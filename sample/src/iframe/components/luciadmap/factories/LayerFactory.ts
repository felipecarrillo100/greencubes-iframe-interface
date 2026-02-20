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
import { LayerConstructorOptions } from "@luciad/ria/view/LayerTreeNode";
import {UrlTileSetModel} from "@luciad/ria/model/tileset/UrlTileSetModel";
import {GoogleMapsTileSetModel} from "@luciad/ria/model/tileset/GoogleMapsTileSetModel";
import {AzureMapsTileSetModel} from "@luciad/ria/model/tileset/AzureMapsTileSetModel";
import {PainterFactory} from "./PainterFactory";
import {PainterAvailable} from "./LayerBuilderInterfaces";

export interface LayerGroupOptions extends LayerConstructorOptions {
    shared?: boolean;
}

export interface SharedLayerGroup extends LayerGroup {
    shared?: boolean;
}

export interface FeatureLayerOptions extends FeatureLayerConstructorOptions {
    painterName?: PainterAvailable;
}

export class LayerFactory {

    /**
     * Creates a RasterTileSetLayer for a WMTS Layer.
     */
    static async createWMTSLayer(model: WMTSTileSetModel, options?: RasterTileSetLayerConstructorOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options);
    }

    /**
     * Creates a Mapbox basemap Layer.
     */
    static async createMapboxTilesLayer(model: UrlTileSetModel, options?: RasterTileSetLayerConstructorOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options);
    }

    /**
     * Creates a Google Maps Layer.
     */
    static async createAzureTilesLayer(model: AzureMapsTileSetModel, options?: RasterTileSetLayerConstructorOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options);
    }

    /**
     * Creates a Google Maps Layer.
     */
    static async createGoogleTilesLayer(model: GoogleMapsTileSetModel, options?: RasterTileSetLayerConstructorOptions): Promise<RasterTileSetLayer> {
        return new RasterTileSetLayer(model, options);
    }

    /**
     * Creates a WMSTileSetLayer specifically for a WMS Layer.
     */
    static async createWMSLayer(model: WMSTileSetModel, options?: RasterTileSetLayerConstructorOptions): Promise<WMSTileSetLayer> {
        return new WMSTileSetLayer(model, options);
    }

    /**
     * Creates a FeatureLayer for a FeatureLayer.
     */
    static async createWFSLayer(model: FeatureModel, options?: FeatureLayerOptions): Promise<FeatureLayer> {
        const painter =  PainterFactory.getPainterByName(options?.painterName);
        return new FeatureLayer(model, {...options, painter});
    }

    /**
     * Creates a FeatureLayer for a FeatureLayer.
     */
    static async createGeoJSONLayer(model: FeatureModel, options?: FeatureLayerOptions): Promise<FeatureLayer> {
        const painter =  PainterFactory.getPainterByName(options?.painterName);
        return new FeatureLayer(model, {...options, painter});
    }

    /**
     * Creates a TileSet3DLayer for OGC 3D Tiles.
     */
    static async create3DTilesLayer(model: OGC3DTilesModel, options?: TileSet3DLayerConstructorOptions): Promise<TileSet3DLayer> {
        return new TileSet3DLayer(model, options);
    }

    /**
     * Creates a TileSet3DLayer for HSPC Point Clouds.
     */
    static async createHSPCLayer(model: HSPCTilesModel, options?: TileSet3DLayerConstructorOptions): Promise<TileSet3DLayer> {
        return new TileSet3DLayer(model, options);
    }

    /**
     * Creates a LayerGroup.
     */
    static async createLayerGroup(options: LayerGroupOptions): Promise<LayerGroup> {
        const layer = new LayerGroup(options);
        (layer as unknown as SharedLayerGroup).shared = options.shared;
        return layer;
    }
}
