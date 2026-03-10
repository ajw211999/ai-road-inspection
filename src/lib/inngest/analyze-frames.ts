import { inngest } from "@/lib/inngest";
import { db } from "@/server/db";
import { surveys, frames } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { analyzeFrame } from "@/lib/ai/analyze-frame";
import { storage } from "@/lib/storage";

const BATCH_SIZE = 5; // Process 5 frames concurrently to manage API rate limits
const COST_PER_FRAME = 0.01; // Estimated cost per GPT-4o Vision call

export const analyzeFrames = inngest.createFunction(
  {
    id: "analyze-frames",
    retries: 2,
    concurrency: [{ limit: 3 }], // Max 3 concurrent survey analyses
    onFailure: async ({ event }) => {
      const surveyId = event.data.event.data.surveyId as string;
      await db
        .update(surveys)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(surveys.id, surveyId));
    },
  },
  { event: "survey/analyze-frames" },
  async ({ event, step }) => {
    const { surveyId } = event.data as { surveyId: string };

    // Step 1: Get all unanalyzed frames for this survey
    const allFrames = await step.run("fetch-frames", async () => {
      return db
        .select({
          id: frames.id,
          frameIndex: frames.frameIndex,
          imageUrl: frames.imageUrl,
        })
        .from(frames)
        .where(eq(frames.surveyId, surveyId))
        .orderBy(frames.frameIndex);
    });

    if (allFrames.length === 0) {
      return { surveyId, analyzed: 0 };
    }

    // Step 2: Process frames in batches
    let analyzedCount = 0;
    let totalCost = 0;

    for (let i = 0; i < allFrames.length; i += BATCH_SIZE) {
      const batch = allFrames.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      await step.run(`analyze-batch-${batchIndex}`, async () => {
        const results = await Promise.allSettled(
          batch.map(async (frame) => {
            // Convert API URL to file path: /api/files/org/survey/frames/file.jpg → uploads/org/survey/frames/file.jpg
            const storageKey = frame.imageUrl.replace("/api/files/", "");
            const imagePath = storage.resolve(storageKey);

            const { analysis, rawResponse, provider } =
              await analyzeFrame(imagePath);

            await db
              .update(frames)
              .set({
                distressType: analysis.distressType as typeof frames.distressType.enumValues[number],
                severity: analysis.severity as typeof frames.severity.enumValues[number],
                confidence: analysis.confidence,
                pciScore: analysis.pciScore,
                aiRawResponse: {
                  ...rawResponse,
                  provider,
                  analyzedAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
              })
              .where(eq(frames.id, frame.id));

            return { frameId: frame.id, pciScore: analysis.pciScore };
          })
        );

        const succeeded = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected");

        if (failed.length > 0) {
          console.error(
            `Batch ${batchIndex}: ${failed.length} frames failed analysis`,
            failed.map((f) => (f as PromiseRejectedResult).reason?.message)
          );
        }

        analyzedCount += succeeded;
        totalCost += succeeded * COST_PER_FRAME;
      });

      // Update progress after each batch
      await step.run(`update-progress-${batchIndex}`, async () => {
        await db
          .update(surveys)
          .set({
            processedFrames: analyzedCount,
            processingCost: totalCost,
            updatedAt: new Date(),
          })
          .where(eq(surveys.id, surveyId));
      });
    }

    // Step 3: Trigger segment generation
    await step.sendEvent("trigger-generate-segments", {
      name: "survey/generate-segments",
      data: { surveyId },
    });

    return { surveyId, analyzed: analyzedCount, cost: totalCost };
  }
);
