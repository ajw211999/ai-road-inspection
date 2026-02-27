// GeoJSON type definitions
declare namespace GeoJSON {
  interface Point {
    type: "Point";
    coordinates: [number, number];
  }

  interface LineString {
    type: "LineString";
    coordinates: [number, number][];
  }

  interface Polygon {
    type: "Polygon";
    coordinates: [number, number][][];
  }

  interface FeatureCollection<G = Geometry, P = Record<string, unknown>> {
    type: "FeatureCollection";
    features: Feature<G, P>[];
  }

  interface Feature<G = Geometry, P = Record<string, unknown>> {
    type: "Feature";
    geometry: G;
    properties: P;
  }

  type Geometry = Point | LineString | Polygon;
}
