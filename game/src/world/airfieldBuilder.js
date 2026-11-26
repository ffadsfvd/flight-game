// Builds every airfield in 3D from the directory: the painted runway, apron and taxiways, edge
// and approach lights, PAPI glide-slope lights, control tower, terminal, hangars, fuel tanks,
// windsocks, grass-strip markers and the seaplane lane's buoys and dock. update() swings the
// windsocks, runs the approach strobes and sets each PAPI light red or white from the aircraft.
import * as THREE from 'three';
import { AIRFIELDS, fromRunwayFrame, landingDirection, runwayAxes } from './airfieldDirectory.js';
import { paintRunwaySurface } from './runwayMarkings.js';
import { createLightBatch } from './lightPoints.js';

const WHITE = new THREE.Color('#fff3d6');
const GREEN = new THREE.Color('#39ff7a');
const RED = new THREE.Color('#ff3328');
const AMBER = new THREE.Color('#ffb340');
const PAPI_ANGLES = [2.5, 2.83, 3.17, 3.5];

const materials = {
  apron: new THREE.MeshLambertMaterial({ color: '#8d8b86' }),
  taxi: new THREE.MeshLambertMaterial({ color: '#4a4b4e' }),
  taxiLine: new THREE.MeshBasicMaterial({ color: '#e8c234' }),
  hangarWall: new THREE.MeshLambertMaterial({ color: '#e7e1d6' }),
  hangarRoof: new THREE.MeshLambertMaterial({ color: '#9aa6ad' }),
  hangarDoor: new THREE.MeshLambertMaterial({ color: '#56606a' }),
  towerBody: new THREE.MeshLambertMaterial({ color: '#f1ebe0' }),
  towerGlass: new THREE.MeshLambertMaterial({ color: '#2a4a5e', emissive: '#3c6f80', emissiveIntensity: 0.5 }),
  towerRoof: new THREE.MeshLambertMaterial({ color: '#c0442e' }),
  terminal: new THREE.MeshLambertMaterial({ color: '#efe4cf' }),
  terminalGlass: new THREE.MeshLambertMaterial({ color: '#30485a', emissive: '#4f7d8f', emissiveIntensity: 0.4 }),
  tank: new THREE.MeshLambertMaterial({ color: '#f4f2ec' }),
  tankStripe: new THREE.MeshLambertMaterial({ color: '#d04a2a' }),
  pole: new THREE.MeshLambertMaterial({ color: '#d9d4cc' }),
  marker: new THREE.MeshLambertMaterial({ color: '#f6f3ea' }),
  buoy: new THREE.MeshLambertMaterial({ color: '#ff7a1f', emissive: '#5a1d00' }),
  dock: new THREE.MeshLambertMaterial({ color: '#8b6a48' }),
};

/** Orange and white windsock stripes. */
function windsockMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 ? '#f7f2ea' : '#ff5a1f';
    ctx.fillRect(i * 25.6, 0, 25.6, 16);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
}
const sockMaterial = windsockMaterial();

/** Places a mesh at runway-frame coordinates, yawed with the runway. */
function placeInFrame(mesh, field, along, across, y, extraYaw = 0) {
  const p = fromRunwayFrame(field, along, across);
  mesh.position.set(p.x, y, p.z);
  mesh.rotation.y = -THREE.MathUtils.degToRad(field.heading) + extraYaw;
  return mesh;
}

function flatStrip(field, along, across, length, width, y, material) {
  const geometry = new THREE.PlaneGeometry(width, length);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return placeInFrame(mesh, field, along, across, y);
}

function buildHangar(group, colliders, field, along, across, y, facing) {
  const hangar = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(34, 8, 26), materials.hangarWall);
  walls.position.y = 4;
  const roofGeometry = new THREE.CylinderGeometry(13, 13, 34, 20, 1, false, 0, Math.PI);
  roofGeometry.rotateZ(Math.PI / 2);
  roofGeometry.scale(1, 0.42, 1);
  const roof = new THREE.Mesh(roofGeometry, materials.hangarRoof);
  roof.position.y = 8;
  const door = new THREE.Mesh(new THREE.PlaneGeometry(26, 7.2), materials.hangarDoor);
  door.position.set(0, 3.7, 13.05 * facing);
  if (facing < 0) door.rotation.y = Math.PI;
  hangar.add(walls, roof, door);
  hangar.traverse((o) => {
    o.castShadow = true;
    o.receiveShadow = true;
  });
  placeInFrame(hangar, field, along, across, y, Math.PI / 2);
  group.add(hangar);
  const p = fromRunwayFrame(field, along, across);
  colliders.push({ kind: 'cylinder', x: p.x, z: p.z, radius: 19, top: y + 13, name: `a hangar at ${field.name}` });
}

function buildTower(group, colliders, field, along, across, y) {
  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 24, 12), materials.towerBody);
  shaft.position.y = 12;
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 4.6, 4.2, 8), materials.towerGlass);
  cab.position.y = 26.1;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.8, 8), materials.towerRoof);
  roof.position.y = 28.6;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 5), materials.pole);
  mast.position.y = 32.5;
  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 10), materials.terminal);
  base.position.y = 2.5;
  tower.add(shaft, cab, roof, mast, base);
  tower.traverse((o) => {
    o.castShadow = true;
  });
  placeInFrame(tower, field, along, across, y);
  group.add(tower);
  const p = fromRunwayFrame(field, along, across);
  colliders.push({ kind: 'cylinder', x: p.x, z: p.z, radius: 7, top: y + 36, name: `the ${field.name} control tower` });
  return new THREE.Vector3(p.x, y + 36, p.z);
}

function buildTerminal(group, colliders, field, along, across, y) {
  const terminal = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(150, 11, 22), materials.terminal);
  body.position.y = 5.5;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(146, 5, 22.4), materials.terminalGlass);
  glass.position.y = 6.5;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(156, 1.2, 26), materials.towerRoof);
  roof.position.y = 11.6;
  terminal.add(body, glass, roof);
  terminal.traverse((o) => {
    o.castShadow = true;
    o.receiveShadow = true;
  });
  placeInFrame(terminal, field, along, across, y);
  group.add(terminal);
  const p = fromRunwayFrame(field, along, across);
  colliders.push({ kind: 'box', x: p.x, z: p.z, halfLength: 78, halfWidth: 13, heading: field.heading, top: y + 12.5, name: `the ${field.name} terminal` });
}

function buildFuelTanks(group, colliders, field, along, across, y) {
  for (let i = 0; i < 2; i += 1) {
    const tank = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 7, 16), materials.tank);
    body.position.y = 3.5;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(5.05, 5.05, 0.9, 16), materials.tankStripe);
    stripe.position.y = 5.2;
    tank.add(body, stripe);
    tank.traverse((o) => {
      o.castShadow = true;
    });
    placeInFrame(tank, field, along + i * 13, across, y);
    group.add(tank);
    const p = fromRunwayFrame(field, along + i * 13, across);
    colliders.push({ kind: 'cylinder', x: p.x, z: p.z, radius: 5.5, top: y + 7.2, name: `the fuel tanks at ${field.name}` });
  }
}

function buildWindsock(group, field, along, across, y) {
  const holder = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 6), materials.pole);
  pole.position.y = 3.5;
  const swivel = new THREE.Group();
  swivel.position.y = 6.8;
  const sockGeometry = new THREE.CylinderGeometry(0.55, 0.25, 4, 12, 1, true);
  sockGeometry.rotateX(Math.PI / 2);
  sockGeometry.translate(0, 0, 2);
  const sock = new THREE.Mesh(sockGeometry, sockMaterial);
  swivel.add(sock);
  holder.add(pole, swivel);
  const p = fromRunwayFrame(field, along, across);
  holder.position.set(p.x, y, p.z);
  group.add(holder);
  return { swivel, sock };
}

/** Builds all airfields; returns the scene group, colliders and a per-frame update. */
export function buildAirfields(terrain) {
  const group = new THREE.Group();
  group.name = 'airfields';
  const colliders = [];
  const windsocks = [];
  const papis = [];
  const strobes = [];
  const beacons = [];
  const edgeBatch = createLightBatch();
  const approachBatch = createLightBatch();
  const flasherPositions = [];

  for (const field of AIRFIELDS) {
    const y = field.elevationResolved ?? field.elevation;
    const side = field.apronSide;
    if (field.kind !== 'water') {
      const { canvas } = paintRunwaySurface(field);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
      const runway = flatStrip(field, 0, 0, field.length, field.width, y + 0.12, new THREE.MeshLambertMaterial({ map: texture }));
      runway.name = `runway-${field.id}`;
      group.add(runway);
      // Apron, taxiways and their yellow lines.
      const apronAcross = side * (field.apronOffset + field.apronDepth / 2);
      group.add(flatStrip(field, 0, apronAcross, field.apronLength, field.apronDepth, y + 0.09, materials.apron));
      for (const along of [-field.apronLength * 0.35, field.apronLength * 0.35]) {
        const taxiLength = field.apronOffset - field.width / 2 + 4;
        const taxiAcross = side * (field.width / 2 + taxiLength / 2 - 2);
        const taxi = flatStrip(field, along, taxiAcross, 18, taxiLength, y + 0.1, materials.taxi);
        group.add(taxi);
        const line = flatStrip(field, along, taxiAcross, 0.5, taxiLength, y + 0.13, materials.taxiLine);
        group.add(line);
      }
      const buildingRow = side * (field.apronOffset + field.apronDepth + 24);
      for (let h = 0; h < field.hangars; h += 1) {
        buildHangar(group, colliders, field, field.apronLength * 0.32 - h * 44, buildingRow, y, -side);
      }
      if (field.tower) beacons.push(buildTower(group, colliders, field, -field.apronLength * 0.5 - 35, side * (field.apronOffset + 30), y));
      if (field.terminal) buildTerminal(group, colliders, field, -field.apronLength * 0.12, buildingRow - side * 6, y);
      if (field.fuel) buildFuelTanks(group, colliders, field, field.apronLength * 0.5 + 25, side * (field.apronOffset + 20), y);
      windsocks.push(buildWindsock(group, field, -field.length * 0.5 + 260, -side * (field.width / 2 + 28), y));
      windsocks.push(buildWindsock(group, field, field.length * 0.5 - 260, -side * (field.width / 2 + 28), y));
    } else {
      // Seaplane lane: buoys either side, a dock running out from the shore, a boathouse.
      const buoyGeometry = new THREE.SphereGeometry(1.1, 10, 8);
      const count = Math.floor(field.length / 90) + 1;
      const buoys = new THREE.InstancedMesh(buoyGeometry, materials.buoy, count * 2);
      const m = new THREE.Matrix4();
      let k = 0;
      for (let i = 0; i < count; i += 1) {
        const along = -field.length / 2 + i * 90;
        for (const s of [-1, 1]) {
          const p = fromRunwayFrame(field, along, s * field.width / 2);
          m.makeTranslation(p.x, 0.35, p.z);
          buoys.setMatrixAt(k, m);
          k += 1;
          approachBatch.add(p.x, 1.6, p.z, AMBER, 2.2);
        }
      }
      group.add(buoys);
      const dockAcross = side * (field.apronOffset - 60);
      group.add(placeInFrame(new THREE.Mesh(new THREE.BoxGeometry(4, 1, 120), materials.dock), field, 0, dockAcross, 0.6, Math.PI / 2));
      buildHangar(group, colliders, field, 0, side * (field.apronOffset + 22), 3, -side);
      if (field.fuel) buildFuelTanks(group, colliders, field, 40, side * (field.apronOffset + 18), 3);
      windsocks.push(buildWindsock(group, field, -60, side * (field.apronOffset - 4), 3));
    }

    if (field.kind === 'grass') {
      const markerGeometry = new THREE.BoxGeometry(1.6, 0.5, 0.6);
      const count = Math.floor(field.length / 50) + 1;
      const markers = new THREE.InstancedMesh(markerGeometry, materials.marker, count * 2);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -THREE.MathUtils.degToRad(field.heading));
      let k = 0;
      for (let i = 0; i < count; i += 1) {
        for (const s of [-1, 1]) {
          const p = fromRunwayFrame(field, -field.length / 2 + i * 50, s * (field.width / 2 + 1.2));
          m.compose(new THREE.Vector3(p.x, y + 0.35, p.z), q, new THREE.Vector3(1, 1, 1));
          markers.setMatrixAt(k, m);
          k += 1;
        }
      }
      group.add(markers);
    }

    if (field.edgeLights) {
      for (let along = -field.length / 2; along <= field.length / 2 + 0.1; along += 60) {
        for (const s of [-1, 1]) {
          const p = fromRunwayFrame(field, along, s * (field.width / 2 + 1.5));
          edgeBatch.add(p.x, y + 0.6, p.z, WHITE, 2.6);
        }
      }
      for (const end of [-1, 1]) {
        for (let a = -field.width / 2; a <= field.width / 2 + 0.1; a += field.width / 8) {
          const p = fromRunwayFrame(field, end * (field.length / 2 + 2), a);
          edgeBatch.add(p.x, y + 0.6, p.z, GREEN, 3.0);
        }
      }
    }

    if (field.approachLights) {
      for (const end of [0, 1]) {
        const dir = landingDirection(field, end);
        const sign = dir.sign;
        for (let d = 30; d <= 720; d += 30) {
          const along = -sign * (field.length / 2 + d);
          const bar = d === 300 ? 15 : 7;
          const stepAcross = d === 300 ? 2 : 3.5;
          for (let a = -bar; a <= bar + 0.01; a += stepAcross) {
            const p = fromRunwayFrame(field, along, a);
            const ground = Math.max(0.5, terrain.heightAt(p.x, p.z));
            approachBatch.add(p.x, Math.max(y, ground) + 1.2, p.z, WHITE, 2.6);
          }
          const c = fromRunwayFrame(field, along, 0);
          flasherPositions.push({ x: c.x, y: Math.max(y, Math.max(0.5, terrain.heightAt(c.x, c.z))) + 2.2, z: c.z, order: d / 30 });
        }
      }
    }

    if (field.papi) {
      for (const end of [0, 1]) {
        const dir = landingDirection(field, end);
        const along = -dir.sign * (field.length / 2 - 300);
        const lights = [];
        for (let i = 0; i < 4; i += 1) {
          const across = -dir.sign * (field.width / 2 + 14 + i * 9);
          const p = fromRunwayFrame(field, along, across);
          lights.push({ x: p.x, y: y + 1.0, z: p.z });
        }
        papis.push({ field, end, lights });
      }
    }
  }

  const edgeLights = edgeBatch.build();
  edgeLights.name = 'runway-edge-lights';
  group.add(edgeLights);
  const approachLights = approachBatch.count > 0 ? approachBatch.build() : null;
  if (approachLights) group.add(approachLights);

  const papiBatch = createLightBatch();
  for (const papi of papis) for (const l of papi.lights) papiBatch.add(l.x, l.y, l.z, RED, 3.6);
  const papiPoints = papiBatch.build();
  papiPoints.material.userData.fixed = 1.4;
  group.add(papiPoints);

  const flasherBatch = createLightBatch();
  for (const f of flasherPositions) flasherBatch.add(f.x, f.y, f.z, WHITE, 6);
  const flashers = flasherPositions.length ? flasherBatch.build() : null;
  if (flashers) {
    flashers.material.userData.fixed = 1.6;
    group.add(flashers);
  }

  const beaconBatch = createLightBatch();
  for (const b of beacons) beaconBatch.add(b.x, b.y, b.z, new THREE.Color('#ff4a2a'), 3);
  const beaconPoints = beacons.length ? beaconBatch.build() : null;
  if (beaconPoints) group.add(beaconPoints);

  const colorScratch = new THREE.Color();

  return {
    group,
    colliders,
    edgeLights,
    /** Per frame: wind (m/s vector), aircraft position and time drive the moving parts. */
    update(time, wind, aircraftPosition) {
      const speed = Math.hypot(wind.x, wind.z);
      const yaw = Math.atan2(wind.x, wind.z);
      for (const sock of windsocks) {
        sock.swivel.rotation.y = yaw;
        sock.sock.rotation.x = THREE.MathUtils.lerp(1.2, 0.05, Math.min(1, speed / 9)) + Math.sin(time * 3.1) * 0.04;
      }
      const colorAttr = papiPoints.geometry.getAttribute('color');
      let k = 0;
      for (const papi of papis) {
        for (let i = 0; i < 4; i += 1) {
          const l = papi.lights[i];
          const dist = Math.hypot(aircraftPosition.x - l.x, aircraftPosition.z - l.z);
          const angle = THREE.MathUtils.radToDeg(Math.atan2(aircraftPosition.y - l.y, dist));
          colorScratch.copy(angle > PAPI_ANGLES[3 - i] ? WHITE : RED);
          colorAttr.setXYZ(k, colorScratch.r, colorScratch.g, colorScratch.b);
          k += 1;
        }
      }
      colorAttr.needsUpdate = true;
      if (flashers) {
        const attr = flashers.geometry.getAttribute('color');
        const phase = (time * 2) % 1;
        for (let i = 0; i < flasherPositions.length; i += 1) {
          const order = 1 - flasherPositions[i].order / 24;
          const on = Math.abs(phase - order) < 0.04 ? 1 : 0.05;
          attr.setXYZ(i, on, on, on * 0.95);
        }
        attr.needsUpdate = true;
      }
      if (beaconPoints) {
        const on = Math.sin(time * 4) > 0.2 ? 1 : 0.15;
        beaconPoints.material.userData.fixed = on * 1.4;
      }
    },
  };
}
