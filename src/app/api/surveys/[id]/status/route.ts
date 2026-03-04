import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { id } = await params;

    const survey = await db.query.surveys.findFirst({
      where: and(
        eq(surveys.id, id),
        eq(surveys.organizationId, user.organizationId)
      ),
      columns: {
        id: true,
        status: true,
        totalFrames: true,
        processedFrames: true,
      },
    });

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch status";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Survey status error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
