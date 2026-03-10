import { db } from "@/server/db";
import { roadSegments, frames, surveys } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { pciLabel, pciColor } from "@/lib/utils";

export async function generatePdf(surveyId: string): Promise<Buffer> {
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

  const [stats] = await db
    .select({
      avgPci: sql<number>`ROUND(AVG(${roadSegments.pciScore}))`,
      minPci: sql<number>`MIN(${roadSegments.pciScore})`,
      maxPci: sql<number>`MAX(${roadSegments.pciScore})`,
      totalSegments: sql<number>`COUNT(*)`,
      totalLengthFt: sql<number>`SUM(${roadSegments.lengthFt})`,
      adaCount: sql<number>`SUM(CASE WHEN ${roadSegments.adaCurbRampFlag} = true THEN 1 ELSE 0 END)`,
    })
    .from(roadSegments)
    .where(eq(roadSegments.surveyId, surveyId));

  const [frameStats] = await db
    .select({
      totalFrames: sql<number>`COUNT(*)`,
      overrideCount: sql<number>`SUM(CASE WHEN ${frames.humanOverride} = true THEN 1 ELSE 0 END)`,
      flaggedCount: sql<number>`SUM(CASE WHEN ${frames.flaggedForReview} = true THEN 1 ELSE 0 END)`,
    })
    .from(frames)
    .where(eq(frames.surveyId, surveyId));

  const worstSegments = [...segments]
    .sort((a, b) => a.pciScore - b.pciScore)
    .slice(0, 15);

  const totalMiles = ((stats.totalLengthFt ?? 0) / 5280).toFixed(1);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.5; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e3a5f; }
    .header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 20px; color: #1e3a5f; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .metric { flex: 1; min-width: 140px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
    .metric .value { font-size: 28px; font-weight: 700; color: #1e3a5f; }
    .metric .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    tr:nth-child(even) { background: #fafafa; }
    .pci-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; color: white; font-weight: 600; font-size: 12px; }
    .ada-flag { color: #dc2626; font-weight: 600; }
    .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${survey?.name ?? "Road Inspection Report"}</h1>
    <p>AI-Powered Pavement Condition Assessment</p>
    <p>Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="value">${stats.totalSegments}</div>
      <div class="label">Segments</div>
    </div>
    <div class="metric">
      <div class="value">${totalMiles} mi</div>
      <div class="label">Total Miles</div>
    </div>
    <div class="metric">
      <div class="value">${stats.avgPci}</div>
      <div class="label">Avg PCI (${pciLabel(stats.avgPci)})</div>
    </div>
    <div class="metric">
      <div class="value">${stats.adaCount}</div>
      <div class="label">ADA Alerts</div>
    </div>
    <div class="metric">
      <div class="value">${frameStats.totalFrames}</div>
      <div class="label">Frames Analyzed</div>
    </div>
  </div>

  <div class="section">
    <h2>PCI Distribution</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>PCI Range</th><th>Segments</th><th>Percentage</th></tr>
      </thead>
      <tbody>
        ${[
          { label: "Good", min: 85, max: 100, color: "#22c55e" },
          { label: "Satisfactory", min: 70, max: 84, color: "#84cc16" },
          { label: "Fair", min: 55, max: 69, color: "#eab308" },
          { label: "Poor", min: 40, max: 54, color: "#f97316" },
          { label: "Failed", min: 0, max: 39, color: "#ef4444" },
        ]
          .map((cat) => {
            const count = segments.filter(
              (s) => s.pciScore >= cat.min && s.pciScore <= cat.max
            ).length;
            const pct =
              stats.totalSegments > 0
                ? ((count / stats.totalSegments) * 100).toFixed(1)
                : "0.0";
            return `<tr>
              <td><span class="pci-badge" style="background:${cat.color}">${cat.label}</span></td>
              <td>${cat.min}–${cat.max}</td>
              <td>${count}</td>
              <td>${pct}%</td>
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Worst Segments (Lowest PCI)</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Street Name</th><th>PCI</th><th>Condition</th><th>Surface</th><th>Length</th><th>ADA</th></tr>
      </thead>
      <tbody>
        ${worstSegments
          .map(
            (s, i) => `<tr>
            <td>${i + 1}</td>
            <td>${s.streetName}</td>
            <td><span class="pci-badge" style="background:${pciColor(s.pciScore)}">${s.pciScore}</span></td>
            <td>${pciLabel(s.pciScore)}</td>
            <td>${s.surfaceType}</td>
            <td>${(s.lengthFt / 5280).toFixed(2)} mi</td>
            <td>${s.adaCurbRampFlag ? '<span class="ada-flag">YES</span>' : ""}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${
    frameStats.overrideCount > 0 || frameStats.flaggedCount > 0
      ? `<div class="section">
    <h2>Quality Assurance</h2>
    <table>
      <thead><tr><th>Metric</th><th>Count</th></tr></thead>
      <tbody>
        <tr><td>Total Frames Analyzed</td><td>${frameStats.totalFrames}</td></tr>
        <tr><td>Human Overrides Applied</td><td>${frameStats.overrideCount}</td></tr>
        <tr><td>Frames Flagged for Review</td><td>${frameStats.flaggedCount}</td></tr>
      </tbody>
    </table>
  </div>`
      : ""
  }

  <div class="section">
    <h2>All Segments</h2>
    <table>
      <thead>
        <tr><th>#</th><th>Street Name</th><th>PCI</th><th>Surface</th><th>Length (ft)</th><th>ADA</th></tr>
      </thead>
      <tbody>
        ${segments
          .map(
            (s) => `<tr>
            <td>${s.segmentIndex}</td>
            <td>${s.streetName}</td>
            <td><span class="pci-badge" style="background:${pciColor(s.pciScore)}">${s.pciScore}</span></td>
            <td>${s.surfaceType}</td>
            <td>${s.lengthFt.toFixed(0)}</td>
            <td>${s.adaCurbRampFlag ? '<span class="ada-flag">YES</span>' : ""}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Generated by GroundTruth AI | AI-Powered Pavement Condition Assessment</p>
    <p>This report was generated using computer vision analysis. Human overrides may have been applied.</p>
  </div>
</body>
</html>`;

  return Buffer.from(html, "utf-8");
}
