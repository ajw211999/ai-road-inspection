import { db } from "../src/server/db";
import { frames } from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const counts = await db.select({
    surveyId: frames.surveyId,
    count: sql<number>`COUNT(*)`,
  }).from(frames).groupBy(frames.surveyId);
  console.log("Frame counts by survey:", JSON.stringify(counts, null, 2));

  // Check first few frames
  const sample = await db.select().from(frames).limit(3);
  console.log("\nSample frames:", JSON.stringify(sample, null, 2));

  process.exit(0);
}
main();
