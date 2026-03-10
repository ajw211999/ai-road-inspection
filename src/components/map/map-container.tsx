"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Map, { Source, Layer, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import type { RoadSegment, Frame } from "@/types";
import {
  computeViewState,
  segmentsToFeatureCollection,
  pciColorExpression,
  buildPciFilter,
  PCI_CATEGORIES,
} from "@/lib/map-utils";
import { MapLegend } from "./map-legend";
import { MapSearch } from "./map-search";
import { MapControls } from "./map-controls";
import { SegmentListPanel } from "./segment-list-panel";
import { SegmentDetailPanel } from "./segment-detail-panel";
import { MapPin } from "lucide-react";

interface MapContainerProps {
  segments: RoadSegment[];
  frames: Frame[];
  initialSegmentId?: string | null;
  mapboxToken?: string;
}

export function MapContainer({
  segments,
  frames,
  initialSegmentId,
  mapboxToken,
}: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(
    () => {
      if (initialSegmentId) {
        return segments.find((s) => s.id === initialSegmentId) ?? null;
      }
      return null;
    }
  );
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(PCI_CATEGORIES.map((c) => c.key))
  );

  const initialView = useMemo(
    () => computeViewState(segments),
    [segments]
  );

  const geojson = useMemo(
    () => segmentsToFeatureCollection(segments),
    [segments]
  );

  const filter = useMemo(
    () => buildPciFilter(activeCategories),
    [activeCategories]
  );

  // Auto-fly to initial segment on mount
  const hasFlewToInitial = useRef(false);
  useEffect(() => {
    if (initialSegmentId && selectedSegment && !hasFlewToInitial.current) {
      hasFlewToInitial.current = true;
      flyToSegment(selectedSegment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flyToSegment(segment: RoadSegment) {
    if (!mapRef.current) return;
    const midLat = (segment.startLat + segment.endLat) / 2;
    const midLng = (segment.startLng + segment.endLng) / 2;
    mapRef.current.flyTo({
      center: [midLng, midLat],
      zoom: 16,
      duration: 1200,
    });
  }

  const handleSelectSegment = useCallback(
    (segment: RoadSegment) => {
      setSelectedSegment(segment);
      flyToSegment(segment);
    },
    []
  );

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const features = e.features;
      if (features && features.length > 0) {
        const id = features[0].properties?.id;
        const seg = segments.find((s) => s.id === id);
        if (seg) {
          handleSelectSegment(seg);
        }
      }
    },
    [segments, handleSelectSegment]
  );

  const handleToggleCategory = useCallback((key: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSegment(null);
  }, []);

  // No-token fallback
  if (!mapboxToken) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex-1 bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700">
                Mapbox Token Required
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                Set <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
                your <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">.env.local</code> to enable the
                interactive map.
              </p>
            </div>
          </div>
          <MapLegend />
        </div>
        <div className="w-80 border-l border-gray-200 bg-white">
          {selectedSegment ? (
            <SegmentDetailPanel
              segment={selectedSegment}
              frames={frames}
              onBack={handleBack}
            />
          ) : (
            <SegmentListPanel
              segments={segments}
              selectedId={null}
              onSelect={handleSelectSegment}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="relative flex-1">
        <Map
          ref={mapRef}
          initialViewState={initialView}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/light-v11"
          interactiveLayerIds={["road-segments"]}
          onClick={handleMapClick}
          cursor="pointer"
          style={{ width: "100%", height: "100%" }}
        >
          <Source id="segments" type="geojson" data={geojson}>
            <Layer
              id="road-segments"
              type="line"
              paint={{
                "line-color": pciColorExpression(),
                "line-width": [
                  "case",
                  [
                    "==",
                    ["get", "id"],
                    selectedSegment?.id ?? "",
                  ],
                  6,
                  3,
                ],
                "line-opacity": 0.85,
              }}
              {...(filter ? { filter } : {})}
            />
          </Source>
        </Map>

        <MapSearch segments={segments} onSelect={handleSelectSegment} />
        <MapControls
          activeCategories={activeCategories}
          onToggle={handleToggleCategory}
        />
        <MapLegend />
      </div>

      {/* Right Panel */}
      <div className="w-80 border-l border-gray-200 bg-white md:w-96">
        {selectedSegment ? (
          <SegmentDetailPanel
            segment={selectedSegment}
            frames={frames}
            onBack={handleBack}
          />
        ) : (
          <SegmentListPanel
            segments={segments}
            selectedId={selectedSegment}
            onSelect={handleSelectSegment}
          />
        )}
      </div>
    </div>
  );
}
