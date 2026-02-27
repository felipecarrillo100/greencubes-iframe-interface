import {
    WMSTileSetModel,
    WMSTileSetModel as WMSModel,
    WMSTileSetModelConstructorOptions
} from "@luciad/ria/model/tileset/WMSTileSetModel";
import {WFSFeatureStore, WFSFeatureStoreCreateOptions} from "@luciad/ria/model/store/WFSFeatureStore";
import {CreateOGC3DTilesModelOptions, OGC3DTilesModel} from "@luciad/ria/model/tileset/OGC3DTilesModel";
import {CreateHSPCTilesModelOptions, HSPCTilesModel} from "@luciad/ria/model/tileset/HSPCTilesModel";
import {WMTSTileSetModel, WMTSTileSetModelCreateOptions} from "@luciad/ria/model/tileset/WMTSTileSetModel";
import { FeatureModel } from "@luciad/ria/model/feature/FeatureModel.js";
import { getReference } from "@luciad/ria/reference/ReferenceProvider.js";
import { GeoJsonCodec } from "@luciad/ria/model/codec/GeoJsonCodec.js";
import { MemoryStore } from "@luciad/ria/model/store/MemoryStore.js";
import { Feature } from "@luciad/ria/model/feature/Feature.js";
import type { QuadTreeRasterTileSetStructure } from "@luciad/ria/model/tileset/RasterTileSetModel";
import { createBounds } from "@luciad/ria/shape/ShapeFactory";
import { UrlTileSetModel } from "@luciad/ria/model/tileset/UrlTileSetModel";
import {
    createGoogleMapsTileSetModel,
    GoogleMapsTileSetModel,
    GoogleMapsTileSetModelCreateOptions
} from "@luciad/ria/model/tileset/GoogleMapsTileSetModel";
import {
    AzureMapsTileSetModel,
    AzureMapsTileSetModelCreateOptions,
    createAzureMapsTileSetModel
} from "@luciad/ria/model/tileset/AzureMapsTileSetModel";
import {FusionTileSetModel, FusionTileSetModelCreateOptions} from "@luciad/ria/model/tileset/FusionTileSetModel";

import {
    WMTSModelOptions,
    WFSModelOptions,
    OGC3DModelOptions,
    HSPCModelOptions,
    WMSTileSetModelOptions,
    AzureMapsModelOptions,
    GeoJSONModelOptions,
    TMSOptions,
    FusionTileSetModelOption
} from "../../../../../src";
import {HttpRequestHeaders} from "@luciad/ria/util/HttpRequestOptions";

const GoogleLogoUrl = "./images/google.png";
const AzureLogoUrl = "./images/azure.svg";

export class ModelFactory {

    static async createElevationModel(options: FusionTileSetModelOption): Promise<FusionTileSetModel> {
        const defaults = {
            url: "https://sampleservices.luciad.com/lts",
            coverageId: "world_elevation_6714a770-860b-4878-90c9-ab386a4bae0f",
            ...options
        }
        const { url, coverageId, ...rest } = defaults;
        return FusionTileSetModel.createFromURL(url, coverageId, rest as FusionTileSetModelCreateOptions);
    }

    static async createGoogleMapsModel(options?: GoogleMapsTileSetModelCreateOptions): Promise<GoogleMapsTileSetModel> {
        const apiKey = import.meta.env.VITE_GOOGLE_KEY;
        const o: GoogleMapsTileSetModelCreateOptions = {
            mapType: "satellite", // Default value
            ...options            // If options contains mapType, it overrides "satellite"
        };
        const model = await createGoogleMapsTileSetModel(apiKey, o);
        model.getLogo = function (): string {
            return GoogleLogoUrl;
        };
        return model;
    }

    static async createAzureMapsModel(options?: AzureMapsModelOptions): Promise<AzureMapsTileSetModel> {
        const apiKey = import.meta.env.VITE_AZURE_KEY;
        const o: AzureMapsTileSetModelCreateOptions = {
            subscriptionKey: apiKey,
            ...options,
        };
        const model = await createAzureMapsTileSetModel(o);
        model.getLogo = function (): string {
            return AzureLogoUrl;
        };
        return model;
    }

    static async createMapboxTilesModel(options?: TMSOptions): Promise<UrlTileSetModel> {
        const token = import.meta.env.VITE_MAPBOX_KEY;
        const url = options?.url ? options.url : `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{-y}@2x.webp?sku=101uLgarUfM1u&access_token=${token}`;
        const webMercatorReference = getReference("EPSG:3857");
        const quadTreeStructure: QuadTreeRasterTileSetStructure = {
            bounds: createBounds(webMercatorReference, [-20037508.3427892, 2 * 20037508.3427892, -20037508.3427892, 2 * 20037508.3427892]),
            level0Columns: 1,
            level0Rows: 1,
            reference: webMercatorReference
        };
        return new UrlTileSetModel({
            baseURL: url, //  url example --> "https://a.tile.openstreetmap.org/{z}/{x}/{-y}.png",
            structure: quadTreeStructure,
            requestParameters: options?.requestParameters,
            requestHeaders: options?.requestHeaders as HttpRequestHeaders,
            credentials: options?.credentials
        });
    }

    /**
     * Creates a WMTS Model using createFromURL.
     * Bundles url, layer, and style into the single options object.
     */
    static async createWMTSModel(options: WMTSModelOptions): Promise<WMTSTileSetModel> {
        const { url, layer, style, ...rest } = options;
        return WMTSTileSetModel.createFromURL(url, { layer, style }, rest as WMTSTileSetModelCreateOptions);
    }

    /**
     * Creates a WMS Model.
     * Note: WMSTileSetModelConstructorOptions already includes 'getMapRoot' for the URL.
     */
    static async createWMSModel(options: WMSTileSetModelOptions): Promise<WMSModel> {
        // 1. Destructure 'crs' out and collect everything else in 'rest'
        const { crs, ...rest } = options;
        const o: WMSTileSetModelConstructorOptions = { ...rest } as WMSTileSetModelConstructorOptions;
        o.reference = getReference(crs ? crs : "EPSG:3857");
        return new WMSTileSetModel(o);
    }

    /**
     * Creates a WFS Store using createFromURL.
     */
    static async createWFSModel(options: WFSModelOptions): Promise<FeatureModel> {
        const { url, featureTypeName, ...rest } = options;
        const store = await WFSFeatureStore.createFromURL(url, featureTypeName, rest as WFSFeatureStoreCreateOptions);
        return new FeatureModel(store);
    }

    /**
     * Creates an OGC 3D Tiles Model using create.
     */
    static async create3DTilesModel(options: OGC3DModelOptions): Promise<OGC3DTilesModel> {
        const { url, crs, ...rest } = options;
        const reference = crs ? getReference(crs) : undefined;
        return OGC3DTilesModel.create(url, {...rest as CreateOGC3DTilesModelOptions, reference});
    }

    /**
     * Creates an HSPC (Point Cloud) Model using create.
     */
    static async createHSPCModel(options: HSPCModelOptions): Promise<HSPCTilesModel> {
        const { url, crs, ...rest } = options;
        const reference = crs ? getReference(crs) : undefined;
        return HSPCTilesModel.create(url, {...rest as CreateHSPCTilesModelOptions, reference});
    }

    public static async createGeoJSONModel(options: GeoJSONModelOptions): Promise<FeatureModel> {
        // Prepare fetch options by mapping Luciad-style properties to native Fetch
        const fetchOptions: RequestInit = {
            method: "GET",
            credentials: options.credentials ? "include" : "same-origin",
            headers: {
                "Accept": "application/geo+json, application/json",
                ...(options.requestHeaders || {}),
            }
        };

        const response = await fetch(options.url, fetchOptions);

        if (!response.ok) {
            throw new Error(`[ModelFactory] GeoJSON load failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Ensure we have a valid reference
        const reference = getReference(options.crs || "EPSG:4326");

        // Decode raw JSON into Luciad Feature objects
        const codec = new GeoJsonCodec({ reference });
        const cursor = codec.decodeObject(data); // This returns the Cursor

        // Drain the cursor into an array for the MemoryStore
        const features: Feature[] = [];
        while (cursor.hasNext()) {
            const feature = cursor.next();
            features.push(feature);
        }

        // Wrap in a MemoryStore and return as a FeatureModel
        const store = new MemoryStore({ reference, data: features });
        return new FeatureModel(store, { reference });
    }
}
