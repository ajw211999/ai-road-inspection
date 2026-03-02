"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { RoadSegment } from "@/types";
import { pciColor } from "@/lib/utils";

interface MapSearchProps {
  segments: RoadSegment[];
  onSelect: (segment: RoadSegment) => void;
}

export function MapSearch({ segments, onSelect }: MapSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? segments.filter((s) =>
        s.streetName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="absolute left-4 top-4 z-10 w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length > 0);
          }}
          onFocus={() => query.length > 0 && setOpen(true)}
          placeholder="Search streets..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm shadow-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.slice(0, 20).map((seg) => (
            <button
              key={seg.id}
              onClick={() => {
                onSelect(seg);
                setQuery(seg.streetName);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {seg.streetName}
                </p>
                <p className="text-xs text-gray-500">{seg.district}</p>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: pciColor(seg.pciScore) }}
              >
                {seg.pciScore}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.length > 0 && filtered.length === 0 && (
        <div className="mt-1 rounded-lg border border-gray-200 bg-white p-4 text-center shadow-lg">
          <p className="text-sm text-gray-500">No streets found</p>
        </div>
      )}
    </div>
  );
}
