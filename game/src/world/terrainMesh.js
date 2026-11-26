// Turns the height grid into one lit mesh: sand on the beaches, dry Mediterranean grass and
// darker forest floor on the slopes, rock on the cliffs, ash on the volcano, mown grass round the
// airfields. A tiled detail texture breaks up the colour close to the ground.
import * as THREE from 'three';
import { smoothstep } from '../core/gradientNoise.js';
import { ISLANDS, TOWNS } from './archipelagoMap.js';
import { AIRFIELDS, toRunwayFrame } from './airfieldDirectory.js';
import { forestDensity } from './vegetationMap.js';

const PALETTE = {
  seabed: new THREE.Color('#b59c6e'),
  wetSand: new THREE.Color('#d8c08e'),
  sand: new THREE.Color('#efdcab'),
  grass: new THREE.Color('#86a24a'),
  dryGrass: new THREE.Color('#bba65e'),
  lush: new THREE.Color('#5f8c39'),
  forestFloor: new THREE.Color('#3f6128'),
  rock: new THREE.Color('#8e7b67'),
  cliff: new THREE.Color('#76665a'),
  highRock: new THREE.Color('#a8968a'),
  ash: new THREE.Color('#5d514b'),
  basalt: new THREE.Color('#3b3330'),
  mowed: new THREE.Color('#9cbc5f'),
  town: new THREE.Color('#cbb593'),
};

/** A soft grain texture (smooth canvas noise) multiplied over the vertex colours. */
function createDetailTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  let seed = 1234567;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const grid = (cells) => {
    const values = new Float32Array(cells * cells).map(() => rand());
    return (x, y) => {
      const gx = (x / size) * cells;
      const gy = (y / size) * cells;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const v = (ix, iy) => values[((iy % cells) * cells + (ix % cells))];
      const a = v(x0, y0) + (v(x0 + 1, y0) - v(x0, y0)) * sx;
      const b = v(x0, y0 + 1) + (v(x0 + 1, y0 + 1) - v(x0, y0 + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const coarse = grid(8);
  const medium = grid(32);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const v = 0.86 + 0.08 * coarse(x, y) + 0.05 * medium(x, y) + 0.025 * rand();
      const i = (y * size + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = Math.min(255, v * 255);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** How strongly (x, z) belongs to an airfield's mown zone, 0..1. */
function airfieldGrass(x, z) {
  let best = 0;
  for (const field of AIRFIELDS) {
    if (field.kind === 'water') continue;
    const p = toRunwayFrame(field, x, z);
    const ex = Math.max(0, Math.abs(p.along) - (field.length * 0.5 + 120));
    const ey = Math.max(0, Math.abs(p.across) - field.flatHalfWidth * 0.85);
    best = Math.max(best, 1 - smoothstep(0, 90, Math.hypot(ex, ey)));
  }
  return best;
}

/** Builds the terrain mesh for a sampler from createIslandTerrain. */
export function createTerrainMesh(terrain) {
  const { n, cells, step, half, heights, noise } = terrain;
  const positions = new Float32Array(n * n * 3);
  const normals = new Float32Array(n * n * 3);
  const colors = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const color = new THREE.Color();
  const tmp = new THREE.Color();
  const volcano = ISLANDS.find((i) => i.volcano);
  const normal = { x: 0, y: 1, z: 0 };

  for (let iz = 0; iz < n; iz += 1) {
    for (let ix = 0; ix < n; ix += 1) {
      const i = iz * n + ix;
      const x = -half + ix * step;
      const z = -half + iz * step;
      const h = heights[i];
      positions[i * 3] = x;
      positions[i * 3 + 1] = h;
      positions[i * 3 + 2] = z;
      const hl = terrain.gridHeight(ix - 1, iz);
      const hr = terrain.gridHeight(ix + 1, iz);
      const hd = terrain.gridHeight(ix, iz - 1);
      const hu = terrain.gridHeight(ix, iz + 1);
      const nx = hl - hr;
      const nz = hd - hu;
      const ny = 2 * step;
      const len = Math.hypot(nx, ny, nz);
      normals[i * 3] = nx / len;
      normals[i * 3 + 1] = ny / len;
      normals[i * 3 + 2] = nz / len;
      normal.y = ny / len;
      uvs[i * 2] = x / 46;
      uvs[i * 2 + 1] = z / 46;

      const n1 = noise.fbm(x * 0.0021, z * 0.0021, 3) * 0.5 + 0.5;
      const n2 = noise.noise(x * 0.013, z * 0.013) * 0.5 + 0.5;
      const slope = 1 - normal.y;
      const beach = 2.6 + n2 * 2.4;
      if (h < 0.4) {
        color.copy(PALETTE.wetSand).lerp(PALETTE.seabed, smoothstep(0, -18, h));
      } else if (h < beach) {
        color.copy(PALETTE.sand).lerp(PALETTE.wetSand, smoothstep(1.2, 0.3, h) * 0.6);
      } else {
        color.copy(PALETTE.grass).lerp(PALETTE.dryGrass, smoothstep(0.35, 0.75, n1));
        color.lerp(PALETTE.lush, smoothstep(0.55, 0.2, n1) * smoothstep(240, 40, h) * 0.6);
        color.lerp(PALETTE.sand, smoothstep(beach + 4, beach, h) * 0.65);
        const forest = h < 720 ? forestDensity(terrain, x, z, h) : 0;
        color.lerp(PALETTE.forestFloor, forest * 0.85);
        color.lerp(tmp.copy(PALETTE.rock).lerp(PALETTE.cliff, n2), smoothstep(0.16, 0.42, slope));
        color.lerp(PALETTE.highRock, smoothstep(430, 680, h) * 0.75);
        if (volcano) {
          const dv = Math.hypot(x - volcano.x, z - volcano.z) / (volcano.rx * volcano.volcano.radius);
          const ashy = smoothstep(0.75, 0.25, dv) * smoothstep(250, 520, h);
          color.lerp(tmp.copy(PALETTE.ash).lerp(PALETTE.basalt, n2), ashy);
        }
        const mown = airfieldGrass(x, z);
        if (mown > 0) color.lerp(PALETTE.mowed, mown * (0.7 + 0.3 * n2));
        for (const town of TOWNS) {
          const dt = Math.hypot(x - town.x, z - town.z) / town.radius;
          if (dt < 1) color.lerp(PALETTE.town, smoothstep(1, 0.35, dt) * 0.55);
        }
      }
      const shade = 0.93 + n2 * 0.14;
      colors[i * 3] = color.r * shade;
      colors[i * 3 + 1] = color.g * shade;
      colors[i * 3 + 2] = color.b * shade;
    }
  }

  const index = new Uint32Array(cells * cells * 6);
  let k = 0;
  for (let iz = 0; iz < cells; iz += 1) {
    for (let ix = 0; ix < cells; ix += 1) {
      const i00 = iz * n + ix;
      const i10 = i00 + 1;
      const i01 = i00 + n;
      const i11 = i01 + 1;
      index[k++] = i00;
      index[k++] = i01;
      index[k++] = i10;
      index[k++] = i10;
      index[k++] = i01;
      index[k++] = i11;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.MeshLambertMaterial({ vertexColors: true, map: createDetailTexture() });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}
