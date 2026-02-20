import {LayerGroup} from "@luciad/ria/view/LayerGroup";
import {LayerTree} from "@luciad/ria/view/LayerTree";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode";
import {ModelFactory} from "./ModelFactory";
import {LayerFactory, SharedLayerGroup} from "./LayerFactory";
import {BuilderLayerType, LayerConfig, LayerTreeConfig} from "./LayerBuilderInterfaces";
import {LayerTreeNodeType} from "@luciad/ria/view/LayerTreeNodeType";

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
                root.addChild(layerNode, "top");
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

    static setTargetGroup(layerTree: LayerTree, layerGroupID: string) {
        try {
            for (const child of layerTree.children) {
                if (child.treeNodeType === LayerTreeNodeType.LAYER_GROUP) {
                    if ((child as SharedLayerGroup).shared) {
                        child.visible = true;
                    } else {
                        child.visible = child.id===layerGroupID
                    }
                }
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}
