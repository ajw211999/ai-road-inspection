import { db } from "../src/server/db";
import { frames } from "../src/server/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const counts = await db
    .select({
      sceneType: frames.sceneType,
      count: sql<number>`COUNT(*)`,
      avgPci: sql<number>`ROUND(AVG(${frames.pciScore}))`,
    })
    .from(frames)
    .groupBy(frames.sceneType)
    .orderBy(sql`COUNT(*) DESC`);

  console.log("Frame scene type breakdown:\n");
  console.log("Scene Type        Count   Avg PCI");
  console.log("─".repeat(40));
  for (const row of counts) {
    const scene = (row.sceneType ?? "unknown").padEnd(18);
    const count = String(row.count).padStart(5);
    const pci = row.avgPci !== null ? String(row.avgPci).padStart(7) : "    N/A";
    console.log(`${scene}${count}${pci}`);
  }

  process.exit(0);
}
main();
