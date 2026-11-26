// Where forests grow and where the ground stays open: one density function shared by the terrain
// colours, the tree planter, the forest-fire mission and the tree-strike check.
import { smoothstep } from '../core/gradientNoise.js';
import { TOWNS, islandAt } from './archipelagoMap.js';
import { AIRFIELDS, toRunwayFrame } from './airfieldDirectory.js';

/** Ground kept clear of trees around airfields (metres beyond the runway ends and sides). */
const AIRFIELD_CLEARANCE = { ends: 380, sides: 140 };

/** 0..1 forest density at (x, z) for the given terrain sampler. */
export function forestDensity(terrain, x, z, height = terrain.heightAt(x, z)) {
  if (height < 6 || height > 720) return 0;
  const normalY = terrain.normalAt(x, z, scratch).y;
  if (normalY < 0.78) return 0;
  for (const field of AIRFIELDS) {
    const p = toRunwayFrame(field, x, z);
    if (Math.abs(p.along) < field.length * 0.5 + AIRFIELD_CLEARANCE.ends && Math.abs(p.across) < Math.max(field.flatHalfWidth, field.width) + AIRFIELD_CLEARANCE.sides) return 0;
  }
  for (const town of TOWNS) {
    if (Math.hypot(x - town.x, z - town.z) < town.radius * 1.05) return 0;
  }
  const n = terrain.noise.fbm(x * 0.0016 + 40.0, z * 0.0016 - 12.0, 4);
  const altitudeFade = 1 - smoothstep(420, 700, height);
  const shoreFade = smoothstep(6, 26, height);
  const character = FOREST_BY_CHARACTER[islandAt(x, z).character] ?? 1;
  return smoothstep(0.02, 0.32, n) * altitudeFade * shoreFade * smoothstep(0.78, 0.9, normalY) * character;
}

/** How much each island character grows trees: dry Orsa Cay hardly any, alpine Nesta the most. */
const FOREST_BY_CHARACTER = { main: 1, volcanic: 0.9, green: 0.75, canyon: 0.2, alpine: 1.35, rock: 0.3, atoll: 0.5 };

const scratch = { x: 0, y: 1, z: 0 };

/** Typical canopy height (m) of the forest at a density, for collisions and the fire mission. */
export function canopyHeight(density) {
  return density > 0.15 ? 9 + density * 7 : 0;
}
