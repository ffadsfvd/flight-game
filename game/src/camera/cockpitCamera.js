// The cockpit camera: the pilot's eye, fixed to the airframe, with a little head movement under G
// and turbulence, free look with the right mouse button and a glance back (V).
import * as THREE from 'three';

const scratch = { eye: new THREE.Vector3(), look: new THREE.Quaternion(), yaw: new THREE.Quaternion(), pitch: new THREE.Quaternion() };
const UP = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);

/** Creates the cockpit view; update() moves `camera` to the pilot's eye. */
export function createCockpitCamera() {
  let bob = 0;
  return {
    update(camera, body, spec, dt, look, lookBack) {
      bob += ((body.gForce - 1) * 0.012 - bob) * Math.min(1, dt * 6);
      const [ex, ey, ez] = spec.eye;
      scratch.eye.set(ex, ey - THREE.MathUtils.clamp(bob, -0.05, 0.06), ez).applyQuaternion(body.quaternion).add(body.position);
      camera.position.copy(scratch.eye);
      const yawAngle = lookBack ? Math.PI * 0.85 : -look.x * 1.4;
      scratch.yaw.setFromAxisAngle(UP, yawAngle);
      scratch.pitch.setFromAxisAngle(RIGHT, THREE.MathUtils.clamp(-look.y * 1.2 - 0.06, -1.2, 1.0));
      camera.quaternion.copy(body.quaternion).multiply(scratch.yaw).multiply(scratch.pitch);
      camera.up.set(0, 1, 0).applyQuaternion(body.quaternion);
    },
  };
}
