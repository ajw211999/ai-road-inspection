import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { frames, surveys } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { id: frameId } = await params;

    // Fetch frame and verify ownership via survey → org
    const frame = await db.query.frames.findFirst({
      where: eq(frames.id, frameId),
      columns: { id: true, surveyId: true },
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.id, frame.surveyId),
      columns: { organizationId: true },
    });

    if (!survey || survey.organizationId !== user.organizationId) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // Only admin/manager/inspector can override
    if (user.role === "viewer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { humanPciScore, humanNotes, flaggedForReview } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof flaggedForReview === "boolean") {
      updates.flaggedForReview = flaggedForReview;
    }

    if (humanPciScore !== undefined && humanPciScore !== null) {
      const score = Math.max(0, Math.min(100, Math.round(Number(humanPciScore))));
      updates.humanOverride = true;
      updates.humanPciScore = score;
    }

    if (typeof humanNotes === "string") {
      updates.humanNotes = humanNotes || null;
    }

    // If explicitly clearing the override
    if (body.humanOverride === false) {
      updates.humanOverride = false;
      updates.humanPciScore = null;
      updates.humanNotes = null;
    }

    const [updated] = await db
      .update(frames)
      .set(updates)
      .where(eq(frames.id, frameId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update frame";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Frame update error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
