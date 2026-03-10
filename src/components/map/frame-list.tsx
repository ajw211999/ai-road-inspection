"use client";

import { useState, useCallback } from "react";
import type { Frame } from "@/types";
import { distressLabel } from "@/lib/utils";
import { SeverityBadge, PciBadge } from "@/components/ui/badge";
import { ImageZoomLightbox } from "@/components/ui/image-zoom-lightbox";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface FrameListProps {
  frames: Frame[];
}

export function FrameList({ frames }: FrameListProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    setZoomIdx((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const handleNext = useCallback(() => {
    setZoomIdx((i) => (i !== null && i < frames.length - 1 ? i + 1 : i));
  }, [frames.length]);

  if (frames.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        No frames for this segment
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {frames.map((frame, idx) => (
          <div
            key={frame.id}
            className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
          >
            {/* Thumbnail + info row */}
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="flex w-full items-start gap-3 p-2 text-left transition-colors hover:bg-gray-100"
            >
              <img
                src={frame.imageUrl}
                alt={`Frame ${frame.frameIndex}`}
                className="h-16 w-24 shrink-0 rounded border border-gray-200 object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">
                    #{frame.frameIndex}
                  </p>
                  <SeverityBadge severity={frame.severity} />
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {distressLabel(frame.distressType)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <PciBadge score={frame.humanOverride ? (frame.humanPciScore ?? frame.pciScore) : frame.pciScore} />
                  <span className="text-[10px] text-gray-400">
                    {(frame.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded image view */}
            {expandedIdx === idx && (
              <div className="border-t border-gray-200 bg-black">
                <div className="relative">
                  <img
                    src={frame.imageUrl}
                    alt={`Frame ${frame.frameIndex}`}
                    className="w-full object-contain"
                    style={{ maxHeight: 300 }}
                  />
                  {/* Zoom button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomIdx(idx);
                    }}
                    className="absolute top-2 left-2 rounded bg-black/50 p-1.5 text-white hover:bg-black/70"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setExpandedIdx(null)}
                    className="absolute top-2 right-2 rounded bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {/* Prev/Next navigation */}
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIdx(idx - 1);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  {idx < frames.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedIdx(idx + 1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Info bar below expanded image */}
                <div className="flex items-center gap-3 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                  <span>Frame #{frame.frameIndex}</span>
                  <span>{distressLabel(frame.distressType)}</span>
                  <span>PCI {frame.pciScore}</span>
                  {frame.humanOverride && (
                    <span className="text-blue-400">
                      Override: {frame.humanPciScore}
                    </span>
                  )}
                  <button
                    onClick={() => setZoomIdx(idx)}
                    className="ml-auto flex items-center gap-1 text-white/60 hover:text-white"
                  >
                    <ZoomIn className="h-3 w-3" />
                    Zoom
                  </button>
                </div>
              </div>
            )}

            {/* Status badges (collapsed view) */}
            {expandedIdx !== idx && (
              <>
                {frame.humanOverride && (
                  <div className="border-t border-gray-100 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                    Override: PCI {frame.humanPciScore ?? "—"}
                    {frame.humanNotes && (
                      <span className="ml-1 text-blue-500">— {frame.humanNotes}</span>
                    )}
                  </div>
                )}
                {frame.flaggedForReview && !frame.humanOverride && (
                  <div className="border-t border-gray-100 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                    Flagged for review
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Zoom lightbox */}
      {zoomIdx !== null && frames[zoomIdx] && (
        <ImageZoomLightbox
          frame={frames[zoomIdx]}
          onClose={() => setZoomIdx(null)}
          onPrev={zoomIdx > 0 ? handlePrev : undefined}
          onNext={zoomIdx < frames.length - 1 ? handleNext : undefined}
        />
      )}
    </>
  );
}
