import { mockSegments, mockFrames } from "@/lib/mock-data";
import { MapContainer } from "@/components/map/map-container";

interface MapPageProps {
  searchParams: Promise<{ segment?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const segmentId = params.segment ?? null;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">
          Map View
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Interactive road condition map — color-coded by PCI score
        </p>
      </div>

      <MapContainer
        segments={mockSegments}
        frames={mockFrames}
        initialSegmentId={segmentId}
        mapboxToken={mapboxToken}
      />
    </div>
  );
}
