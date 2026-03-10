import PptxGenJS from "pptxgenjs";

type TableRow = PptxGenJS.TableRow;
import { db } from "@/server/db";
import { roadSegments, surveys } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { pciLabel } from "@/lib/utils";

function row(cells: string[]): TableRow {
  return cells.map((text) => ({ text }));
}

export async function generatePptx(surveyId: string): Promise<Buffer> {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1);

  const segments = await db
    .select()
    .from(roadSegments)
    .where(eq(roadSegments.surveyId, surveyId))
    .orderBy(roadSegments.segmentIndex);

  // PCI distribution
  const [pciStats] = await db
    .select({
      avgPci: sql<number>`ROUND(AVG(${roadSegments.pciScore}))`,
      minPci: sql<number>`MIN(${roadSegments.pciScore})`,
      maxPci: sql<number>`MAX(${roadSegments.pciScore})`,
      totalSegments: sql<number>`COUNT(*)`,
      goodCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} >= 85 THEN 1 ELSE 0 END)`,
      satisfactoryCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} >= 70 AND ${roadSegments.pciScore} < 85 THEN 1 ELSE 0 END)`,
      fairCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} >= 55 AND ${roadSegments.pciScore} < 70 THEN 1 ELSE 0 END)`,
      poorCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} >= 40 AND ${roadSegments.pciScore} < 55 THEN 1 ELSE 0 END)`,
      failedCount: sql<number>`SUM(CASE WHEN ${roadSegments.pciScore} < 40 THEN 1 ELSE 0 END)`,
      adaCount: sql<number>`SUM(CASE WHEN ${roadSegments.adaCurbRampFlag} = true THEN 1 ELSE 0 END)`,
    })
    .from(roadSegments)
    .where(eq(roadSegments.surveyId, surveyId));

  const pres = new PptxGenJS();
  pres.author = "GroundTruth AI";
  pres.title = survey?.name ?? "Road Inspection Report";

  // Slide 1: Title
  const slide1 = pres.addSlide();
  slide1.addText(survey?.name ?? "Road Inspection Report", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: "1e3a5f",
    align: "center",
  });
  slide1.addText("AI-Powered Pavement Condition Assessment", {
    x: 0.5,
    y: 3,
    w: 9,
    h: 0.8,
    fontSize: 18,
    color: "6b7280",
    align: "center",
  });
  slide1.addText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.5,
    fontSize: 12,
    color: "9ca3af",
    align: "center",
  });

  // Slide 2: Executive Summary
  const slide2 = pres.addSlide();
  slide2.addText("Executive Summary", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: "1e3a5f",
  });

  const summaryData: TableRow[] = [
    row(["Metric", "Value"]),
    row(["Total Segments", String(pciStats.totalSegments)]),
    row(["Average PCI", `${pciStats.avgPci} (${pciLabel(pciStats.avgPci)})`]),
    row(["PCI Range", `${pciStats.minPci} – ${pciStats.maxPci}`]),
    row(["ADA Alerts", String(pciStats.adaCount)]),
  ];

  slide2.addTable(summaryData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    fontSize: 14,
    border: { type: "solid", pt: 0.5, color: "e5e7eb" },
    colW: [4.5, 4.5],
    rowH: [0.4, 0.4, 0.4, 0.4, 0.4],
    autoPage: false,
  });

  // Slide 3: PCI Distribution
  const slide3 = pres.addSlide();
  slide3.addText("PCI Distribution", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: "1e3a5f",
  });

  const distData: TableRow[] = [
    row(["Category", "PCI Range", "Segments", "Percentage"]),
    row(["Good", "85–100", String(pciStats.goodCount), `${((pciStats.goodCount / pciStats.totalSegments) * 100).toFixed(1)}%`]),
    row(["Satisfactory", "70–84", String(pciStats.satisfactoryCount), `${((pciStats.satisfactoryCount / pciStats.totalSegments) * 100).toFixed(1)}%`]),
    row(["Fair", "55–69", String(pciStats.fairCount), `${((pciStats.fairCount / pciStats.totalSegments) * 100).toFixed(1)}%`]),
    row(["Poor", "40–54", String(pciStats.poorCount), `${((pciStats.poorCount / pciStats.totalSegments) * 100).toFixed(1)}%`]),
    row(["Failed", "0–39", String(pciStats.failedCount), `${((pciStats.failedCount / pciStats.totalSegments) * 100).toFixed(1)}%`]),
  ];

  slide3.addTable(distData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    fontSize: 13,
    border: { type: "solid", pt: 0.5, color: "e5e7eb" },
    colW: [2.5, 2, 2, 2.5],
    autoPage: false,
  });

  // Slide 4: Worst Segments
  const worstSegments = [...segments]
    .sort((a, b) => a.pciScore - b.pciScore)
    .slice(0, 10);

  const slide4 = pres.addSlide();
  slide4.addText("Top 10 Worst Segments", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: "1e3a5f",
  });

  const worstData: TableRow[] = [
    row(["#", "Street Name", "PCI", "Condition", "ADA Flag"]),
    ...worstSegments.map((s, i) =>
      row([
        String(i + 1),
        s.streetName,
        String(s.pciScore),
        pciLabel(s.pciScore),
        s.adaCurbRampFlag ? "YES" : "",
      ])
    ),
  ];

  slide4.addTable(worstData, {
    x: 0.5,
    y: 1.2,
    w: 9,
    fontSize: 12,
    border: { type: "solid", pt: 0.5, color: "e5e7eb" },
    colW: [0.5, 3.5, 1, 2, 2],
    autoPage: false,
  });

  // Slide 5: ADA Compliance
  if (pciStats.adaCount > 0) {
    const adaSegments = segments.filter((s) => s.adaCurbRampFlag);
    const slide5 = pres.addSlide();
    slide5.addText("ADA Compliance Alerts", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: "dc2626",
    });

    slide5.addText(
      `${pciStats.adaCount} segments flagged for ADA curb ramp issues`,
      {
        x: 0.5,
        y: 1,
        w: 9,
        h: 0.5,
        fontSize: 14,
        color: "6b7280",
      }
    );

    const adaData: TableRow[] = [
      row(["Street Name", "PCI Score", "Condition"]),
      ...adaSegments.slice(0, 15).map((s) =>
        row([s.streetName, String(s.pciScore), pciLabel(s.pciScore)])
      ),
    ];

    slide5.addTable(adaData, {
      x: 0.5,
      y: 1.8,
      w: 9,
      fontSize: 12,
      border: { type: "solid", pt: 0.5, color: "e5e7eb" },
      colW: [4, 2.5, 2.5],
      autoPage: false,
    });
  }

  const output = await pres.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
