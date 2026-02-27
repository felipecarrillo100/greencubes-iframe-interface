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

export interface JSONHTTPRequest {
    /** Whether to include credentials (cookies) in cross-origin requests */
    credentials?: boolean
    /** * Custom headers to include in the request.
     * Note: Luciad requires these to be strings.
     */
    requestHeaders?: Record<string, string>; // Changed from string | number | boolean
    /** Custom query parameters to include in the request */
    requestParameters?: Record<string, string | number | boolean>;
}

export interface WMTSModelOptions extends JSONHTTPRequest {
    url: string;
    layer: string;
    style?: string;
    crs?: string;
    matrixSet?: string;
    format?: string;
    levelRange?: { min: number; max: number };
    dimensions?: Record<string, string | number | boolean>;
    useQuadTreeOnly?: boolean;
    preferredRequestEncoding?: string;
    isSparseTileSet?: boolean;
    subdomains?: string[];
}

export interface WFSModelOptions extends JSONHTTPRequest {
    url: string;
    featureTypeName: string;
    crs?: string;
    maxFeatures?: number;
    /** Whether the layer trigger an event on feature click */
    clickable?: boolean;
}

export interface OGC3DModelOptions extends JSONHTTPRequest {
    url: string;
    crs?: string;
}

export interface HSPCModelOptions extends JSONHTTPRequest {
    url: string;
    crs?: string;
}

export interface WMSTileSetModelOptions extends JSONHTTPRequest {
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
    dimensions?: Record<string, any>;
}

export interface AzureMapsModelOptions {
    subscriptionKey?: string;
    mapStyle?: string;
    language?: string;
    tileSetId?: string;
}

export interface GeoJSONModelOptions extends JSONHTTPRequest {
    url: string;
    crs?: string;
    /** Whether the layer trigger an event on feature click */
    clickable?: boolean;
}

export interface TMSOptions extends JSONHTTPRequest{
    url?: string;
}

export interface FusionTileSetModelOption extends JSONHTTPRequest {
    url?: string;
    coverageId?: string;
}

export interface GoogleMapsTileSetModelOptions {
    mapType?: "roadmap" | "satellite" | "terrain"
    language?: string
    region?: string
    imageFormat?: "jpeg" | "png"
    scale?: "scaleFactor1x" | "scaleFactor2x" | "scaleFactor4x"
    highDpi?: boolean
    layerTypes?: ("layerRoadmap" | "layerStreetview" | "layerTraffic")[]
    styles?: string
    overlay?: boolean
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
    | { type: BuilderLayerType.GOOGLE; modelOptions: GoogleMapsTileSetModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.MAPBOX; modelOptions: TMSOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WMS; modelOptions: WMSTileSetModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WMTS; modelOptions: WMTSModelOptions; layerOptions?: RasterLayerOptions }
    | { type: BuilderLayerType.WFS; modelOptions: WFSModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.GEOJSON; modelOptions: GeoJSONModelOptions; layerOptions?: FeatureLayerOptions }
    | { type: BuilderLayerType.OGC3DTiles; modelOptions: OGC3DModelOptions; layerOptions?: TileSet3DLayerOptions }
    | { type: BuilderLayerType.HSPC; modelOptions: HSPCModelOptions; layerOptions?: TileSet3DLayerOptions };

export type AddLayerPosition = "top" | "bottom" | "above" | "below" | "parent" | "parent-bottom";

export interface AddLayerOptions {
    layerConfig: LayerConfig;
    position?: AddLayerPosition;
    referenceLayerId?: string;
}

export interface MoveLayerOptions {
    layerId: string;
    position?: AddLayerPosition;
    referenceLayerId?: string;
}

export interface LayerTreeConfig {
    children: LayerConfig[];
}

export interface InitialMapSetup extends LayerTreeConfig {
    mode: MapModeType;
    targetGroupId: string;
    targetFeatureLayerID?: string;
    boundsFeatureLayerID?: string;
}
