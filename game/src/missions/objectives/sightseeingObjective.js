// Objective: a sightseeing flight with paying passengers aboard. Show them each sight in turn
// (fly over or past it inside its radius and height band) while keeping them comfortable:
// steep banks, hard pulls or pushes and fast climbs or dives drain the comfort meter, smooth
// flying lets it recover a little. Comfort at the end is the score; if it reaches zero the
// passengers have had enough and the tour is called off.
import * as THREE from 'three';

const FT = 3.28084;

export function createSightseeingObjective(stage) {
  const sights = stage.sights.map((s) => ({ ...s, seen: false }));
  const limits = { maxBank: 30, gMin: 0.5, gMax: 1.6, climbFpm: 1300, sinkFpm: 1100, ...stage.comfort };
  let comfort = 100;
  let steepest = 0;
  let peakG = 1;
  let lowestG = 1;
  let complaint = 0;
  let worst = '';
  const objective = {
    kind: 'sightseeing',
    score: 0,
    rows: [],
    failedReason: null,
    get comfort() {
      return comfort;
    },
    begin(ctx) {
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    update(dt, ctx) {
      const b = ctx.body;
      if (!b.onGround) {
        const bank = Math.abs(b.bank);
        const fpm = b.verticalSpeed * 196.85;
        steepest = Math.max(steepest, bank);
        peakG = Math.max(peakG, b.gForce);
        lowestG = Math.min(lowestG, b.gForce);
        // Each limit exceeded drains comfort in proportion to how far past it the pilot is: a
        // moment over a limit costs a few points, a long rough stretch empties the meter.
        const excess = {
          bank: Math.max(0, bank - limits.maxBank) / 10,
          pull: Math.max(0, b.gForce - limits.gMax) / 0.3,
          push: Math.max(0, limits.gMin - b.gForce) / 0.2,
          climb: Math.max(0, fpm - limits.climbFpm) / 600,
          dive: Math.max(0, -fpm - limits.sinkFpm) / 700,
        };
        const drain = excess.bank + excess.pull + excess.push + excess.climb + excess.dive;
        if (drain > 0) {
          comfort = Math.max(0, comfort - drain * 5 * dt);
          const top = Object.entries(excess).sort((x, y) => y[1] - x[1])[0][0];
          worst = { bank: 'steep banks', pull: 'hard pulls', push: 'pushes over the top', climb: 'steep climbs', dive: 'steep dives' }[top];
          complaint -= dt;
          if (complaint <= 0 && stage.passenger) {
            ctx.radio(stage.passenger, { bank: 'Whoa, the sea is where the sky should be!', pull: 'Oof, that pressed us into our seats.', push: 'My stomach just left without me!', climb: 'Are we going to space?', dive: 'Too fast, too fast down!' }[top], { priority: true });
            complaint = 12;
          }
        } else {
          comfort = Math.min(100, comfort + 0.6 * dt);
        }
      }
      if (comfort <= 0) {
        objective.failedReason = `The passengers had enough of the ${worst || 'rough ride'} and asked to be taken home`;
        objective.score = 0;
        return 'failed';
      }
      const next = sights.find((s) => !s.seen);
      if (next) {
        const p = b.position;
        const d = Math.hypot(next.x - p.x, next.z - p.z);
        const agl = b.agl * FT;
        const inBand = (next.minFt === undefined || agl >= next.minFt) && (next.maxFt === undefined || agl <= next.maxFt);
        if (d < (next.radius ?? 400) && inBand) {
          next.seen = true;
          ctx.toast(`SIGHT: ${next.name.toUpperCase()}`, 'good');
          ctx.report({ kind: 'sight', name: next.name, comfort });
          if (next.say) ctx.radio(next.say[0], next.say[1]);
        }
        return 'active';
      }
      objective.score = Math.round(comfort);
      ctx.report({ kind: 'tour-done', comfort });
      objective.rows.push(['Passenger comfort', `${Math.round(comfort)}%`], ['Sights shown', `${sights.length} of ${sights.length}`], ['Steepest bank', `${Math.round(steepest)}°`], ['G range', `${lowestG.toFixed(1)} to ${peakG.toFixed(1)}`]);
      return 'done';
    },
    info(ctx) {
      const next = sights.find((s) => !s.seen);
      const p = ctx.body.position;
      const d = next ? Math.hypot(next.x - p.x, next.z - p.z) : 0;
      const band = next && next.maxFt !== undefined ? `below ${next.maxFt} ft` : next && next.minFt !== undefined ? `above ${next.minFt} ft` : '';
      return {
        objective: next ? `Show the passengers ${next.name}` : 'Tour complete',
        next: stage.hint ?? `Gentle: bank under ${limits.maxBank}°, no hard pulls${band ? `, pass ${band}` : ''}`,
        stats: [['COMFORT', `${Math.round(comfort)}%`], ['SIGHTS', `${sights.filter((s) => s.seen).length} / ${sights.length}`], ['DIST', d > 900 ? `${(d / 1852).toFixed(1)} NM` : `${Math.round(d)} m`]],
        progress: sights.filter((s) => s.seen).length / sights.length,
      };
    },
    /** The comfort meter, shown in the fuel and condition panel's load row. */
    load: () => ({ label: 'COMFORT', fraction: comfort / 100, text: `${Math.round(comfort)}%`, color: comfort > 70 ? '#6be38a' : comfort > 40 ? '#ffb02e' : '#ff4d3d' }),
    markers: () => {
      const next = sights.find((s) => !s.seen);
      return sights.map((s) => ({ x: s.x, z: s.z, kind: 'area', radius: s.radius ?? 400, active: !s.seen, label: s === next ? 'SIGHT' : null, color: s.seen ? '#6be38a' : '#ffd34d' }));
    },
    guidance: () => null,
    bearing(ctx) {
      const s = sights.find((x) => !x.seen);
      if (!s) return null;
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(s.x - p.x, -(s.z - p.z))) + 360) % 360;
    },
  };
  return objective;
}
