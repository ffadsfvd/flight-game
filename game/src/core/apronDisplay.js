// Parks a few aircraft on the aprons (Marenza's flight line and Orsa Cay) so the airfields look
// used. They are the same models the player flies, with their lights and spotlights switched off.
import * as THREE from 'three';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';
import { airfieldById, fromRunwayFrame } from '../world/airfieldDirectory.js';

const PARKING = [
  { field: 'marenza', aircraft: 'wren', along: 150 },
  { field: 'marenza', aircraft: 'wren', along: 118 },
  { field: 'marenza', aircraft: 'heron', along: 70 },
  { field: 'marenza', aircraft: 'swiftlet', along: 10 },
  { field: 'orsa', aircraft: 'wren', along: 40 },
  { field: 'calvera', aircraft: 'wren', along: 0 },
];

/** Builds the parked aircraft into the scene. */
export function parkDisplayAircraft(scene) {
  const group = new THREE.Group();
  group.name = 'parked-aircraft';
  for (const slot of PARKING) {
    const field = airfieldById(slot.field);
    const rig = buildAircraftModel(slot.aircraft);
    rig.root.traverse((o) => {
      if (o.isLight) o.visible = false;
    });
    rig.lights.group.visible = false;
    if (rig.prop) rig.prop.disc.visible = false;
    rig.exterior.children.forEach((child, i) => {
      if (i > 0) child.visible = false;
    });
    const across = field.apronSide * (field.apronOffset + field.apronDepth * 0.55);
    const p = fromRunwayFrame(field, slot.along, across);
    const lowest = Math.min(...rig.spec.gear.map((g) => g[1])) - rig.spec.wheelRadius;
    rig.root.position.set(p.x, field.elevationResolved - lowest + 0.05, p.z);
    rig.root.rotation.set(0, -THREE.MathUtils.degToRad(field.heading - 90 * field.apronSide), 0);
    group.add(rig.root);
  }
  scene.add(group);
  return group;
}
