import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { frames, surveys } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();

    // Only admin/manager/inspector can override
    if (user.role === "viewer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { frameIds, action, humanPciScore, humanNotes } = body as {
      frameIds: string[];
      action: "approve" | "flag" | "unflag";
      humanPciScore?: number;
      humanNotes?: string;
    };

    if (!Array.isArray(frameIds) || frameIds.length === 0) {
      return NextResponse.json(
        { error: "frameIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!["approve", "flag", "unflag"].includes(action)) {
      return NextResponse.json(
        { error: "action must be one of: approve, flag, unflag" },
        { status: 400 }
      );
    }

    // Fetch all requested frames and verify ownership via survey → org
    const requestedFrames = await db.query.frames.findMany({
      where: inArray(frames.id, frameIds),
      columns: { id: true, surveyId: true, pciScore: true },
    });

    if (requestedFrames.length === 0) {
      return NextResponse.json(
        { error: "No frames found" },
        { status: 404 }
      );
    }

    // Get unique survey IDs and verify all belong to user's org
    const surveyIds = [...new Set(requestedFrames.map((f) => f.surveyId))];
    const relatedSurveys = await db.query.surveys.findMany({
      where: inArray(surveys.id, surveyIds),
      columns: { id: true, organizationId: true },
    });

    const orgMismatch = relatedSurveys.some(
      (s) => s.organizationId !== user.organizationId
    );
    const allSurveyIdsFound = surveyIds.every((sid) =>
      relatedSurveys.some((s) => s.id === sid)
    );

    if (orgMismatch || !allSurveyIdsFound) {
      return NextResponse.json(
        { error: "Some frames do not belong to your organization" },
        { status: 403 }
      );
    }

    // Ensure we only update frames that were actually found and verified
    const verifiedFrameIds = requestedFrames.map((f) => f.id);

    // Build update object based on action
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    switch (action) {
      case "approve": {
        updates.humanOverride = true;
        if (humanPciScore !== undefined && humanPciScore !== null) {
          updates.humanPciScore = Math.max(
            0,
            Math.min(100, Math.round(Number(humanPciScore)))
          );
        }
        // When no humanPciScore provided, mark as approved with notes only
        // (humanPciScore stays null, meaning "AI score accepted as correct")
        if (typeof humanNotes === "string") {
          updates.humanNotes = humanNotes || null;
        }
        break;
      }
      case "flag": {
        updates.flaggedForReview = true;
        break;
      }
      case "unflag": {
        updates.flaggedForReview = false;
        break;
      }
    }

    const result = await db
      .update(frames)
      .set(updates)
      .where(inArray(frames.id, verifiedFrameIds));

    return NextResponse.json({ updated: verifiedFrameIds.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk update frames";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Bulk frame update error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
