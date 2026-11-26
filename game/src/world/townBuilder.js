// The island towns, laid out on a street grid round a paved square: plaster and stone houses of
// one to three floors with hipped, pyramid or flat roofs in terracotta, slate and white, taller
// blocks in the city centre, a bell tower on every square, a harbour mole with moored boats and a
// harbour light, warm window lights for dusk, and the roads that join towns and airfields.
// Buildings are instanced by shape and wall kind and kept in a coarse grid for collision checks.
import * as THREE from 'three';
import { createSeededRandom } from '../core/seededRandom.js';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { ROADS, TOWNS } from './archipelagoMap.js';
import { AIRFIELDS, airfieldAt, toRunwayFrame } from './airfieldDirectory.js';
import { createLightBatch } from './lightPoints.js';
import { createBuildingMaterials } from './buildingTextures.js';

const PLASTER_COLORS = ['#f6f1e6', '#f3e4c8', '#efd3a4', '#f4d9c6', '#e9dccb', '#fbf8f1', '#e6c99e', '#f1cbb0', '#dde6e8', '#f2e5b5', '#f7efe2', '#e8bfa6'];
const STONE_COLORS = ['#efe4cf', '#e2d6c0', '#eadbb9', '#d9d3c8'];
const ROOF_COLORS = {
  terracotta: ['#c0582f', '#cc6a3c', '#ad4b2b', '#c9794a', '#a3432a', '#b9623a'],
  slate: ['#5d6670', '#6b7079', '#535b66'],
  white: ['#f4f2ec', '#ebe8e0', '#e2ded5'],
};
const CELL = 60;
const FLOOR = 3.2;
const FOUNDATION = 1.5;

/** Building shapes: floors, window bays along the length and the depth, size range and roofs. */
const SHAPES = [
  { id: 'cottage', floors: 1, baysX: 2, baysZ: 2, size: [7, 9, 6, 7.5], roofs: ['pyramid', 'hip', 'hip'] },
  { id: 'house', floors: 2, baysX: 3, baysZ: 2, size: [9, 12, 7, 9], roofs: ['hip', 'hip', 'flat'] },
  { id: 'townhouse', floors: 3, baysX: 3, baysZ: 3, size: [9, 12, 8, 11], roofs: ['hip', 'flat'] },
  { id: 'block', floors: 4, baysX: 5, baysZ: 3, size: [15, 22, 10, 13], roofs: ['flat', 'hip'] },
  { id: 'tower', floors: 7, baysX: 4, baysZ: 4, size: [13, 16, 12, 15], roofs: ['flat'] },
];
const SHAPE = Object.fromEntries(SHAPES.map((s) => [s.id, s]));

/** Walls on a unit footprint, one quad per floor per side so each floor maps its own texture row. */
function wallGeometry({ floors, baysX, baysZ }) {
  const total = FOUNDATION + floors * FLOOR;
  const levels = [[0, FOUNDATION / total, 0, 0.034]];
  for (let f = 0; f < floors; f += 1) {
    const y0 = (FOUNDATION + f * FLOOR) / total;
    const y1 = (FOUNDATION + (f + 1) * FLOOR) / total;
    levels.push(f === 0 ? [y0, y1, 0, 0.5] : [y0, y1, 0.5, 1]);
  }
  const sides = [
    { o: [-0.5, 0.5], a: [1, 0], n: [0, 0, 1], bays: baysX },
    { o: [0.5, -0.5], a: [-1, 0], n: [0, 0, -1], bays: baysX },
    { o: [0.5, 0.5], a: [0, -1], n: [1, 0, 0], bays: baysZ },
    { o: [-0.5, -0.5], a: [0, 1], n: [-1, 0, 0], bays: baysZ },
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  const index = [];
  const quad = (corners, normal, uv) => {
    const base = positions.length / 3;
    for (const c of corners) positions.push(...c);
    for (let i = 0; i < 4; i += 1) normals.push(...normal);
    uvs.push(...uv);
    index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (const s of sides) {
    const [x0, z0] = s.o;
    const x1 = x0 + s.a[0];
    const z1 = z0 + s.a[1];
    const u1 = s.bays / 2;
    for (const [y0, y1, v0, v1] of levels) {
      quad([[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]], s.n, [0, v0, u1, v0, u1, v1, 0, v1]);
    }
  }
  quad([[-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5]], [0, 1, 0], [0.01, 0.99, 0.02, 0.99, 0.02, 0.98, 0.01, 0.98]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  return geometry;
}

/** A hipped roof on a unit footprint, eaves at y 0, ridge at y 1 along x; inset 0.5 makes a pyramid. */
function hipRoofGeometry(inset) {
  const r = 0.5 - inset;
  const A = [-0.5, 0, 0.5];
  const B = [0.5, 0, 0.5];
  const C = [0.5, 0, -0.5];
  const D = [-0.5, 0, -0.5];
  const R1 = [-r, 1, 0];
  const R2 = [r, 1, 0];
  const positions = [];
  const uvs = [];
  const slopeUv = (p) => [(p[0] + 0.5) * 3, p[1] * 2.6];
  const endUv = (p) => [(p[2] + 0.5) * 2.4, p[1] * 2.6];
  const tri = (a, b, c, uv) => {
    for (const p of [a, b, c]) {
      positions.push(...p);
      uvs.push(...uv(p));
    }
  };
  tri(A, B, R2, slopeUv);
  if (r > 0) tri(A, R2, R1, slopeUv);
  tri(C, D, R1, slopeUv);
  if (r > 0) tri(C, R1, R2, slopeUv);
  tri(B, C, R2, endUv);
  tri(D, A, R1, endUv);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function bellTowerGeometry(withNave) {
  const parts = [];
  const shaft = new THREE.BoxGeometry(5.5, 24, 5.5);
  shaft.translate(0, 12, 0);
  parts.push({ geometry: shaft, color: '#f3ead8' });
  const belfry = new THREE.BoxGeometry(6.5, 5, 6.5);
  belfry.translate(0, 26.5, 0);
  parts.push({ geometry: belfry, color: '#e8d6b4' });
  for (const [x, z] of [[0, 3.3], [0, -3.3], [3.3, 0], [-3.3, 0]]) {
    const arch = new THREE.BoxGeometry(x ? 0.2 : 2.4, 3, x ? 2.4 : 0.2);
    arch.translate(x, 26.3, z);
    parts.push({ geometry: arch, color: '#3b3128' });
  }
  const cap = new THREE.ConeGeometry(4.9, 7, 4);
  cap.rotateY(Math.PI / 4);
  cap.translate(0, 32.5, 0);
  parts.push({ geometry: cap, color: '#b4502e' });
  const clock = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16);
  clock.rotateX(Math.PI / 2);
  clock.translate(0, 19, 2.85);
  parts.push({ geometry: clock, color: '#f7f3e6' });
  if (withNave) {
    const nave = new THREE.BoxGeometry(12, 10, 26);
    nave.translate(0, 5, 14);
    parts.push({ geometry: nave, color: '#f1e6d0' });
    const naveRoof = new THREE.CylinderGeometry(0.1, 8.5, 4, 4, 1);
    naveRoof.rotateY(Math.PI / 4);
    naveRoof.scale(1, 1, 2.2);
    naveRoof.translate(0, 12, 14);
    parts.push({ geometry: naveRoof, color: '#b85a33' });
  }
  return mergeColoredParts(parts);
}

function fountainGeometry() {
  const basin = new THREE.CylinderGeometry(3.2, 3.4, 0.9, 16);
  basin.translate(0, 0.45, 0);
  const water = new THREE.CylinderGeometry(2.8, 2.8, 0.1, 16);
  water.translate(0, 0.85, 0);
  const column = new THREE.CylinderGeometry(0.35, 0.5, 2.2, 8);
  column.translate(0, 1.6, 0);
  return mergeColoredParts([
    { geometry: basin, color: '#e9e2d2' },
    { geometry: water, color: '#5fa8c8' },
    { geometry: column, color: '#e3dccb' },
  ]);
}

function boatGeometry() {
  const hull = new THREE.BoxGeometry(2.6, 1.2, 8);
  hull.translate(0, 0.4, 0);
  const bow = new THREE.CylinderGeometry(0.01, 1.3, 2.4, 3, 1);
  bow.rotateX(-Math.PI / 2);
  bow.scale(1, 0.46, 1);
  bow.translate(0, 0.4, -5.2);
  const cabin = new THREE.BoxGeometry(1.8, 1.4, 2.6);
  cabin.translate(0, 1.6, -0.6);
  const stripe = new THREE.BoxGeometry(2.66, 0.25, 8.05);
  stripe.translate(0, 0.75, 0);
  return mergeColoredParts([
    { geometry: hull, color: '#f7f7f2' },
    { geometry: bow, color: '#f7f7f2' },
    { geometry: stripe, color: '#2f6f9a' },
    { geometry: cabin, color: '#e8e4da' },
  ]);
}

function sailboatGeometry() {
  const hull = new THREE.BoxGeometry(2.2, 1, 9);
  hull.translate(0, 0.35, 0);
  const bow = new THREE.CylinderGeometry(0.01, 1.1, 2.6, 3, 1);
  bow.rotateX(-Math.PI / 2);
  bow.scale(1, 0.45, 1);
  bow.translate(0, 0.35, -5.8);
  const mast = new THREE.BoxGeometry(0.18, 11, 0.18);
  mast.translate(0, 6.3, -0.8);
  const boom = new THREE.BoxGeometry(0.4, 0.4, 3.6);
  boom.translate(0, 1.6, 0.9);
  return mergeColoredParts([
    { geometry: hull, color: '#fbfbf6' },
    { geometry: bow, color: '#fbfbf6' },
    { geometry: mast, color: '#d8d8d4' },
    { geometry: boom, color: '#c44a32' },
  ]);
}

function harbourLightGeometry() {
  const base = new THREE.CylinderGeometry(2.4, 2.8, 2, 12);
  base.translate(0, 1, 0);
  const tower = new THREE.CylinderGeometry(1.3, 1.7, 9, 12);
  tower.translate(0, 6.5, 0);
  const band = new THREE.CylinderGeometry(1.36, 1.5, 2, 12);
  band.translate(0, 7.5, 0);
  const lantern = new THREE.CylinderGeometry(1.1, 1.1, 1.6, 8);
  lantern.translate(0, 11.8, 0);
  const cap = new THREE.ConeGeometry(1.4, 1.4, 8);
  cap.translate(0, 13.3, 0);
  return mergeColoredParts([
    { geometry: base, color: '#cfc8b8' },
    { geometry: tower, color: '#f7f5ef' },
    { geometry: band, color: '#c93b2b' },
    { geometry: lantern, color: '#ffe6a0' },
    { geometry: cap, color: '#c93b2b' },
  ]);
}

/** A flat ribbon on the ground from (ax, az) to (bx, bz), sampled every `step` metres. */
function addGroundRibbon(positions, terrain, ax, az, bx, bz, halfWidth, lift, keep) {
  const len = Math.hypot(bx - ax, bz - az);
  if (len < 1) return;
  const steps = Math.max(1, Math.ceil(len / 10));
  const nx = (-(bz - az) / len) * halfWidth;
  const nz = ((bx - ax) / len) * halfWidth;
  for (let s = 0; s < steps; s += 1) {
    const x0 = ax + ((bx - ax) * s) / steps;
    const z0 = az + ((bz - az) * s) / steps;
    const x1 = ax + ((bx - ax) * (s + 1)) / steps;
    const z1 = az + ((bz - az) * (s + 1)) / steps;
    if (keep && (!keep(x0, z0) || !keep(x1, z1))) continue;
    const h0 = Math.max(1, terrain.heightAt(x0, z0)) + lift;
    const h1 = Math.max(1, terrain.heightAt(x1, z1)) + lift;
    positions.push(x0 - nx, h0, z0 - nz, x0 + nx, h0, z0 + nz, x1 + nx, h1, z1 + nz);
    positions.push(x0 - nx, h0, z0 - nz, x1 + nx, h1, z1 + nz, x1 - nx, h1, z1 - nz);
  }
}

function ribbonMesh(positions, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** The nearest open water from a town centre: { angle, distance } or null. */
function seaDirection(terrain, town) {
  let best = null;
  for (let k = 0; k < 48; k += 1) {
    const angle = (k / 48) * Math.PI * 2;
    for (let d = 40; d < town.radius * 1.7; d += 12) {
      const h = terrain.heightAt(town.x + Math.cos(angle) * d, town.z + Math.sin(angle) * d);
      if (h < -2) {
        if (!best || d < best.distance) best = { angle, distance: d };
        break;
      }
    }
  }
  return best;
}

/** True inside the cleared strip under a runway's approach lights, where nothing is built. */
function underApproachLights(x, z) {
  for (const field of AIRFIELDS) {
    if (!field.approachLights) continue;
    const p = toRunwayFrame(field, x, z);
    const beyond = Math.abs(p.along) - field.length / 2;
    if (beyond > 0 && beyond < 1000 && Math.abs(p.across) < 55) return true;
  }
  return false;
}

/** Builds towns and roads on the terrain; returns the group, the building grid and a query. */
export function buildTowns(terrain) {
  const group = new THREE.Group();
  group.name = 'towns';
  const random = createSeededRandom(4242);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const buildings = [];
  const grid = new Map();
  const normal = { x: 0, y: 1, z: 0 };
  const windowLights = createLightBatch();
  const warm = new THREE.Color('#ffc26a');
  const streetPositions = [];
  const squarePositions = [];
  const towers = [];
  const fountains = [];
  const boats = [];
  const sailboats = [];
  const moles = [];
  const harbourLights = [];

  const gridKey = (x, z) => `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
  const addCollider = (b) => {
    buildings.push(b);
    const key = gridKey(b.x, b.z);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(b);
  };
  const clashes = (x, z, radius) => {
    for (let gx = -1; gx <= 1; gx += 1) {
      for (let gz = -1; gz <= 1; gz += 1) {
        const list = grid.get(`${Math.floor(x / CELL) + gx},${Math.floor(z / CELL) + gz}`);
        if (list && list.some((b) => Math.hypot(b.x - x, b.z - z) < (b.radius + radius) * 0.92)) return true;
      }
    }
    return false;
  };
  const buildable = (x, z) => {
    const h = terrain.heightAt(x, z);
    if (h < 2.2 || h > 220) return null;
    if (terrain.normalAt(x, z, normal).y < 0.9) return null;
    if (airfieldAt(x, z, 60)) return null;
    if (underApproachLights(x, z)) return null;
    return h;
  };

  // Porto Celeste's church stands where it always has, east of the square.
  const porto = TOWNS[0];
  const churchAt = { x: porto.x + 40, z: porto.z - 30 };
  const churchY = terrain.heightAt(churchAt.x, churchAt.z);
  const church = new THREE.Mesh(bellTowerGeometry(true), new THREE.MeshLambertMaterial({ vertexColors: true }));
  church.position.set(churchAt.x, churchY - 0.5, churchAt.z);
  church.castShadow = true;
  group.add(church);
  addCollider({ x: churchAt.x, z: churchAt.z + 12, w: 14, d: 40, radius: 18, top: churchY + 37, town: 'the Porto Celeste bell tower' });

  for (const town of TOWNS) {
    const angle = random() * Math.PI;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const toWorld = (u, v) => [town.x + u * ca - v * sa, town.z + u * sa + v * ca];
    const pitch = town.city ? 36 : 30;
    const street = 6;
    const inner = pitch - street;
    const n = Math.ceil(town.radius / pitch);
    let placed = 0;

    // The square at the centre, with a fountain and a bell tower on its corner.
    {
      const [x, z] = toWorld(0, 0);
      const h = terrain.heightAt(x, z);
      if (h > 1.5) {
        const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => toWorld((a * inner) / 2, (b * inner) / 2));
        const y = (cx, cz) => Math.max(1, terrain.heightAt(cx, cz)) + 0.32;
        const [p0, p1, p2, p3] = corners;
        squarePositions.push(p0[0], y(...p0), p0[1], p2[0], y(...p2), p2[1], p1[0], y(...p1), p1[1]);
        squarePositions.push(p0[0], y(...p0), p0[1], p3[0], y(...p3), p3[1], p2[0], y(...p2), p2[1]);
        fountains.push([x, h, z]);
        if (town !== porto) {
          const [tx, tz] = toWorld(inner / 2 - 4, -inner / 2 + 4);
          const ty = terrain.heightAt(tx, tz);
          towers.push([tx, ty, tz, angle]);
          addCollider({ x: tx, z: tz, w: 7, d: 7, radius: 5, top: ty + 36, town: `the ${town.name} bell tower` });
        }
      }
    }

    for (let i = -n; i <= n; i += 1) {
      for (let j = -n; j <= n; j += 1) {
        if (i === 0 && j === 0) continue;
        const cu = i * pitch;
        const cv = j * pitch;
        const r = Math.hypot(cu, cv);
        if (r > town.radius) continue;
        const t = r / town.radius;
        if (random() > 1.02 - t * t * 0.75) continue;
        const core = town.city && t < 0.42;
        const lots = [];
        const half = inner / 2;
        const split = core ? (random() < 0.45 ? 1 : 2) : random() < 0.3 ? 2 : 4;
        if (split === 1) lots.push([0, 0, inner, inner]);
        else if (split === 2) lots.push([-half / 2, 0, half, inner], [half / 2, 0, half, inner]);
        else for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) lots.push([(a * half) / 2, (b * half) / 2, half, half]);
        for (const [lu, lv, lw, ld] of lots) {
          if (placed >= town.buildings) break;
          if (random() < 0.04 + t * 0.1) continue;
          let shape;
          if (core) shape = split === 1 ? (random() < 0.45 ? SHAPE.tower : SHAPE.block) : random() < 0.6 ? SHAPE.townhouse : SHAPE.house;
          else if (t < 0.45) shape = random() < 0.45 ? SHAPE.townhouse : SHAPE.house;
          else shape = random() < 0.55 ? SHAPE.house : SHAPE.cottage;
          const [wMin, wMax, dMin, dMax] = shape.size;
          let w = Math.min(lw - 1.2, wMin + random() * (wMax - wMin));
          let d = Math.min(ld - 1.2, dMin + random() * (dMax - dMin));
          if (w < 5 || d < 5) continue;
          // Push the house toward the street on its lot so fronts line up.
          const pu = cu + lu + Math.sign(lu || 1) * (lw - w) * 0.45 * random();
          const pv = cv + lv + Math.sign(lv || 1) * (ld - d) * 0.45;
          const [x, z] = toWorld(pu, pv);
          const h = buildable(x, z);
          if (h === null) continue;
          // Front (+z of the house) faces the nearer street; the long side runs along the street.
          const swapped = d > w;
          if (swapped) [w, d] = [d, w];
          let yaw = -angle + (swapped ? Math.PI / 2 : 0);
          const facing = swapped ? lu : lv;
          if (facing < 0 || (facing === 0 && random() < 0.5)) yaw += Math.PI;
          const radius = Math.hypot(w, d) * 0.5;
          if (clashes(x, z, radius * 0.8)) continue;
          const roof = pick(shape.roofs);
          const stone = random() < (town.stone ?? 0.22);
          const height = shape.floors * FLOOR;
          const roofHeight = roof === 'flat' ? 0.7 : 1.6 + d * 0.32;
          const building = {
            shape: shape.id, x, z, w, d, base: h, height, yaw, roof, roofHeight, stone,
            wall: pick(stone ? STONE_COLORS : PLASTER_COLORS),
            roofColor: roof === 'flat' ? pick(ROOF_COLORS.white) : pick(random() < (town.slate ?? 0.15) ? ROOF_COLORS.slate : ROOF_COLORS.terracotta),
            radius: radius * 0.85, top: h + height + roofHeight + 1, town: town.name,
          };
          addCollider(building);
          placed += 1;
          const lights = 1 + Math.floor(random() * shape.floors);
          for (let k = 0; k < lights; k += 1) {
            if (random() > 0.6) continue;
            const along = (random() - 0.5) * w * 0.7;
            const lift = h + (Math.floor(random() * shape.floors) + 0.55) * FLOOR;
            const cy = Math.cos(yaw);
            const sy = Math.sin(yaw);
            const lx = along;
            const lz = d / 2 + 0.3;
            windowLights.add(x + lx * cy + lz * sy, lift, z - lx * sy + lz * cy, warm, 1.3);
          }
        }
      }
    }

    // Streets between the blocks, only where houses line them, kept off water and runways.
    const keep = (x, z) => terrain.heightAt(x, z) > 1.2 && !airfieldAt(x, z, 20) && !underApproachLights(x, z) && clashes(x, z, 14);
    for (let k = -n - 1; k <= n; k += 1) {
      const c = (k + 0.5) * pitch;
      if (Math.abs(c) >= town.radius) continue;
      const span = Math.sqrt(town.radius * town.radius - c * c);
      const [ax, az] = toWorld(c, -span);
      const [bx, bz] = toWorld(c, span);
      addGroundRibbon(streetPositions, terrain, ax, az, bx, bz, street / 2, 0.3, keep);
      const [ex, ez] = toWorld(-span, c);
      const [fx, fz] = toWorld(span, c);
      addGroundRibbon(streetPositions, terrain, ex, ez, fx, fz, street / 2, 0.31, keep);
    }

    // A harbour mole running out from the shore, boats along it and a light at its end.
    if (town.harbour) {
      const sea = seaDirection(terrain, town);
      if (sea) {
        const dx = Math.cos(sea.angle);
        const dz = Math.sin(sea.angle);
        const start = sea.distance - 30;
        const length = 190;
        const sx = town.x + dx * start;
        const sz = town.z + dz * start;
        const yaw = Math.atan2(dx, dz);
        moles.push({ x: sx + dx * length * 0.5, z: sz + dz * length * 0.5, length, yaw });
        harbourLights.push([sx + dx * (length - 4), sz + dz * (length - 4)]);
        for (let s = 40; s < length - 12; s += 13) {
          for (const side of [-1, 1]) {
            const bx = sx + dx * s - dz * side * 8.5;
            const bz = sz + dz * s + dx * side * 8.5;
            if (terrain.heightAt(bx, bz) > -1.2 || random() < 0.2) continue;
            (random() < 0.4 ? sailboats : boats).push([bx, bz, yaw + (random() - 0.5) * 0.2 + (random() < 0.5 ? Math.PI : 0)]);
          }
        }
      }
    }
    // Boats at anchor off the town.
    for (let i = 0; i < 16; i += 1) {
      const a = random() * Math.PI * 2;
      const r = town.radius * (0.8 + random() * 0.7);
      const x = town.x + Math.cos(a) * r;
      const z = town.z + Math.sin(a) * r;
      const h = terrain.heightAt(x, z);
      if (h < -1.5 && h > -25) (random() < 0.45 ? sailboats : boats).push([x, z, random() * Math.PI * 2]);
    }
  }

  // Instanced walls by shape and wall kind, roofs by roof kind.
  const materials = createBuildingMaterials();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const houses = buildings.filter((b) => b.shape);
  for (const shape of SHAPES) {
    const geometry = wallGeometry(shape);
    for (const stone of [false, true]) {
      const list = houses.filter((b) => b.shape === shape.id && b.stone === stone);
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(geometry, stone ? materials.stone : materials.plaster, list.length);
      list.forEach((b, i) => {
        q.setFromAxisAngle(up, b.yaw);
        m.compose(pos.set(b.x, b.base - FOUNDATION, b.z), q, scale.set(b.w, b.height + FOUNDATION, b.d));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, color.set(b.wall));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `town-walls-${shape.id}${stone ? '-stone' : ''}`;
      group.add(mesh);
    }
  }
  const roofGeometries = { hip: hipRoofGeometry(0.3), pyramid: hipRoofGeometry(0.5), flat: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0) };
  for (const kind of Object.keys(roofGeometries)) {
    const list = houses.filter((b) => b.roof === kind);
    if (!list.length) continue;
    const mesh = new THREE.InstancedMesh(roofGeometries[kind], kind === 'flat' ? materials.flat : materials.tiles, list.length);
    list.forEach((b, i) => {
      q.setFromAxisAngle(up, b.yaw);
      const over = kind === 'flat' ? 1.03 : 1.1;
      m.compose(pos.set(b.x, b.base + b.height, b.z), q, scale.set(b.w * over, b.roofHeight, b.d * over));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, color.set(b.roofColor));
    });
    mesh.castShadow = true;
    mesh.name = `town-roofs-${kind}`;
    group.add(mesh);
  }

  const vertexMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const instanced = (geometry, list, place) => {
    if (!list.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, vertexMaterial, list.length);
    list.forEach((item, i) => {
      place(item);
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  instanced(bellTowerGeometry(false), towers, ([x, y, z, a]) => m.compose(pos.set(x, y - 0.5, z), q.setFromAxisAngle(up, -a), scale.set(1, 1, 1)));
  instanced(fountainGeometry(), fountains, ([x, y, z]) => m.compose(pos.set(x, y + 0.2, z), q.identity(), scale.set(1, 1, 1)));
  instanced(boatGeometry(), boats, ([x, z, yaw]) => m.compose(pos.set(x, 0, z), q.setFromAxisAngle(up, yaw), scale.set(1, 1, 1)));
  instanced(sailboatGeometry(), sailboats, ([x, z, yaw]) => m.compose(pos.set(x, 0, z), q.setFromAxisAngle(up, yaw), scale.set(1, 1, 1)));
  instanced(harbourLightGeometry(), harbourLights, ([x, z]) => m.compose(pos.set(x, 1.5, z), q.identity(), scale.set(1, 1, 1)));
  const moleMaterial = new THREE.MeshLambertMaterial({ color: '#b9b1a2' });
  for (const mole of moles) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(7, 4.5, mole.length), moleMaterial);
    mesh.position.set(mole.x, -1.2, mole.z);
    mesh.rotation.y = mole.yaw;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  const harbourBeacons = createLightBatch();
  for (const [x, z] of harbourLights) harbourBeacons.add(x, 13.6, z, new THREE.Color('#ff5a3a'), 3.2);
  if (harbourLights.length) {
    const beacons = harbourBeacons.build();
    beacons.material.userData.fixed = 1.2;
    group.add(beacons);
  }

  // Streets, squares and the roads between towns: ribbons laid on the ground, lifted to stay above it.
  const streetMaterial = new THREE.MeshLambertMaterial({ color: '#a59c8d', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  if (streetPositions.length) group.add(ribbonMesh(streetPositions, streetMaterial));
  const squareMaterial = new THREE.MeshLambertMaterial({ color: '#d8ccb4', polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  if (squarePositions.length) group.add(ribbonMesh(squarePositions, squareMaterial));
  const roadMaterial = new THREE.MeshLambertMaterial({ color: '#8f8577', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const roadPositions = [];
  for (const road of ROADS) {
    for (let i = 0; i < road.length - 1; i += 1) addGroundRibbon(roadPositions, terrain, road[i][0], road[i][1], road[i + 1][0], road[i + 1][1], 3, 0.35, null);
  }
  group.add(ribbonMesh(roadPositions, roadMaterial));

  const windows = windowLights.build();
  windows.name = 'town-window-lights';
  group.add(windows);

  return {
    group,
    buildings,
    windows,
    /** The building whose box the point is inside (or null): used by the crash detector. */
    buildingAt(x, y, z) {
      const cx = Math.floor(x / CELL);
      const cz = Math.floor(z / CELL);
      for (let gx = -1; gx <= 1; gx += 1) {
        for (let gz = -1; gz <= 1; gz += 1) {
          const list = grid.get(`${cx + gx},${cz + gz}`);
          if (!list) continue;
          for (const b of list) {
            if (y < b.top && Math.hypot(b.x - x, b.z - z) < b.radius) return b;
          }
        }
      }
      return null;
    },
  };
}
