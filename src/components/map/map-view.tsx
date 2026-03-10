"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, MapPin } from "lucide-react";
import type { RoadSegment, Frame } from "@/types";
import { MapContainer } from "./map-container";

interface SurveyOption {
  id: string;
  name: string;
  status: string;
  totalSegments: number;
  averagePci: number | null;
  createdAt: string;
}

interface MapViewProps {
  initialSegmentId: string | null;
  initialSurveyId: string | null;
  mapboxToken: string;
}

export function MapView({
  initialSegmentId,
  initialSurveyId,
  mapboxToken,
}: MapViewProps) {
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [surveys, setSurveys] = useState<SurveyOption[]>([]);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(
    initialSurveyId
  );
  const [loading, setLoading] = useState(true);

  const fetchMapData = useCallback(
    async (surveyId?: string | null) => {
      setLoading(true);
      try {
        const param = surveyId ? `?surveyId=${surveyId}` : "";
        const res = await fetch(`/api/map${param}`);
        if (!res.ok) throw new Error("Failed to fetch map data");
        const data = await res.json();
        setSegments(data.segments);
        setFrames(data.frames);
        setSurveys(data.surveys);
        setActiveSurveyId(data.activeSurveyId);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMapData(initialSurveyId);
  }, [fetchMapData, initialSurveyId]);

  const handleSurveyChange = (surveyId: string) => {
    setActiveSurveyId(surveyId);
    fetchMapData(surveyId);
  };

  if (loading) {
    return (
      <>
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            Map View
          </h1>
          <p className="mt-1 text-sm text-gray-500">Loading map data...</p>
        </div>
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    );
  }

  if (segments.length === 0 && surveys.length === 0) {
    return (
      <>
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">
            Map View
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Interactive road condition map
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-gray-700">
              No inspection data yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Complete a survey to see road segments on the map.
            </p>
          </div>
        </div>
      </>
    );
  }

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId);

  return (
    <>
      {/* Header with survey selector */}
      <div className="border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">
              Map View
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {segments.length} segments
              {activeSurvey
                ? ` — ${activeSurvey.name}`
                : " — color-coded by PCI score"}
            </p>
          </div>

          {surveys.length > 1 && (
            <select
              value={activeSurveyId ?? ""}
              onChange={(e) => handleSurveyChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {surveys.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalSegments} segments
                  {s.averagePci != null
                    ? `, PCI ${Math.round(s.averagePci)}`
                    : ""}
                  )
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <MapContainer
        segments={segments}
        frames={frames}
        initialSegmentId={initialSegmentId}
        mapboxToken={mapboxToken}
      />
    </>
  );
}
