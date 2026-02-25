export type MapModeType = "2D" | "3D";

export enum BuilderLayerType {
    GROUP = "GROUP",
    AZURE = "AZURE",
    ELEVATION = "ELEVATION",
    GOOGLE = "GOOGLE",
    MAPBOX = "MAPBOX",
    WMS = "WMS",
    WMTS = "WMTS",
    WFS = "WFS",
    GEOJSON = "GEOJSON",
    OGC3DTiles = "OGC3DTiles",
    HSPC = "HSPC"
}

export enum PainterAvailable {
    Experience = "Experience",
}

export interface WMTSModelOptions {
    url: string;
    layer: string;
    style?: string;
    crs?: string;
    matrixSet?: string;
    format?: string;
    levelRange?: { min: number; max: number };
    dimensions?: Record<string, string | number | boolean>;
    requestParameters?: Record<string, string | number | boolean>;
    useQuadTreeOnly?: boolean;
    preferredRequestEncoding?: string;
    isSparseTileSet?: boolean;
    subdomains?: string[];
}

export interface WFSModelOptions {
    url: string;
    featureTypeName: string;
    crs?: string;
    maxFeatures?: number;
    requestParameters?: Record<string, string | number | boolean>;
}

export interface OGC3DModelOptions {
    url: string;
}

export interface HSPCModelOptions {
    url: string;
}

export interface WMSTileSetModelOptions {
    getMapRoot: string;
    layers: string[];
    crs?: string;
    format?: string;
    transparent?: boolean;
    version?: string;
    backgroundColor?: string;
    getFeatureInfoRoot?: string;
    queryLayers?: string[];
    styles?: string[];
    infoFormat?: string;
    levelCount?: number;
    swapAxes?: string[];
    sld?: string;
    sldBody?: string;
    subdomains?: string[];
    requestParameters?: Record<string, any>;
    dimensions?: Record<string, any>;
}

export interface AzureMapsModelOptions {
    subscriptionKey?: string;
    mapStyle?: string;
    language?: string;
    tileSetId?: string;
}

export interface GeoJSONModelOptions {
    url: string;
    crs?: string;
    /** Whether to include credentials (cookies) in cross-origin requests */
    credentials?: boolean;
    /** Custom headers to include in the request */
    requestHeaders?: Record<string, string>;
}

export interface TMSOptions {
    url?: string;
}

export interface FusionTileSetModelOption {
    url?: string;
    coverageId?: string;
}

export interface LayerGroupOptions {
    id?: string;
    label?: string;
    visible?: boolean;
    shared?: boolean;
}

export interface FeatureLayerOptions {
    id?: string;
    label?: string;
    visible?: boolean;
    painterName?: PainterAvailable;
    selectable?: boolean;
    hoverable?: boolean;
    isSnapTarget?: boolean;
    editable?: boolean;
    incrementalRendering?: boolean;
}

// Re-using common options for different layer types
export interface RasterLayerOptions {
    id?: string;
    label?: string;
    visible?: boolean;
    opacity?: number;
}

export interface TileSet3DLayerOptions {
    id?: string;
    label?: string;
    visible?: boolean;
}

export type LayerConfig =
    | { type: BuilderLayerType.GROUP; layerOptions: LayerGroupOptions; children: LayerConfig[] }
    | { type: BuilderLayerType.ELEVATION; modelOptions: FusionTileSetModelOption; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.AZURE; modelOptions: AzureMapsModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.GOOGLE; modelOptions: { mapType?: string }; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.MAPBOX; modelOptions: TMSOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WMS; modelOptions: WMSTileSetModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WMTS; modelOptions: WMTSModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WFS; modelOptions: WFSModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.GEOJSON; modelOptions: GeoJSONModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.OGC3DTiles; modelOptions: OGC3DModelOptions; layerOptions?: TileSet3DLayerOptions }
    | { type: BuilderLayerType.HSPC; modelOptions: HSPCModelOptions; layerOptions?: TileSet3DLayerOptions };

export interface LayerTreeConfig {
    children: LayerConfig[];
}

export interface InitialMapSetup extends LayerTreeConfig {
    mode: MapModeType;
    targetGroupId: string;
    targetFeatureLayerID?: string
    boundsFeatureLayerID?: string
}
