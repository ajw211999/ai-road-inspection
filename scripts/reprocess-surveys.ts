import { db } from "../src/server/db";
import { surveys, frames, roadSegments } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allSurveys = await db
    .select({ id: surveys.id, name: surveys.name })
    .from(surveys);

  console.log(`Found ${allSurveys.length} surveys to reprocess:\n`);

  for (const survey of allSurveys) {
    console.log(`--- Resetting survey: ${survey.name} (${survey.id}) ---`);

    // 1. Reset frames first (clear FK reference to segments)
    await db
      .update(frames)
      .set({
        segmentId: null,
        sceneType: "public_road",
        distressType: "none",
        severity: "low",
        confidence: 0,
        pciScore: 0,
        aiRawResponse: {},
        humanOverride: false,
        humanPciScore: null,
        humanNotes: null,
        flaggedForReview: false,
        updatedAt: new Date(),
      })
      .where(eq(frames.surveyId, survey.id));
    console.log(`  Reset all frames`);

    // 2. Delete old segments (now safe — no FK references)
    const deleted = await db
      .delete(roadSegments)
      .where(eq(roadSegments.surveyId, survey.id))
      .returning({ id: roadSegments.id });
    console.log(`  Deleted ${deleted.length} old segments`);

    // 3. Reset survey status
    await db
      .update(surveys)
      .set({
        status: "processing",
        totalSegments: 0,
        averagePci: null,
        processedFrames: 0,
        processingCost: 0,
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(surveys.id, survey.id));
    console.log(`  Survey reset to processing`);
  }

  // 4. Trigger re-analysis via Inngest
  console.log(`\nSending analyze-frames events to Inngest...`);
  for (const survey of allSurveys) {
    const res = await fetch("http://localhost:8288/e/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "survey/analyze-frames",
        data: { surveyId: survey.id },
      }),
    });
    const result = await res.json();
    console.log(`  ${survey.name}: event sent (${JSON.stringify(result)})`);
  }

  console.log("\nDone! Surveys are now reprocessing with the updated AI prompt.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
