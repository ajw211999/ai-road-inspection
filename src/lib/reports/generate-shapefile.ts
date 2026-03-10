import { db } from "@/server/db";
import { roadSegments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
// @ts-expect-error shp-write has no type declarations
import shpwrite from "shp-write";

export async function generateShapefile(surveyId: string): Promise<Buffer> {
  const segments = await db
    .select()
    .from(roadSegments)
    .where(eq(roadSegments.surveyId, surveyId))
    .orderBy(roadSegments.segmentIndex);

  const features = segments.map((s) => {
    // Use geometry if available, otherwise create from start/end points
    const geometry = s.geometry as { type: string; coordinates: number[][] } | null;
    const coords = geometry?.coordinates ?? [
      [s.startLng, s.startLat],
      [s.endLng, s.endLat],
    ];

    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: coords,
      },
      properties: {
        segment_id: s.segmentIndex,
        street_name: s.streetName,
        pci_score: s.pciScore,
        surface_type: s.surfaceType,
        length_ft: s.lengthFt,
        ada_flag: s.adaCurbRampFlag ? 1 : 0,
        district: s.district ?? "",
      },
    };
  });

  const geojson = {
    type: "FeatureCollection" as const,
    features,
  };

  const zipBuffer = await shpwrite.zip(geojson, {
    types: {
      polyline: "road_segments",
    },
  });

  return Buffer.from(zipBuffer);
}
