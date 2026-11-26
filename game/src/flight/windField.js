// Wind over the islands: a steady wind from a direction, gusts that swell and fade, turbulence that
// grows near the ground and in storms, and air that changes by island: gustier over the volcano
// and the alpine peak, calmer over the atoll. With the terrain attached it also lifts: ridge lift
// where the wind blows up a slope, and thermal columns over hot rock and fields for soaring.
import { THERMALS, WIND_CHARACTER, islandAt } from '../world/archipelagoMap.js';

/** Creates a wind field. `from` is the direction the wind blows from (deg), speed in m/s. */
export function createWindField({ from = 250, speed = 4, gust = 1.5, turbulence = 0.3 } = {}) {
  const state = { from, speed, gust, turbulence, time: 0, current: { x: 0, y: 0, z: 0 }, gustNow: 0, lift: 0 };
  let terrain = null;
  let characterCache = { x: Infinity, z: Infinity, factor: 1 };

  function set(options) {
    Object.assign(state, options);
  }

  /** The island character's gust factor at (x, z), cached over a few hundred metres. */
  function gustFactor(x, z) {
    if (Math.abs(x - characterCache.x) > 200 || Math.abs(z - characterCache.z) > 200) {
      const ground = terrain ? terrain.heightAt(x, z) : 0;
      characterCache = { x, z, factor: ground > 0 ? WIND_CHARACTER[islandAt(x, z).character] ?? 1 : 1 };
    }
    return characterCache.factor;
  }

  /** Rising air at p: ridge lift from the wind meeting a slope plus thermal columns. */
  function liftAt(p, windX, windZ) {
    if (!terrain) return 0;
    const ground = Math.max(0, terrain.heightAt(p.x, p.z));
    const agl = p.y - ground;
    let lift = 0;
    if (ground > 5 && agl < 600) {
      const e = 40;
      const dhdx = (terrain.heightAt(p.x + e, p.z) - terrain.heightAt(p.x - e, p.z)) / (2 * e);
      const dhdz = (terrain.heightAt(p.x, p.z + e) - terrain.heightAt(p.x, p.z - e)) / (2 * e);
      lift += (windX * dhdx + windZ * dhdz) * 0.9 * Math.exp(-Math.max(0, agl) / 260);
    }
    for (const t of THERMALS) {
      const d2 = ((p.x - t.x) ** 2 + (p.z - t.z) ** 2) / (t.radius * t.radius);
      if (d2 > 4 || p.y > t.top) continue;
      const core = Math.exp(-d2) - 0.25 * Math.exp(-d2 * 0.25);
      lift += t.lift * core * Math.min(1, (t.top - p.y) / 150);
    }
    return lift;
  }

  /** Wind vector (m/s, world axes) at position p; also stored in state.current. */
  function sample(p, out = state.current) {
    const t = state.time;
    const toward = ((state.from + 180) * Math.PI) / 180;
    const character = gustFactor(p.x, p.z);
    const gustWave = Math.max(0, Math.sin(t * 0.21) * 0.6 + Math.sin(t * 0.53 + 1.3) * 0.4);
    const gustNow = state.gust * gustWave * character;
    state.gustNow = gustNow;
    const agl = Math.max(0, p.y);
    const layer = 0.65 + 0.35 * Math.min(1, agl / 300);
    const speed = (state.speed + gustNow) * layer;
    const bump = state.turbulence * character * (1 + 1.5 * Math.max(0, 1 - agl / 400));
    out.x = Math.sin(toward) * speed + Math.sin(t * 1.7 + p.z * 0.01) * bump;
    out.z = -Math.cos(toward) * speed + Math.sin(t * 1.3 + p.x * 0.012) * bump;
    state.lift = liftAt(p, out.x, out.z);
    out.y = Math.sin(t * 2.3 + p.x * 0.008 + p.z * 0.006) * bump * 0.6 + state.lift;
    return out;
  }

  return {
    state,
    set,
    sample,
    /** Lets the wind read the ground for ridge lift and the island character. */
    attachTerrain(t) {
      terrain = t;
    },
    advance(dt) {
      state.time += dt;
    },
    /** Heading (deg) the wind comes from and its speed in knots, for the HUD and the tower. */
    report() {
      return { from: Math.round(state.from), knots: Math.round((state.speed + state.gustNow) * 1.944), gustKnots: Math.round((state.speed + state.gust) * 1.944) };
    },
  };
}
