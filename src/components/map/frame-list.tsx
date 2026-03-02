import type { Frame } from "@/types";
import { distressLabel } from "@/lib/utils";
import { SeverityBadge } from "@/components/ui/badge";

interface FrameListProps {
  frames: Frame[];
}

export function FrameList({ frames }: FrameListProps) {
  if (frames.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        No frames for this segment
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {frames.map((frame) => (
        <div
          key={frame.id}
          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">
                Frame #{frame.frameIndex}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {distressLabel(frame.distressType)}
              </p>
            </div>
            <SeverityBadge severity={frame.severity} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>
              Confidence:{" "}
              <span className="font-medium text-gray-700">
                {(frame.confidence * 100).toFixed(0)}%
              </span>
            </span>
            <span>
              PCI:{" "}
              <span className="font-medium text-gray-700">
                {frame.pciScore}
              </span>
            </span>
          </div>
          {frame.humanOverride && (
            <div className="mt-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
              Override: PCI {frame.humanPciScore ?? "—"}
              {frame.humanNotes && (
                <span className="ml-1 text-blue-500">
                  — {frame.humanNotes}
                </span>
              )}
            </div>
          )}
          {frame.flaggedForReview && !frame.humanOverride && (
            <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Flagged for review
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
