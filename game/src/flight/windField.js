// Wind over the islands: a steady wind from a direction, gusts that swell and fade, turbulence that
// grows near the ground and in storms, and mechanical turbulence downwind of the mountains.

/** Creates a wind field. `from` is the direction the wind blows from (deg), speed in m/s. */
export function createWindField({ from = 250, speed = 4, gust = 1.5, turbulence = 0.3 } = {}) {
  const state = { from, speed, gust, turbulence, time: 0, current: { x: 0, y: 0, z: 0 }, gustNow: 0 };

  function set(options) {
    Object.assign(state, options);
  }

  /** Wind vector (m/s, world axes) at position p; also stored in state.current. */
  function sample(p, out = state.current) {
    const t = state.time;
    const toward = ((state.from + 180) * Math.PI) / 180;
    const gustWave = Math.max(0, Math.sin(t * 0.21) * 0.6 + Math.sin(t * 0.53 + 1.3) * 0.4);
    const gustNow = state.gust * gustWave;
    state.gustNow = gustNow;
    const agl = Math.max(0, p.y);
    const layer = 0.65 + 0.35 * Math.min(1, agl / 300);
    const speed = (state.speed + gustNow) * layer;
    const bump = state.turbulence * (1 + 1.5 * Math.max(0, 1 - agl / 400));
    out.x = Math.sin(toward) * speed + Math.sin(t * 1.7 + p.z * 0.01) * bump;
    out.z = -Math.cos(toward) * speed + Math.sin(t * 1.3 + p.x * 0.012) * bump;
    out.y = Math.sin(t * 2.3 + p.x * 0.008 + p.z * 0.006) * bump * 0.6;
    return out;
  }

  return {
    state,
    set,
    sample,
    advance(dt) {
      state.time += dt;
    },
    /** Heading (deg) the wind comes from and its speed in knots, for the HUD and the tower. */
    report() {
      return { from: Math.round(state.from), knots: Math.round((state.speed + state.gustNow) * 1.944), gustKnots: Math.round((state.speed + state.gust) * 1.944) };
    },
  };
}
