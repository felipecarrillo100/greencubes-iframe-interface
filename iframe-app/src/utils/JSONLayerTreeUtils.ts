import { LayerTree } from "@luciad/ria/view/LayerTree";
import { JSONLayer, JSONLayerGroup, JSONLayerTreeNode, JSONLayerType } from "../../../src/JSONLayerTree";
import { LayerGroup } from "@luciad/ria/view/LayerGroup";
import { Layer } from "@luciad/ria/view/Layer";
import { LayerTreeNode } from "@luciad/ria/view/LayerTreeNode";
import { FeatureLayer } from "@luciad/ria/view/feature/FeatureLayer";
import { RasterTileSetLayer } from "@luciad/ria/view/tileset/RasterTileSetLayer";
import { WMSTileSetLayer } from "@luciad/ria/view/tileset/WMSTileSetLayer";
import { TileSet3DLayer } from "@luciad/ria/view/tileset/TileSet3DLayer";
import { GridLayer } from "@luciad/ria/view/grid/GridLayer";

export class JSONLayerTreeUtils {
    static fromLayerTree(layerTree: LayerTree | LayerGroup): JSONLayerTreeNode[] {
        return layerTree.children.map((child: LayerTreeNode): JSONLayerTreeNode => {
            if (child instanceof LayerGroup) {
                return {
                    id: child.id,
                    label: child.label,
                    visible: child.visible,
                    className: JSONLayerTreeUtils.getLayerClassName(child),
                    children: JSONLayerTreeUtils.fromLayerTree(child)
                } as JSONLayerGroup;
            } else {
                const layer = child as Layer;
                return {
                    id: layer.id,
                    label: layer.label,
                    visible: layer.visible,
                    type: layer.type,
                    className: JSONLayerTreeUtils.getLayerClassName(layer)
                } as JSONLayer;
            }
        });
    }

    private static getLayerClassName(layer: Layer | LayerGroup): JSONLayerType {
        if (layer instanceof LayerGroup) {
            return JSONLayerType.LayerGroup;
        } else if (layer instanceof FeatureLayer) {
            return JSONLayerType.FeatureLayer;
        } else if (layer instanceof WMSTileSetLayer) {
            return JSONLayerType.WMSTileSetLayer;
        } else if (layer instanceof RasterTileSetLayer) {
            return JSONLayerType.RasterTileSetLayer;
        } else if (layer instanceof TileSet3DLayer) {
            return JSONLayerType.TileSet3DLayer;
        } else if (layer instanceof GridLayer) {
            return JSONLayerType.GridLayer;
        }
        return JSONLayerType.Unknown;
    }
}
