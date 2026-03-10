import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys, roadSegments, frames } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();
    const orgId = user.organizationId;

    const url = new URL(request.url);
    const surveyId = url.searchParams.get("surveyId");

    // If no surveyId provided, get the most recent completed survey
    let targetSurveyId = surveyId;

    if (!targetSurveyId) {
      const [latest] = await db
        .select({ id: surveys.id })
        .from(surveys)
        .where(
          and(
            eq(surveys.organizationId, orgId),
            eq(surveys.status, "completed")
          )
        )
        .orderBy(desc(surveys.createdAt))
        .limit(1);

      if (!latest) {
        return NextResponse.json({
          segments: [],
          frames: [],
          surveys: [],
          activeSurveyId: null,
        });
      }

      targetSurveyId = latest.id;
    }

    // Verify survey belongs to user's org
    const survey = await db.query.surveys.findFirst({
      where: and(
        eq(surveys.id, targetSurveyId),
        eq(surveys.organizationId, orgId)
      ),
      columns: { id: true },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Fetch segments and frames in parallel
    const [segmentResults, frameResults, surveyList] = await Promise.all([
      db
        .select()
        .from(roadSegments)
        .where(eq(roadSegments.surveyId, targetSurveyId))
        .orderBy(roadSegments.segmentIndex),
      db
        .select()
        .from(frames)
        .where(eq(frames.surveyId, targetSurveyId))
        .orderBy(frames.frameIndex),
      db
        .select({
          id: surveys.id,
          name: surveys.name,
          status: surveys.status,
          totalSegments: surveys.totalSegments,
          averagePci: surveys.averagePci,
          createdAt: surveys.createdAt,
        })
        .from(surveys)
        .where(
          and(
            eq(surveys.organizationId, orgId),
            eq(surveys.status, "completed")
          )
        )
        .orderBy(desc(surveys.createdAt)),
    ]);

    return NextResponse.json({
      segments: segmentResults,
      frames: frameResults,
      surveys: surveyList,
      activeSurveyId: targetSurveyId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch map data";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Map data error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
