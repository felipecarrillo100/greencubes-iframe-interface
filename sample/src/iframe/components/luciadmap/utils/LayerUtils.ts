import {Point} from "@luciad/ria/shape/Point";
import {createBounds} from "@luciad/ria/shape/ShapeFactory";
import {Feature} from "@luciad/ria/model/feature/Feature.js";
import {ShapeType} from "@luciad/ria/shape/ShapeType";
import type {FeatureId} from "@luciad/ria/model/feature/Feature";
import {WebGLMap} from "@luciad/ria/view/WebGLMap";
import {FeatureLayer} from "@luciad/ria/view/feature/FeatureLayer";
import {NavigationType} from "ria-toolbox/libs/scene-navigation/GestureUtil";
import {NavigationGizmo} from "ria-toolbox/libs/scene-navigation/NavigationGizmo";
import ROTATION_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_circles.glb";
import PAN_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_arrows.glb";
import SCROLL_GLB from "ria-toolbox/libs/scene-navigation/gizmo/gizmo_octhedron.glb";
import {SceneNavigationController} from "ria-toolbox/libs/scene-navigation/SceneNavigationController";
import {NavigationKeysMode} from "ria-toolbox/libs/scene-navigation/KeyNavigationSupport";
import {DefaultController} from "@luciad/ria/view/controller/DefaultController";
import {MapModeType} from "../../../../../../src";

export class LayerUtils {

    static detectPointBounds(point: Point) {
        const width = 0.001;
        return createBounds(point.reference, [point.x - width / 2, width, point.y - width / 2, width, point.z, 0]);
    }

    static detectFeaturesBounds(features: Feature[], options?:{featureIds: FeatureId[]}) {
        const matches = options ?
            features.filter(f => options.featureIds.includes(f.id)) :
            features;
        if (matches.length>0) {
            let bounds = matches[0].shape?.bounds?.copy();
            if (matches[0].shape?.type === ShapeType.POINT) {
                bounds = this.detectPointBounds(matches[0].shape as Point);
            }
            if (bounds) {
                for (let i=1; i<matches.length; ++i) {
                    const b =matches[i].shape?.bounds;
                    if (b) bounds.setTo3DUnion(b);
                }
            }
            return bounds;
        }
        return null;
    }

}

export function restrictBounds3D(map: WebGLMap | null, layer: FeatureLayer) {
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

export function restrictBounds2D(map: WebGLMap | null, layer: FeatureLayer) {
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
