import * as React from "react";
import { useEffect, useRef, useState } from "react";

import "./LuciadMap.scss"
import { WebGLMap } from "@luciad/ria/view/WebGLMap.js";
import { getReference } from "@luciad/ria/reference/ReferenceProvider.js";
import { ViewToolIBar } from "../buttons/ViewToolIBar";
import { FeatureLayer } from "@luciad/ria/view/feature/FeatureLayer.js";
import type { Feature, FeatureId } from "@luciad/ria/model/feature/Feature.js";
import { MapNavigatorAnimationOptions } from "@luciad/ria/view/MapNavigator";
import {LayerTree, LayerTreeNodeChangeEvent} from "@luciad/ria/view/LayerTree";
import { listenFromParent, sendToParent, ParentToIframeMsg, IframeToParentMsg } from "@library/index";
import type { MapModeType, ParentToIframeMessage, JSONLayerTree, LayerTreeChangedEventType, AddLayerOptions } from "@library/index";
import type { InitialMapSetup } from "@library/interfaces";
import { ElevationLayerState, LayerBuilder } from "./factories/LayerBuilder";
import { CoordinateReference } from "@luciad/ria/reference/CoordinateReference";

import { Handle } from "@luciad/ria/util/Evented";
import { LayerUtils, restrictBounds2D } from "./utils/LayerUtils";
import { JSONLayerTreeUtils } from "../../utils/JSONLayerTreeUtils";
import { createVisibilityListeners, removeVisibilityListeners, VisibilityManager } from "./managers/VisibilityManager";


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
    geometrySelected?: (selection: {[key:string]: Feature[]}) => void;
    geometryClicked?: (feature: Feature, layerId: string) => void;
    layerTreeChange?: (o: {
        layerTreeNodeChange: LayerTreeNodeChangeEvent, type: "NodeAdded" | "NodeRemoved" | "NodeMoved",
        layerTree: JSONLayerTree
    }) => void;
}

function addListenerLayerTreeChange(map: WebGLMap, callback?: (o: { layerTreeNodeChange: LayerTreeNodeChangeEvent, type: LayerTreeChangedEventType }) => void) {
    // This code will be called every time the selection change in the map
    const action = (actionType: LayerTreeChangedEventType) => (layerTreeNodeChange: LayerTreeNodeChangeEvent) => {
        // Find a layer by ID in the map layerTree
        if (typeof callback === "function") {
            callback({ layerTreeNodeChange, type: actionType });
        }
    }
    map.layerTree.on("NodeAdded", action("NodeAdded"));
    map.layerTree.on("NodeRemoved", action("NodeRemoved"));
    map.layerTree.on("NodeMoved", action("NodeMoved"));
}

function addListenerOnSelectionChange(map: WebGLMap, callback?: (selection: {[key:string]: Feature[]}) => void): Handle {
    // This code will be called every time the selection change in the map
    return map.on("SelectionChanged", () => {
        // Find a layer by ID in the map layerTree
        const selection = [...map.selectedObjects];
        const mapSelection: {[key:string]: Feature[]} = {}

        for (const item of selection) {
            mapSelection[item.layer.id] = item.selected  as Feature[]
        }
        // Verify only one layer / one feature is selected
        if (typeof callback === "function") callback(mapSelection);
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
                case ParentToIframeMsg.SelectFeature:
                    highlightFeature(msg.data);
                    break;
                case ParentToIframeMsg.SelectFeatures:
                    selectFeatures(msg.data);
                    break;
                case ParentToIframeMsg.ZoomToSelection:
                    zoomToFeatures(msg.data);
                    break;
                case ParentToIframeMsg.ZoomToLayer:
                    zoomToLayer(msg.data);
                    break;
                case ParentToIframeMsg.RemoveLayer:
                    removeLayer(msg.data);
                    break;
                case ParentToIframeMsg.SetLayerVisibility:
                    setLayerVisibility(msg.data);
                    break;
                case ParentToIframeMsg.SetProjection:
                    setProjection(msg.data);
                    break;
                case ParentToIframeMsg.SetInitialMapSetup:
                    setInitialMapSetup(msg.data);
                    break;
                case ParentToIframeMsg.SetLayerGroup:
                    setLayerGroup(msg.data);
                    break;
                case ParentToIframeMsg.AddLayer:
                    addLayer(msg.data.options);
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
            type: IframeToParentMsg.ProjectionChanged,
            data: { mode },
        });
    }

    const divRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<WebGLMap | null>(null);
    const visibilityManager = useRef<VisibilityManager | null>(null)
    const activeLayer = useRef<FeatureLayer | null>(null);

    const highlightFeature = (options: { featureId: FeatureId, layerId?: string }) => {
        if (activeLayer.current && mapRef.current) {
            const targetLayer = options.layerId ? mapRef.current.layerTree.findLayerById(options.layerId) as FeatureLayer : activeLayer.current;
            if (!targetLayer || !targetLayer.workingSet) return;
            const features = targetLayer.workingSet.get();
            const matches = features.filter(f => f.id === options.featureId);
            if (matches.length === 1)
                mapRef.current.selectObjects([{ layer: targetLayer, objects: matches }]);
        }
    }

    const selectFeatures = (options: { featureIds: FeatureId[], layerId?: string }) => {
        if (activeLayer.current && mapRef.current) {
            const targetLayer = options.layerId ? mapRef.current.layerTree.findLayerById(options.layerId) as FeatureLayer : activeLayer.current;
            if (!targetLayer || !targetLayer.workingSet) return;
            const features = targetLayer.workingSet.get();
            const matches = features.filter(f => options.featureIds.includes(f.id));
            if (matches.length > 0)
                mapRef.current.selectObjects([{ layer: targetLayer, objects: matches }]);
        }
    }

    const setLayerVisibility = (options: { layerId?: string, visible: boolean }) => {
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

    const makeFeatureLayersClickable = (layerTree:  LayerTree)=>{
        const featureLayers = LayerBuilder.getFeatureLayers(layerTree);
        for (const featureLayer of featureLayers) {
            featureLayer.onClick = triggerOnClickAction(featureLayer.id);
        }
    }

    const setInitialMapSetup = (options: { settings: InitialMapSetup }) => {
        if (options.settings && mapRef.current) {
            setProjection(options.settings);
            mapRef.current.layerTree.removeAllChildren();
            LayerBuilder.build(mapRef.current.layerTree, options.settings).then(() => {
                if (!mapRef.current) return;
                // MAke all vector layers clickable!!!
                makeFeatureLayersClickable(mapRef.current.layerTree);
                if (selectionChangeHandle.current !== null) {
                    selectionChangeHandle.current.remove();
                    selectionChangeHandle.current = null;
                }
                selectionChangeHandle.current = addListenerOnSelectionChange(mapRef.current, triggerOnSelectionChangeAction)

                if (options.settings.targetGroupId) {
                    LayerBuilder.setTargetGroup(mapRef.current.layerTree, options.settings.targetGroupId);
                }
                if (options.settings.boundsFeatureLayerID ) {
                    const boundsLayer = mapRef.current.layerTree.findLayerById(options.settings.boundsFeatureLayerID);
                    if (boundsLayer instanceof FeatureLayer) {
                        if (mapRef.current.reference.equals(World3DReference)) {
                            //  restrictBounds3D(mapRef.current, boundsLayer);
                        } else {
                            restrictBounds2D(mapRef.current, boundsLayer);
                        }
                    }
                }
                if (options.settings.targetFeatureLayerID) {
                    const targetLayer = mapRef.current?.layerTree.findLayerById(options.settings.targetFeatureLayerID);
                    if (targetLayer && targetLayer instanceof FeatureLayer) {
                        activeLayer.current = targetLayer;
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
                type: IframeToParentMsg.TargetGroupChanged,
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

    const addLayer = (options: AddLayerOptions) => {
        if (mapRef.current) {
            LayerBuilder.addLayer(mapRef.current.layerTree, options);
        }
    }

    const zoomToFeatures = (options: { featureIds: FeatureId[], animate?: boolean | MapNavigatorAnimationOptions | undefined, layerId?: string }) => {
        if (mapRef.current) {
            const targetLayer = options.layerId ? mapRef.current.layerTree.findLayerById(options.layerId) as FeatureLayer : activeLayer.current;
            if (!targetLayer || !targetLayer.workingSet) return;
            const features = targetLayer.workingSet.get();
            const bounds = LayerUtils.detectFeaturesBounds(features, options);
            if (bounds) {
                mapRef.current.mapNavigator.fit({ bounds, animate: options.animate });
            }
        }
    }


    const triggerOnSelectionChangeAction = (selection: {[key:string]: Feature[]}) => {
        if (typeof props.geometrySelected === "function") {
            props.geometrySelected(selection);
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
                type: IframeToParentMsg.LayerTreeVisibilityChanged,
                data: { layerTree: { children: JSONLayerTreeUtils.fromLayerTree(mapRef.current?.layerTree) } },
            });
        }
    }

    const triggerOnClickAction = (layerId: string) => (feature: Feature) => {
        if (typeof props.geometryClicked === "function") {
            props.geometryClicked(feature, layerId);
            //    return true
        }
        return false;
    }

    useEffect(() => {
        if (divRef.current) {
            mapRef.current = new WebGLMap(divRef.current, { reference });
            if (mapRef.current.mapNavigator.constraints.above) mapRef.current.mapNavigator.constraints.above.minAltitude = 0.5;
            mapRef.current.globeColor = "#15202d";
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
