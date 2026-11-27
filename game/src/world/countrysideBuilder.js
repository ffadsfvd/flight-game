// The countryside between the towns: farm plots laid on the ground with crop rows painted in code
// (wheat, young maize, ploughed soil, lavender, sunflowers, vines), hedgerows with trees along
// their edges, a dirt lane through each farm with a car or a tractor on it, and a farmstead of
// house, barn and silo at its end. Everything is instanced or merged so the whole lot is a few draws.
import * as THREE from 'three';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { createSeededRandom, hash2 } from '../core/seededRandom.js';
import { FARMLANDS, TOWNS } from './archipelagoMap.js';
import { AIRFIELDS, airfieldAt, toRunwayFrame } from './airfieldDirectory.js';

/** Crops: soil colour, row colour, row count per texture and how the rows are drawn. */
const CROPS = [
  { id: 'wheat', soil: '#c99d4c', row: '#ecc96a', rows: 22, kind: 'fine' },
  { id: 'maize', soil: '#8d6a44', row: '#6f9c3a', rows: 12, kind: 'rows' },
  { id: 'ploughed', soil: '#8a6141', row: '#a8785a', rows: 18, kind: 'furrows' },
  { id: 'lavender', soil: '#7d8a52', row: '#8a6fb8', rows: 12, kind: 'rows' },
  { id: 'sunflower', soil: '#7c7a3a', row: '#f0c22e', rows: 12, kind: 'dots' },
  { id: 'vines', soil: '#b39066', row: '#4f7b34', rows: 10, kind: 'rows' },
  { id: 'hay', soil: '#b9b465', row: '#d7c46f', rows: 8, kind: 'bales' },
];

/** A canvas texture of one crop: rows running along the texture's v axis. */
function cropTexture(crop, seed) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const random = createSeededRandom(seed);
  ctx.fillStyle = crop.soil;
  ctx.fillRect(0, 0, size, size);
  // Soil grain.
  for (let i = 0; i < 1400; i += 1) {
    ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(random() * size, random() * size, 2 + random() * 3, 2 + random() * 3);
  }
  const pitch = size / crop.rows;
  for (let r = 0; r < crop.rows; r += 1) {
    const x = r * pitch + pitch / 2;
    if (crop.kind === 'fine') {
      ctx.fillStyle = crop.row;
      ctx.fillRect(x - pitch * 0.42, 0, pitch * 0.84, size);
      ctx.fillStyle = 'rgba(120,80,20,0.25)';
      ctx.fillRect(x + pitch * 0.38, 0, pitch * 0.16, size);
    } else if (crop.kind === 'furrows') {
      ctx.fillStyle = crop.row;
      ctx.fillRect(x - pitch * 0.25, 0, pitch * 0.5, size);
      ctx.fillStyle = 'rgba(40,25,10,0.35)';
      ctx.fillRect(x + pitch * 0.25, 0, pitch * 0.2, size);
    } else if (crop.kind === 'dots') {
      ctx.fillStyle = '#5b7a2c';
      ctx.fillRect(x - pitch * 0.3, 0, pitch * 0.6, size);
      ctx.fillStyle = crop.row;
      for (let y = 4; y < size; y += 9) {
        ctx.beginPath();
        ctx.arc(x + (random() - 0.5) * 2, y + random() * 3, pitch * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (crop.kind === 'bales') {
      ctx.fillStyle = crop.row;
      ctx.fillRect(x - pitch * 0.12, 0, pitch * 0.24, size);
    } else {
      ctx.fillStyle = crop.row;
      ctx.fillRect(x - pitch * 0.3, 0, pitch * 0.6, size);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x - pitch * 0.3, 0, pitch * 0.12, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function treeGeometry() {
  const trunk = new THREE.CylinderGeometry(0.3, 0.45, 3.2, 5);
  trunk.translate(0, 1.6, 0);
  const crown = new THREE.IcosahedronGeometry(3.4, 1);
  crown.scale(1, 0.85, 1);
  crown.translate(0, 5.6, 0);
  return mergeColoredParts([
    { geometry: trunk, color: '#5e4632' },
    { geometry: crown, color: '#4f7f33' },
  ]);
}

function cypressGeometry() {
  const trunk = new THREE.CylinderGeometry(0.25, 0.35, 1.6, 5);
  trunk.translate(0, 0.8, 0);
  const crown = new THREE.ConeGeometry(1.5, 11, 7);
  crown.translate(0, 6.4, 0);
  return mergeColoredParts([
    { geometry: trunk, color: '#5e4632' },
    { geometry: crown, color: '#365f2a' },
  ]);
}

function farmhouseGeometry() {
  const walls = new THREE.BoxGeometry(12, 6.4, 8);
  walls.translate(0, 3.2, 0);
  const roof = new THREE.ConeGeometry(8.4, 3.4, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.scale(1.08, 1, 0.72);
  roof.translate(0, 8.1, 0);
  const door = new THREE.BoxGeometry(1.4, 2.4, 0.2);
  door.translate(-2, 1.2, 4.05);
  const parts = [
    { geometry: walls, color: '#f1dfbf' },
    { geometry: roof, color: '#b9583a' },
    { geometry: door, color: '#6b4a32' },
  ];
  for (const [x, y] of [[2, 1.6], [4.5, 1.6], [-4.5, 4.6], [-2, 4.6], [2, 4.6], [4.5, 4.6]]) {
    const w = new THREE.BoxGeometry(1.1, 1.3, 0.2);
    w.translate(x, y + 0.2, 4.05);
    parts.push({ geometry: w, color: '#5f8c83' });
  }
  return mergeColoredParts(parts);
}

function barnGeometry() {
  const walls = new THREE.BoxGeometry(16, 6, 10);
  walls.translate(0, 3, 0);
  const roof = new THREE.CylinderGeometry(6.4, 6.4, 16.6, 3, 1);
  roof.rotateZ(Math.PI / 2);
  roof.rotateX(Math.PI / 6);
  roof.scale(1, 0.55, 0.92);
  roof.translate(0, 7.6, 0);
  const doors = new THREE.BoxGeometry(5, 4.6, 0.2);
  doors.translate(0, 2.3, 5.05);
  return mergeColoredParts([
    { geometry: walls, color: '#a8452f' },
    { geometry: roof, color: '#6f6a64' },
    { geometry: doors, color: '#e9dcc4' },
  ]);
}

function siloGeometry() {
  const body = new THREE.CylinderGeometry(2.4, 2.4, 13, 12);
  body.translate(0, 6.5, 0);
  const dome = new THREE.SphereGeometry(2.45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.translate(0, 13, 0);
  return mergeColoredParts([
    { geometry: body, color: '#dcd8cf' },
    { geometry: dome, color: '#9aa3a8' },
  ]);
}

function carGeometry() {
  const body = new THREE.BoxGeometry(1.8, 0.75, 4.2);
  body.translate(0, 0.75, 0);
  const cabin = new THREE.BoxGeometry(1.6, 0.65, 2.1);
  cabin.translate(0, 1.45, -0.2);
  const glass = new THREE.BoxGeometry(1.64, 0.45, 2.0);
  glass.translate(0, 1.45, -0.2);
  const parts = [
    { geometry: body, color: '#ffffff' },
    { geometry: cabin, color: '#f4f4f4' },
    { geometry: glass, color: '#2c3540' },
  ];
  for (const [x, z] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
    const wheel = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 8);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, 0.36, z);
    parts.push({ geometry: wheel, color: '#1d1d1d' });
  }
  return mergeColoredParts(parts);
}

function tractorGeometry() {
  const body = new THREE.BoxGeometry(1.4, 1.0, 2.6);
  body.translate(0, 1.2, 0.5);
  const cab = new THREE.BoxGeometry(1.5, 1.5, 1.4);
  cab.translate(0, 2.2, -0.6);
  const parts = [
    { geometry: body, color: '#ffffff' },
    { geometry: cab, color: '#e8e8e8' },
  ];
  for (const [x, z, r] of [[-0.9, -0.8, 0.85], [0.9, -0.8, 0.85], [-0.8, 1.3, 0.5], [0.8, 1.3, 0.5]]) {
    const wheel = new THREE.CylinderGeometry(r, r, 0.45, 10);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(x, r, z);
    parts.push({ geometry: wheel, color: '#1d1d1d' });
  }
  return mergeColoredParts(parts);
}

function baleGeometry() {
  const bale = new THREE.CylinderGeometry(0.75, 0.75, 1.2, 10);
  bale.rotateZ(Math.PI / 2);
  bale.translate(0, 0.75, 0);
  return mergeColoredParts([{ geometry: bale, color: '#e2c779' }]);
}

/** True inside the cleared strip under a runway's approach lights. */
function underApproach(x, z) {
  for (const field of AIRFIELDS) {
    if (!field.approachLights) continue;
    const p = toRunwayFrame(field, x, z);
    const beyond = Math.abs(p.along) - field.length / 2;
    if (beyond > -40 && beyond < 1000 && Math.abs(p.across) < 60) return true;
  }
  return false;
}

/** Builds every farm in FARMLANDS on the terrain; returns { group, counts }. */
export function buildCountryside(terrain) {
  const group = new THREE.Group();
  group.name = 'countryside';
  const random = createSeededRandom(7171);
  const normal = { x: 0, y: 1, z: 0 };
  const groundOk = (x, z) => {
    const h = terrain.heightAt(x, z);
    if (h < 2.6 || h > 120) return false;
    if (terrain.normalAt(x, z, normal).y < 0.965) return false;
    if (airfieldAt(x, z, 45) || underApproach(x, z)) return false;
    for (const town of TOWNS) if (Math.hypot(x - town.x, z - town.z) < town.radius * 1.02) return false;
    return true;
  };

  const plotsByCrop = CROPS.map(() => []);
  const hedges = [];
  const trees = [];
  const cypresses = [];
  const lanes = [];
  const houses = [];
  const barns = [];
  const silos = [];
  const cars = [];
  const tractors = [];
  const bales = [];

  for (const farm of FARMLANDS) {
    const h = THREE.MathUtils.degToRad(farm.heading);
    const ca = Math.cos(h);
    const sa = Math.sin(h);
    const toWorld = (u, v) => [farm.x + u * ca - v * sa, farm.z + u * sa + v * ca];
    const { cols, rows } = farm;
    const [pw, pd] = farm.plot;
    const laneGap = 8;
    const u0 = (-cols * pw) / 2;
    const v0 = (-rows * pd - laneGap) / 2;
    const laneRow = Math.floor(rows / 2);
    const edgeKeys = new Set();
    let anyPlot = false;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (random() < (farm.gaps ?? 0.08)) continue;
        // Plots vary a little in size so the patchwork never looks stamped out.
        const ua = u0 + c * pw + 2;
        const ub = ua + pw - 4 - random() * pw * 0.12;
        const va = v0 + r * pd + (r >= laneRow ? laneGap : 0) + 2;
        const vb = va + pd - 4 - random() * pd * 0.1;
        const corners = [[ua, va], [ub, va], [ub, vb], [ua, vb], [(ua + ub) / 2, (va + vb) / 2]];
        if (!corners.every(([u, v]) => groundOk(...toWorld(u, v)))) continue;
        anyPlot = true;
        const crop = Math.floor(hash2(c + farm.seed * 7, r, 91) * CROPS.length);
        const along = random() < 0.5;
        plotsByCrop[crop].push({ toWorld, ua, ub, va, vb, along });
        if (CROPS[crop].id === 'hay') {
          for (let k = 0; k < 10; k += 1) {
            const [bx, bz] = toWorld(ua + 6 + random() * (ub - ua - 12), va + 6 + random() * (vb - va - 12));
            bales.push([bx, terrain.heightAt(bx, bz), bz, random() * Math.PI]);
          }
        }
        // Hedges along the plot edges (shared edges once), trees standing in them.
        const edges = [[ua - 2, va - 2, ub + 2, va - 2], [ub + 2, va - 2, ub + 2, vb + 2], [ua - 2, vb + 2, ub + 2, vb + 2], [ua - 2, va - 2, ua - 2, vb + 2]];
        for (const [a, b, cc, d] of edges) {
          const key = [a, b, cc, d].map((n) => Math.round(n / 6)).join(',');
          if (edgeKeys.has(key) || random() < 0.25) continue;
          edgeKeys.add(key);
          const len = Math.hypot(cc - a, d - b);
          const segs = Math.max(1, Math.round(len / 12));
          for (let s = 0; s < segs; s += 1) {
            if (random() < 0.12) continue;
            const t = (s + 0.5) / segs;
            const [x, z] = toWorld(a + (cc - a) * t, b + (d - b) * t);
            const yaw = -h - Math.atan2(d - b, cc - a);
            hedges.push([x, terrain.heightAt(x, z), z, yaw, (len / segs) * 1.05, 1.4 + random() * 0.7]);
            if (random() < 0.32) trees.push([x + (random() - 0.5) * 3, z + (random() - 0.5) * 3, 0.8 + random() * 0.5]);
          }
        }
      }
    }
    if (!anyPlot) continue;
    // The lane through the middle of the farm, then on to the farmstead at its east end.
    const laneV = v0 + laneRow * pd + laneGap / 2;
    const [lax, laz] = toWorld(u0 - 30, laneV);
    const [lbx, lbz] = toWorld(-u0 + 40, laneV);
    lanes.push([lax, laz, lbx, lbz]);
    const yawLane = -h - Math.PI / 2;
    const vehicles = farm.vehicles ?? 2;
    for (let k = 0; k < vehicles; k += 1) {
      const t = 0.2 + ((k + random() * 0.5) / vehicles) * 0.6;
      const x = lax + (lbx - lax) * t;
      const z = laz + (lbz - laz) * t;
      const list = k === 0 ? tractors : cars;
      list.push([x, terrain.heightAt(x, z), z, yawLane + (k % 2 ? Math.PI : 0), k]);
    }
    // Cypresses lining the lane near the farmstead.
    for (let s = 0; s < 8; s += 1) {
      for (const side of [-1, 1]) {
        const [x, z] = toWorld(-u0 - 60 + s * 12, laneV + side * 6.5);
        if (groundOk(x, z)) cypresses.push([x, z, 0.85 + random() * 0.3]);
      }
    }
    const [fx, fz] = toWorld(-u0 + 30, laneV + 28);
    const [bx, bz] = toWorld(-u0 + 52, laneV + 22);
    const [sx, sz] = toWorld(-u0 + 66, laneV + 34);
    if (groundOk(fx, fz)) houses.push([fx, terrain.heightAt(fx, fz), fz, -h + Math.PI]);
    if (groundOk(bx, bz)) barns.push([bx, terrain.heightAt(bx, bz), bz, -h]);
    if (groundOk(sx, sz)) silos.push([sx, terrain.heightAt(sx, sz), sz, 0]);
    for (let k = 0; k < 5; k += 1) {
      const [x, z] = toWorld(-u0 + 20 + random() * 60, laneV + 40 + random() * 25);
      if (groundOk(x, z)) trees.push([x, z, 0.9 + random() * 0.5]);
    }
  }

  // Field surfaces: a grid draped over the ground a little above it, one mesh per crop.
  CROPS.forEach((crop, ci) => {
    const plots = plotsByCrop[ci];
    if (!plots.length) return;
    const positions = [];
    const uvs = [];
    const cell = 12;
    for (const plot of plots) {
      const { toWorld, ua, ub, va, vb, along } = plot;
      const nu = Math.max(1, Math.ceil((ub - ua) / cell));
      const nv = Math.max(1, Math.ceil((vb - va) / cell));
      const vert = (i, j) => {
        const u = ua + ((ub - ua) * i) / nu;
        const v = va + ((vb - va) * j) / nv;
        const [x, z] = toWorld(u, v);
        // One texture repeat spans about 40 m, rows run along or across the plot.
        return [x, terrain.heightAt(x, z) + 0.28, z, along ? u / 40 : v / 40, along ? v / 40 : u / 40];
      };
      for (let i = 0; i < nu; i += 1) {
        for (let j = 0; j < nv; j += 1) {
          const a = vert(i, j);
          const b = vert(i + 1, j);
          const c = vert(i + 1, j + 1);
          const d = vert(i, j + 1);
          for (const p of [a, d, b, b, d, c]) {
            positions.push(p[0], p[1], p[2]);
            uvs.push(p[3], p[4]);
          }
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();
    const material = new THREE.MeshLambertMaterial({ map: cropTexture(crop, 300 + ci), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.name = `farm-${crop.id}`;
    group.add(mesh);
  });

  // Lanes: pale dirt ribbons following the ground.
  {
    const positions = [];
    for (const [ax, az, bx, bz] of lanes) {
      const len = Math.hypot(bx - ax, bz - az);
      const steps = Math.ceil(len / 10);
      const nx = (-(bz - az) / len) * 2.6;
      const nz = ((bx - ax) / len) * 2.6;
      for (let s = 0; s < steps; s += 1) {
        const x0 = ax + ((bx - ax) * s) / steps;
        const z0 = az + ((bz - az) * s) / steps;
        const x1 = ax + ((bx - ax) * (s + 1)) / steps;
        const z1 = az + ((bz - az) * (s + 1)) / steps;
        if (terrain.heightAt(x0, z0) < 1.5 || terrain.heightAt(x1, z1) < 1.5) continue;
        const h0 = terrain.heightAt(x0, z0) + 0.32;
        const h1 = terrain.heightAt(x1, z1) + 0.32;
        positions.push(x0 - nx, h0, z0 - nz, x0 + nx, h0, z0 + nz, x1 + nx, h1, z1 + nz);
        positions.push(x0 - nx, h0, z0 - nz, x1 + nx, h1, z1 + nz, x1 - nx, h1, z1 - nz);
      }
    }
    if (positions.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: '#d9c39a', polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
      mesh.receiveShadow = true;
      mesh.name = 'farm-lanes';
      group.add(mesh);
    }
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  const vertexMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const instanced = (name, geometry, list, place, material = vertexMaterial) => {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((item, i) => {
      place(item, i, mesh);
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    group.add(mesh);
  };
  const hedgeGeometry = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  instanced('farm-hedges', hedgeGeometry, hedges, ([x, y, z, yaw, len, height], i, mesh) => {
    m.compose(pos.set(x, y - 0.2, z), q.setFromAxisAngle(up, yaw), scale.set(len, height, 1.8));
    mesh.setColorAt(i, color.set(i % 3 ? '#4d7432' : '#5a7e36'));
  }, new THREE.MeshLambertMaterial({ color: '#ffffff' }));
  instanced('farm-trees', treeGeometry(), trees, ([x, z, s]) => m.compose(pos.set(x, terrain.heightAt(x, z) - 0.2, z), q.setFromAxisAngle(up, x * 0.37), scale.set(s, s, s)));
  instanced('farm-cypresses', cypressGeometry(), cypresses, ([x, z, s]) => m.compose(pos.set(x, terrain.heightAt(x, z) - 0.2, z), q.identity(), scale.set(s, s, s)));
  instanced('farmhouses', farmhouseGeometry(), houses, ([x, y, z, yaw]) => m.compose(pos.set(x, y - 0.5, z), q.setFromAxisAngle(up, yaw), scale.set(1, 1, 1)));
  instanced('farm-barns', barnGeometry(), barns, ([x, y, z, yaw]) => m.compose(pos.set(x, y - 0.5, z), q.setFromAxisAngle(up, yaw), scale.set(1, 1, 1)));
  instanced('farm-silos', siloGeometry(), silos, ([x, y, z]) => m.compose(pos.set(x, y - 0.5, z), q.identity(), scale.set(1, 1, 1)));
  instanced('farm-bales', baleGeometry(), bales, ([x, y, z, yaw]) => m.compose(pos.set(x, y - 0.1, z), q.setFromAxisAngle(up, yaw), scale.set(1, 1, 1)));
  const carColors = ['#c8352b', '#2f5f9e', '#f2f0ea', '#e2b23a', '#3d7d5a'];
  const paintMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  instanced('farm-cars', carGeometry(), cars, ([x, y, z, yaw, k], i, mesh) => {
    m.compose(pos.set(x, y + 0.2, z), q.setFromAxisAngle(up, yaw), scale.set(1.15, 1.15, 1.15));
    mesh.setColorAt(i, color.set(carColors[(i + k) % carColors.length]));
  }, paintMaterial);
  instanced('farm-tractors', tractorGeometry(), tractors, ([x, y, z, yaw], i, mesh) => {
    m.compose(pos.set(x, y + 0.2, z), q.setFromAxisAngle(up, yaw), scale.set(1.2, 1.2, 1.2));
    mesh.setColorAt(i, color.set(i % 2 ? '#d24a2a' : '#3f8a3a'));
  }, paintMaterial);

  return { group, counts: { plots: plotsByCrop.reduce((s, l) => s + l.length, 0), hedges: hedges.length, trees: trees.length, farmsteads: houses.length, vehicles: cars.length + tractors.length } };
}
