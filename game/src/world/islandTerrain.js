// The archipelago's height field: islands, mountain ranges, the volcano, the canyon, the lagoon
// and flattened airfields, sampled once into a grid. Physics, rendering, the minimap and the sea
// shader all read the same grid through the same triangle interpolation, so what you see is what
// you hit.
import { createNoise2D, smoothstep } from '../core/gradientNoise.js';
import { CANYONS, ISLANDS, LAGOONS, MESAS, PLAINS, RANGES, TOWNS, WORLD_HALF_SIZE } from './archipelagoMap.js';
import { AIRFIELDS, runwayAxes } from './airfieldDirectory.js';

const SEA_FLOOR = -60;

/** Distance from (x, z) to segment a-b and the 0..1 position of the nearest point along it. */
function segmentDistance(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
  t = Math.min(1, Math.max(0, t));
  const px = ax + dx * t - x;
  const pz = az + dz * t - z;
  return { distance: Math.sqrt(px * px + pz * pz), t };
}

/** Builds the terrain sampler. `cells` grid cells span the map on each side. */
export function createIslandTerrain({ seed = 7, cells = 512 } = {}) {
  const noise = createNoise2D(seed);
  const half = WORLD_HALF_SIZE;
  const size = half * 2;
  const step = size / cells;
  const n = cells + 1;
  const heights = new Float32Array(n * n);

  function islandShape(island, x, z) {
    const dx = x - island.x;
    const dz = z - island.z;
    const c = Math.cos(island.rot);
    const s = Math.sin(island.rot);
    const u = (dx * c + dz * s) / island.rx;
    const v = (-dx * s + dz * c) / island.rz;
    const raw = Math.sqrt(u * u + v * v);
    if (raw > 1.7) return { d: raw, raw };
    const warp = noise.fbm(x * 0.00042 + island.seed * 13.1, z * 0.00042 - island.seed * 7.7, 4) * island.coastNoise;
    return { d: raw + warp, raw };
  }

  /** Height before airfields are flattened: islands, ranges, volcano, canyon and lagoon. */
  function naturalHeight(x, z) {
    let h = SEA_FLOOR;
    let land = 0;
    for (const island of ISLANDS) {
      const { d, raw } = islandShape(island, x, z);
      if (raw > 1.7) continue;
      let e;
      if (d < 1) {
        const t = 1 - d;
        e = island.peak * Math.pow(t, island.power) + 1.5;
        // Alpine islands get ridges and gullies, sharper toward the summit.
        if (island.character === 'alpine') e += island.peak * 0.24 * t * (noise.ridged(x * 0.0021 + 5.1, z * 0.0021 - 3.3, 4) - 0.45);
        if (island.volcano) {
          const vol = island.volcano;
          const dv = raw / vol.radius;
          if (dv < 1) {
            let cone = vol.peak * Math.pow(1 - dv, 1.35);
            cone *= 0.9 + 0.1 * noise.ridged(x * 0.004, z * 0.004, 3);
            if (dv < vol.crater) cone -= vol.craterDepth * (1 - (dv / vol.crater) ** 2);
            e = Math.max(e, cone);
          }
        }
        land = Math.max(land, Math.min(1, t * 8));
      } else {
        e = 1.5 - (d - 1) * 190;
      }
      if (e > h) h = e;
    }
    if (h > 0) {
      const mask = smoothstep(0, 25, h);
      h += (noise.fbm(x * 0.0011, z * 0.0011, 5) + 0.35) * 26 * mask;
      for (const range of RANGES) {
        const { distance, t } = segmentDistance(x, z, range.ax, range.az, range.bx, range.bz);
        if (distance > range.width) continue;
        const across = 1 - (distance / range.width) ** 2;
        const along = Math.pow(Math.sin(Math.PI * t), 0.7);
        const peak = range.peakBoost * Math.exp(-(((t - range.peakAt) / 0.12) ** 2));
        const ridge = 0.5 + 0.5 * noise.ridged(x * 0.00075 + 3.1, z * 0.00075 - 1.7, 5);
        h += (range.height * Math.pow(across, 1.4) * along + peak * across) * ridge * smoothstep(5, 70, h) * land;
      }
    }
    for (const canyon of CANYONS) {
      let best = Infinity;
      let floor = 0;
      for (let i = 0; i < canyon.points.length - 1; i += 1) {
        const a = canyon.points[i];
        const b = canyon.points[i + 1];
        const { distance, t } = segmentDistance(x, z, a[0], a[1], b[0], b[1]);
        if (distance < best) {
          best = distance;
          floor = a[2] + (b[2] - a[2]) * t;
        }
      }
      if (best < canyon.halfWidth + canyon.wall && h > floor) {
        const wiggle = noise.noise(x * 0.01, z * 0.01) * 18;
        const k = smoothstep(canyon.halfWidth * 0.55, canyon.halfWidth + canyon.wall, best + wiggle);
        h = floor + (h - floor) * Math.pow(k, 0.85);
      }
    }
    for (const mesa of MESAS) {
      const r = Math.hypot(x - mesa.x, z - mesa.z) / mesa.radius;
      if (r > 1.35 || h <= 0) continue;
      const edge = r + noise.noise(x * 0.018, z * 0.018) * 0.14;
      const cliff = 1 - smoothstep(0.74, 0.98, edge);
      const talus = (1 - smoothstep(0.98, 1.35, edge)) * 0.2;
      h += mesa.height * Math.max(cliff, talus);
    }
    for (const lagoon of LAGOONS) {
      const dx = x - lagoon.x;
      const dz = z - lagoon.z;
      const c = Math.cos(lagoon.rot);
      const s = Math.sin(lagoon.rot);
      const u = (dx * c + dz * s) / lagoon.rx;
      const v = (-dx * s + dz * c) / lagoon.rz;
      const d = Math.sqrt(u * u + v * v) + noise.noise(x * 0.004, z * 0.004) * 0.08;
      const f = smoothstep(1.08, 0.72, d);
      if (f > 0) h = Math.min(h, h * (1 - f) + lagoon.depth * f);
    }
    for (const plain of PLAINS) {
      const dx = x - plain.x;
      const dz = z - plain.z;
      const c = Math.cos(plain.rot);
      const s = Math.sin(plain.rot);
      const u = (dx * c + dz * s) / plain.rx;
      const v = (-dx * s + dz * c) / plain.rz;
      const w = 1 - smoothstep(0.65, 1.0, Math.sqrt(u * u + v * v));
      if (w > 0 && h > plain.height) h = h + (plain.height + (h - plain.height) * plain.keep - h) * w;
    }
    return h;
  }

  for (const field of AIRFIELDS) {
    field.elevationResolved = field.elevation === 'auto' ? Math.max(10, Math.round(naturalHeight(field.x, field.z))) : field.elevation;
  }

  /** Final height: natural ground with airfields and town centres levelled. */
  function shapedHeight(x, z) {
    let h = naturalHeight(x, z);
    for (const field of AIRFIELDS) {
      if (field.kind === 'platform') continue;
      const { fx, fz, rx, rz } = runwayAxes(field);
      const dx = x - field.x;
      const dz = z - field.z;
      if (field.kind === 'water') {
        const along = Math.abs(dx * fx + dz * fz);
        const across = dx * rx + dz * rz - field.apronSide * (field.apronOffset + 25);
        const e = Math.hypot(Math.max(0, along - 70), Math.max(0, Math.abs(across) - 30));
        if (e < 90) h = h + (3 - h) * (1 - smoothstep(0, 90, e));
        continue;
      }
      const along = Math.abs(dx * fx + dz * fz);
      const across = Math.abs(dx * rx + dz * rz);
      const ex = Math.max(0, along - (field.length * 0.5 + 160));
      const ey = Math.max(0, across - field.flatHalfWidth);
      const e = Math.sqrt(ex * ex + ey * ey);
      if (e < 320) {
        const w = 1 - smoothstep(0, 320, e);
        h = h + (field.elevationResolved - h) * w;
      }
    }
    for (const town of TOWNS) {
      if (!town.flatten) continue;
      const d = Math.hypot(x - town.x, z - town.z) / town.radius;
      if (d < 1 && h > 2) h = h + (Math.max(4, h * 0.55) - h) * (1 - smoothstep(0.4, 1, d)) * 0.6;
    }
    return h;
  }

  for (let iz = 0; iz < n; iz += 1) {
    const z = -half + iz * step;
    for (let ix = 0; ix < n; ix += 1) {
      heights[iz * n + ix] = shapedHeight(-half + ix * step, z);
    }
  }

  /**
   * Height at (x, z) interpolated on the same two triangles per cell the mesh draws
   * (the diagonal runs from (ix+1, iz) to (ix, iz+1)).
   */
  function heightAt(x, z) {
    const gx = (x + half) / step;
    const gz = (z + half) / step;
    if (gx < 0 || gz < 0 || gx >= cells || gz >= cells) return SEA_FLOOR;
    const ix = Math.floor(gx);
    const iz = Math.floor(gz);
    const fx = gx - ix;
    const fz = gz - iz;
    const i00 = iz * n + ix;
    const h00 = heights[i00];
    const h10 = heights[i00 + 1];
    const h01 = heights[i00 + n];
    const h11 = heights[i00 + n + 1];
    if (fx + fz <= 1) return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
    return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  }

  /** Unit surface normal at (x, z) from central differences on the grid. */
  function normalAt(x, z, out) {
    const e = step * 0.5;
    const hx = heightAt(x + e, z) - heightAt(x - e, z);
    const hz = heightAt(x, z + e) - heightAt(x, z - e);
    const nx = -hx;
    const ny = 2 * e;
    const nz = -hz;
    const len = Math.hypot(nx, ny, nz);
    out.x = nx / len;
    out.y = ny / len;
    out.z = nz / len;
    return out;
  }

  /** The vertex height at grid indices (clamped). */
  function gridHeight(ix, iz) {
    const cx = Math.min(cells, Math.max(0, ix));
    const cz = Math.min(cells, Math.max(0, iz));
    return heights[cz * n + cx];
  }

  return { heights, cells, step, n, half, size, heightAt, normalAt, gridHeight, noise, seaFloor: SEA_FLOOR };
}
