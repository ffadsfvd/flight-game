// The chase camera: sits behind and above the aircraft along its flight path, not its nose, so a
// sideslip or a high angle of attack never swings the view. It eases its orientation (not its
// position) so it keeps a constant distance at any speed, leans a little into banks, stays above
// the ground and lets the pilot look around with the right mouse button.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const scratch = {
  forward: new THREE.Vector3(),
  path: new THREE.Vector3(),
  target: new THREE.Quaternion(),
  matrix: new THREE.Matrix4(),
  offset: new THREE.Vector3(),
  look: new THREE.Vector3(),
  bodyUp: new THREE.Vector3(),
  up: new THREE.Vector3(),
  side: new THREE.Vector3(),
};

/** Creates a chase rig; update() moves `camera`. `framing` tunes height, distance and look-ahead. */
export function createChaseCamera() {
  const rig = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let initialised = false;
  const framing = { height: 1.35, distance: 1, lookAhead: 34, lookUp: 0.6 };
  return {
    framing,
    reset() {
      initialised = false;
    },
    update(camera, body, spec, dt, world, look) {
      const { forward, path, target, matrix, offset, bodyUp, side } = scratch;
      forward.set(0, 0, -1).applyQuaternion(body.quaternion);
      if (body.airspeed > 12 && body.velocity.lengthSq() > 1) {
        path.copy(body.velocity).normalize();
        const blend = THREE.MathUtils.clamp((body.airspeed - 12) / 20, 0, 0.75);
        path.lerp(forward, 1 - blend).normalize();
      } else {
        path.copy(forward);
      }
      if (Math.abs(path.y) > 0.97) path.y = Math.sign(path.y) * 0.97;
      bodyUp.set(0, 1, 0).applyQuaternion(body.quaternion);
      const leanUp = scratch.up.copy(UP).lerp(bodyUp, 0.22).normalize();
      matrix.lookAt(new THREE.Vector3(), path, leanUp);
      target.setFromRotationMatrix(matrix);
      if (!initialised) {
        rig.copy(target);
        up.copy(leanUp);
        initialised = true;
      } else {
        rig.slerp(target, 1 - Math.exp(-dt * 4.2));
        up.lerp(leanUp, 1 - Math.exp(-dt * 3)).normalize();
      }
      const distance = spec.chaseDistance * framing.distance * (1 + Math.min(0.25, body.airspeed / 400));
      offset.set(0, spec.chaseHeight * framing.height, distance);
      if (look.x || look.y) {
        offset.applyAxisAngle(UP, -look.x);
        side.set(1, 0, 0);
        offset.applyAxisAngle(side, -THREE.MathUtils.clamp(look.y, -1.2, 1.2));
      }
      offset.applyQuaternion(rig);
      camera.position.copy(body.position).add(offset);
      const ground = Math.max(0, world.terrain.heightAt(camera.position.x, camera.position.z));
      if (camera.position.y < ground + 1.6) camera.position.y = ground + 1.6;
      const lookAhead = scratch.look.copy(path).multiplyScalar(framing.lookAhead);
      if (look.x || look.y) lookAhead.set(0, 0, 0);
      camera.up.copy(up);
      camera.lookAt(scratch.look.add(body.position).addScaledVector(up, framing.lookUp));
    },
  };
}
