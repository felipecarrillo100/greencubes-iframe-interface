/*
 *
 * Copyright (c) 1999-2025 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
/*
 *
 * Copyright (c) 1999-2025 Luciad All Rights Reserved.
 *
 * Luciad grants you ("Licensee") a non-exclusive, royalty free, license to use,
 * modify and redistribute this software in source and binary code form,
 * provided that i) this copyright notice and license appear on all copies of
 * the software; and ii) Licensee does not utilize the software in a manner
 * which is disparaging to Luciad.
 *
 * This software is provided "AS IS," without a warranty of any kind. ALL
 * EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
 * IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR
 * NON-INFRINGEMENT, ARE HEREBY EXCLUDED. LUCIAD AND ITS LICENSORS SHALL NOT BE
 * LIABLE FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING
 * OR DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES. IN NO EVENT WILL LUCIAD OR ITS
 * LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
 * INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
 * CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
 * OR INABILITY TO USE SOFTWARE, EVEN IF LUCIAD HAS BEEN ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGES.
 */
import type {Vector3} from "@luciad/ria/util/Vector3.js";
import {Animation} from "@luciad/ria/view/animation/Animation.js";
import {PerspectiveCamera} from "@luciad/ria/view/camera/PerspectiveCamera.js";
import {Map} from "@luciad/ria/view/Map.js";

/**
 * A quick-look animation uses cartesian interpolation to move the camera from one LookAt position to a target
 * LookAt position. This can be handy for small movements of the camera that don't require complex curves around
 * the entire world.
 */
export class QuickLookAnimation extends Animation {
  private readonly _map: Map;
  private readonly _targetRef: Vector3;
  private readonly _targetPitch: number;
  private readonly _targetDistance: number;
  private readonly _startDistance: number;
  private _targetYaw: number;
  private _startPitch: number;
  private _startRef: Vector3 | null;
  private _startYaw: number;

  /**
   * Creates a new quick look animation.
   *
   * @param map The map to perform the animation on.
   * @param targetRef The target reference point to look at at the end of this animation
   * @param targetPitch The target pitch with which to look at the reference point at the end of this animation
   * @param targetYaw The target yaw with which to look at the reference point at the end of the animation
   * @param startDistance The start distance to the reference point at the beginning of this animation
   * @param targetDistance The target distance to the reference point at the end of this animation in meters.
   * @param duration The duration of the animation in milliseconds.
   */
  constructor(map: Map, targetRef: Vector3, targetPitch: number, targetYaw: number, startDistance: number,
              targetDistance: number, duration: number) {
    super(duration);
    this._map = map;
    this._targetRef = targetRef;
    this._targetPitch = targetPitch;
    this._targetYaw = targetYaw;
    this._targetDistance = targetDistance;
    this._startDistance = startDistance;
    this._startPitch = 0;
    this._startRef = null;
    this._startYaw = 0;
  };

  onStart(): void {
    const lookAtCamera = (this._map.camera as PerspectiveCamera).asLookAt(this._startDistance);
    this._startRef = lookAtCamera.ref;
    this._startPitch = lookAtCamera.pitch;
    this._startYaw = lookAtCamera.yaw;
    if ((this._targetYaw - this._startYaw) > 180) {
      this._targetYaw -= 360;
    } else if ((this._startYaw - this._targetYaw) > 180) {
      this._targetYaw += 360;
    }
  };

  update(fraction: number): void {
    const t = easeInOutQuad(fraction);

    const pitch = lerp(this._startPitch, this._targetPitch, t);
    const yaw = lerp(this._startYaw, this._targetYaw, t);
    const distance = lerp(this._startDistance, this._targetDistance, t);
    const ref = lerpPoint(this._startRef!, this._targetRef, t);

    const perspectiveCamera = this._map.camera as PerspectiveCamera;
    const lookAtCamera = perspectiveCamera.asLookAt(1);
    lookAtCamera.pitch = pitch;
    lookAtCamera.distance = distance;
    lookAtCamera.yaw = yaw;
    lookAtCamera.ref = ref;
    this._map.camera = perspectiveCamera.lookAt(lookAtCamera);
  };
}

function lerpPoint(from: Vector3, to: Vector3, t: number): Vector3 {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    z: lerp(from.z, to.z, t)
  }
}

function lerp(from: number, to: number, t: number): number {
  return (1 - t) * from + t * to;
}

function easeInOutQuad(t: number): number {
  return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
