import type { RoadSegment, SegmentFeature } from "@/types";
import type { Expression } from "mapbox-gl";

/** Austin, TX center coordinates */
export const AUSTIN_VIEW_STATE = {
  latitude: 30.267,
  longitude: -97.743,
  zoom: 13,
};

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
