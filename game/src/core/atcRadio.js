// Air traffic control for free flight. Lined up on a runway, the pilot gets a take-off clearance
// with the wind; established on final, a landing clearance; both mention circuit traffic close to
// the field. Marenza Tower answers at the international airport, Solvara Radio (the unicom) at
// the fields without a tower.
import { AIRFIELDS, landingDirection, toRunwayFrame } from '../world/airfieldDirectory.js';

const FINAL_RANGE = 4500;

function windText(wind) {
  return `wind ${String(Math.round(wind.from / 10) * 10 || 360).padStart(3, '0')} at ${Math.max(1, Math.round(wind.speed * 1.944))}`;
}

/** Which runway end a heading points along (0 or 1), or null when it is not lined up. */
function alignedEnd(field, heading, tolerance) {
  const off = ((heading - field.heading + 540) % 360) - 180;
  if (Math.abs(off) <= tolerance) return 0;
  if (Math.abs(off) >= 180 - tolerance) return 1;
  return null;
}

/** Creates the controller; update(dt, body, registration) speaks through `say(who, text)`. */
export function createAtcRadio({ say, wind, traffic }) {
  let cleared = new Set();
  let cooldown = 0;

  function trafficNear(field) {
    const near = traffic.flyers.filter((f) => Math.hypot(f.rig.root.position.x - field.x, f.rig.root.position.z - field.z) < 3500);
    if (!near.length) return '';
    const f = near[0];
    const kind = { pelican: 'Pelican twin', heron: 'Heron seaplane', kestrel: 'Kestrel sprayer', swiftlet: 'Swiftlet jet' }[f.route.aircraft] ?? 'Wren';
    return ` Traffic: ${f.route.callsign}, a ${kind}, ${f.route.activity ?? 'in the circuit'}.`;
  }

  function speak(field, text) {
    const tower = field.tower;
    say(tower ? 'dario' : 'pia', `${tower ? `${field.name.split(' ')[0]} Tower` : `${field.name.split(' ')[0]} traffic, Solvara Radio`}: ${text}`);
    cooldown = 6;
  }

  return {
    reset() {
      cleared = new Set();
      cooldown = 2;
    },
    update(dt, body, registration) {
      cooldown -= dt;
      if (cooldown > 0 || !body) return;
      const w = wind.state;
      for (const field of AIRFIELDS) {
        const p = toRunwayFrame(field, body.position.x, body.position.z);
        const water = field.kind === 'water';
        if (body.onGround || (water && body.onWater)) {
          if (Math.abs(p.across) > Math.max(field.width, 30) || Math.abs(p.along) > field.length / 2 + 40 || body.groundSpeed > 8) continue;
          const end = alignedEnd(field, body.heading, 25);
          const key = `takeoff-${field.id}-${end}`;
          if (end === null || cleared.has(key)) continue;
          cleared.add(key);
          cleared.delete(`land-${field.id}-0`);
          cleared.delete(`land-${field.id}-1`);
          const name = landingDirection(field, end).name;
          speak(field, `${registration}, runway ${name}, ${windText(w)}, ${field.tower ? 'cleared for take-off' : 'runway is clear, announce your departure'}.${trafficNear(field)}`);
          return;
        }
        const end = alignedEnd(field, body.heading, 20);
        if (end === null || body.agl > 450 || body.verticalSpeed > 1) continue;
        const dir = landingDirection(field, end);
        const before = -(dir.sign * p.along) - field.length / 2;
        if (before < 300 || before > FINAL_RANGE || Math.abs(p.across) > 250) continue;
        const key = `land-${field.id}-${end}`;
        if (cleared.has(key)) continue;
        cleared.add(key);
        cleared.delete(`takeoff-${field.id}-0`);
        cleared.delete(`takeoff-${field.id}-1`);
        speak(field, `${registration}, ${(before / 1852).toFixed(1)} miles final, runway ${dir.name}, ${windText(w)}, ${field.tower ? 'cleared to land' : `${water ? 'the water lane is clear' : 'the runway is clear'}, land at your discretion`}.${field.tower ? trafficNear(field) : ''}`);
        return;
      }
    },
  };
}
