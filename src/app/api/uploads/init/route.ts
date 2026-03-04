import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys } from "@/server/db/schema";
import { storage } from "@/lib/storage";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await request.json();

    const { name, contentType } = body as {
      name: string;
      contentType: string;
    };

    if (!name || !contentType) {
      return NextResponse.json(
        { error: "name and contentType are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid video type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const uploadId = randomUUID();

    const [survey] = await db
      .insert(surveys)
      .values({
        organizationId: user.organizationId,
        createdById: user.id,
        name,
        status: "uploading",
      })
      .returning();

    // Create upload directory
    const uploadDir = storage.resolve(
      `${user.organizationId}/${uploadId}`
    );
    await fs.mkdir(uploadDir, { recursive: true });

    return NextResponse.json({
      uploadId,
      surveyId: survey.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload init failed";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Upload init error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
