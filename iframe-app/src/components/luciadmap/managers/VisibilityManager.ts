import {LayerTree} from "@luciad/ria/view/LayerTree";
import {Handle} from "@luciad/ria/util/Evented";
import {LayerTreeNode} from "@luciad/ria/view/LayerTreeNode";
import {LayerGroup} from "@luciad/ria/view/LayerGroup";

/**
 * The object that holds the state of the listeners for a specific map/tree.
 */
export interface VisibilityManager {
    registry: Map<string, Handle[]>;
    structuralHandles: Handle[];
}

/**
 * Creates and registers visibility listeners recursively.
 * Returns a Manager object used to clean up later.
 */
export const createVisibilityListeners = (
    layerTree: LayerTree,
    onVisibilityToggle: (node: LayerTreeNode) => void
): VisibilityManager => {
    const manager: VisibilityManager = {
        registry: new Map<string, Handle[]>(),
        structuralHandles: []
    };

    const attach = (node: LayerTreeNode) => {
        const handles: Handle[] = [];
        // Attach the visibility listener
        handles.push(node.on("VisibilityChanged", () => onVisibilityToggle(node)));

        if (node instanceof LayerGroup || node instanceof LayerTree ) {
            node.children.forEach(attach);
        }
        manager.registry.set(node.id, handles);
    };

    const detach = (node: LayerTreeNode) => {
        const handles = manager.registry.get(node.id);
        if (handles) {
            handles.forEach(h => h.remove());
            manager.registry.delete(node.id);
        }
        if (node instanceof LayerGroup) {
            node.children.forEach(detach);
        }
    };

    // Register structural listeners to keep the registry in sync
    manager.structuralHandles = [
        layerTree.on("NodeAdded", (event) => attach(event.node)),
        layerTree.on("NodeRemoved", (event) => detach(event.node))
    ];

    // Initial attachment for existing nodes
    layerTree.children.forEach(attach);

    return manager;
};

/**
 * Destroys all handles within a specific VisibilityManager.
 */
export const removeVisibilityListeners = (manager: VisibilityManager): void => {
    // 1. Remove tree-level structural listeners
    manager.structuralHandles.forEach(h => h.remove());
    manager.structuralHandles = [];

    // 2. Remove all layer-specific visibility listeners
    manager.registry.forEach((handles) => {
        handles.forEach(h => h.remove());
    });

    // 3. Clear the specific registry
    manager.registry.clear();
};
