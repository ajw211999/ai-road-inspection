"use client";

import { PCI_CATEGORIES } from "@/lib/map-utils";

interface MapControlsProps {
  activeCategories: Set<string>;
  onToggle: (key: string) => void;
}

export function MapControls({ activeCategories, onToggle }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-4 z-10 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">Layer Filters</p>
      {PCI_CATEGORIES.map(({ key, label, color }) => (
        <label
          key={key}
          className="flex cursor-pointer items-center gap-2 py-1 text-xs text-gray-700"
        >
          <input
            type="checkbox"
            checked={activeCategories.has(key)}
            onChange={() => onToggle(key)}
            className="h-3.5 w-3.5 rounded border-gray-300"
          />
          <span
            className="inline-block h-2.5 w-4 rounded-sm"
            style={{ backgroundColor: color }}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
