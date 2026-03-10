import { MapView } from "@/components/map/map-view";

interface MapPageProps {
  searchParams: Promise<{ segment?: string; survey?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const segmentId = params.segment ?? null;
  const surveyId = params.survey ?? null;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  return (
    <div className="flex h-full flex-col">
      <MapView
        initialSegmentId={segmentId}
        initialSurveyId={surveyId}
        mapboxToken={mapboxToken}
      />
    </div>
  );
}
