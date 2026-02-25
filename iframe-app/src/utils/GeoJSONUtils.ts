import { Shape } from "@luciad/ria/shape/Shape.js";
import { GeoJsonCodec } from "@luciad/ria/model/codec/GeoJsonCodec.js";
import { JSONGeometry } from "../../../src/JSONFeature";

const geoJSONCodec = new GeoJsonCodec({ generateIDs: true });
// const geoJSONCodecNoID = new GeoJsonCodec({generateIDs: false});

export class GeoJSONUtils {
    public static shapeToGeometry(shape: Shape | null): JSONGeometry {
        return geoJSONCodec.encodeShape(shape);
    }
}
