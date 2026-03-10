"use client";

import type { RoadSegment, Frame } from "@/types";
import { pciColor, pciLabel, formatMiles } from "@/lib/utils";
import { FrameList } from "./frame-list";
import { ArrowLeft, Accessibility, Ruler, MapPin } from "lucide-react";

interface SegmentDetailPanelProps {
  segment: RoadSegment;
  frames: Frame[];
  onBack: () => void;
}

export function SegmentDetailPanel({
  segment,
  frames,
  onBack,
}: SegmentDetailPanelProps) {
  const segmentFrames = frames.filter((f) => f.segmentId === segment.id);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </button>
        <h2 className="text-base font-semibold text-[var(--color-primary)]">
          {segment.streetName}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">{segment.district}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* PCI Score */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: pciColor(segment.pciScore) }}
          >
            {segment.pciScore}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">PCI Score</p>
            <p
              className="text-sm font-semibold"
              style={{ color: pciColor(segment.pciScore) }}
            >
              {pciLabel(segment.pciScore)}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <Ruler className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Length</p>
              <p className="text-sm font-medium text-gray-900">
                {segment.lengthFt} ft ({formatMiles(segment.lengthFt)} mi)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
            <MapPin className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Surface</p>
              <p className="text-sm font-medium capitalize text-gray-900">
                {segment.surfaceType}
              </p>
            </div>
          </div>
        </div>

        {/* ADA Alert */}
        {segment.adaCurbRampFlag && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
            <Accessibility className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700">
              ADA curb ramp alert flagged
            </span>
          </div>
        )}

        {/* Frames */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Frames ({segmentFrames.length})
          </h3>
          <FrameList frames={segmentFrames} />
        </div>
      </div>
    </div>
  );
}
