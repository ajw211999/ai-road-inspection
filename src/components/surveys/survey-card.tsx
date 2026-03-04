import { Film, Clock, CheckCircle, AlertCircle, Upload } from "lucide-react";
import type { Survey } from "@/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  uploading: {
    label: "Uploading",
    color: "text-blue-800",
    bg: "bg-blue-100",
    icon: Upload,
  },
  processing: {
    label: "Processing",
    color: "text-amber-800",
    bg: "bg-amber-100",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "text-green-800",
    bg: "bg-green-100",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "text-red-800",
    bg: "bg-red-100",
    icon: AlertCircle,
  },
};

interface SurveyCardProps {
  survey: Survey;
}

export function SurveyCard({ survey }: SurveyCardProps) {
  const config = STATUS_CONFIG[survey.status] ?? STATUS_CONFIG.processing;
  const StatusIcon = config.icon;
  const progressPct =
    survey.totalFrames > 0
      ? Math.round((survey.processedFrames / survey.totalFrames) * 100)
      : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Film className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{survey.name}</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(survey.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.color}`}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Progress bar for uploading/processing */}
      {(survey.status === "uploading" || survey.status === "processing") && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {survey.processedFrames} / {survey.totalFrames || "?"} frames
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${
                survey.status === "uploading" ? "bg-blue-500" : "bg-amber-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats for completed surveys */}
      {survey.status === "completed" && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Frames" value={survey.processedFrames} />
          <MiniStat label="Segments" value={survey.totalSegments} />
          <MiniStat
            label="Avg PCI"
            value={survey.averagePci != null ? Math.round(survey.averagePci) : "—"}
          />
        </div>
      )}

      {/* Error state info */}
      {survey.status === "failed" && (
        <p className="mt-3 text-xs text-red-600">
          Processing failed. You may re-upload to try again.
        </p>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
