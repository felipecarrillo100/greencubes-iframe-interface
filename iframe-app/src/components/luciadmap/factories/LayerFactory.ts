import { WMSTileSetModel } from "@luciad/ria/model/tileset/WMSTileSetModel";
import { WMTSTileSetModel } from "@luciad/ria/model/tileset/WMTSTileSetModel";
import { OGC3DTilesModel } from "@luciad/ria/model/tileset/OGC3DTilesModel";
import { HSPCTilesModel } from "@luciad/ria/model/tileset/HSPCTilesModel";
import { FeatureModel } from "@luciad/ria/model/feature/FeatureModel.js";

import { RasterTileSetLayer, RasterTileSetLayerConstructorOptions } from "@luciad/ria/view/tileset/RasterTileSetLayer.js";
import { WMSTileSetLayer } from "@luciad/ria/view/tileset/WMSTileSetLayer";
import { FeatureLayer, FeatureLayerConstructorOptions } from "@luciad/ria/view/feature/FeatureLayer.js";
import { TileSet3DLayer, TileSet3DLayerConstructorOptions } from "@luciad/ria/view/tileset/TileSet3DLayer";
import { LayerGroup } from "@luciad/ria/view/LayerGroup";
import { AzureMapsTileSetModel } from "@luciad/ria/model/tileset/AzureMapsTileSetModel";
import { PainterFactory } from "./PainterFactory";
import {
    PainterAvailable,
    LayerGroupOptions,
    FeatureLayerOptions,
    RasterLayerOptions,
    TileSet3DLayerOptions
} from "../../../../../src";
import { FusionTileSetModel } from "@luciad/ria/model/tileset/FusionTileSetModel";

export interface SharedLayerGroup extends LayerGroup {
    shared?: boolean;
}

export class LayerFactory {
    /**
     * Creates a RasterTileSetLayer for an Elevation Layer.
     */
    static async createElevationLayer(model: FusionTileSetModel, options?: RasterLayerOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a RasterTileSetLayer for a WMTS Layer.
     */
    static async createWMTSLayer(model: WMTSTileSetModel, options?: RasterLayerOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a Mapbox basemap Layer.
     */
    static async createMapboxTilesLayer(model: UrlTileSetModel, options?: RasterLayerOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a Google Maps Layer.
     */
    static async createAzureTilesLayer(model: AzureMapsTileSetModel, options?: RasterLayerOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a Google Maps Layer.
     */
    static async createGoogleTilesLayer(model: GoogleMapsTileSetModel, options?: RasterLayerOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a WMSTileSetLayer specifically for a WMS Layer.
     */
    static async createWMSLayer(model: WMSTileSetModel, options?: RasterLayerOptions): Promise<WMSTileSetLayer> {
        return new WMSTileSetLayer(model, options as RasterTileSetLayerConstructorOptions);
    }

    /**
     * Creates a FeatureLayer for a FeatureLayer.
     */
    static async createWFSLayer(model: FeatureModel, options?: FeatureLayerOptions): Promise<FeatureLayer> {
        const painter = PainterFactory.getPainterByName(options?.painterName);
        return new FeatureLayer(model, { ...options as FeatureLayerConstructorOptions, painter });
    }

    /**
     * Creates a FeatureLayer for a FeatureLayer.
     */
    static async createGeoJSONLayer(model: FeatureModel, options?: FeatureLayerOptions): Promise<FeatureLayer> {
        const painter = PainterFactory.getPainterByName(options?.painterName);
        return new FeatureLayer(model, { ...options as FeatureLayerConstructorOptions, painter });
    }

    /**
     * Creates a TileSet3DLayer for OGC 3D Tiles.
     */
    static async create3DTilesLayer(model: OGC3DTilesModel, options?: TileSet3DLayerOptions): Promise<TileSet3DLayer> {
        return new TileSet3DLayer(model, options as TileSet3DLayerConstructorOptions);
    }

    /**
     * Creates a TileSet3DLayer for HSPC Point Clouds.
     */
    static async createHSPCLayer(model: HSPCTilesModel, options?: TileSet3DLayerOptions): Promise<TileSet3DLayer> {
        return new TileSet3DLayer(model, options as TileSet3DLayerConstructorOptions);
    }

    /**
     * Creates a LayerGroup.
     */
    static async createLayerGroup(options: LayerGroupOptions): Promise<LayerGroup> {
        const layer = new LayerGroup(options as LayerConstructorOptions);
        (layer as unknown as SharedLayerGroup).shared = options.shared;
        return layer;
    }
}
