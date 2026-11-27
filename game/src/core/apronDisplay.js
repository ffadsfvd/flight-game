// Parks a few aircraft on the aprons (Marenza's flight line and Orsa Cay) so the airfields look
// used. They are the same models the player flies, with their lights and spotlights switched off.
import * as THREE from 'three';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';
import { airfieldById, fromRunwayFrame } from '../world/airfieldDirectory.js';

const PARKING = [
  // Marenza's flight line: every type in the fleet, nose to the runway in its own livery, the
  // smallest at the west end where the title camera stands, the long-winged ones further east.
  { field: 'marenza', aircraft: 'kestrel', along: -228 },
  { field: 'marenza', aircraft: 'saker', along: -208 },
  { field: 'marenza', aircraft: 'wren', along: -186 },
  { field: 'marenza', aircraft: 'swiftlet', along: -162 },
  { field: 'marenza', aircraft: 'heron', along: -135 },
  { field: 'marenza', aircraft: 'pelican', along: -104 },
  { field: 'marenza', aircraft: 'swallow', along: -70 },
  { field: 'marenza', aircraft: 'wren', along: 150 },
  { field: 'marenza', aircraft: 'heron', along: 70 },
  { field: 'orsa', aircraft: 'wren', along: 40 },
  { field: 'calvera', aircraft: 'wren', along: 0 },
];

const STAND_PAINT = new THREE.MeshBasicMaterial({ color: '#e8c234', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

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
    for (const prop of rig.props ?? [rig.prop]) if (prop) prop.disc.visible = false;
    rig.exterior.children.forEach((child, i) => {
      if (i > 0) child.visible = false;
    });
    const across = field.apronSide * (field.apronOffset + field.apronDepth * 0.55);
    const p = fromRunwayFrame(field, slot.along, across);
    const lowest = Math.min(...rig.spec.gear.map((g) => g[1])) - rig.spec.wheelRadius;
    rig.root.position.set(p.x, field.elevationResolved - lowest + 0.05, p.z);
    rig.root.rotation.set(0, -THREE.MathUtils.degToRad(field.heading - 90 * field.apronSide), 0);
    group.add(rig.root);
    // The stand: a yellow lead-in line from the taxi lane to the parked aircraft and a stop bar.
    const y = field.elevationResolved + 0.15;
    const lineFrom = field.apronOffset + 3;
    const lineTo = field.apronOffset + field.apronDepth * 0.55 + 6;
    const lead = fromRunwayFrame(field, slot.along, field.apronSide * ((lineFrom + lineTo) / 2));
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, lineTo - lineFrom).rotateX(-Math.PI / 2), STAND_PAINT);
    strip.position.set(lead.x, y, lead.z);
    strip.rotation.y = -THREE.MathUtils.degToRad(field.heading - 90);
    group.add(strip);
    const stop = fromRunwayFrame(field, slot.along, field.apronSide * (lineFrom + 4));
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5).rotateX(-Math.PI / 2), STAND_PAINT);
    bar.position.set(stop.x, y, stop.z);
    bar.rotation.y = -THREE.MathUtils.degToRad(field.heading - 90);
    group.add(bar);
  }
  scene.add(group);
  return group;
}
