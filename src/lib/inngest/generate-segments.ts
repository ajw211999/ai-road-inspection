import { inngest } from "@/lib/inngest";
import { db } from "@/server/db";
import { surveys, frames, roadSegments } from "@/server/db/schema";
import { eq, sql, inArray, and, notInArray } from "drizzle-orm";

const FRAMES_PER_SEGMENT = 5; // Group every 5 consecutive frames into a segment

export const generateSegments = inngest.createFunction(
  {
    id: "generate-segments",
    retries: 2,
    onFailure: async ({ event }) => {
      const surveyId = event.data.event.data.surveyId as string;
      await db
        .update(surveys)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(surveys.id, surveyId));
    },
  },
  { event: "survey/generate-segments" },
  async ({ event, step }) => {
    const { surveyId } = event.data as { surveyId: string };

    // Step 1: Fetch survey to get orgId
    const survey = await step.run("fetch-survey", async () => {
      const [s] = await db
        .select({ organizationId: surveys.organizationId })
        .from(surveys)
        .where(eq(surveys.id, surveyId))
        .limit(1);
      return s;
    });

    if (!survey) throw new Error(`Survey ${surveyId} not found`);

    // Step 2: Fetch analyzed frames — only public road scenes (exclude parking lots, driveways, etc.)
    const NON_ROAD_SCENES = ["parking_lot", "driveway", "off_road", "not_road"] as const;
    const analyzedFrames = await step.run("fetch-analyzed-frames", async () => {
      return db
        .select({
          id: frames.id,
          frameIndex: frames.frameIndex,
          lat: frames.lat,
          lng: frames.lng,
          pciScore: frames.pciScore,
          distressType: frames.distressType,
          severity: frames.severity,
          confidence: frames.confidence,
        })
        .from(frames)
        .where(
          and(
            eq(frames.surveyId, surveyId),
            notInArray(frames.sceneType, [...NON_ROAD_SCENES])
          )
        )
        .orderBy(frames.frameIndex);
    });

    if (analyzedFrames.length === 0) {
      return { surveyId, segments: 0 };
    }

    // Step 3: Group frames into segments and create segment records
    const segmentCount = await step.run("create-segments", async () => {
      const chunks: (typeof analyzedFrames)[] = [];
      for (let i = 0; i < analyzedFrames.length; i += FRAMES_PER_SEGMENT) {
        chunks.push(analyzedFrames.slice(i, i + FRAMES_PER_SEGMENT));
      }

      let createdCount = 0;
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        if (chunk.length === 0) continue;

        // Calculate aggregate PCI (weighted by confidence)
        let totalWeight = 0;
        let weightedPci = 0;
        let hasAda = false;

        for (const f of chunk) {
          const weight = Math.max(f.confidence, 0.1); // min weight 0.1
          weightedPci += f.pciScore * weight;
          totalWeight += weight;
        }

        const avgPci = totalWeight > 0 ? Math.round(weightedPci / totalWeight) : 0;

        // Find dominant distress type (most severe non-none)
        const distressCounts = new Map<string, number>();
        for (const f of chunk) {
          if (f.distressType !== "none") {
            distressCounts.set(
              f.distressType,
              (distressCounts.get(f.distressType) || 0) + 1
            );
          }
        }

        // Check ADA flag: flag if any frame has low PCI near curb areas
        // (simplified: flag segments with PCI < 40)
        if (avgPci < 40) {
          hasAda = true;
        }

        // Use first and last frame positions for segment endpoints
        const firstFrame = chunk[0];
        const lastFrame = chunk[chunk.length - 1];

        // Generate a street name from segment index
        // In production, this would come from reverse geocoding
        const streetName = `Segment ${idx + 1}`;

        // Calculate approximate length (simplified — uses frame count as proxy)
        // At ~30mph dashcam, 1fps ≈ 44ft per frame
        const approxLengthFt = chunk.length * 44;

        // Build GeoJSON LineString geometry
        const coordinates = chunk.map((f) => [f.lng, f.lat]);
        const geometry = {
          type: "LineString" as const,
          coordinates,
        };

        const [segment] = await db
          .insert(roadSegments)
          .values({
            surveyId,
            organizationId: survey.organizationId,
            streetName,
            segmentIndex: idx + 1,
            startLat: firstFrame.lat,
            startLng: firstFrame.lng,
            endLat: lastFrame.lat,
            endLng: lastFrame.lng,
            lengthFt: approxLengthFt,
            pciScore: avgPci,
            adaCurbRampFlag: hasAda,
            geometry,
          })
          .returning({ id: roadSegments.id });

        // Link frames to this segment
        const frameIds = chunk.map((f) => f.id);
        await db
          .update(frames)
          .set({ segmentId: segment.id, updatedAt: new Date() })
          .where(inArray(frames.id, frameIds));

        createdCount++;
      }

      return createdCount;
    });

    // Step 4: Calculate survey-level stats and mark as completed
    await step.run("finalize-survey", async () => {
      // Compute average PCI across all segments
      const [stats] = await db
        .select({
          avgPci: sql<number>`ROUND(AVG(${roadSegments.pciScore}))`,
          count: sql<number>`COUNT(*)`,
        })
        .from(roadSegments)
        .where(eq(roadSegments.surveyId, surveyId));

      await db
        .update(surveys)
        .set({
          status: "completed",
          totalSegments: stats.count,
          averagePci: stats.avgPci,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(surveys.id, surveyId));
    });

    return { surveyId, segments: segmentCount };
  }
);
