// The ground of a forest fire: a charred burn scar laid on the slope under each hot spot with a
// glowing fire front that dies down as drops knock the fire back, burnt trunks standing in it,
// rocks scattered round it, a fire break cut across the slope below the fire line and a farmhouse
// beyond it. Also paints the flame-tongue sprite the flames are drawn with.
import * as THREE from 'three';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { createSeededRandom } from '../core/seededRandom.js';

/** A flame tongue on a 128 px canvas: white-yellow core, orange body, red fringe, soft edges. */
export function flameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.filter = 'blur(2.5px)';
  ctx.translate(64, 124);
  const g = ctx.createRadialGradient(0, -34, 2, 0, -46, 70);
  g.addColorStop(0, 'rgba(255,250,215,1)');
  g.addColorStop(0.3, 'rgba(255,205,90,0.95)');
  g.addColorStop(0.62, 'rgba(255,110,20,0.75)');
  g.addColorStop(1, 'rgba(190,30,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.bezierCurveTo(-40, -14, -34, -62, -8, -92);
  ctx.bezierCurveTo(-2, -102, 4, -112, 2, -120);
  ctx.bezierCurveTo(18, -96, 40, -64, 34, -30);
  ctx.bezierCurveTo(30, -12, 16, -2, 0, -2);
  ctx.closePath();
  ctx.fill();
  // Point sprites sample with gl_PointCoord (y down), so the canvas is used unflipped.
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  return texture;
}

function scarTexture(seed, glow) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rand = createSeededRandom(seed);
  // A ragged outline round the centre.
  const edge = [];
  for (let i = 0; i < 40; i += 1) edge.push(0.8 + rand() * 0.18);
  const radiusAt = (a) => {
    const t = ((a / (Math.PI * 2)) * 40 + 40) % 40;
    const i = Math.floor(t);
    const f = t - i;
    return edge[i] * (1 - f) + edge[(i + 1) % 40] * f;
  };
  ctx.translate(128, 128);
  if (!glow) {
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const a = (i / 80) * Math.PI * 2;
      const r = radiusAt(a) * 124;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 124);
    g.addColorStop(0, 'rgba(34,28,24,0.92)');
    g.addColorStop(0.7, 'rgba(52,42,34,0.85)');
    g.addColorStop(1, 'rgba(80,66,50,0.35)');
    ctx.fillStyle = g;
    ctx.fill();
    for (let i = 0; i < 900; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 112;
      ctx.fillStyle = rand() < 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(110,100,92,0.25)';
      ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2 + rand() * 4, 2 + rand() * 4);
    }
  } else {
    // The burning front: a glowing ragged ring and embers inside it.
    for (let i = 0; i < 260; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = radiusAt(a) * 118 * (0.82 + rand() * 0.2);
      const s = 6 + rand() * 12;
      const g = ctx.createRadialGradient(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * r, Math.sin(a) * r, s);
      g.addColorStop(0, 'rgba(255,190,80,0.9)');
      g.addColorStop(0.5, 'rgba(255,90,20,0.5)');
      g.addColorStop(1, 'rgba(160,20,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.cos(a) * r - s, Math.sin(a) * r - s, s * 2, s * 2);
    }
    for (let i = 0; i < 160; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 100;
      const s = 2 + rand() * 4;
      const g = ctx.createRadialGradient(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * r, Math.sin(a) * r, s);
      g.addColorStop(0, `rgba(255,${(110 + rand() * 90) | 0},30,${0.5 + rand() * 0.4})`);
      g.addColorStop(1, 'rgba(200,40,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.cos(a) * r - s, Math.sin(a) * r - s, s * 2, s * 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A square grid laid on the terrain round (x, z), `lift` metres above it, UVs 0..1. */
function groundPatch(terrain, x, z, half, lift, segments = 20) {
  const positions = [];
  const uvs = [];
  const index = [];
  for (let j = 0; j <= segments; j += 1) {
    for (let i = 0; i <= segments; i += 1) {
      const px = x - half + (2 * half * i) / segments;
      const pz = z - half + (2 * half * j) / segments;
      positions.push(px, Math.max(0, terrain.heightAt(px, pz)) + lift, pz);
      uvs.push(i / segments, 1 - j / segments);
    }
  }
  for (let j = 0; j < segments; j += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = j * (segments + 1) + i;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

function farmhouseGeometry() {
  const walls = new THREE.BoxGeometry(11, 5.5, 8);
  walls.translate(0, 2.75, 0);
  const roof = new THREE.ConeGeometry(7.6, 3.4, 4);
  roof.rotateY(Math.PI / 4);
  roof.scale(1.15, 1, 0.85);
  roof.translate(0, 7.2, 0);
  const shed = new THREE.BoxGeometry(5, 3.2, 6);
  shed.translate(8, 1.6, 1);
  const door = new THREE.BoxGeometry(1.4, 2.3, 0.1);
  door.translate(-2, 1.15, 4.02);
  return mergeColoredParts([
    { geometry: walls, color: '#efe2c8' },
    { geometry: roof, color: '#b9552f' },
    { geometry: shed, color: '#c9b49a' },
    { geometry: door, color: '#6b4a33' },
  ]);
}

/** Builds the fire ground for `fires` ({ x, z, radius }) on `terrain`; update() fades the glow. */
export function buildWildfireScenery(scene, terrain, fires) {
  const group = new THREE.Group();
  group.name = 'wildfire-scenery';
  const random = createSeededRandom(5151);
  const ground = (x, z) => Math.max(0, terrain.heightAt(x, z));
  const glows = [];
  fires.forEach((f, k) => {
    const scar = new THREE.Mesh(groundPatch(terrain, f.x, f.z, f.radius * 1.45, 0.45), new THREE.MeshLambertMaterial({ map: scarTexture(70 + k, false), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    scar.renderOrder = 1;
    const glowMaterial = new THREE.MeshBasicMaterial({ map: scarTexture(90 + k, true), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, fog: true });
    const glow = new THREE.Mesh(groundPatch(terrain, f.x, f.z, f.radius * 1.3, 0.6), glowMaterial);
    glow.renderOrder = 2;
    group.add(scar, glow);
    glows.push({ fire: f, material: glowMaterial, phase: random() * 6 });
  });

  // Burnt trunks in the scars and rocks round them.
  const trunks = [];
  const rocks = [];
  for (const f of fires) {
    for (let i = 0; i < 18; i += 1) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * f.radius * 1.1;
      trunks.push([f.x + Math.cos(a) * r, f.z + Math.sin(a) * r, 0.7 + random() * 0.6, random() * 0.3]);
    }
    for (let i = 0; i < 26; i += 1) {
      const a = random() * Math.PI * 2;
      const r = f.radius * (0.9 + random() * 1.8);
      rocks.push([f.x + Math.cos(a) * r, f.z + Math.sin(a) * r, 0.8 + random() * 2.4, random() * Math.PI]);
    }
  }
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const trunkGeometry = mergeColoredParts([
    { geometry: new THREE.CylinderGeometry(0.18, 0.32, 8, 6).translate(0, 4, 0), color: '#1d1a18' },
    { geometry: new THREE.CylinderGeometry(0.06, 0.1, 2.6, 4).rotateZ(0.9).translate(0.9, 5.6, 0), color: '#1d1a18' },
    { geometry: new THREE.CylinderGeometry(0.05, 0.09, 2.2, 4).rotateZ(-1).translate(-0.8, 6.4, 0.2), color: '#262220' },
  ]);
  const vertexMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
  const trunkMesh = new THREE.InstancedMesh(trunkGeometry, vertexMaterial, trunks.length);
  trunks.forEach(([x, z, k, lean], i) => {
    q.setFromEuler(new THREE.Euler(lean * 0.3, random() * Math.PI, lean * 0.2));
    m.compose(p.set(x, ground(x, z) - 0.3, z), q, s.set(k, k, k));
    trunkMesh.setMatrixAt(i, m);
  });
  trunkMesh.castShadow = true;
  const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#8b8178' }), rocks.length);
  rocks.forEach(([x, z, size, yaw], i) => {
    q.setFromEuler(new THREE.Euler(random(), yaw, random()));
    m.compose(p.set(x, ground(x, z) + size * 0.25, z), q, s.set(size * 1.2, size * 0.7, size));
    rockMesh.setMatrixAt(i, m);
  });
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  group.add(trunkMesh, rockMesh);

  // A fire break bulldozed across the slope below the fire line, and a farmhouse beyond it.
  const minX = Math.min(...fires.map((f) => f.x - f.radius));
  const maxX = Math.max(...fires.map((f) => f.x + f.radius));
  const lowZ = Math.max(...fires.map((f) => f.z + f.radius));
  const breakZ = lowZ + 70;
  const positions = [];
  const steps = Math.ceil((maxX - minX + 500) / 10);
  for (let i = 0; i < steps; i += 1) {
    const x0 = minX - 250 + i * 10;
    const x1 = x0 + 10;
    const z0 = breakZ + Math.sin(x0 * 0.01) * 12;
    const z1 = breakZ + Math.sin(x1 * 0.01) * 12;
    const h0 = ground(x0, z0) + 0.4;
    const h1 = ground(x1, z1) + 0.4;
    positions.push(x0, h0, z0 - 7, x0, h0, z0 + 7, x1, h1, z1 + 7);
    positions.push(x0, h0, z0 - 7, x1, h1, z1 + 7, x1, h1, z1 - 7);
  }
  const breakGeometry = new THREE.BufferGeometry();
  breakGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  breakGeometry.computeVertexNormals();
  const firebreak = new THREE.Mesh(breakGeometry, new THREE.MeshLambertMaterial({ color: '#9a7a55', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  firebreak.receiveShadow = true;
  group.add(firebreak);
  const hx = (minX + maxX) / 2 + 90;
  const hz = breakZ + 55;
  const house = new THREE.Mesh(farmhouseGeometry(), vertexMaterial);
  house.position.set(hx, ground(hx, hz) - 0.3, hz);
  house.rotation.y = 0.3;
  house.castShadow = true;
  group.add(house);

  scene.add(group);
  return {
    group,
    update(time) {
      for (const g of glows) g.material.opacity = Math.min(1, g.fire.intensity * 1.1) * (0.82 + 0.18 * Math.sin(time * 5.3 + g.phase));
    },
    dispose() {
      scene.remove(group);
    },
  };
}
