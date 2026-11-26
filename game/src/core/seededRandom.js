// A small seeded random generator (mulberry32) so the world, the screenshot scenes and the AI
// rivals come out the same for the same seed.

/** Returns a function giving floats in [0, 1) from a 32-bit seed. */
export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A float in [min, max) from a generator made by createSeededRandom. */
export function randomRange(random, min, max) {
  return min + (max - min) * random();
}

/** Hash two integers and a seed into [0, 1): a stateless random value for grid cells. */
export function hash2(ix, iz, seed) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(seed | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
