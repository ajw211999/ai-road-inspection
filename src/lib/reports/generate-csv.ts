import { db } from "@/server/db";
import { roadSegments, frames, surveys } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function generateCsv(surveyId: string): Promise<Buffer> {
  const [survey] = await db
    .select({ name: surveys.name })
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  const segments = await db
    .select()
    .from(roadSegments)
    .where(eq(roadSegments.surveyId, surveyId))
    .orderBy(roadSegments.segmentIndex);

  const segmentFrames = await db
    .select()
    .from(frames)
    .where(eq(frames.surveyId, surveyId))
    .orderBy(frames.frameIndex);

  // Segment CSV
  const segmentHeaders = [
    "segment_index",
    "street_name",
    "pci_score",
    "surface_type",
    "length_ft",
    "start_lat",
    "start_lng",
    "end_lat",
    "end_lng",
    "ada_curb_ramp_flag",
    "district",
  ];

  const segmentRows = segments.map((s) =>
    [
      s.segmentIndex,
      `"${s.streetName}"`,
      s.pciScore,
      s.surfaceType,
      s.lengthFt,
      s.startLat,
      s.startLng,
      s.endLat,
      s.endLng,
      s.adaCurbRampFlag,
      s.district ?? "",
    ].join(",")
  );

  // Frame CSV
  const frameHeaders = [
    "frame_index",
    "segment_index",
    "distress_type",
    "severity",
    "confidence",
    "pci_score",
    "human_override",
    "human_pci_score",
    "human_notes",
    "flagged_for_review",
    "lat",
    "lng",
  ];

  // Map segmentId to index for readability
  const segmentIdToIndex = new Map(
    segments.map((s) => [s.id, s.segmentIndex])
  );

  const frameRows = segmentFrames.map((f) =>
    [
      f.frameIndex,
      f.segmentId ? (segmentIdToIndex.get(f.segmentId) ?? "") : "",
      f.distressType,
      f.severity,
      f.confidence.toFixed(2),
      f.pciScore,
      f.humanOverride,
      f.humanPciScore ?? "",
      f.humanNotes ? `"${f.humanNotes.replace(/"/g, '""')}"` : "",
      f.flaggedForReview,
      f.lat,
      f.lng,
    ].join(",")
  );

  const content = [
    `# Road Inspection Report: ${survey?.name ?? surveyId}`,
    `# Generated: ${new Date().toISOString()}`,
    "",
    "## SEGMENTS",
    segmentHeaders.join(","),
    ...segmentRows,
    "",
    "## FRAMES",
    frameHeaders.join(","),
    ...frameRows,
  ].join("\n");

  return Buffer.from(content, "utf-8");
}
