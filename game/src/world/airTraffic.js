// Pattern traffic: AI aircraft flying endless circuits round the airfields, so the islands feel
// busy. A Wren does touch-and-goes on Marenza's left-hand circuit for runway 09, a second Wren
// works the Orsa Cay circuit, and the Pelican shuttles round the south of the archipelago. They
// bank into their turns and climb and descend along the path; they are scenery, not obstacles.
import * as THREE from 'three';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';
import { airfieldById, fromRunwayFrame } from './airfieldDirectory.js';

const UP = new THREE.Vector3(0, 1, 0);

/** A closed circuit round a runway, from [metres along, metres to the right, height] points. */
function circuitAround(fieldId, legs) {
  const field = airfieldById(fieldId);
  const ground = field.elevationResolved ?? field.elevation ?? 0;
  return legs.map(([along, across, height]) => {
    const p = fromRunwayFrame(field, along, across);
    return new THREE.Vector3(p.x, ground + height, p.z);
  });
}

/** The circuits flown, with aircraft, speed (m/s) and starting point along the loop (0..1). */
export function trafficRoutes() {
  return [
    {
      name: 'Marenza circuit', aircraft: 'wren', speed: 40, phase: 0.62, callsign: 'SV-114',
      points: circuitAround('marenza', [[-700, 0, 26], [0, 0, 18], [800, 0, 60], [1500, 0, 170], [1900, -500, 260], [900, -900, 300], [-1100, -900, 300], [-2000, -500, 230], [-1900, 0, 110], [-1300, 0, 55]]),
    },
    {
      name: 'Orsa circuit', aircraft: 'wren', speed: 38, phase: 0.2, callsign: 'SV-131',
      points: circuitAround('orsa', [[-450, 0, 24], [300, 0, 40], [1100, 0, 150], [1500, -600, 230], [800, -1100, 260], [-900, -1100, 260], [-1500, -600, 200], [-1200, 0, 110]]),
    },
    {
      name: 'Island shuttle', aircraft: 'pelican', speed: 55, phase: 0.35, callsign: 'SV-640',
      points: [[-1500, 4600, 420], [1600, 4700, 440], [3600, 4300, 430], [5200, 1800, 460], [4300, 200, 480], [1600, 900, 520], [-600, 1700, 520], [-3600, 3500, 440]].map(([x, z, y]) => new THREE.Vector3(x, y, z)),
    },
  ];
}

/** Builds the traffic into `scene`; call update(dt, time) every frame. */
export function createAirTraffic(scene) {
  const flyers = trafficRoutes().map((route) => {
    const rig = buildAircraftModel(route.aircraft);
    scene.add(rig.root);
    const curve = new THREE.CatmullRomCurve3(route.points, true, 'centripetal', 0.5);
    return { route, rig, curve, length: curve.getLength(), distance: route.phase * curve.getLength(), bank: 0, lastHeading: null };
  });
  const tangent = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const roll = new THREE.Quaternion();
  const origin = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);

  return {
    flyers,
    update(dt, time) {
      for (const f of flyers) {
        f.distance = (f.distance + f.route.speed * dt) % f.length;
        const u = f.distance / f.length;
        f.curve.getPointAt(u, f.rig.root.position);
        f.curve.getTangentAt(u, tangent);
        const heading = Math.atan2(tangent.x, -tangent.z);
        if (f.lastHeading !== null && dt > 0) {
          let turn = heading - f.lastHeading;
          if (turn > Math.PI) turn -= Math.PI * 2;
          if (turn < -Math.PI) turn += Math.PI * 2;
          const target = THREE.MathUtils.clamp(Math.atan((f.route.speed * turn) / dt / 9.81), -0.8, 0.8);
          f.bank += (target - f.bank) * Math.min(1, dt * 2.5);
        }
        f.lastHeading = heading;
        matrix.lookAt(origin, tangent, UP);
        f.rig.root.quaternion.setFromRotationMatrix(matrix).multiply(roll.setFromAxisAngle(zAxis, -f.bank));
        const prop = f.rig.prop;
        if (prop) {
          prop.spin.rotation.z += dt * 75;
          prop.disc.material.opacity = 0.75;
          for (const blade of prop.blades) blade.visible = false;
        }
        f.rig.lights.update(time, true, 0.6);
      }
    },
  };
}
