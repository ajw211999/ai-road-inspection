import { mockSegments } from "@/lib/mock-data";
import { pciColor, pciLabel } from "@/lib/utils";

export default function MapPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Map View</h1>
        <p className="mt-1 text-sm text-gray-500">
          Interactive road condition map — Mapbox GL JS will be integrated here
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map Placeholder */}
        <div className="relative flex-1 bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700">
                Mapbox GL JS Map
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {mockSegments.length} road segments will render here as
                color-coded lines
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Center: 30.267°N, 97.743°W (Austin, TX)
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold text-gray-700">PCI Legend</p>
            {[
              { min: 85, label: "Good" },
              { min: 70, label: "Satisfactory" },
              { min: 55, label: "Fair" },
              { min: 40, label: "Poor" },
              { min: 0, label: "Failed" },
            ].map(({ min, label }) => (
              <div key={label} className="flex items-center gap-2 py-0.5">
                <div
                  className="h-3 w-6 rounded-sm"
                  style={{ backgroundColor: pciColor(min) }}
                />
                <span className="text-xs text-gray-600">
                  {label} ({min}+)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Segment List Sidebar */}
        <div className="w-80 overflow-y-auto border-l border-gray-200 bg-white">
          <div className="sticky top-0 border-b border-gray-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-gray-700">
              Segments ({mockSegments.length})
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {mockSegments.map((seg) => (
              <li
                key={seg.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {seg.streetName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seg.district} · {seg.lengthFt} ft
                  </p>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: pciColor(seg.pciScore) }}
                >
                  {seg.pciScore} — {pciLabel(seg.pciScore)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
