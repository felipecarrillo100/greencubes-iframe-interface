export type JSONFeatureId = string | number;

export type JSONGeometry =
    | { type: "Point"; coordinates: [number, number] | [number, number, number] }
    | { type: "MultiPoint"; coordinates: ([number, number] | [number, number, number])[] }
    | { type: "LineString"; coordinates: ([number, number] | [number, number, number])[] }
    | { type: "MultiLineString"; coordinates: ([number, number] | [number, number, number])[][] }
    | { type: "Polygon"; coordinates: ([number, number] | [number, number, number])[][ ] }
    | { type: "MultiPolygon"; coordinates: ([number, number] | [number, number, number])[][][] }
    | { type: "GeometryCollection"; geometries: JSONGeometry[] };

export interface JSONFeature {
    type: "Feature";
    id?: JSONFeatureId;
    geometry: JSONGeometry | null;
    properties: { [key: string]: any } | null;
}
