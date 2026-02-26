export enum JSONLayerType {
    LayerGroup = "LayerGroup",
    FeatureLayer = "FeatureLayer",
    RasterTileSetLayer = "RasterTileSetLayer",
    WMSTileSetLayer = "WMSTileSetLayer",
    TileSet3DLayer = "TileSet3DLayer",
    GridLayer = "GridLayer",
    Unknown = "Unknown"
}

export interface JSONLayer {
    id: string;
    label: string;
    visible: boolean;
    type: string;
    layerType: JSONLayerType;
}

export interface JSONLayerGroup {
    id: string;
    label: string;
    visible: boolean;
    children: (JSONLayer | JSONLayerGroup)[];
    layerType: JSONLayerType.LayerGroup;
}

export interface JSONLayerTree {
    children: (JSONLayer | JSONLayerGroup)[];
}

export type JSONLayerTreeNode = JSONLayer | JSONLayerGroup;
