import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera.js";
import {createCartesianGeodesy, createEllipsoidalGeodesy} from "@luciad/ria/geodesy/GeodesyFactory.js";
import {getReference} from "@luciad/ria/reference/ReferenceProvider.js";
import {AnimationManager} from "@luciad/ria/view/animation/AnimationManager.js";
import {QuickLookAnimation} from "./QuickLookAnimation.ts";
import {createPoint} from "@luciad/ria/shape/ShapeFactory.js";
import type {WebGLMap} from "@luciad/ria/view/WebGLMap.js";
import {LocationMode} from "@luciad/ria/transformation/LocationMode.js";
import {OutOfBoundsError} from "@luciad/ria/error/OutOfBoundsError.js";
import {ReferenceType} from "@luciad/ria/reference/ReferenceType.js";
import { createTransformation } from "@luciad/ria/transformation/TransformationFactory.js";
import type {Point} from "@luciad/ria/shape/Point.js";

const OFFSET_DISTANCE = 1000;
export const RAD2DEG = 180 / Math.PI;

// const CARTESIAN_GEODESY = createCartesianGeodesy(getReference("EPSG:4978"));
const XYZProjectionIdentifier = "LUCIAD:XYZ";
const World3DProjectionIdentifier = "EPSG:4978";

const CartesianProjection = getReference(XYZProjectionIdentifier);
const World3DProjection = getReference(World3DProjectionIdentifier);
const CRS84 = getReference("CRS:84");

const CARTESIAN_GEODESY = createCartesianGeodesy(CartesianProjection);
const WORLD_GEODESY = createCartesianGeodesy(World3DProjection);
const geodesy = createEllipsoidalGeodesy(CRS84);

const ANIMATION_DURATION = 500; //ms

export function helicopterPerspective(map: WebGLMap) {
    const perspectiveAnimation = createPerspectiveAnimation(map, -89);
    if (perspectiveAnimation) {
        AnimationManager.putAnimation(map.cameraAnimationKey, perspectiveAnimation, false);
    }
}

export function carPerspective(map: WebGLMap) {
    const perspectiveAnimation = createPerspectiveAnimation(map, -1);
    if (perspectiveAnimation) {
        AnimationManager.putAnimation(map.cameraAnimationKey, perspectiveAnimation, false);
    }
}

function createPerspectiveAnimation(map: WebGLMap, targetPitch: number) {
    let ref;
    let distance;
    const eye = map.camera.eyePoint;
    if (map.reference.equals(CartesianProjection)) {
        ref = createPoint(map.reference, [0,0,0]);
        distance = CARTESIAN_GEODESY.distance3D(ref, eye);
    } else if (map.reference.equals(World3DProjection)) {
        ref = getCenterScreenInMapCoords(map);
        distance = WORLD_GEODESY.distance3D(ref, eye);
    } else {
        return null;
    }

    const lookAt = (map.camera as PerspectiveCamera).asLookAt(distance);
    return new QuickLookAnimation(
        map,
        ref,
        targetPitch,
        lookAt.yaw,
        distance,
        distance,
        ANIMATION_DURATION
    );
}

function getCenterScreenInMapCoords(map: WebGLMap) {
    return map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE).transform(
        createPoint(null, [map.viewSize[0] / 2, map.viewSize[1] / 2]));
}

export function turn(map: WebGLMap, quadrants: number) {
    let ref;
    let distance;
    const eye = map.camera.eyePoint;
    if (map.reference.equals(CartesianProjection)) {
        ref = createPoint(map.reference, [0,0,0]);
        distance = CARTESIAN_GEODESY.distance3D(ref, eye);
    } else {
        ref = getCenterScreenInMapCoords(map);
        distance = WORLD_GEODESY.distance3D(ref, eye);
    }

    const lookAt = (map.camera as PerspectiveCamera).asLookAt(distance);
    const animation = new QuickLookAnimation(
        map,
        ref,
        lookAt.pitch, (Math.round(lookAt.yaw / 90) + quadrants) * 90,
        distance,
        distance,
        ANIMATION_DURATION
    );
    AnimationManager.putAnimation(map.cameraAnimationKey, animation, false);
}

export function rotateToNorth(map: WebGLMap) {
    //try to rotate around the center of the screen or fall back to a rotation on the camera itself.
    let center;
    try {
        center = map.getViewToMapTransformation(LocationMode.CLOSEST_SURFACE)
            .transform(createPoint(null, [map.viewSize[0] / 2, map.viewSize[1] / 2]))
    } catch (e) {
        if (!(e instanceof OutOfBoundsError)) {
            throw e;
        }
        center = map.camera.eyePoint;
    }

    const deltaRotation = -getAzimuthAtViewCenter(map);

    map.mapNavigator.rotate({animate: true, deltaRotation: deltaRotation, deltaYaw: deltaRotation, center});
}

function getAzimuthAtViewCenter(map: WebGLMap) {
    //if the map is unreferenced or 3D, we can just get the camera's rotation
    if (map.reference.referenceType === ReferenceType.CARTESIAN || map.reference.referenceType ===
        ReferenceType.GEOCENTRIC) {
        return getCameraRotation(map);
    }

    //In 2D there might not be a general north direction (eg. polar stereographic projection), we calculate the
    //azimuth by getting the angle between the point at the center of the view and another point north of that.
    try {
        const world2llh = createTransformation(map.reference, CRS84);
        const llh2world = createTransformation(CRS84, map.reference);

        let centerViewPoint = createPoint(null, [map.viewSize[0] / 2, map.viewSize[1] / 2]);
        const viewToModel = (point: Point) => {
            const mapPoint = map.getViewToMapTransformation(LocationMode.TERRAIN).transform(point);
            return createTransformation(map.reference, map.reference, {normalizeWrapAround: map.wrapAroundWorld}).transform(mapPoint);
        }
        const centerMapPoint = viewToModel(centerViewPoint);
        // the wrapAround normalization might've caused the point to be normalized to a different location on-screen
        // go back to view again, to make sure centerMapPoint matches centerViewPoint
        centerViewPoint = map.mapToViewTransformation.transform(centerMapPoint);
        const centerllhPoint = world2llh.transform(centerMapPoint);
        const higherllhPoint = geodesy.interpolate(centerllhPoint, OFFSET_DISTANCE, 0);

        const higherViewPoint = map.mapToViewTransformation.transform(llh2world.transform(higherllhPoint));

        return Math.atan2(centerViewPoint.x - higherViewPoint.x, centerViewPoint.y - higherViewPoint.y) * RAD2DEG;
    } catch (e) {
        if (e instanceof OutOfBoundsError) {
            return getCameraRotation(map);
        } else {
            throw e;
        }
    }
}

/**
 * Returns the rotation (in 2D) or yaw (in 3D) of the map's camera.
 */
function getCameraRotation(map: WebGLMap) {
    const camera = map.camera;
    if (camera instanceof PerspectiveCamera) {
        return camera.asLookFrom().yaw;
    } else {
        return camera.asLook2D().rotation;
    }
}
