import { inngest } from "@/lib/inngest";
import { db } from "@/server/db";
import { surveys, frames } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { storage } from "@/lib/storage";
import { promises as fs } from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export const extractFrames = inngest.createFunction(
  {
    id: "extract-frames",
    retries: 3,
    onFailure: async ({ event }) => {
      const surveyId = event.data.event.data.surveyId as string;
      await db
        .update(surveys)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(surveys.id, surveyId));
    },
  },
  { event: "survey/extract-frames" },
  async ({ event, step }) => {
    const { surveyId, videoPath, orgId } = event.data as {
      surveyId: string;
      videoPath: string;
      orgId: string;
    };

    // Normalize path for FFmpeg on Windows
    const normalizedVideoPath = videoPath.replace(/\\/g, "/");

    // Step 1: Probe video to get duration
    const duration = await step.run("probe-video", async () => {
      return new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(normalizedVideoPath, (err, metadata) => {
          if (err) return reject(err);
          const dur = metadata.format.duration;
          if (!dur || dur <= 0) {
            return reject(new Error("Invalid video duration"));
          }
          resolve(dur);
        });
      });
    });

    // Step 2: Update total frames (1fps → totalFrames = floor(duration))
    const totalFrames = Math.floor(duration);
    await step.run("update-total-frames", async () => {
      await db
        .update(surveys)
        .set({ totalFrames, updatedAt: new Date() })
        .where(eq(surveys.id, surveyId));
    });

    // Step 3: Extract frames at 1fps
    const framesDir = storage.resolve(
      path.join(orgId, surveyId, "frames").replace(/\\/g, "/")
    );
    await step.run("run-ffmpeg", async () => {
      await fs.mkdir(framesDir, { recursive: true });
      const outputPattern = path
        .join(framesDir, "frame_%04d.jpg")
        .replace(/\\/g, "/");

      return new Promise<void>((resolve, reject) => {
        ffmpeg(normalizedVideoPath)
          .outputOptions(["-vf", "fps=1", "-q:v", "2"])
          .output(outputPattern)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });
    });

    // Step 4: Insert frame records in batches
    await step.run("insert-frame-records", async () => {
      const files = await fs.readdir(framesDir);
      const frameFiles = files
        .filter((f) => f.startsWith("frame_") && f.endsWith(".jpg"))
        .sort();

      const BATCH_SIZE = 50;
      for (let i = 0; i < frameFiles.length; i += BATCH_SIZE) {
        const batch = frameFiles.slice(i, i + BATCH_SIZE);
        const records = batch.map((file, batchIdx) => {
          const frameIndex = i + batchIdx + 1;
          const key = `${orgId}/${surveyId}/frames/${file}`;
          return {
            surveyId,
            segmentId: null,
            frameIndex,
            imageUrl: storage.getUrl(key),
            lat: 0,
            lng: 0,
            pciScore: 0,
          };
        });
        await db.insert(frames).values(records);
      }
    });

    // Step 5: Mark survey as completed
    await step.run("mark-complete", async () => {
      await db
        .update(surveys)
        .set({
          status: "completed",
          processedFrames: totalFrames,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(surveys.id, surveyId));
    });

    return { surveyId, totalFrames };
  }
);
