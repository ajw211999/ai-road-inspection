import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { surveys } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { storage } from "@/lib/storage";
import { inngest } from "@/lib/inngest";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { uploadId } = await params;
    const body = await request.json();
    const { surveyId } = body as { surveyId: string };

    if (!surveyId) {
      return NextResponse.json(
        { error: "surveyId is required" },
        { status: 400 }
      );
    }

    const uploadDir = storage.resolve(
      `${user.organizationId}/${uploadId}`
    );

    // Read chunk files in order
    const files = await fs.readdir(uploadDir);
    const chunkFiles = files
      .filter((f) => f.startsWith("chunk_"))
      .sort();

    if (chunkFiles.length === 0) {
      return NextResponse.json(
        { error: "No chunks found" },
        { status: 400 }
      );
    }

    // Assemble chunks into final video
    const videoPath = path.join(uploadDir, "video.mp4");
    const writeStream = createWriteStream(videoPath);

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(uploadDir, chunkFile);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clean up chunk files
    for (const chunkFile of chunkFiles) {
      await fs.unlink(path.join(uploadDir, chunkFile));
    }

    // Update survey
    const videoUrl = storage.getUrl(
      `${user.organizationId}/${uploadId}/video.mp4`
    );
    await db
      .update(surveys)
      .set({
        status: "processing",
        videoUrl,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(surveys.id, surveyId));

    // Send Inngest event for frame extraction
    await inngest.send({
      name: "survey/extract-frames",
      data: {
        surveyId,
        videoPath,
        orgId: user.organizationId,
      },
    });

    return NextResponse.json({ success: true, surveyId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload complete failed";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Upload complete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
