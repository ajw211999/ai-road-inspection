import { db } from "../src/server/db";
import { surveys } from "../src/server/db/schema";

async function main() {
  const rows = await db.select({
    id: surveys.id,
    name: surveys.name,
    status: surveys.status,
    videoUrl: surveys.videoUrl,
    totalFrames: surveys.totalFrames,
    processedFrames: surveys.processedFrames,
    organizationId: surveys.organizationId,
  }).from(surveys);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
main();
