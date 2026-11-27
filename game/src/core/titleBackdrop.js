// The living backdrop behind the menus: an air-to-air photo flight. The camera circles the
// archipelago at golden hour. On the title screen the whole fleet flies past in an echelon off to
// the right, each type in its own livery, the selected one leading; behind the other menus only
// the selected aircraft holds formation, banking gently, with Porto Celeste, the airport and the
// mountains beyond. (The fleet also stands parked on Marenza's flight line, see apronDisplay.js.)
import * as THREE from 'three';
import { AIRCRAFT } from '../aircraft/aircraftCatalog.js';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';

const CENTRE = new THREE.Vector3(-1200, 0, 1600);
const RADIUS = 4200;
const HEIGHT = 470;

/** Formation slots from the camera: [metres ahead, right and up as fractions of the distance
 *  ahead]. The lead is nearest, low on the right; the wingmen spread out ahead of it over the
 *  islands, stepped up so every aircraft stands clear of the others. */
const ECHELON = [[29, 0.32, -0.1], [60, 0.04, -0.035], [76, 0.21, 0.03], [92, 0.42, 0.01], [108, -0.06, 0.07], [124, 0.13, 0.1], [142, 0.32, 0.12]]
  .map(([ahead, right, up]) => [ahead, ahead * right, ahead * up]);

function animateRig(rig, dt, time) {
  for (const prop of rig.props ?? [rig.prop]) {
    if (!prop) continue;
    prop.spin.rotation.z += dt * 70;
    prop.disc.material.opacity = 0.75;
    for (const b of prop.blades) b.visible = false;
  }
  if (rig.jet) rig.jet.glowMaterial.opacity = 0.9;
  for (const leg of rig.gearLegs) if (leg.fold !== 'fixed') leg.group.visible = false;
  rig.lights.update(time, true, 0.6);
  rig.exterior.visible = true;
}

/** Creates the backdrop driver for the session and camera director. */
export function createTitleBackdrop(session, director, camera) {
  const q = new THREE.Quaternion();
  const wingman = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const position = new THREE.Vector3();
  const slot = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let angle = THREE.MathUtils.degToRad(78);
  // The fleet's other aircraft, built the first time the title shows them.
  const fleet = new Map();
  let fleetGroup = null;
  const fleetRig = (id) => {
    if (!fleet.has(id)) {
      const rig = buildAircraftModel(id);
      rig.exterior.children.forEach((child, i) => {
        if (i > 0) child.visible = true;
      });
      fleetGroup.add(rig.root);
      fleet.set(id, rig);
    }
    return fleet.get(id);
  };
  return {
    enter(aircraftId = 'wren') {
      director.view = 'manual';
      session.showModel(aircraftId, CENTRE, q);
    },
    /** Sets the backdrop to an exact angle (deg) on its circle, for the screenshot. */
    setAngle(deg) {
      angle = THREE.MathUtils.degToRad(deg);
    },
    update(dt, time, aircraftId, withFleet = false) {
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
      const [ahead, aside, lift] = ECHELON[0];
      position.copy(camera.position).addScaledVector(forward, ahead).addScaledVector(right, aside).addScaledVector(up, lift + Math.sin(time * 0.7) * 0.4);
      const motion = Math.atan2(right.x, -right.z);
      const heading = motion - THREE.MathUtils.degToRad(28);
      euler.set(0.03 + Math.sin(time * 0.5) * 0.01, -heading, -0.16 + Math.sin(time * 0.33) * 0.04);
      q.setFromEuler(euler);
      const rig = session.showModel(aircraftId, position, q);
      animateRig(rig, dt, time);
      if (!fleetGroup) {
        fleetGroup = new THREE.Group();
        fleetGroup.name = 'title-fleet';
        rig.root.parent.add(fleetGroup);
      }
      fleetGroup.visible = withFleet;
      if (withFleet) {
        // The rest of the fleet in echelon right, each a little behind and below the one before,
        // every pilot holding the lead's bank with a small bob of their own.
        const others = AIRCRAFT.map((a) => a.id).filter((id) => id !== aircraftId);
        others.forEach((id, k) => {
          const [a, s, l] = ECHELON[k + 1];
          slot.copy(camera.position).addScaledVector(forward, a).addScaledVector(right, s).addScaledVector(up, l + Math.sin(time * 0.6 + k * 1.7) * 0.5);
          euler.set(0.03 + Math.sin(time * 0.5 + k) * 0.01, -heading, -0.16 + Math.sin(time * 0.33 + k * 0.8) * 0.05);
          wingman.setFromEuler(euler);
          const other = fleetRig(id);
          other.root.position.copy(slot);
          other.root.quaternion.copy(wingman);
          animateRig(other, dt, time);
        });
      }
      return position;
    },
  };
}
