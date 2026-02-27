import { FileText, FileSpreadsheet, Map, Table } from "lucide-react";

const reportFormats = [
  {
    format: "PDF",
    icon: FileText,
    description: "Council-ready presentation report with maps, charts, and photos",
    engine: "Puppeteer",
  },
  {
    format: "PPTX",
    icon: FileSpreadsheet,
    description: "PowerPoint slide deck for city council presentations",
    engine: "pptxgenjs",
  },
  {
    format: "Shapefile",
    icon: Map,
    description: "GIS-compatible shapefile for import into ArcGIS or QGIS",
    engine: "shp-write",
  },
  {
    format: "CSV",
    icon: Table,
    description: "Raw data export for spreadsheet analysis",
    engine: "Native",
  },
];

const mockReports = [
  {
    id: "1",
    name: "Q1 2026 Downtown Austin — Full Report",
    format: "PDF" as const,
    status: "completed" as const,
    createdAt: "2026-01-20",
    fileSize: "4.2 MB",
  },
  {
    id: "2",
    name: "Council Presentation — District 1-4",
    format: "PPTX" as const,
    status: "completed" as const,
    createdAt: "2026-01-22",
    fileSize: "8.1 MB",
  },
  {
    id: "3",
    name: "GIS Export — All Segments",
    format: "Shapefile" as const,
    status: "completed" as const,
    createdAt: "2026-01-22",
    fileSize: "1.8 MB",
  },
];

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and download inspection reports in multiple formats
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          + Generate Report
        </button>
      </div>

      {/* Export Format Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportFormats.map(({ format, icon: Icon, description, engine }) => (
          <div
            key={format}
            className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{format}</p>
                <p className="text-xs text-gray-400">{engine}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">{description}</p>
          </div>
        ))}
      </div>

      {/* Data Export Guarantee Banner */}
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          Data Export Guarantee
        </p>
        <p className="mt-1 text-xs text-green-700">
          Your data is always yours. Export all inspection data in standard
          formats (CSV, Shapefile, PDF) at any time, even if you cancel your
          subscription. No vendor lock-in.
        </p>
      </div>

      {/* Recent Reports Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Report Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {mockReports.map((report) => (
                <tr key={report.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {report.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {report.format}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      {report.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {report.fileSize}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {report.createdAt}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
