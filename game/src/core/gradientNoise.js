// 2D gradient noise with fractal sums, used to shape coastlines, mountains and vegetation.
import { createSeededRandom } from './seededRandom.js';

/** Builds a noise source: noise(x, z) in about [-1, 1], plus fbm and ridged sums over it. */
export function createNoise2D(seed) {
  const random = createSeededRandom(seed);
  const perm = new Uint8Array(512);
  const gradX = new Float32Array(256);
  const gradZ = new Float32Array(256);
  const order = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < 512; i += 1) perm[i] = order[i & 255];
  for (let i = 0; i < 256; i += 1) {
    const angle = random() * Math.PI * 2;
    gradX[i] = Math.cos(angle);
    gradZ[i] = Math.sin(angle);
  }

  function noise(x, z) {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const fx = x - x0;
    const fz = z - z0;
    const ix = x0 & 255;
    const iz = z0 & 255;
    const g00 = perm[ix + perm[iz]];
    const g10 = perm[ix + 1 + perm[iz]];
    const g01 = perm[ix + perm[iz + 1]];
    const g11 = perm[ix + 1 + perm[iz + 1]];
    const n00 = gradX[g00] * fx + gradZ[g00] * fz;
    const n10 = gradX[g10] * (fx - 1) + gradZ[g10] * fz;
    const n01 = gradX[g01] * fx + gradZ[g01] * (fz - 1);
    const n11 = gradX[g11] * (fx - 1) + gradZ[g11] * (fz - 1);
    const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
    const nx0 = n00 + (n10 - n00) * u;
    const nx1 = n01 + (n11 - n01) * u;
    return (nx0 + (nx1 - nx0) * v) * 1.414;
  }

  /** Fractal sum: octaves of noise, each twice the frequency and `gain` the amplitude. */
  function fbm(x, z, octaves = 5, gain = 0.5) {
    let sum = 0;
    let amp = 1;
    let freq = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o += 1) {
      sum += noise(x * freq + o * 17.3, z * freq - o * 9.1) * amp;
      norm += amp;
      amp *= gain;
      freq *= 2.03;
    }
    return sum / norm;
  }

  /** Ridged sum: sharp crests where the noise crosses zero, for mountain ranges. In [0, 1]. */
  function ridged(x, z, octaves = 5) {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    let weight = 1;
    for (let o = 0; o < octaves; o += 1) {
      let n = 1 - Math.abs(noise(x * freq + o * 31.7, z * freq + o * 11.3));
      n *= n * weight;
      weight = Math.min(1, Math.max(0, n * 2));
      sum += n * amp;
      amp *= 0.5;
      freq *= 2.1;
    }
    return Math.min(1, sum * 1.1);
  }

  return { noise, fbm, ridged };
}

/** Smooth 0..1 ramp between edge0 and edge1. */
export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
