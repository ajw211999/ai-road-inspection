import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { extractFrames } from "@/lib/inngest/extract-frames";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractFrames],
});
