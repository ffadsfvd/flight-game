// Turns the height grid into one lit mesh: sand on the beaches, dry Mediterranean grass and
// darker forest floor on the slopes, rock on the cliffs, ash on the volcano, mown grass round the
// airfields. A tiled detail texture breaks up the colour close to the ground.
import * as THREE from 'three';
import { smoothstep } from '../core/gradientNoise.js';
import { hash2 } from '../core/seededRandom.js';
import { ISLANDS, TOWNS, islandAt } from './archipelagoMap.js';
import { AIRFIELDS, toRunwayFrame } from './airfieldDirectory.js';
import { forestDensity } from './vegetationMap.js';

const PALETTE = {
  seabed: new THREE.Color('#b59c6e'),
  wetSand: new THREE.Color('#d8c08e'),
  sand: new THREE.Color('#efdcab'),
  grass: new THREE.Color('#8ea64a'),
  dryGrass: new THREE.Color('#c6aa5c'),
  lush: new THREE.Color('#5f8c39'),
  forestFloor: new THREE.Color('#3f6128'),
  rock: new THREE.Color('#8e7b67'),
  cliff: new THREE.Color('#76665a'),
  highRock: new THREE.Color('#a8968a'),
  ash: new THREE.Color('#5d514b'),
  basalt: new THREE.Color('#3b3330'),
  mowed: new THREE.Color('#9cbc5f'),
  town: new THREE.Color('#cbb593'),
  snow: new THREE.Color('#f2f5f8'),
};

/** Each island character's own ground colours over the main island's palette. */
const CHARACTER_PALETTES = {
  volcanic: { sand: '#6b625a', wetSand: '#4a433e', seabed: '#5a5048', grass: '#7f8c45', dryGrass: '#a08f55', lush: '#56762f', rock: '#4f4541', cliff: '#3d3532', highRock: '#5e524c' },
  green: { grass: '#7cad45', dryGrass: '#a3b955', lush: '#4b9234', forestFloor: '#356b2a' },
  canyon: { sand: '#e9bd84', grass: '#b8935a', dryGrass: '#cf9d5c', lush: '#9c7a46', forestFloor: '#6f5a35', rock: '#b4593b', cliff: '#963f2b', highRock: '#c56c45' },
  alpine: { grass: '#6f9a44', dryGrass: '#8fa552', lush: '#3f7330', forestFloor: '#2c4c22', rock: '#8b8884', cliff: '#6f6c69', highRock: '#a9a6a1' },
  rock: { grass: '#8d9a58', dryGrass: '#a59a6c', rock: '#8f8a84', cliff: '#77726d' },
  atoll: { sand: '#f8f0d9', wetSand: '#e8dcc0', seabed: '#e6dbbd', grass: '#9cbb58' },
};
const PALETTES = Object.fromEntries(Object.entries(CHARACTER_PALETTES).map(([id, colors]) => [id, { ...PALETTE, ...Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, new THREE.Color(v)])) }]));

/** How often farmland appears on each character's lowland (1 = the main island). */
const FIELDS_BY_CHARACTER = { main: 1, green: 1.5, volcanic: 0.5, canyon: 0.25, alpine: 0.4, rock: 0, atoll: 0 };
const LAVA_RUST = new THREE.Color('#6b3424');

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

const CROPS = [new THREE.Color('#e0bb5a'), new THREE.Color('#86ad45'), new THREE.Color('#b48553'), new THREE.Color('#a9ad58'), new THREE.Color('#d8c27f'), new THREE.Color('#6f9a40'), new THREE.Color('#c99b4e')];

/** Farmland patchwork on gentle lowland: 0..1, zero on slopes, beaches, hills and in towns. */
function fieldPatch(x, z, h, slope, rate = 1) {
  if (h < 4 || h > 90 || slope > 0.12) return 0;
  const u = (x * 0.95 + z * 0.31) / 170;
  const v = (-x * 0.31 + z * 0.95) / 120;
  if (hash2(Math.floor(u), Math.floor(v), 33) > Math.min(0.95, 0.8 * rate)) return 0;
  for (const town of TOWNS) if (Math.hypot(x - town.x, z - town.z) < town.radius * 1.1) return 0;
  const edge = Math.min(u - Math.floor(u), Math.ceil(u) - u, v - Math.floor(v), Math.ceil(v) - v);
  return smoothstep(4, 9, h) * smoothstep(90, 50, h) * smoothstep(0.12, 0.05, slope) * smoothstep(0.0, 0.12, edge);
}

/** How strongly (x, z) belongs to an airfield's mown zone, 0..1. */
function airfieldGrass(x, z) {
  let best = 0;
  for (const field of AIRFIELDS) {
    if (field.kind === 'water' || field.kind === 'platform') continue;
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
  const fieldAttr = new Float32Array(n * n);
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
      const character = islandAt(x, z).character;
      const P = PALETTES[character] ?? PALETTE;
      let fieldMark = 0;
      if (h < 0.4) {
        color.copy(P.wetSand).lerp(P.seabed, smoothstep(0, -18, h));
      } else if (h < beach) {
        color.copy(P.sand).lerp(P.wetSand, smoothstep(1.2, 0.3, h) * 0.6);
      } else {
        color.copy(P.grass).lerp(P.dryGrass, smoothstep(0.35, 0.75, n1));
        color.lerp(P.lush, smoothstep(0.55, 0.2, n1) * smoothstep(240, 40, h) * 0.6);
        color.lerp(P.sand, smoothstep(beach + 4, beach, h) * 0.65);
        const forest = h < 720 ? forestDensity(terrain, x, z, h) : 0;
        const mownNear = airfieldGrass(x, z);
        const fieldRate = FIELDS_BY_CHARACTER[character] ?? 1;
        const fields = fieldRate > 0 ? fieldPatch(x, z, h, slope, fieldRate) * (1 - forest) * (1 - mownNear) : 0;
        if (fields > 0) color.lerp(CROPS[Math.floor(hash2(Math.floor((x * 0.95 + z * 0.31) / 170), Math.floor((-x * 0.31 + z * 0.95) / 120), 21) * CROPS.length)], fields * 0.82);
        fieldMark = fields;
        color.lerp(P.forestFloor, forest * 0.85);
        color.lerp(tmp.copy(P.rock).lerp(P.cliff, n2), smoothstep(0.16, 0.42, slope));
        color.lerp(P.highRock, smoothstep(430, 680, h) * 0.75);
        if (character === 'alpine') color.lerp(P.snow, smoothstep(560, 660, h + n2 * 80) * (1 - smoothstep(0.55, 0.8, slope)));
        if (volcano) {
          const dv = Math.hypot(x - volcano.x, z - volcano.z) / (volcano.rx * volcano.volcano.radius);
          const ashy = smoothstep(0.75, 0.25, dv) * smoothstep(250, 520, h);
          color.lerp(tmp.copy(PALETTE.ash).lerp(PALETTE.basalt, n2), ashy);
          // Old lava flows: dark basalt tongues running down from the crater, rusty at the edges.
          if (dv < 0.95 && h > 60) {
            const flow = smoothstep(0.62, 0.86, noise.ridged(x * 0.0024 + 7.3, z * 0.0024 - 2.1, 3));
            color.lerp(tmp.copy(PALETTE.basalt).lerp(LAVA_RUST, smoothstep(0.86, 0.62, flow) * 0.5), flow * smoothstep(0.95, 0.55, dv) * 0.9);
          }
        }
        const mown = airfieldGrass(x, z);
        if (mown > 0) color.lerp(P.mowed, mown * (0.7 + 0.3 * n2));
        for (const town of TOWNS) {
          const dt = Math.hypot(x - town.x, z - town.z) / town.radius;
          if (dt < 1) color.lerp(PALETTE.town, smoothstep(1, 0.35, dt) * 0.55);
        }
      }
      fieldAttr[i] = fieldMark;
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
  geometry.setAttribute('aField', new THREE.BufferAttribute(fieldAttr, 1));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  geometry.computeBoundingSphere();

  const material = new THREE.MeshLambertMaterial({ vertexColors: true, map: createDetailTexture() });
  // Break up large even areas with world-space value noise at two scales, so plains and slopes
  // never show the detail texture's repeat; close to the ground add crop rows in the fields,
  // layered strata in steep rock and a fine grain, all fading out with distance.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aField;\nvarying vec3 vTerrainWorld;\nvarying vec3 vTerrainNormal;\nvarying float vField;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTerrainWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvTerrainNormal = normal;\nvField = aField;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vTerrainWorld;
varying vec3 vTerrainNormal;
varying float vField;
float tHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float tNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), f.x), mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), f.x), f.y);
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float macroNoise = tNoise(vTerrainWorld.xz * 0.0045) * 0.55 + tNoise(vTerrainWorld.xz * 0.017) * 0.3 + tNoise(vTerrainWorld.xz * 0.09) * 0.15;
diffuseColor.rgb *= 0.84 + 0.3 * macroNoise;
// Wet, darker sand in the metre above the waterline, so every coast has a crisp edge.
float wetSand = smoothstep(1.5, 0.2, vTerrainWorld.y) * smoothstep(-1.2, 0.0, vTerrainWorld.y);
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.7, 0.66, 0.6), wetSand);
float viewDistance = length(cameraPosition - vTerrainWorld);
float slope = 1.0 - normalize(vTerrainNormal).y;
// Strata: horizontal bands of lighter and darker rock on cliffs, mesas and canyon walls.
float strata = sin(vTerrainWorld.y * 0.42 + tNoise(vTerrainWorld.xz * 0.012) * 4.0) * 0.5 + 0.5;
diffuseColor.rgb *= 1.0 + (strata - 0.5) * 0.26 * smoothstep(0.22, 0.5, slope) * (1.0 - smoothstep(2500.0, 6000.0, viewDistance));
// Crop rows across the farm fields.
float rowCoord = dot(vTerrainWorld.xz, vec2(-0.31, 0.95));
float rows = smoothstep(0.35, 0.65, abs(fract(rowCoord / 6.0) - 0.5) * 2.0);
diffuseColor.rgb *= 1.0 - vField * (0.13 * rows - 0.05) * (1.0 - smoothstep(500.0, 1800.0, viewDistance));
// Fine grain near the ground: grass tufts, pebbles, sand.
float grain = tNoise(vTerrainWorld.xz * 0.85) * 0.6 + tNoise(vTerrainWorld.xz * 3.1) * 0.4;
diffuseColor.rgb *= 1.0 + (grain - 0.5) * 0.24 * (1.0 - smoothstep(40.0, 320.0, viewDistance));`);
  };
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  return mesh;
}
