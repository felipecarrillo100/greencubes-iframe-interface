import * as React from "react";
import {useEffect, useRef, useState} from "react";

import "./LuciadMap.scss"
import {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {ViewToolIBar} from "../buttons/ViewToolIBar";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer.js";
import type {Feature, FeatureId} from "@luciad/ria/model/feature/Feature.js";
import {DefaultController} from "@luciad/ria/view/controller/DefaultController.js";
import {NavigationKeysMode} from "ria-toolbox/libs/scene-navigation/KeyNavigationSupport";
import {NavigationGizmo} from "ria-toolbox/libs/scene-navigation/NavigationGizmo";
import {NavigationType} from "ria-toolbox/libs/scene-navigation/GestureUtil";
import {createBounds} from "@luciad/ria/shape/ShapeFactory.js";

import ROTATION_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_circles.glb";
import PAN_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_arrows.glb";
import SCROLL_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_octhedron.glb";
import {SceneNavigationController} from "ria-toolbox/libs/scene-navigation/SceneNavigationController";
import {MapNavigatorAnimationOptions} from "@luciad/ria/view/MapNavigator";
import {LayerTreeNodeChangeEvent} from "@luciad/ria/view/LayerTree";
import {listenFromParent, MapModeType, type ParentToIframeMessage, sendToParent} from "../../../../../src";
import {LayerBuilder} from "./factories/LayerBuilder";
import {CoordinateReference} from "@luciad/ria/reference/CoordinateReference";
import {InitialMapSetup} from "./factories/LayerBuilderInterfaces";
import {Handle} from "@luciad/ria/util/Evented";

const WebMercator = "EPSG:3857";
const WORLD3D = "EPSG:4978";
const DefaultCoordinateReference = getReference(WebMercator);
const World3DReference = getReference(WORLD3D);


interface Props {
    onMapReady?:(m:WebGLMap|null)=>void;
    onShowTime?: (options: {status: boolean, errorMessage?:string, targetLayerId?: string}) => void;
    geometrySelected?: (features: Feature[]) => void;
    geometryClicked?: (feature: Feature) => void;
    layerTreeChange?: (o: {layerTreeNodeChange: LayerTreeNodeChangeEvent,  type: "NodeAdded" | "NodeRemoved" | "NodeMoved"  }) => void;
}

function addListenerLayerTreeChange(map: WebGLMap, callback?: (o: {layerTreeNodeChange: LayerTreeNodeChangeEvent,  type: "NodeAdded" | "NodeRemoved" | "NodeMoved"  }) => void) {
    // This code will be called every time the selection change in the map
    const action  = (actionType:  "NodeAdded" | "NodeRemoved" | "NodeMoved")=>(layerTreeNodeChange: LayerTreeNodeChangeEvent) => {
        // Find a layer by ID in the map layerTree
        if (typeof callback === "function") {
              callback({layerTreeNodeChange, type: actionType});
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
    const selectionChangeHandle = useRef<Handle|null>(null);

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
            mapRef.current.reference = reference;
            notifyProjectionsChange(reference)
        }
    }, [reference]);

    const notifyProjectionsChange = (reference: CoordinateReference) => {
        const mode: MapModeType = (reference.identifier.toUpperCase() === "EPSG:4978") ? "3D" : "2D"
        sendToParent({
            type: "ProjectionChanged",
            data: {mode},
        });
    }

    const divRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<WebGLMap | null>(null);
    const activeLayer = useRef<FeatureLayer | null>(null);

    const highlightFeature = (options:{ featureId:  FeatureId})=> {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const matches = features.filter(f=>f.id===options.featureId);
            if (matches.length === 1)
            mapRef.current.selectObjects([{layer: activeLayer.current,objects: matches}]);
        }
    }
    const selectFeatures = (options: { featureIds:  FeatureId[]})=> {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const matches = features.filter(f => options.featureIds.includes(f.id));
            if (matches.length === 1)
                mapRef.current.selectObjects([{layer: activeLayer.current,objects: matches}]);
        }
    }

    const zoomToLayer = (iOptions: {layerid?:string, animate?: boolean | MapNavigatorAnimationOptions | undefined})=> {
        if (mapRef.current) {
            const options = iOptions ? iOptions : {animate: true};
            if (!options.layerid) {
                if (activeLayer.current && activeLayer.current.bounds) mapRef.current.mapNavigator.fit({bounds: activeLayer.current.bounds, animate: options.animate})
            } else {
                const layer = mapRef.current.layerTree.findLayerById(options.layerid) as FeatureLayer;
                if (layer && layer.bounds) mapRef.current.mapNavigator.fit({bounds: layer.bounds, animate: options.animate})
            }
        }
    }

    const setProjection = (options: { mode?: MapModeType}) => {
        if (options.mode==="2D") {
            setReference(DefaultCoordinateReference)
        } else {
            setReference(World3DReference)
        }
    }

    const setInitialMapSetup= (options: { settings: InitialMapSetup }) => {
        if (options.settings && mapRef.current) {
            setProjection(options.settings);
            LayerBuilder.build(mapRef.current.layerTree, options.settings).then(()=>{
                if (options.settings.targetGroupId) {
                    mapRef.current && LayerBuilder.setTargetGroup(mapRef.current.layerTree, options.settings.targetGroupId);
                }
                if (options.settings.boundsFeatureLayerID &&  mapRef.current) {
                    const boundsLayer = mapRef.current?.layerTree.findLayerById(options.settings.boundsFeatureLayerID);
                    if (boundsLayer instanceof FeatureLayer) {
                        if (mapRef.current.reference.equals(World3DReference)) {
                            restrictBounds3D(mapRef.current, boundsLayer);
                        } else {
                            restrictBounds2D(mapRef.current, boundsLayer);
                        }
                    }
                }
                if (options.settings.targetFeatureLayerID && mapRef.current) {
                    const targetLayer = mapRef.current?.layerTree.findLayerById(options.settings.targetFeatureLayerID);
                    if (targetLayer && targetLayer instanceof FeatureLayer) {
                        if (selectionChangeHandle.current !== null ) {
                            selectionChangeHandle.current.remove();
                            selectionChangeHandle.current =  null;
                        }
                        targetLayer.onClick = triggerOnClickAction;
                        activeLayer.current = targetLayer;
                        selectionChangeHandle.current = addListenerOnSelectionChange(mapRef.current, targetLayer, triggerOnSelectionChangeAction)
                    }
                }
                if (typeof props.onShowTime === "function") props.onShowTime({status: true});
            });
        }
    }

    const setLayerGroup= (options: { targetGroupId: string; mode?: MapModeType }) => {
        if (!mapRef.current) return;
        if (options.mode) {
            setProjection(options);
        }
        const newMode = options.mode ? options.mode : (reference.identifier.toUpperCase() === "EPSG:4978") ? "3D" : "2D"
        const result = LayerBuilder.setTargetGroup(mapRef.current.layerTree, options.targetGroupId);
        // Send notification to parent
        if (result) {
            sendToParent({
                type: "TargetGroupChanged",
                data: {targetGroupId: options.targetGroupId, mode: newMode},
            });
        }
    }


    const removeLayer = (options: { layerId?: string }) => {
        if (!mapRef.current) return;

        const layerToRemove = options.layerId
            ? (mapRef.current.layerTree.findLayerById(options.layerId) as FeatureLayer)
            : activeLayer.current;

        if (layerToRemove) {
            layerToRemove.parent?.removeChild(layerToRemove);
        }
    };

    const zoomToFeatures= (options:{ featureIds: FeatureId[], animate?: boolean | MapNavigatorAnimationOptions | undefined})=> {
        if (activeLayer.current && mapRef.current) {
            const features = activeLayer.current.workingSet.get();
            const matches = features.filter(f => options.featureIds.includes(f.id));
            if (matches.length>0) {
                const bounds = matches[0].shape?.bounds?.copy();
                if (bounds) {
                    for (let i=1; i<matches.length; ++i) {
                        const b =matches[i].shape?.bounds;
                        if (b) bounds.setTo3DUnion(b);
                    }
                    if (bounds) mapRef.current.mapNavigator.fit({bounds, animate: options.animate})
                }
            }
        }
    }


    const triggerOnSelectionChangeAction = (features: Feature[]) => {
        if (typeof props.geometrySelected === "function") {
            props.geometrySelected(features);
        }
    }

    const triggerOnLayerTreeChange= (o: {layerTreeNodeChange: LayerTreeNodeChangeEvent,  type: "NodeAdded" | "NodeRemoved" | "NodeMoved"  }) => {
        if (typeof props.layerTreeChange === "function") {
            props.layerTreeChange(o);
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
            mapRef.current = new WebGLMap(divRef.current, {reference});
            addListenerLayerTreeChange(mapRef.current, triggerOnLayerTreeChange);
            if (typeof props.onMapReady === "function") props.onMapReady(mapRef.current);
        }
        return () => {
            if (mapRef.current) mapRef.current.destroy();
            mapRef.current = null;
            if (typeof props.onMapReady === "function") props.onMapReady(null);
        }
    }, []);

    return (
        <div className="LuciadMap">
            <div className="LuciadMapElement" ref={divRef}/>
            <ViewToolIBar mapRef={mapRef} layerRef={activeLayer}/>
        </div>
    )
}

function restrictBounds3D(map: WebGLMap | null, layer: FeatureLayer) {
    if (!map) return;
    if (!layer.bounds) return;

    const {limitBounds, targetBounds} = calculateBounds(layer, "3D");


    map.mapNavigator.fit({bounds: targetBounds, animate: false});

    // Declare the gizmos to use for the different navigation types.
    const gizmos = {
        [NavigationType.ROTATION]: new NavigationGizmo(ROTATION_GLB),
        [NavigationType.PAN]: new NavigationGizmo(PAN_GLB),
        [NavigationType.ZOOM]: new NavigationGizmo(SCROLL_GLB, {sizeInPixels: 40})
    };
    // Create a controller with varying options.
    const navigateController = new SceneNavigationController(gizmos, limitBounds, {
        navigationMode: NavigationKeysMode.TANGENT_FORWARD, // navigate along camera paths
        defaultSpeed: 8, // ~28km/h
        allowZoomOnClick: true, // clicking on a spot zooms in on to that location by a set fraction
        useZoomAnimations: false, // don't use smooth animations when zooming or out
        fasterMultiplier: 2, // go two times as fast when shift is pressed
        slowerMultiplier: 0.5, // go only half as fast when space is pressed
        swapPanRotateButtons: true
    });

    map.defaultController = new DefaultController({navigateController});
}

function restrictBounds2D(map: WebGLMap | null, layer: FeatureLayer) {
    if (!map) return;
    if (!layer.bounds) return;

    const {limitBounds, targetBounds} = calculateBounds(layer, "2D");

    map.mapNavigator.fit({bounds: targetBounds, animate: false});

    map.mapNavigator.constraints = {
        limitBounds: {
            bounds: limitBounds,
        }
    };
}

function calculateBounds(layer: FeatureLayer, mode?: MapModeType) {
    const currentMode = mode ? mode: "2D";
    const valueOnMode = (value: number)=> {
        return currentMode === "2D" ? 0 : value;
    }

    // @ts-ignore
    let limitBounds = layer.bounds.copy();
    // @ts-ignore
    let targetBounds = layer.bounds.copy();
    const limitsScale = 9;
    const targetScale = 4;
    if (limitBounds.depth === 0) {
        limitBounds = createBounds(limitBounds.reference, [
            limitBounds.x - (limitsScale - 1) * limitBounds.width / 2, limitBounds.width * limitsScale,
            limitBounds.y - (limitsScale - 1) * limitBounds.height / 2, limitBounds.height * limitsScale,
            valueOnMode(-100), valueOnMode(60000)
        ])
        targetBounds = createBounds(targetBounds.reference, [
            targetBounds.x - (targetScale - 1) * targetBounds.width / 2, targetBounds.width * targetScale,
            targetBounds.y - (targetScale - 1) * targetBounds.height / 2, targetBounds.height * targetScale,
            valueOnMode(-100), valueOnMode(60000)
        ]);
    } else {
        limitBounds = createBounds(limitBounds.reference, [
            limitBounds.x - (limitsScale - 1) * limitBounds.width / 2, limitBounds.width * limitsScale,
            limitBounds.y - (limitsScale - 1) * limitBounds.height / 2, limitBounds.height * limitsScale,
            valueOnMode(limitBounds.z - ((limitsScale*2) - 1) * limitBounds.depth / 2),
            valueOnMode(limitBounds.depth * limitsScale *2)
        ]);
        targetBounds = createBounds(targetBounds.reference, [
            targetBounds.x - (targetScale - 1) * targetBounds.width / 2, targetBounds.width * targetScale,
            targetBounds.y - (targetScale - 1) * targetBounds.height / 2, targetBounds.height * targetScale,
            // targetBounds.z - ((targetScale*2) - 1) * targetBounds.depth / 2, targetBounds.depth * targetScale *2
            valueOnMode(targetBounds.z + targetBounds.depth / 3 - (targetBounds.depth * targetScale * 2) / 2),
            valueOnMode(targetBounds.depth * targetScale * 2)
        ]);
    }

    return {limitBounds, targetBounds}
}
