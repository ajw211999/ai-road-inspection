import type { RoadSegment, SegmentFeature } from "@/types";
import type { Expression } from "mapbox-gl";

/** Austin, TX center coordinates */
export const AUSTIN_VIEW_STATE = {
  latitude: 30.267,
  longitude: -97.743,
  zoom: 13,
};

/** Compute view state that fits all segments, fallback to Austin */
export function computeViewState(segments: RoadSegment[]): {
  latitude: number;
  longitude: number;
  zoom: number;
} {
  if (segments.length === 0) return AUSTIN_VIEW_STATE;

  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  for (const s of segments) {
    minLat = Math.min(minLat, s.startLat, s.endLat);
    maxLat = Math.max(maxLat, s.startLat, s.endLat);
    minLng = Math.min(minLng, s.startLng, s.endLng);
    maxLng = Math.max(maxLng, s.startLng, s.endLng);
  }

  // Skip if all coords are 0 (no GPS data yet)
  if (minLat === 0 && maxLat === 0 && minLng === 0 && maxLng === 0) {
    return AUSTIN_VIEW_STATE;
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  // Estimate zoom from bounding box span
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const span = Math.max(latSpan, lngSpan);

  let zoom = 13;
  if (span > 0.5) zoom = 10;
  else if (span > 0.1) zoom = 12;
  else if (span > 0.01) zoom = 14;
  else zoom = 16;

  return { latitude, longitude, zoom };
}

/** Convert road segments array to a GeoJSON FeatureCollection */
export function segmentsToFeatureCollection(segments: RoadSegment[]): {
  type: "FeatureCollection";
  features: SegmentFeature[];
} {
  return {
    type: "FeatureCollection",
    features: segments
      .filter((s) => s.geometry)
      .map((s) => ({
        type: "Feature" as const,
        geometry: s.geometry!,
        properties: {
          id: s.id,
          streetName: s.streetName,
          pciScore: s.pciScore,
          surfaceType: s.surfaceType,
          district: s.district,
          adaCurbRampFlag: s.adaCurbRampFlag,
        },
      })),
  };
}

/** Mapbox step expression that maps PCI scores to colors */
export function pciColorExpression(): Expression {
  return [
    "step",
    ["get", "pciScore"],
    "#ef4444", // < 40: red (Failed)
    40,
    "#f97316", // 40-54: orange (Poor)
    55,
    "#eab308", // 55-69: yellow (Fair)
    70,
    "#84cc16", // 70-84: lime (Satisfactory)
    85,
    "#22c55e", // 85+: green (Good)
  ] as Expression;
}

/** PCI rating categories for layer toggles */
export const PCI_CATEGORIES = [
  { key: "good", label: "Good", min: 85, max: 100, color: "#22c55e" },
  { key: "satisfactory", label: "Satisfactory", min: 70, max: 84, color: "#84cc16" },
  { key: "fair", label: "Fair", min: 55, max: 69, color: "#eab308" },
  { key: "poor", label: "Poor", min: 40, max: 54, color: "#f97316" },
  { key: "failed", label: "Failed", min: 0, max: 39, color: "#ef4444" },
] as const;

/** Build Mapbox filter expression from active category keys */
export function buildPciFilter(
  activeCategories: Set<string>
): Expression | undefined {
  if (activeCategories.size === PCI_CATEGORIES.length) return undefined; // show all

  const conditions: Expression[] = [];
  for (const cat of PCI_CATEGORIES) {
    if (activeCategories.has(cat.key)) {
      conditions.push([
        "all",
        [">=", ["get", "pciScore"], cat.min],
        ["<=", ["get", "pciScore"], cat.max],
      ] as Expression);
    }
  }

  if (conditions.length === 0) return ["==", 1, 0] as Expression; // hide all
  if (conditions.length === 1) return conditions[0];
  return ["any", ...conditions] as Expression;
}
