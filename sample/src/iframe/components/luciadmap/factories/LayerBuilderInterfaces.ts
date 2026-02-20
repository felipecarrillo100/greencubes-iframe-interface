import {
    AzureMapsModelOptions, FusionTileSetModelOption,
    GeoJSONModelOptions,
    HSPCModelOptions,
    OGC3DModelOptions, TMSOptions,
    WFSModelOptions,
    WMSTileSetModelOptions,
    WMTSModelOptions
} from "./ModelFactory";
import {TileSet3DLayerConstructorOptions} from "@luciad/ria/view/tileset/TileSet3DLayer";
import {RasterTileSetLayerConstructorOptions} from "@luciad/ria/view/tileset/RasterTileSetLayer.js";
import {GoogleMapsTileSetModelCreateOptions} from "@luciad/ria/model/tileset/GoogleMapsTileSetModel";
import {MapModeType} from "../../../../../../src";
import {FeatureLayerOptions, LayerGroupOptions} from "./LayerFactory";

export enum BuilderLayerType {
    GROUP = "GROUP",
    AZURE = "AZURE",
    ELEVATION = "ELEVATION",
    GOOGLE  = "GOOGLE",
    MAPBOX = "MAPBOX",
    WMS = "WMS",
    WMTS = "WMTS",
    WFS = "WFS",
    GEOJSON = "GEOJSON",
    OGC3DTiles = "OGC3DTiles",
    HSPC = "HSPC"
}

// Discriminated Union for Type Safety
export type LayerConfig =
    | { type: BuilderLayerType.GROUP; layerOptions: LayerGroupOptions; children: LayerConfig[] }
    | { type: BuilderLayerType.ELEVATION; modelOptions: FusionTileSetModelOption; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.AZURE; modelOptions: AzureMapsModelOptions; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.GOOGLE; modelOptions: GoogleMapsTileSetModelCreateOptions; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.MAPBOX; modelOptions: TMSOptions; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.WMS; modelOptions: WMSTileSetModelOptions; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.WMTS; modelOptions: WMTSModelOptions; layerOptions?: RasterTileSetLayerConstructorOptions }
    | { type: BuilderLayerType.WFS; modelOptions: WFSModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.GEOJSON; modelOptions: GeoJSONModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.OGC3DTiles; modelOptions: OGC3DModelOptions; layerOptions?: TileSet3DLayerConstructorOptions }
    | { type: BuilderLayerType.HSPC; modelOptions: HSPCModelOptions; layerOptions?: TileSet3DLayerConstructorOptions };

export interface LayerTreeConfig {
    children: LayerConfig[];
}

export interface InitialMapSetup extends LayerTreeConfig {
    mode: MapModeType;
    targetGroupId: string;
    targetFeatureLayerID?: string
    boundsFeatureLayerID?: string
}

export enum PainterAvailable {
    Experience = "Experience",
}
