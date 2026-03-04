import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { promises as fs } from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const { uploadId } = await params;

    const chunkIndex = request.headers.get("x-chunk-index");
    if (chunkIndex === null) {
      return NextResponse.json(
        { error: "x-chunk-index header is required" },
        { status: 400 }
      );
    }

    const body = await request.arrayBuffer();
    const buffer = Buffer.from(body);

    const paddedIndex = String(chunkIndex).padStart(5, "0");
    const chunkPath = path.join(
      storage.resolve(`${user.organizationId}/${uploadId}`),
      `chunk_${paddedIndex}`
    );

    await fs.writeFile(chunkPath, buffer);

    return NextResponse.json({ received: true, chunkIndex: Number(chunkIndex) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Chunk upload failed";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
