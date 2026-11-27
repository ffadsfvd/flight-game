// Island traffic: AI aircraft in their operators' colours that make the archipelago feel busy. A
// club Wren flies low approaches on Marenza's left-hand circuit for runway 09 and another works
// Orsa Cay, the Pelican shuttle and the yellow mail Wren run between the islands, a Heron
// seaplane touches down and lifts off again on Lumeno Lagoon, a crop duster sprays the fields
// north of Marenza, a coast-guard Swiftlet patrols the islands high up, and a Pelican holds
// short of runway 09. They bank into their turns; they are scenery, not obstacles.
import * as THREE from 'three';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';
import { TRAFFIC_LIVERIES } from '../aircraft/trafficLiveries.js';
import { airfieldById, fromRunwayFrame } from './airfieldDirectory.js';

const UP = new THREE.Vector3(0, 1, 0);

/** A closed circuit round a runway, from [metres along, metres to the right, height] points. */
function circuitAround(fieldId, legs) {
  const field = airfieldById(fieldId);
  const ground = field.kind === 'water' ? 0 : field.elevationResolved ?? field.elevation ?? 0;
  return legs.map(([along, across, height]) => {
    const p = fromRunwayFrame(field, along, across);
    return new THREE.Vector3(p.x, ground + height, p.z);
  });
}

/** The routes flown, with aircraft, livery, speed (m/s) and starting point along the loop (0..1). */
export function trafficRoutes(terrain) {
  const overGround = (points) => points.map(([x, z, h]) => new THREE.Vector3(x, Math.max(0, terrain ? terrain.heightAt(x, z) : 0) + h, z));
  return [
    {
      name: 'Marenza circuit', aircraft: 'wren', livery: 'aeroclub', speed: 40, phase: 0.62, callsign: 'SV-114',
      points: circuitAround('marenza', [[-700, 0, 26], [0, 0, 18], [800, 0, 60], [1500, 0, 170], [1900, -500, 260], [900, -900, 300], [-1100, -900, 300], [-2000, -500, 230], [-1900, 0, 110], [-1300, 0, 55]]),
    },
    {
      name: 'Orsa circuit', aircraft: 'wren', livery: 'aeroclub', speed: 38, phase: 0.2, callsign: 'SV-131',
      points: circuitAround('orsa', [[-450, 0, 24], [300, 0, 40], [1100, 0, 150], [1500, -600, 230], [800, -1100, 260], [-900, -1100, 260], [-1500, -600, 200], [-1200, 0, 110]]),
    },
    {
      name: 'Island shuttle', aircraft: 'pelican', livery: 'solvaraAir', speed: 55, phase: 0.35, callsign: 'SV-640', activity: 'on the island shuttle',
      points: [[-1500, 4600, 420], [1600, 4700, 440], [3600, 4300, 430], [5200, 1800, 460], [4300, 200, 480], [1600, 900, 520], [-600, 1700, 520], [-3600, 3500, 440]].map(([x, z, y]) => new THREE.Vector3(x, y, z)),
    },
    {
      name: 'Lagoon seaplane', aircraft: 'heron', livery: 'lagoonTaxi', speed: 34, phase: 0.1, callsign: 'SV-622', seaplane: true, activity: 'touch and go on the lagoon',
      points: circuitAround('lumeno', [[-1000, 0, 70], [-520, 0, 12], [-330, 0, 2.1], [0, 0, 2.0], [260, 0, 2.4], [520, 0, 22], [900, 0, 90], [1250, 450, 170], [700, 1000, 220], [-900, 1000, 220], [-1600, 500, 150]]),
    },
    {
      name: 'Crop duster', aircraft: 'kestrel', livery: 'farmCoop', speed: 36, phase: 0.5, callsign: 'SV-355', spray: true, activity: 'crop spraying north of the field',
      points: overGround([[-3000, 2420, 8], [-2600, 2420, 7], [-2200, 2420, 7], [-1880, 2430, 12], [-1760, 2465, 48], [-1880, 2500, 13], [-2200, 2510, 7], [-2600, 2510, 7], [-3000, 2500, 12], [-3120, 2465, 48]]),
    },
    {
      name: 'Vento duster', aircraft: 'kestrel', livery: 'farmCoop', speed: 33, phase: 0.1, callsign: 'SV-356', spray: true, activity: 'spraying the Casale Vento farms beside the approach',
      points: overGround([[-4120, 2808, 9], [-3960, 2806, 7], [-3800, 2808, 7], [-3700, 2812, 12], [-3600, 2828, 46], [-3690, 2858, 14], [-3800, 2866, 7], [-3960, 2866, 7], [-4120, 2860, 12], [-4220, 2830, 46]]),
    },
    {
      name: 'Mail run', aircraft: 'wren', livery: 'islandPost', speed: 46, phase: 0.7, callsign: 'SV-150', activity: 'on the mail run',
      points: [[-2900, 2200, 380], [-4400, -200, 450], [-5300, -2300, 380], [-6100, -3500, 300], [-4800, -3900, 380], [-3900, -1500, 480], [-3300, 900, 450]].map(([x, z, y]) => new THREE.Vector3(x, y, z)),
    },
    {
      name: 'Coast-guard patrol', aircraft: 'swiftlet', livery: 'coastGuard', speed: 95, phase: 0.45, callsign: 'SV-911', activity: 'on patrol overhead',
      points: [[-6800, 1800, 900], [-5000, -4600, 950], [0, -6600, 1100], [5200, -4500, 1000], [6800, 1000, 900], [4200, 5200, 850], [-1200, 5600, 850], [-5200, 4800, 880]].map(([x, z, y]) => new THREE.Vector3(x, y, z)),
    },
  ];
}

/** Aircraft waiting on the ground with engines running: [field, aircraft, livery, registration, along, across, heading]. */
const HOLDING = [['marenza', 'pelican', 'solvaraAir', 'SV-655', -862, 58, 32]];

function sprayPlume() {
  // A soft cone of droplets streaming back from the wing, thick at the spray bar and fading out.
  const geometry = new THREE.ConeGeometry(5.5, 26, 14, 1, true);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -1.1, 13 + 1.5);
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 64);
  const material = new THREE.MeshBasicMaterial({ color: '#eef3ea', map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'crop-spray';
  return mesh;
}

/** Builds the traffic into `scene`; call update(dt, time) every frame. */
export function createAirTraffic(scene, terrain) {
  const flyers = trafficRoutes(terrain).map((route) => {
    const rig = buildAircraftModel(route.aircraft, { livery: TRAFFIC_LIVERIES[route.livery], registration: route.callsign });
    rig.root.traverse((o) => {
      if (o.isLight) o.visible = false;
    });
    if (route.seaplane) for (const leg of rig.gearLegs) if (leg.fold !== 'fixed') leg.group.visible = false;
    const spray = route.spray ? sprayPlume() : null;
    if (spray) rig.root.add(spray);
    scene.add(rig.root);
    const curve = new THREE.CatmullRomCurve3(route.points, true, 'centripetal', 0.5);
    return { route, rig, curve, spray, length: curve.getLength(), distance: route.phase * curve.getLength(), bank: 0, lastHeading: null };
  });
  const holding = HOLDING.map(([fieldId, aircraft, livery, registration, along, across, heading]) => {
    const field = airfieldById(fieldId);
    const rig = buildAircraftModel(aircraft, { livery: TRAFFIC_LIVERIES[livery], registration });
    rig.root.traverse((o) => {
      if (o.isLight) o.visible = false;
    });
    const p = fromRunwayFrame(field, along, across * field.apronSide);
    const lowest = Math.min(...rig.spec.gear.map((g) => g[1])) - rig.spec.wheelRadius;
    rig.root.position.set(p.x, field.elevationResolved - lowest + 0.05, p.z);
    rig.root.rotation.set(0, -THREE.MathUtils.degToRad(heading), 0);
    scene.add(rig.root);
    return { rig, field };
  });
  const tangent = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const roll = new THREE.Quaternion();
  const origin = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const spinProps = (rig, dt) => {
    for (const prop of rig.props ?? [rig.prop]) {
      if (!prop) continue;
      prop.spin.rotation.z += dt * 75;
      prop.disc.material.opacity = 0.75;
      for (const blade of prop.blades) blade.visible = false;
    }
  };

  return {
    flyers,
    holding,
    /** Moves a route's aircraft to fraction `u` of its loop (screenshot scenes place traffic). */
    place(name, u) {
      const f = flyers.find((x) => x.route.name === name);
      if (f) f.distance = (u % 1) * f.length;
    },
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
        spinProps(f.rig, dt);
        if (f.spray) {
          const p = f.rig.root.position;
          const agl = p.y - Math.max(0, terrain ? terrain.heightAt(p.x, p.z) : 0);
          f.spray.visible = agl < 16 && Math.abs(f.bank) < 0.25;
        }
        f.rig.lights.update(time, true, 0.6);
      }
      for (const h of holding) {
        spinProps(h.rig, dt);
        h.rig.lights.update(time, true, 0.6);
      }
    },
  };
}
