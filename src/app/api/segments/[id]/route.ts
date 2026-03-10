import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { roadSegments, surveys } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { id } = await params;

    if (user.role === "viewer") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch the segment and verify org ownership
    const segment = await db.query.roadSegments.findFirst({
      where: eq(roadSegments.id, id),
    });

    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    if (segment.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { humanPciScore, humanNotes, humanOverride } = body as {
      humanPciScore?: number;
      humanNotes?: string;
      humanOverride?: boolean;
    };

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Clear override
    if (humanOverride === false) {
      updates.humanOverride = false;
      updates.humanPciScore = null;
      updates.humanNotes = null;
    } else if (humanPciScore !== undefined && humanPciScore !== null) {
      // Set override with score
      updates.humanOverride = true;
      updates.humanPciScore = Math.max(
        0,
        Math.min(100, Math.round(Number(humanPciScore)))
      );
      if (typeof humanNotes === "string") {
        updates.humanNotes = humanNotes || null;
      }
    }

    const [updated] = await db
      .update(roadSegments)
      .set(updates)
      .where(eq(roadSegments.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update segment";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Segment update error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
