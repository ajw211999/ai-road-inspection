import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys, roadSegments, frames, users } from "@/server/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();
    const orgId = user.organizationId;

    const url = new URL(request.url);
    const surveyId = url.searchParams.get("surveyId"); // optional filter

    // Get org info
    const org = await db.query.organizations.findFirst({
      where: eq(
        (await import("@/server/db/schema")).organizations.id,
        orgId
      ),
    });

    // Surveys list (for the filter dropdown)
    const surveyList = await db
      .select({
        id: surveys.id,
        name: surveys.name,
        status: surveys.status,
        completedAt: surveys.completedAt,
        averagePci: surveys.averagePci,
      })
      .from(surveys)
      .where(eq(surveys.organizationId, orgId))
      .orderBy(desc(surveys.createdAt));

    // Build segment filter condition
    const segmentCondition = surveyId
      ? and(eq(roadSegments.organizationId, orgId), eq(roadSegments.surveyId, surveyId))
      : eq(roadSegments.organizationId, orgId);

    // Effective PCI: use human override when present, otherwise AI score
    const effectivePci = sql`CASE WHEN ${roadSegments.humanOverride} = true AND ${roadSegments.humanPciScore} IS NOT NULL THEN ${roadSegments.humanPciScore} ELSE ${roadSegments.pciScore} END`;

    // Survey count
    const [surveyStats] = await db
      .select({
        totalSurveys: sql<number>`COUNT(*)`,
        completedSurveys: sql<number>`SUM(CASE WHEN ${surveys.status} = 'completed' THEN 1 ELSE 0 END)`,
      })
      .from(surveys)
      .where(eq(surveys.organizationId, orgId));

    // Segment stats (filtered by survey if selected)
    const [segmentStats] = await db
      .select({
        totalSegments: sql<number>`COUNT(*)`,
        avgPci: sql<number>`COALESCE(ROUND(AVG(${effectivePci})), 0)`,
        totalLengthFt: sql<number>`COALESCE(SUM(${roadSegments.lengthFt}), 0)`,
        goodCount: sql<number>`SUM(CASE WHEN ${effectivePci} >= 70 THEN 1 ELSE 0 END)`,
        adaCount: sql<number>`SUM(CASE WHEN ${roadSegments.adaCurbRampFlag} = true THEN 1 ELSE 0 END)`,
      })
      .from(roadSegments)
      .where(segmentCondition);

    // PCI distribution buckets (filtered, using effective PCI)
    const pciDistribution = await db
      .select({
        bucket: sql<string>`
          CASE
            WHEN ${effectivePci} >= 0 AND ${effectivePci} < 10 THEN '0-10'
            WHEN ${effectivePci} >= 10 AND ${effectivePci} < 25 THEN '10-25'
            WHEN ${effectivePci} >= 25 AND ${effectivePci} < 40 THEN '25-40'
            WHEN ${effectivePci} >= 40 AND ${effectivePci} < 55 THEN '40-55'
            WHEN ${effectivePci} >= 55 AND ${effectivePci} < 70 THEN '55-70'
            WHEN ${effectivePci} >= 70 AND ${effectivePci} < 85 THEN '70-85'
            WHEN ${effectivePci} >= 85 THEN '85-100'
          END`,
        count: sql<number>`COUNT(*)`,
      })
      .from(roadSegments)
      .where(segmentCondition)
      .groupBy(sql`1`);

    const BUCKET_COLORS: Record<string, string> = {
      "0-10": "#991b1b",
      "10-25": "#ef4444",
      "25-40": "#f97316",
      "40-55": "#eab308",
      "55-70": "#84cc16",
      "70-85": "#22c55e",
      "85-100": "#15803d",
    };

    const ALL_BUCKETS = ["0-10", "10-25", "25-40", "40-55", "55-70", "70-85", "85-100"];
    const distributionMap = new Map(pciDistribution.map((b) => [b.bucket, Number(b.count)]));

    const distribution = ALL_BUCKETS.map((range) => ({
      range,
      count: distributionMap.get(range) ?? 0,
      color: BUCKET_COLORS[range],
    }));

    // Worst segments (top 10, filtered, sorted by effective PCI)
    const worstSegments = await db
      .select()
      .from(roadSegments)
      .where(segmentCondition)
      .orderBy(sql`${effectivePci} ASC`)
      .limit(10);

    // Recent activity (last 15 events across surveys, overrides, flags)
    const recentOverrides = await db
      .select({
        id: frames.id,
        type: sql<string>`'override'`,
        frameIndex: frames.frameIndex,
        surveyId: frames.surveyId,
        humanPciScore: frames.humanPciScore,
        pciScore: frames.pciScore,
        timestamp: frames.updatedAt,
      })
      .from(frames)
      .innerJoin(surveys, eq(frames.surveyId, surveys.id))
      .where(
        and(
          eq(surveys.organizationId, orgId),
          eq(frames.humanOverride, true)
        )
      )
      .orderBy(desc(frames.updatedAt))
      .limit(10);

    const recentFlags = await db
      .select({
        id: frames.id,
        type: sql<string>`'flag'`,
        frameIndex: frames.frameIndex,
        surveyId: frames.surveyId,
        humanPciScore: frames.humanPciScore,
        pciScore: frames.pciScore,
        timestamp: frames.updatedAt,
      })
      .from(frames)
      .innerJoin(surveys, eq(frames.surveyId, surveys.id))
      .where(
        and(
          eq(surveys.organizationId, orgId),
          eq(frames.flaggedForReview, true)
        )
      )
      .orderBy(desc(frames.updatedAt))
      .limit(5);

    const recentSurveyEvents = surveyList.slice(0, 5).map((s) => ({
      id: s.id,
      type: s.status === "completed" ? "survey_completed" : s.status === "processing" ? "survey_processing" : "survey_uploaded",
      name: s.name,
      status: s.status,
      averagePci: s.averagePci,
      timestamp: s.completedAt || null,
    }));

    // Merge and sort activity by timestamp
    const activity = [
      ...recentOverrides.map((r) => ({
        id: r.id,
        type: r.type as string,
        description: `Frame #${r.frameIndex} override — PCI ${r.humanPciScore ?? r.pciScore}`,
        timestamp: r.timestamp,
      })),
      ...recentFlags.map((r) => ({
        id: r.id,
        type: r.type as string,
        description: `Frame #${r.frameIndex} flagged for review`,
        timestamp: r.timestamp,
      })),
      ...recentSurveyEvents.map((s) => ({
        id: s.id,
        type: s.type,
        description: s.type === "survey_completed"
          ? `"${s.name}" completed — Avg PCI ${s.averagePci ?? "N/A"}`
          : s.type === "survey_processing"
            ? `"${s.name}" is processing`
            : `"${s.name}" uploaded`,
        timestamp: s.timestamp,
      })),
    ]
      .filter((a) => a.timestamp)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 15);

    const totalSegments = Number(segmentStats.totalSegments) || 0;
    const goodCount = Number(segmentStats.goodCount) || 0;
    const goodPct = totalSegments > 0 ? Math.round((goodCount / totalSegments) * 100) : 0;

    return NextResponse.json({
      organization: org ? { name: org.name, plan: org.plan } : null,
      surveys: surveyList,
      totalSurveys: Number(surveyStats.completedSurveys) || 0,
      totalSegments,
      averagePci: Number(segmentStats.avgPci) || 0,
      totalLengthFt: Number(segmentStats.totalLengthFt) || 0,
      goodConditionPct: goodPct,
      adaAlerts: Number(segmentStats.adaCount) || 0,
      pciDistribution: distribution,
      worstSegments,
      recentActivity: activity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
