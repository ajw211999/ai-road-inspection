import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys, roadSegments } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const orgId = user.organizationId;

    // Get org info
    const org = await db.query.organizations.findFirst({
      where: eq(
        (await import("@/server/db/schema")).organizations.id,
        orgId
      ),
    });

    // Survey count
    const [surveyStats] = await db
      .select({
        totalSurveys: sql<number>`COUNT(*)`,
        completedSurveys: sql<number>`SUM(CASE WHEN ${surveys.status} = 'completed' THEN 1 ELSE 0 END)`,
      })
      .from(surveys)
      .where(eq(surveys.organizationId, orgId));

    // Segment stats
    const [segmentStats] = await db
      .select({
        totalSegments: sql<number>`COUNT(*)`,
        avgPci: sql<number>`COALESCE(ROUND(AVG(${roadSegments.pciScore})), 0)`,
        totalLengthFt: sql<number>`COALESCE(SUM(${roadSegments.lengthFt}), 0)`,
        goodCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} >= 70 THEN 1 ELSE 0 END)`,
        adaCount: sql<number>`SUM(CASE WHEN ${roadSegments.adaCurbRampFlag} = true THEN 1 ELSE 0 END)`,
      })
      .from(roadSegments)
      .where(eq(roadSegments.organizationId, orgId));

    // PCI distribution buckets
    const pciDistribution = await db
      .select({
        bucket: sql<string>`
          CASE
            WHEN ${roadSegments.pciScore} >= 0 AND ${roadSegments.pciScore} < 10 THEN '0-10'
            WHEN ${roadSegments.pciScore} >= 10 AND ${roadSegments.pciScore} < 25 THEN '10-25'
            WHEN ${roadSegments.pciScore} >= 25 AND ${roadSegments.pciScore} < 40 THEN '25-40'
            WHEN ${roadSegments.pciScore} >= 40 AND ${roadSegments.pciScore} < 55 THEN '40-55'
            WHEN ${roadSegments.pciScore} >= 55 AND ${roadSegments.pciScore} < 70 THEN '55-70'
            WHEN ${roadSegments.pciScore} >= 70 AND ${roadSegments.pciScore} < 85 THEN '70-85'
            WHEN ${roadSegments.pciScore} >= 85 THEN '85-100'
          END`,
        count: sql<number>`COUNT(*)`,
      })
      .from(roadSegments)
      .where(eq(roadSegments.organizationId, orgId))
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

    // Worst segments (top 10)
    const worstSegments = await db
      .select()
      .from(roadSegments)
      .where(eq(roadSegments.organizationId, orgId))
      .orderBy(roadSegments.pciScore)
      .limit(10);

    const totalSegments = Number(segmentStats.totalSegments) || 0;
    const goodCount = Number(segmentStats.goodCount) || 0;
    const goodPct = totalSegments > 0 ? Math.round((goodCount / totalSegments) * 100) : 0;

    return NextResponse.json({
      organization: org ? { name: org.name, plan: org.plan } : null,
      totalSurveys: Number(surveyStats.completedSurveys) || 0,
      totalSegments,
      averagePci: Number(segmentStats.avgPci) || 0,
      totalLengthFt: Number(segmentStats.totalLengthFt) || 0,
      goodConditionPct: goodPct,
      adaAlerts: Number(segmentStats.adaCount) || 0,
      pciDistribution: distribution,
      worstSegments,
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
