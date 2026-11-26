// The island towns: whitewashed and ochre houses with terracotta roofs packed round a centre, a
// bell tower, harbour boats, warm window lights for dusk, and the roads that join towns and
// airfields. Buildings are instanced and kept in a coarse grid for collision checks.
import * as THREE from 'three';
import { createSeededRandom } from '../core/seededRandom.js';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { ROADS, TOWNS } from './archipelagoMap.js';
import { airfieldAt } from './airfieldDirectory.js';
import { createLightBatch } from './lightPoints.js';

const WALL_COLORS = ['#f4efe4', '#efe2c6', '#e9cf9f', '#f2d7c4', '#e3d9c8', '#f6f1e8', '#dcc39a', '#efc9a8'];
const ROOF_COLORS = ['#b8532f', '#c4643a', '#a84a2c', '#c97b4a', '#9f4128'];
const CELL = 60;

function bellTowerGeometry() {
  const shaft = new THREE.BoxGeometry(6, 26, 6);
  shaft.translate(0, 13, 0);
  const belfry = new THREE.BoxGeometry(7, 5, 7);
  belfry.translate(0, 28.5, 0);
  const cap = new THREE.ConeGeometry(5.2, 7, 4);
  cap.rotateY(Math.PI / 4);
  cap.translate(0, 34.5, 0);
  const nave = new THREE.BoxGeometry(12, 10, 26);
  nave.translate(0, 5, 14);
  const naveRoof = new THREE.CylinderGeometry(0.1, 8.5, 4, 4, 1);
  naveRoof.rotateY(Math.PI / 4);
  naveRoof.scale(1, 1, 2.2);
  naveRoof.translate(0, 12, 14);
  return mergeColoredParts([
    { geometry: shaft, color: '#f3ead8' },
    { geometry: belfry, color: '#e8d6b4' },
    { geometry: cap, color: '#b4502e' },
    { geometry: nave, color: '#f1e6d0' },
    { geometry: naveRoof, color: '#b85a33' },
  ]);
}

function boatGeometry() {
  const hull = new THREE.BoxGeometry(2.6, 1.2, 8);
  hull.translate(0, 0.4, 0);
  const cabin = new THREE.BoxGeometry(1.8, 1.4, 2.6);
  cabin.translate(0, 1.6, -0.6);
  return mergeColoredParts([
    { geometry: hull, color: '#f7f7f2' },
    { geometry: cabin, color: '#2f6f9a' },
  ]);
}

/** Builds towns and roads on the terrain; returns the group, the building grid and a query. */
export function buildTowns(terrain) {
  const group = new THREE.Group();
  group.name = 'towns';
  const random = createSeededRandom(4242);
  const buildings = [];
  const grid = new Map();
  const normal = { x: 0, y: 1, z: 0 };
  const windowLights = createLightBatch();
  const warm = new THREE.Color('#ffc26a');

  for (const town of TOWNS) {
    const gridAngle = random() * Math.PI;
    let placed = 0;
    for (let attempt = 0; attempt < town.buildings * 6 && placed < town.buildings; attempt += 1) {
      const r = town.radius * Math.pow(random(), 1.05);
      const a = random() * Math.PI * 2;
      const x = town.x + Math.cos(a) * r;
      const z = town.z + Math.sin(a) * r;
      const h = terrain.heightAt(x, z);
      if (h < 2.2 || h > 160) continue;
      if (terrain.normalAt(x, z, normal).y < 0.9) continue;
      if (airfieldAt(x, z, 60)) continue;
      const w = 7 + random() * 8;
      const d = 7 + random() * 7;
      const centre = 1 - r / town.radius;
      const floors = 1 + Math.floor(random() * (1.5 + centre * 2.5));
      const height = floors * 3.3 + 0.6;
      const key = `${Math.floor(x / CELL)},${Math.floor(z / CELL)}`;
      let clash = false;
      for (let gx = -1; gx <= 1 && !clash; gx += 1) {
        for (let gz = -1; gz <= 1 && !clash; gz += 1) {
          const list = grid.get(`${Math.floor(x / CELL) + gx},${Math.floor(z / CELL) + gz}`);
          if (list) clash = list.some((b) => Math.hypot(b.x - x, b.z - z) < (b.radius + Math.max(w, d) * 0.5) * 1.05);
        }
      }
      if (clash) continue;
      const building = { x, z, w, d, height, base: h, radius: Math.max(w, d) * 0.55, top: h + height + 2.5, yaw: gridAngle + (random() < 0.7 ? 0 : Math.PI / 2) + (random() - 0.5) * 0.15, town: town.name, wall: WALL_COLORS[Math.floor(random() * WALL_COLORS.length)], roof: ROOF_COLORS[Math.floor(random() * ROOF_COLORS.length)] };
      buildings.push(building);
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(building);
      if (random() < 0.55) windowLights.add(x + (random() - 0.5) * w * 0.6, h + 2 + random() * (height - 2), z + (random() - 0.5) * d * 0.6, warm, 1.4);
      placed += 1;
    }
  }

  const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
  wallGeometry.translate(0, 0.5, 0);
  const roofGeometry = new THREE.ConeGeometry(0.72, 1, 4);
  roofGeometry.rotateY(Math.PI / 4);
  roofGeometry.translate(0, 0.5, 0);
  const walls = new THREE.InstancedMesh(wallGeometry, new THREE.MeshLambertMaterial({ color: '#ffffff' }), buildings.length);
  const roofs = new THREE.InstancedMesh(roofGeometry, new THREE.MeshLambertMaterial({ color: '#ffffff' }), buildings.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  buildings.forEach((b, i) => {
    q.setFromAxisAngle(up, b.yaw);
    m.compose(new THREE.Vector3(b.x, b.base - 1.5, b.z), q, new THREE.Vector3(b.w, b.height + 1.5, b.d));
    walls.setMatrixAt(i, m);
    walls.setColorAt(i, color.set(b.wall));
    m.compose(new THREE.Vector3(b.x, b.base + b.height, b.z), q, new THREE.Vector3(b.w * 1.08, 2.4 + b.w * 0.12, b.d * 1.08));
    roofs.setMatrixAt(i, m);
    roofs.setColorAt(i, color.set(b.roof));
  });
  walls.castShadow = true;
  walls.receiveShadow = true;
  roofs.castShadow = true;
  group.add(walls, roofs);

  const vertexMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const porto = TOWNS[0];
  const tower = new THREE.Mesh(bellTowerGeometry(), vertexMaterial);
  const towerY = terrain.heightAt(porto.x + 40, porto.z - 30);
  tower.position.set(porto.x + 40, towerY - 0.5, porto.z - 30);
  tower.castShadow = true;
  group.add(tower);
  const towerCollider = { x: tower.position.x, z: tower.position.z, w: 14, d: 40, radius: 16, top: towerY + 38, town: 'the Porto Celeste bell tower' };
  buildings.push(towerCollider);
  grid.get(`${Math.floor(towerCollider.x / CELL)},${Math.floor(towerCollider.z / CELL)}`)?.push(towerCollider);

  // Harbour boats moored off each coastal town, on water only.
  const boats = [];
  for (const town of TOWNS) {
    for (let i = 0; i < 14; i += 1) {
      const a = random() * Math.PI * 2;
      const r = town.radius * (0.8 + random() * 0.6);
      const x = town.x + Math.cos(a) * r;
      const z = town.z + Math.sin(a) * r;
      const h = terrain.heightAt(x, z);
      if (h < -1.5 && h > -25) boats.push([x, z, random() * Math.PI]);
    }
  }
  if (boats.length) {
    const boatMesh = new THREE.InstancedMesh(boatGeometry(), vertexMaterial, boats.length);
    boats.forEach(([x, z, yaw], i) => {
      q.setFromAxisAngle(up, yaw);
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1));
      boatMesh.setMatrixAt(i, m);
    });
    group.add(boatMesh);
  }

  // Roads: ribbons laid on the ground, lifted a little to stay above it.
  const roadMaterial = new THREE.MeshLambertMaterial({ color: '#8f8577', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const road of ROADS) {
    const positions = [];
    const samples = [];
    for (let i = 0; i < road.length - 1; i += 1) {
      const [ax, az] = road[i];
      const [bx, bz] = road[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const steps = Math.max(1, Math.ceil(len / 14));
      for (let s = 0; s < steps; s += 1) samples.push([ax + ((bx - ax) * s) / steps, az + ((bz - az) * s) / steps]);
    }
    samples.push(road[road.length - 1]);
    const halfWidth = 3;
    for (let i = 0; i < samples.length - 1; i += 1) {
      const [ax, az] = samples[i];
      const [bx, bz] = samples[i + 1];
      const len = Math.hypot(bx - ax, bz - az) || 1;
      const nx = (-(bz - az) / len) * halfWidth;
      const nz = ((bx - ax) / len) * halfWidth;
      const ha = Math.max(1, terrain.heightAt(ax, az)) + 0.35;
      const hb = Math.max(1, terrain.heightAt(bx, bz)) + 0.35;
      positions.push(ax - nx, ha, az - nz, ax + nx, ha, az + nz, bx + nx, hb, bz + nz);
      positions.push(ax - nx, ha, az - nz, bx + nx, hb, bz + nz, bx - nx, hb, bz - nz);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, roadMaterial);
    mesh.receiveShadow = true;
    group.add(mesh);
  }

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
