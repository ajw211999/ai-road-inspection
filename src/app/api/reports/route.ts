import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/server/db";
import { reports, surveys } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { storage } from "@/lib/storage";
import { generateCsv } from "@/lib/reports/generate-csv";
import { generatePptx } from "@/lib/reports/generate-pptx";
import { generateShapefile } from "@/lib/reports/generate-shapefile";
import { generatePdf } from "@/lib/reports/generate-pdf";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();

    const results = await db
      .select()
      .from(reports)
      .where(eq(reports.organizationId, user.organizationId))
      .orderBy(desc(reports.createdAt));

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reports";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Reports fetch error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const FORMAT_EXT: Record<string, string> = {
  pdf: "html", // HTML report (print to PDF in browser)
  pptx: "pptx",
  shapefile: "zip",
  csv: "csv",
};


export async function POST(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await request.json();
    const { surveyId, name, format } = body;

    if (!surveyId || !name || !format) {
      return NextResponse.json(
        { error: "surveyId, name, and format are required" },
        { status: 400 }
      );
    }

    if (!["pdf", "pptx", "shapefile", "csv"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use: pdf, pptx, shapefile, csv" },
        { status: 400 }
      );
    }

    // Verify survey belongs to user's org and is completed
    const survey = await db.query.surveys.findFirst({
      where: and(
        eq(surveys.id, surveyId),
        eq(surveys.organizationId, user.organizationId)
      ),
      columns: { id: true, status: true },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    if (survey.status !== "completed") {
      return NextResponse.json(
        { error: "Survey must be completed before generating reports" },
        { status: 400 }
      );
    }

    // Create report record
    const [report] = await db
      .insert(reports)
      .values({
        surveyId,
        organizationId: user.organizationId,
        createdById: user.id,
        name,
        format,
        status: "generating",
        config: body.config ?? {},
      })
      .returning();

    // Generate the report
    try {
      let buffer: Buffer;

      switch (format) {
        case "csv":
          buffer = await generateCsv(surveyId);
          break;
        case "pptx":
          buffer = await generatePptx(surveyId);
          break;
        case "shapefile":
          buffer = await generateShapefile(surveyId);
          break;
        case "pdf":
          buffer = await generatePdf(surveyId);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Save to storage
      const ext = FORMAT_EXT[format];
      const storageKey = `${user.organizationId}/reports/${report.id}.${ext}`;
      await storage.save(storageKey, buffer);

      // Update report record
      const [updated] = await db
        .update(reports)
        .set({
          status: "completed",
          fileUrl: storage.getUrl(storageKey),
          fileSizeBytes: buffer.length,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, report.id))
        .returning();

      return NextResponse.json(updated);
    } catch (genError) {
      console.error("Report generation failed:", genError);
      await db
        .update(reports)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(reports.id, report.id));

      return NextResponse.json(
        {
          error: "Report generation failed",
          details: genError instanceof Error ? genError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create report";
    if (message === "Not authenticated") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Report creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
