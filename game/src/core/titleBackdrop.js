// The living backdrop behind the menus: an air-to-air photo flight. The camera circles the
// archipelago at golden hour while the selected aircraft holds formation just off to the right,
// banking gently, with Porto Celeste, the airport and the mountains beyond.
import * as THREE from 'three';

const CENTRE = new THREE.Vector3(-1200, 0, 1600);
const RADIUS = 4200;
const HEIGHT = 470;

/** Creates the backdrop driver for the session and camera director. */
export function createTitleBackdrop(session, director, camera) {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const position = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let angle = THREE.MathUtils.degToRad(78);
  return {
    enter(aircraftId = 'wren') {
      director.view = 'manual';
      session.showModel(aircraftId, CENTRE, q);
    },
    /** Sets the backdrop to an exact angle (deg) on its circle, for the screenshot. */
    setAngle(deg) {
      angle = THREE.MathUtils.degToRad(deg);
    },
    update(dt, time, aircraftId) {
      angle -= dt * 0.012;
      camera.position.set(CENTRE.x + Math.cos(angle) * RADIUS, HEIGHT + Math.sin(time * 0.2) * 4, CENTRE.z + Math.sin(angle) * RADIUS);
      forward.set(-Math.cos(angle), -0.07, -Math.sin(angle)).normalize();
      right.crossVectors(forward, up).normalize();
      if (camera.fov !== 52) {
        camera.fov = 52;
        camera.updateProjectionMatrix();
      }
      camera.up.set(0, 1, 0);
      camera.lookAt(camera.position.x + forward.x * 100, camera.position.y + forward.y * 100, camera.position.z + forward.z * 100);
      position.copy(camera.position).addScaledVector(forward, 29).addScaledVector(right, 8.6).addScaledVector(up, -2.9 + Math.sin(time * 0.7) * 0.4);
      const motion = Math.atan2(right.x, -right.z);
      const heading = motion - THREE.MathUtils.degToRad(28);
      euler.set(0.03 + Math.sin(time * 0.5) * 0.01, -heading, -0.16 + Math.sin(time * 0.33) * 0.04);
      q.setFromEuler(euler);
      const rig = session.showModel(aircraftId, position, q);
      if (rig.prop) {
        rig.prop.spin.rotation.z += dt * 70;
        rig.prop.disc.material.opacity = 0.75;
        for (const b of rig.prop.blades) b.visible = false;
      }
      if (rig.jet) rig.jet.glowMaterial.opacity = 0.9;
      for (const leg of rig.gearLegs) if (leg.fold !== 'fixed') leg.group.visible = false;
      rig.lights.update(time, true, 0.6);
      rig.exterior.visible = true;
      return position;
    },
  };
}
