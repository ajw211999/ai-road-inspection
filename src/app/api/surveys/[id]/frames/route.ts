import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { frames, surveys } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { id: surveyId } = await params;

    // Verify survey belongs to user's org
    const survey = await db.query.surveys.findFirst({
      where: and(
        eq(surveys.id, surveyId),
        eq(surveys.organizationId, user.organizationId)
      ),
      columns: { id: true },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Parse query params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20") || 20));
    const filter = url.searchParams.get("filter"); // "flagged" | "overridden" | "low-confidence" | null

    // Build where conditions
    let whereCondition = eq(frames.surveyId, surveyId);

    if (filter === "flagged") {
      whereCondition = and(whereCondition, eq(frames.flaggedForReview, true))!;
    } else if (filter === "overridden") {
      whereCondition = and(whereCondition, eq(frames.humanOverride, true))!;
    } else if (filter === "low-confidence") {
      whereCondition = and(whereCondition, sql`${frames.confidence} < 0.7`)!;
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(frames)
      .where(whereCondition);

    // Get paginated frames
    const items = await db
      .select()
      .from(frames)
      .where(whereCondition)
      .orderBy(frames.frameIndex)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({
      items,
      total: Number(count),
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch frames";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Frames fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
