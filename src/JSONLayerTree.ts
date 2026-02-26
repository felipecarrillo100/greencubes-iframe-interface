export enum JSONLayerClass {
    LayerGroup = "LayerGroup",
    FeatureLayer = "FeatureLayer",
    RasterTileSetLayer = "RasterTileSetLayer",
    WMSTileSetLayer = "WMSTileSetLayer",
    TileSet3DLayer = "TileSet3DLayer",
    GridLayer = "GridLayer",
    Unknown = "Unknown"
}

export enum JSONLayerType {
    BASE = "BASE",
    STATIC = "STATIC",
    DYNAMIC = "DYNAMIC",
}

export interface JSONLayer {
    id: string;
    label: string;
    visible: boolean;
    type: JSONLayerType;
    className: JSONLayerClass;
}

export interface JSONLayerGroup {
    id: string;
    label: string;
    visible: boolean;
    children: (JSONLayer | JSONLayerGroup)[];
    className: JSONLayerClass.LayerGroup;
}

export interface JSONLayerTree {
    children: (JSONLayer | JSONLayerGroup)[];
}

export type JSONLayerTreeNode = JSONLayer | JSONLayerGroup;
