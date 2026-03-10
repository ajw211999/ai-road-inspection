import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { extractFrames } from "@/lib/inngest/extract-frames";
import { analyzeFrames } from "@/lib/inngest/analyze-frames";
import { generateSegments } from "@/lib/inngest/generate-segments";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractFrames, analyzeFrames, generateSegments],
});
