import { LayerGroup } from "@luciad/ria/view/LayerGroup";
import { LayerTree } from "@luciad/ria/view/LayerTree";
import { LayerTreeNode } from "@luciad/ria/view/LayerTreeNode";
import { ModelFactory } from "./ModelFactory";
import { LayerFactory, SharedLayerGroup } from "./LayerFactory";
import { BuilderLayerType, LayerConfig, LayerTreeConfig } from "../../../../../src";
import { LayerTreeNodeType } from "@luciad/ria/view/LayerTreeNodeType";
import { LayerTreeVisitor } from "@luciad/ria/view/LayerTreeVisitor";
import { Layer } from "@luciad/ria/view/Layer.js";
import { RasterTileSetLayer } from "@luciad/ria/view/tileset/RasterTileSetLayer.js";
import { FusionTileSetModel } from "@luciad/ria/model/tileset/FusionTileSetModel";
import { AddLayerOptions } from "../../../../../src";


/**
 * Represents the basic state of an elevation layer.
 */
export interface ElevationLayerState {
    id: string;
    visible: boolean;
}

export class LayerBuilder {

    public static purge(root: LayerTree | LayerGroup) {
        root.removeAllChildren();
    }

    /**
     * Entry point: Index 0 is the BOTTOM-MOST layer.
     * Higher indices are stacked ABOVE lower indices.
     */
    public static async build(root: LayerTree | LayerGroup, config: LayerTreeConfig): Promise<void> {
        if (!config.children || config.children.length === 0) return;

        const slots: (LayerTreeNode | null)[] = new Array(config.children.length).fill(null);

        const promises = config.children.map((node, index) =>
            this.processAndSlot(root, node, index, slots)
        );

        await Promise.allSettled(promises);
    }

    private static async processAndSlot(
        root: LayerTree | LayerGroup,
        node: LayerConfig,
        index: number,
        slots: (LayerTreeNode | null)[]
    ): Promise<void> {
        try {
            const layerNode = await this.processNode(node);
            if (!layerNode) return;

            // Determine position based on: Higher Index = On Top
            const { reference, position } = this.calculatePlacement(index, slots, root);

            if (reference && reference.parent === root) {
                // If we find a lower index (e.g., index 0), we go ABOVE it.
                // If we find a higher index (e.g., index 2), we go BELOW it.
                root.addChild(layerNode, position, reference);
            } else {
                // If no siblings are ready yet, we add to TOP.
                // This ensures that when the "actual" bottom layers arrive later,
                // they can find us and slot themselves "below" us.
                try {
                    root.addChild(layerNode, "top");
                } catch (e) {
                    console.error(layerNode);
                    console.error(e);
                }
            }
            slots[index] = layerNode;
        } catch (error) {
            console.error(`[LayerBuilder][Index ${index}] Error:`, error);
        }
    }

    /**
     * Stack Logic:
     * - If I find a sibling with a LOWER index, I go ABOVE it.
     * - If I find a sibling with a HIGHER index, I go BELOW it.
     */
    private static calculatePlacement(index: number, slots: (LayerTreeNode | null)[], root: LayerTree | LayerGroup) {
        // 1. Look for a sibling that belongs BELOW me (lower index)
        for (let i = index - 1; i >= 0; i--) {
            const node = slots[i];
            if (node && node.parent === root) {
                return { reference: node, position: "above" as const };
            }
        }

        // 2. Look for a sibling that belongs ABOVE me (higher index)
        for (let i = index + 1; i < slots.length; i++) {
            const node = slots[i];
            if (node && node.parent === root) {
                return { reference: node, position: "below" as const };
            }
        }

        return { reference: null, position: "top" as const };
    }

    private static async processNode(node: LayerConfig): Promise<LayerTreeNode | null> {
        if (node.type === BuilderLayerType.GROUP) {
            const group = await LayerFactory.createLayerGroup(node.layerOptions);
            if (node.children && node.children.length > 0) {
                // Await ensures the group is populated before it's added to the main tree
                await this.build(group, { children: node.children });
            }
            return group;
        }
        return await this.createLayer(node);
    }

    private static async createLayer(node: Exclude<LayerConfig, { type: BuilderLayerType.GROUP }>): Promise<LayerTreeNode | null> {
        try {
            switch (node.type) {
                case BuilderLayerType.ELEVATION:
                    return await LayerFactory.createElevationLayer(await ModelFactory.createElevationModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.AZURE:
                    return await LayerFactory.createAzureTilesLayer(await ModelFactory.createAzureMapsModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.GOOGLE:
                    return await LayerFactory.createGoogleTilesLayer(await ModelFactory.createGoogleMapsModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.MAPBOX:
                    return await LayerFactory.createMapboxTilesLayer(await ModelFactory.createMapboxTilesModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.WMTS:
                    return await LayerFactory.createWMTSLayer(await ModelFactory.createWMTSModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.WMS:
                    return await LayerFactory.createWMSLayer(await ModelFactory.createWMSModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.WFS:
                    return await LayerFactory.createWFSLayer(await ModelFactory.createWFSModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.GEOJSON:
                    return await LayerFactory.createGeoJSONLayer(await ModelFactory.createGeoJSONModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.OGC3DTiles:
                    return await LayerFactory.create3DTilesLayer(await ModelFactory.create3DTilesModel(node.modelOptions), node.layerOptions);
                case BuilderLayerType.HSPC:
                    return await LayerFactory.createHSPCLayer(await ModelFactory.createHSPCModel(node.modelOptions), node.layerOptions);
                default:
                    return null;
            }
        } catch (e) {
            throw e;
        }
    }

    public static async addLayer(layerTree: LayerTree, options: AddLayerOptions): Promise<LayerTreeNode | null> {
        const { layerConfig, position = "top", referenceLayerId } = options;

        try {
            const newNode = await this.processNode(layerConfig);
            if (!newNode) return null;

            let parent: LayerTree | LayerGroup = layerTree;
            let finalPosition: "top" | "bottom" | "above" | "below" = (position === "parent") ? "top" : (  (position === "parent-bottom") ? "bottom": position);
            let referenceNode: LayerTreeNode | undefined;

            if (referenceLayerId) {
                const found = layerTree.findLayerTreeNodeById(referenceLayerId);
                if (found) {
                    if (position === "above" || position === "below") {
                        parent = found.parent || layerTree;
                        referenceNode = found;
                    } else if (position === "parent" || position === "parent-bottom") {
                        if (found instanceof LayerGroup) {
                            parent = found;
                        } else {
                            console.warn(`[LayerBuilder] Target node ${referenceLayerId} is not a group. Adding to root top.`);
                            finalPosition = "top";
                        }
                    }
                } else {
                    console.warn(`[LayerBuilder] Reference layer/group ${referenceLayerId} not found. Adding to root top.`);
                    finalPosition = "top";
                }
            }

            parent.addChild(newNode, finalPosition as any, referenceNode);
            return newNode;
        } catch (error) {
            console.error(`[LayerBuilder] Error adding layer:`, error);
            return null;
        }
    }

    static setTargetGroup(layerTree: LayerTree, layerGroupID: string) {
        try {
            for (const child of layerTree.children) {
                if (child.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
                    if ((child as SharedLayerGroup).shared) {
                        child.visible = true;
                    } else {
                        child.visible = child.id === layerGroupID
                    }
                }
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Represents the basic state of an elevation layer.
     */

    static saveElevationLayers(layerTree: LayerTree): ElevationLayerState[] {
        const elevationLayers: RasterTileSetLayer[] = [];
        const layerTreeVisitor = {
            visitLayer: (layer: Layer) => {
                if (layer instanceof RasterTileSetLayer) {
                    if (layer.model instanceof FusionTileSetModel) {
                        elevationLayers.push(layer);
                    }
                }
                return LayerTreeVisitor.ReturnValue.CONTINUE;
            },
            visitLayerGroup: (layerGroup: LayerGroup) => {
                layerGroup.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
                return LayerTreeVisitor.ReturnValue.CONTINUE;
            }
        };
        layerTree.visitChildren(layerTreeVisitor, LayerTreeNode.VisitOrder.TOP_DOWN);
        return elevationLayers.map(l => ({ id: l.id, visible: l.visible }));
    }

    static restoreElevationLayers(layerTree: LayerTree, layerStates: ElevationLayerState[], forceTo?: boolean) {
        if (!layerTree || !layerStates || !Array.isArray(layerStates)) {
            return;
        }

        for (const state of layerStates) {
            // 2. Guard against missing IDs in the state object
            if (!state.id) continue;

            // 3. findLayerById can return null if the layer was removed or ID changed
            const layer = layerTree.findLayerById(state.id);

            if (layer) {
                if (typeof forceTo === "undefined") {
                    layer.visible = !!state.visible; // Ensure boolean cast
                } else {
                    layer.visible = forceTo;
                }
            } else {
                console.warn(`[LuciadRIA] Could not restore visibility: Layer with ID "${state.id}" not found.`);
            }
        }
    }
}
