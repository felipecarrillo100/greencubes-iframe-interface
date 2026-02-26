import * as React from "react";
import { useEffect, useRef, useState } from "react";

import "./LuciadMap.scss"
import { WebGLMap } from "@luciad/ria/view/WebGLMap.js";
import { getReference } from "@luciad/ria/reference/ReferenceProvider.js";
import { ViewToolIBar } from "../buttons/ViewToolIBar";
import { FeatureLayer } from "@luciad/ria/view/feature/FeatureLayer.js";
import type { Feature, FeatureId } from "@luciad/ria/model/feature/Feature.js";
import { MapNavigatorAnimationOptions } from "@luciad/ria/view/MapNavigator";
import { LayerTreeNodeChangeEvent } from "@luciad/ria/view/LayerTree";
import { listenFromParent, MapModeType, type ParentToIframeMessage, sendToParent, JSONLayerTree } from "../../../../src";
import { ElevationLayerState, LayerBuilder } from "./factories/LayerBuilder";
import { CoordinateReference } from "@luciad/ria/reference/CoordinateReference";
import { InitialMapSetup } from "../../../../src/interfaces";
import { Handle } from "@luciad/ria/util/Evented";
import { LayerUtils, restrictBounds2D } from "./utils/LayerUtils";
import { JSONLayerTreeUtils } from "../../utils/JSONLayerTreeUtils";
import {createVisibilityListeners, removeVisibilityListeners, VisibilityManager} from "./managers/VisibilityManager";


const WebMercator = "EPSG:3857";
const WORLD3D = "EPSG:4978";
const World2DReference = getReference(WebMercator);
const World3DReference = getReference(WORLD3D);

const DefaultCoordinateReference = World3DReference;


const easeInOutCubic = (n: number): number => {
    return n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2;
};

interface Props {
    onMapReady?: (m: WebGLMap | null) => void;
    onShowTime?: (options: { status: boolean, errorMessage?: string, targetLayerId?: string }) => void;
    geometrySelected?: (features: Feature[]) => void;
    geometryClicked?: (feature: Feature) => void;
    layerTreeChange?: (o: {
        layerTreeNodeChange: LayerTreeNodeChangeEvent, type: "NodeAdded" | "NodeRemoved" | "NodeMoved",
        layerTree: JSONLayerTree
    }) => void;
}

function addListenerLayerTreeChange(map: WebGLMap, callback?: (o: { layerTreeNodeChange: LayerTreeNodeChangeEvent, type: "NodeAdded" | "NodeRemoved" | "NodeMoved" }) => void) {
    // This code will be called every time the selection change in the map
    const action = (actionType: "NodeAdded" | "NodeRemoved" | "NodeMoved") => (layerTreeNodeChange: LayerTreeNodeChangeEvent) => {
        // Find a layer by ID in the map layerTree
        if (typeof callback === "function") {
            callback({ layerTreeNodeChange, type: actionType });
        }
    }
    map.layerTree.on("NodeAdded", action("NodeAdded"));
    map.layerTree.on("NodeRemoved", action("NodeRemoved"));
    map.layerTree.on("NodeMoved", action("NodeMoved"));
}

function addListenerOnSelectionChange(map: WebGLMap, featureLayer: FeatureLayer, callback?: (features: Feature[]) => void): Handle {
    // This code will be called every time the selection change in the map
    return map.on("SelectionChanged", () => {
        // Find a layer by ID in the map layerTree
        const layer = featureLayer;
        const selection = [...map.selectedObjects];
        // Verify only one layer / one feature is selected
        if (selection.length === 1 && selection[0].layer === layer) {
            if (selection[0].selected.length > 0) {
                const features = selection[0].selected as Feature[];
                // Assign the controller to the map to edit the selected feature
                if (typeof callback === "function") callback(features);
            }
        } else {
            if (typeof callback === "function") callback([]);
        }
    });
}

export const LuciadMap: React.FC<Props> = (props: Props) => {
    const [reference, setReference] = useState<CoordinateReference>(DefaultCoordinateReference);
    const selectionChangeHandle = useRef<Handle | null>(null);
    const layerStates = useRef<ElevationLayerState[]>([]);

    useEffect(() => {
        // Subscribe to messages from parent
        const unsubscribe = listenFromParent((msg: ParentToIframeMessage) => {
            switch (msg.type) {
                case "HighlightFeature":
                    highlightFeature(msg.data);
                    break;
                case "SelectFeatures":
                    selectFeatures(msg.data);
                    break;
                case "ZoomToSelection":
                    zoomToFeatures(msg.data);
                    break;
                case "ZoomToLayer":
                    zoomToLayer(msg.data);
                    break;
                case "RemoveLayer":
                    removeLayer(msg.data);
                    break;
                case "SetLayerVisibility":
                    setLayerVisibility(msg.data);
                    break;
                case "SetProjection":
                    setProjection(msg.data);
                    break;
                case "SetInitialMapSetup":
                    setInitialMapSetup(msg.data);
                    break;
                case "SetLayerGroup":
                    setLayerGroup(msg.data);
                    break;
                default:
                    // @ts-ignore
                    console.warn("Unhandled message type:", msg.type);
            }
        });
        // Cleanup automatically when component unmounts
        return () => {
            unsubscribe();
        };
    }, []); // Depend on highlightFeature if it changes

    useEffect(() => {
        if (mapRef.current) {
            if (is3DReference(mapRef.current.reference)) {
                layerStates.current = LayerBuilder.saveElevationLayers(mapRef.current.layerTree);
            }
            const mapState = mapRef.current.saveState();
            const boundsArray = mapRef.current.getMapBounds();
            mapRef.current.reference = reference;

            if (mapRef.current) {
                if (is3DReference(reference)) {
                    LayerBuilder.restoreElevationLayers(mapRef.current.layerTree, layerStates.current, true);
                    mapRef.current.restoreState(mapState);
                    mapRef.current.mapNavigator.fit({ bounds: boundsArray[0], fitMargin: "0", animate: { duration: 1000, ease: easeInOutCubic } });
                }
            }

            notifyProjectionsChange(reference);
        }
    }, [reference]);

    const is3DReference = (reference: CoordinateReference) => {
        return (reference.identifier.toUpperCase() === "EPSG:4978")
    }

    const notifyProjectionsChange = (reference: CoordinateReference) => {
        const mode: MapModeType = is3DReference(reference) ? "3D" : "2D"
        sendToParent({
            type: "ProjectionChanged",
            data: { mode },
        });
    }

    const divRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<WebGLMap | null>(null);
    const visibilityManager = useRef<VisibilityManager | null>(null)
    const activeLayer = useRef<FeatureLayer | null>(null);

    const highlightFeature = (options: { featureId: FeatureId }) => {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const matches = features.filter(f => f.id === options.featureId);
            if (matches.length === 1)
                mapRef.current.selectObjects([{ layer: activeLayer.current, objects: matches }]);
        }
    }
    const selectFeatures = (options: { featureIds: FeatureId[] }) => {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const matches = features.filter(f => options.featureIds.includes(f.id));
            if (matches.length === 1)
                mapRef.current.selectObjects([{ layer: activeLayer.current, objects: matches }]);
        }
    }

    const setLayerVisibility =  (options: { layerId?: string, visible: boolean }) => {
        if (mapRef.current) {
            if (options.layerId) {
                const layer = mapRef.current.layerTree.findLayerTreeNodeById(options.layerId);
                layer.visible = options.visible;
            }
        }
    }

    const zoomToLayer = (iOptions: { layerId?: string, animate?: boolean | MapNavigatorAnimationOptions | undefined }) => {
        if (mapRef.current) {
            const options = iOptions ? iOptions : { animate: true };
            if (!options.layerId) {
                if (activeLayer.current && activeLayer.current.bounds) mapRef.current.mapNavigator.fit({ bounds: activeLayer.current.bounds, animate: options.animate })
            } else {
                const layer = mapRef.current.layerTree.findLayerById(options.layerId) as FeatureLayer;
                if (layer && layer.bounds) mapRef.current.mapNavigator.fit({ bounds: layer.bounds, animate: options.animate })
            }
        }
    }

    const setProjection = (options: { mode?: MapModeType }) => {
        if (options.mode === "2D") {
            setReference(World2DReference)
        } else {
            setReference(World3DReference)
        }
    }

    const setInitialMapSetup = (options: { settings: InitialMapSetup }) => {
        if (options.settings && mapRef.current) {
            setProjection(options.settings);
            LayerBuilder.build(mapRef.current.layerTree, options.settings).then(() => {
                if (options.settings.targetGroupId) {
                    mapRef.current && LayerBuilder.setTargetGroup(mapRef.current.layerTree, options.settings.targetGroupId);
                }
                if (options.settings.boundsFeatureLayerID && mapRef.current) {
                    const boundsLayer = mapRef.current?.layerTree.findLayerById(options.settings.boundsFeatureLayerID);
                    if (boundsLayer instanceof FeatureLayer) {
                        if (mapRef.current.reference.equals(World3DReference)) {
                            //  restrictBounds3D(mapRef.current, boundsLayer);
                        } else {
                            restrictBounds2D(mapRef.current, boundsLayer);
                        }
                    }
                }
                if (options.settings.targetFeatureLayerID && mapRef.current) {
                    const targetLayer = mapRef.current?.layerTree.findLayerById(options.settings.targetFeatureLayerID);
                    if (targetLayer && targetLayer instanceof FeatureLayer) {
                        if (selectionChangeHandle.current !== null) {
                            selectionChangeHandle.current.remove();
                            selectionChangeHandle.current = null;
                        }
                        targetLayer.onClick = triggerOnClickAction;
                        activeLayer.current = targetLayer;
                        selectionChangeHandle.current = addListenerOnSelectionChange(mapRef.current, targetLayer, triggerOnSelectionChangeAction)
                    }
                }
                if (typeof props.onShowTime === "function") props.onShowTime({ status: true });
            });
        }
    }

    const setLayerGroup = (options: { targetGroupId: string; mode?: MapModeType }) => {
        if (!mapRef.current) return;
        if (options.mode) {
            setProjection(options);
        }
        const newMode = options.mode ? options.mode : is3DReference(reference) ? "3D" : "2D"
        const result = LayerBuilder.setTargetGroup(mapRef.current.layerTree, options.targetGroupId);
        // Send notification to parent
        if (result) {
            sendToParent({
                type: "TargetGroupChanged",
                data: { targetGroupId: options.targetGroupId, mode: newMode },
            });
        }
    }


    const removeLayer = (options: { layerId?: string }) => {
        if (!mapRef.current) return;

        const layerToRemove = options.layerId
            ? mapRef.current.layerTree.findLayerTreeNodeById(options.layerId)
            : activeLayer.current;

        if (layerToRemove) {
            layerToRemove.parent?.removeChild(layerToRemove);
        }
    };

    const zoomToFeatures = (options: { featureIds: FeatureId[], animate?: boolean | MapNavigatorAnimationOptions | undefined }) => {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const bounds = LayerUtils.detectFeaturesBounds(features, options);
            if (bounds) {
                mapRef.current.mapNavigator.fit({ bounds, animate: options.animate });
            }
        }
    }


    const triggerOnSelectionChangeAction = (features: Feature[]) => {
        if (typeof props.geometrySelected === "function") {
            props.geometrySelected(features);
        }
    }

    const triggerOnLayerTreeChange = (o: { layerTreeNodeChange: LayerTreeNodeChangeEvent, type: "NodeAdded" | "NodeRemoved" | "NodeMoved" }) => {
        if (typeof props.layerTreeChange === "function" && mapRef.current) {
            const layerTree = mapRef.current.layerTree;
            const jsonLayerTree: JSONLayerTree = { children: JSONLayerTreeUtils.fromLayerTree(layerTree) };
            props.layerTreeChange({
                ...o,
                layerTree: jsonLayerTree
            });
        }
    }

    const triggerOnLaterVisibilityChanged = () => {
        if (mapRef.current) {
            sendToParent({
                type: "LayerTreeVisibilityChanged",
                data: { layerTree: { children: JSONLayerTreeUtils.fromLayerTree(mapRef.current?.layerTree) }},
            });
        }
    }

    const triggerOnClickAction = (feature: Feature) => {
        if (typeof props.geometryClicked === "function") {
            props.geometryClicked(feature);
            //    return true
        }
        return false;
    }

    useEffect(() => {
        if (divRef.current) {
            mapRef.current = new WebGLMap(divRef.current, { reference });
            addListenerLayerTreeChange(mapRef.current, triggerOnLayerTreeChange);
            console.log("Listener started")
            visibilityManager.current = createVisibilityListeners(mapRef.current.layerTree, triggerOnLaterVisibilityChanged)
            if (typeof props.onMapReady === "function") props.onMapReady(mapRef.current);
        }
        return () => {
            if (mapRef.current) mapRef.current.destroy();
            if (visibilityManager.current !== null) removeVisibilityListeners(visibilityManager.current);
            mapRef.current = null;
            visibilityManager.current = null;
            if (typeof props.onMapReady === "function") props.onMapReady(null);
        }
    }, []);

    return (
        <div className="LuciadMap">
            <div className="LuciadMapElement" ref={divRef} />
            <ViewToolIBar mapRef={mapRef} layerRef={activeLayer} />
        </div>
    )
}
