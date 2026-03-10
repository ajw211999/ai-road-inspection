"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  FileSpreadsheet,
  Map,
  Table,
  Download,
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import type { Report, Survey } from "@/types";

const FORMAT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; description: string; engine: string }
> = {
  pdf: {
    label: "PDF",
    icon: FileText,
    description: "Council-ready report with charts, tables, and PCI analysis",
    engine: "HTML Report",
  },
  pptx: {
    label: "PPTX",
    icon: FileSpreadsheet,
    description: "PowerPoint slide deck for city council presentations",
    engine: "pptxgenjs",
  },
  shapefile: {
    label: "Shapefile",
    icon: Map,
    description: "GIS-compatible shapefile for import into ArcGIS or QGIS",
    engine: "shp-write",
  },
  csv: {
    label: "CSV",
    icon: Table,
    description: "Raw data export for spreadsheet analysis",
    engine: "Native",
  },
};

const STATUS_BADGE: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  generating: { bg: "bg-amber-100", color: "text-amber-700", icon: Clock },
  completed: { bg: "bg-green-100", color: "text-green-700", icon: CheckCircle },
  failed: { bg: "bg-red-100", color: "text-red-700", icon: AlertCircle },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReportsView() {
  const [reports, setReports] = useState<Report[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, surveysRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/surveys"),
      ]);
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (surveysRes.ok) setSurveys(await surveysRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedSurveys = surveys.filter((s) => s.status === "completed");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and download inspection reports in multiple formats
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          disabled={completedSurveys.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Export Format Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(FORMAT_CONFIG).map(
          ([key, { label, icon: Icon, description, engine }]) => (
            <div
              key={key}
              className="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{engine}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">{description}</p>
            </div>
          )
        )}
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

      {/* Reports Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          {loading ? "Loading..." : `Reports (${reports.length})`}
        </h2>

        {!loading && reports.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12 text-gray-400">
            <FileText className="h-10 w-10" />
            <p className="mt-3 text-sm font-medium">No reports generated yet</p>
            <p className="mt-1 text-xs">
              {completedSurveys.length > 0
                ? 'Click "Generate Report" to create your first report.'
                : "Complete a survey first, then generate reports."}
            </p>
          </div>
        ) : (
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
                {reports.map((report) => {
                  const statusConfig = STATUS_BADGE[report.status] ?? STATUS_BADGE.generating;
                  const StatusIcon = statusConfig.icon;
                  const formatInfo = FORMAT_CONFIG[report.format];

                  return (
                    <tr key={report.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {report.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatInfo?.label ?? report.format.toUpperCase()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {report.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {report.fileSizeBytes
                          ? formatBytes(report.fileSizeBytes)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {report.status === "completed" && report.fileUrl ? (
                          <a
                            href={report.fileUrl}
                            download
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        ) : report.status === "generating" ? (
                          <span className="text-gray-400">Generating...</span>
                        ) : (
                          <span className="text-red-400">Failed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Dialog */}
      {showDialog && (
        <GenerateReportDialog
          surveys={completedSurveys}
          onClose={() => setShowDialog(false)}
          onGenerated={() => {
            setShowDialog(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Generate Report Dialog
// ============================================================

function GenerateReportDialog({
  surveys,
  onClose,
  onGenerated,
}: {
  surveys: Survey[];
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [surveyId, setSurveyId] = useState(surveys[0]?.id ?? "");
  const [format, setFormat] = useState("pdf");
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate name when survey or format changes
  useEffect(() => {
    const survey = surveys.find((s) => s.id === surveyId);
    if (survey) {
      const formatLabel = FORMAT_CONFIG[format]?.label ?? format.toUpperCase();
      setName(`${survey.name} — ${formatLabel} Report`);
    }
  }, [surveyId, format, surveys]);

  const handleGenerate = async () => {
    if (!surveyId || !name.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId,
          name: name.trim(),
          format,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }

      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Generate Report
          </h2>
          <button
            onClick={onClose}
            disabled={generating}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Survey Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Survey
            </label>
            <select
              value={surveyId}
              onChange={(e) => setSurveyId(e.target.value)}
              disabled={generating}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (PCI {s.averagePci != null ? Math.round(s.averagePci) : "—"})
                </option>
              ))}
            </select>
          </div>

          {/* Format Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Format
            </label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {Object.entries(FORMAT_CONFIG).map(
                ([key, { label, icon: Icon }]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    disabled={generating}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors ${
                      format === key
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Report Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={generating}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={generating}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !surveyId || !name.trim()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
            {generating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
