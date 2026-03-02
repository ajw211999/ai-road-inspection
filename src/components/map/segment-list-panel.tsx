"use client";

import { useState } from "react";
import type { RoadSegment } from "@/types";
import { pciColor, pciLabel } from "@/lib/utils";
import { SearchInput } from "@/components/ui/search-input";

interface SegmentListPanelProps {
  segments: RoadSegment[];
  selectedId: string | null;
  onSelect: (segment: RoadSegment) => void;
}

export function SegmentListPanel({
  segments,
  selectedId,
  onSelect,
}: SegmentListPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? segments.filter((s) =>
        s.streetName.toLowerCase().includes(search.toLowerCase())
      )
    : segments;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Segments ({filtered.length})
        </p>
        <div className="mt-2">
          <SearchInput
            placeholder="Filter segments..."
            onSearch={setSearch}
          />
        </div>
      </div>
      <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
        {filtered.map((seg) => (
          <li
            key={seg.id}
            onClick={() => onSelect(seg)}
            className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-blue-50 ${
              selectedId === seg.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {seg.streetName}
              </p>
              <p className="text-xs text-gray-500">
                {seg.district} · {seg.lengthFt} ft
              </p>
            </div>
            <span
              className="ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: pciColor(seg.pciScore) }}
            >
              {seg.pciScore} — {pciLabel(seg.pciScore)}
            </span>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">
            No segments match your search
          </li>
        )}
      </ul>
    </div>
  );
}
