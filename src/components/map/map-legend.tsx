import { PCI_CATEGORIES } from "@/lib/map-utils";

export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 z-10 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">PCI Legend</p>
      {PCI_CATEGORIES.map(({ label, min, color }) => (
        <div key={label} className="flex items-center gap-2 py-0.5">
          <div
            className="h-3 w-6 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-gray-600">
            {label} ({min}+)
          </span>
        </div>
      ))}
    </div>
  );
}
