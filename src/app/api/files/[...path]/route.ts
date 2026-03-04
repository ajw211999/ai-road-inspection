import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const filePath = path.join(UPLOADS_DIR, ...segments);

    // Path traversal protection
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
