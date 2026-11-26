// Chooses and runs the active view: chase, cockpit, the external fly-by camera, the replay after
// a crash or landing, and the slow orbit behind the menus. C cycles the flying views.
import * as THREE from 'three';
import { createChaseCamera } from './chaseCamera.js';
import { createCockpitCamera } from './cockpitCamera.js';
import { createReplayCamera } from './replayCamera.js';

export const VIEW_NAMES = { chase: 'CHASE VIEW', cockpit: 'COCKPIT VIEW', flyby: 'FLY-BY VIEW', replay: 'REPLAY', orbit: '' };
const CYCLE = ['chase', 'cockpit', 'flyby'];

/** Creates the director for a perspective camera. */
export function createCameraDirector(camera) {
  const chase = createChaseCamera();
  const cockpit = createCockpitCamera();
  const replay = createReplayCamera();
  const flybyStation = new THREE.Vector3();
  let view = 'chase';
  let orbitAngle = 0;
  const orbit = { centre: new THREE.Vector3(-600, 0, 1200), radius: 2600, height: 520, speed: 0.025, lookHeight: 160 };

  function setFov(fov) {
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  return {
    replay,
    orbit,
    chaseFraming: chase.framing,
    get view() {
      return view;
    },
    set view(name) {
      view = name;
      if (name === 'chase') chase.reset();
    },
    cycle() {
      view = CYCLE[(CYCLE.indexOf(view) + 1) % CYCLE.length];
      if (view === 'chase') chase.reset();
      return view;
    },
    /** Places the fly-by camera ahead of the aircraft, beside its path. */
    placeFlyby(body, world) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(body.quaternion).setY(0).normalize();
      flybyStation.copy(body.position).addScaledVector(forward, 160 + body.airspeed * 2.5);
      flybyStation.x += forward.z * 40;
      flybyStation.z -= forward.x * 40;
      flybyStation.y = Math.max(body.position.y - 8, Math.max(0, world.terrain.heightAt(flybyStation.x, flybyStation.z)) + 3);
    },
    update(dt, body, spec, world, look, lookBack) {
      if (view === 'orbit') {
        setFov(55);
        orbitAngle += dt * orbit.speed;
        camera.position.set(orbit.centre.x + Math.cos(orbitAngle) * orbit.radius, orbit.height, orbit.centre.z + Math.sin(orbitAngle) * orbit.radius);
        camera.up.set(0, 1, 0);
        camera.lookAt(orbit.centre.x, orbit.lookHeight, orbit.centre.z);
        return null;
      }
      if (view === 'replay') return replay.update(camera, dt);
      if (!body) return null;
      if (view === 'cockpit') {
        setFov(74);
        cockpit.update(camera, body, spec, dt, look, lookBack);
      } else if (view === 'flyby') {
        setFov(50);
        if (flybyStation.lengthSq() === 0 || flybyStation.distanceTo(body.position) > 700) this.placeFlyby(body, world);
        camera.position.copy(flybyStation);
        camera.up.set(0, 1, 0);
        camera.lookAt(body.position);
      } else {
        setFov(60);
        chase.update(camera, body, spec, dt, world, look);
      }
      return null;
    },
  };
}
