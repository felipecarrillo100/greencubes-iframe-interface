import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import type {QuadTreeRasterTileSetStructure} from "@luciad/ria/model/tileset/RasterTileSetModel.js";
import {createBounds} from "@luciad/ria/shape/ShapeFactory.js";
import {UrlTileSetModel} from "@luciad/ria/model/tileset/UrlTileSetModel.js";
import {RasterTileSetLayer} from "@luciad/ria/view/tileset/RasterTileSetLayer.js";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import {MemoryStore} from "@luciad/ria/model/store/MemoryStore.js";
import {FeatureModel} from "@luciad/ria/model/feature/FeatureModel.js";
import {ShapeIndexPainter} from "./ShapeIndexPainter";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {GeoJsonCodec} from "@luciad/ria/model/codec/GeoJsonCodec.js";

const defaultProjection = "EPSG:4326";
const reference = getReference(defaultProjection);


export function getRequestInitValues(params: URLSearchParams): RequestInit | null {
    const encoded = params.get("requestInit");
    if (!encoded) return {} as RequestInit;
    // Decode base64 safely
    const decoded = atob(encoded);
    return JSON.parse(decoded) as RequestInit;
}

export async function loadGeoJson(
    url: string,
    inputOptions?: RequestInit | null
): Promise<FeatureLayer> {
    const options = inputOptions ? inputOptions : {};
    try {
        const defaultOptions: RequestInit = {
            method: "GET",
            headers: {
                "Content-Type": "text/plain",
                ...(options?.headers || {}), // merge headers safely
            },
            ...options,
        };

        const response = await fetch(url, defaultOptions);

        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.status} ${response.statusText}`);
        }

        // Read raw bytes as ArrayBuffer
        const buffer = await response.arrayBuffer();
        const text = decodeServerText(buffer);

        const store = new MemoryStore({ reference, data: transformDataToFeatures(text) });

        const model = new FeatureModel(store, { reference });
        const painter = new ShapeIndexPainter();
        return new FeatureLayer(model, {
            label: "Labels",
            selectable: true,
            hoverable: true,
            visible: true,
            painter,
        });
    } catch (err) {
        console.error("Error loading labels:", err);
        throw err;
    }
}


function transformDataToFeatures(data: string) {
    const features : Feature[] = [];
    const codec = new GeoJsonCodec();
    const cursor = codec.decode({content:data, contentType:"application/json"});
    while (cursor.hasNext()) {
        const feature = cursor.next();
        features.push(feature);
    }
    return features;
}

export function loadBackground(url: string) {
    const webMercatorReference = getReference("EPSG:3857");
    const quadTreeStructure : QuadTreeRasterTileSetStructure = {
        bounds: createBounds(webMercatorReference, [-20037508.3427892, 2 * 20037508.3427892, -20037508.3427892, 2 * 20037508.3427892]),
        level0Columns: 1,
        level0Rows: 1,
        reference: webMercatorReference
    };
    const model = new UrlTileSetModel({
        baseURL: url, //  url example --> "https://a.tile.openstreetmap.org/{z}/{x}/{-y}.png",
        structure: quadTreeStructure
    })
// Create a layer for the model.
    return new RasterTileSetLayer(model, {
        label: "OpenStreetMap"
    });
}


/**
 * Decode server text safely, auto-fixing Latin1 -> UTF-8 if needed
 */
function decodeServerText(buffer: ArrayBuffer): string {
    const utf8Decoder = new TextDecoder('utf-8');
    let text = utf8Decoder.decode(buffer);

    // Check if UTF-8 decoding produced replacement chars
    if (text.includes('�')) {
        // Fallback: interpret as Latin1 / Windows-1252
        const bytes = new Uint8Array(buffer);
        text = '';
        for (let i = 0; i < bytes.length; i++) {
            text += String.fromCharCode(bytes[i]);
        }
    }

    return text;
}
