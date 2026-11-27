// Damage that turns a sortie into decisions. Parts take real damage (overspeed flutter, over-G,
// flaps or gear out too fast, a hard landing, a bird strike where a mission has birds), and each
// damaged part changes the flying in a way the HUD names: an engine capped below full power, a
// bent wing that pulls to one side, gear that will no longer take a firm landing (or retract),
// flaps jammed where they were. Careful flying inside the aircraft's limits never causes damage.
import { enginePowerCap } from './engineModel.js';

/** Per-flight damage bookkeeping. */
export function createDamageTracker({ birds = true, random = Math.random } = {}) {
  return { birds, random, overspeedTime: 0, overstressTime: 0, birdCooldown: 25, birdStrikes: 0, log: [] };
}

function record(tracker, event) {
  tracker.log.push(event);
  return event;
}

/** Bends the airframe; the damaged wing (1 = left, -1 = right) makes the aircraft pull its way. */
function hurtAirframe(body, amount, side) {
  if (body.airframe >= 0.999) body.wingPull = side;
  body.airframe = Math.max(0, body.airframe - amount);
}

/** A bird hits the engine or a wing: the engine loses power or the wing starts to pull. */
export function applyBirdStrike(body, tracker, { engineHit = tracker.random() < 0.6, side = tracker.random() < 0.5 ? 1 : -1, severity = tracker.random() } = {}) {
  tracker.birdCooldown = 60;
  tracker.birdStrikes += 1;
  if (engineHit) {
    body.engine.health = Math.max(0.05, body.engine.health - 0.22 - severity * 0.15);
    body.airframe = Math.max(0.05, body.airframe - 0.03);
  } else {
    hurtAirframe(body, 0.12 + severity * 0.08, side);
  }
  return record(tracker, { kind: 'bird', part: engineHit ? 'engine' : 'wing', text: engineHit ? 'Bird strike: engine running rough' : `Bird strike on the ${side > 0 ? 'left' : 'right'} wing` });
}

/** Applies a step's worth of damage to `body`; returns an array of new events (usually empty). */
export function stepDamage(body, tracker, dt) {
  const spec = body.spec;
  const events = [];
  if (body.onGround) return events;
  if (body.airspeed > spec.vne) {
    tracker.overspeedTime += dt;
    hurtAirframe(body, (body.airspeed / spec.vne - 1) * 0.35 * dt, body.bank >= 0 ? 1 : -1);
    if (tracker.overspeedTime > 0.6 && tracker.overspeedTime - dt <= 0.6) events.push(record(tracker, { kind: 'overspeed', part: 'airframe', text: 'Airframe flutter from overspeed' }));
  } else {
    tracker.overspeedTime = 0;
  }
  const g = body.gForce;
  if (g > spec.gLimit || g < -spec.gLimit * 0.5) {
    tracker.overstressTime += dt;
    const excess = g > 0 ? g / spec.gLimit - 1 : -g / (spec.gLimit * 0.5) - 1;
    // The wing on the inside of the pull takes the load: it is the one that bends.
    hurtAirframe(body, excess * 0.5 * dt, body.bank >= 0 ? 1 : -1);
    if (tracker.overstressTime - dt <= 0) events.push(record(tracker, { kind: 'overstress', part: 'airframe', text: `Wings overstressed at ${g.toFixed(1)} G` }));
  } else {
    tracker.overstressTime = 0;
  }
  if (body.flapPosition > 0.05 && body.airspeed > spec.vFlapMax * 1.12 && !body.flapsJammed) {
    body.flapsJammed = true;
    body.airframe = Math.max(0, body.airframe - 0.08);
    events.push(record(tracker, { kind: 'flaps', part: 'flaps', text: 'Flaps jammed: extended above their limit speed' }));
  }
  if (spec.gearRetracts && body.gearPosition > 0.05 && body.airspeed > spec.vGearMax * 1.12 && body.gearHealth > 0.6) {
    body.gearHealth = 0.55;
    events.push(record(tracker, { kind: 'gear', part: 'gear', text: 'Gear doors damaged: lowered above limit speed' }));
  }
  tracker.birdCooldown -= dt;
  if (tracker.birds && tracker.birdCooldown <= 0 && body.agl < 170 && body.airspeed > 22) {
    if (tracker.random() < dt * 0.006) events.push(applyBirdStrike(body, tracker));
  }
  return events;
}

/** The sink rates the gear takes now: damaged gear bends and collapses at less. */
export function gearLimits(body) {
  const factor = 0.55 + 0.45 * Math.max(0, Math.min(1, body.gearHealth));
  return { limitFpm: body.spec.gearLimitFpm * factor, collapseFpm: body.spec.gearCollapseFpm * (0.65 + 0.35 * body.gearHealth) };
}

/** Applies the gear and airframe damage of a firm touchdown; returns an event or null. */
export function applyTouchdownDamage(body, tracker, fpm) {
  const { limitFpm, collapseFpm } = gearLimits(body);
  if (fpm <= limitFpm) return null;
  const severity = (fpm - limitFpm) / Math.max(1, collapseFpm - limitFpm);
  body.gearHealth = Math.max(0, body.gearHealth - severity * 0.7);
  body.airframe = Math.max(0, body.airframe - severity * 0.15);
  return record(tracker, { kind: 'hard-landing', part: 'gear', text: `Hard landing at ${Math.round(fpm)} fpm: gear damaged` });
}

/** Can the gear be raised? Damaged doors leave it stuck down. */
export function gearWillRetract(body) {
  return body.gearHealth >= 0.6;
}

/**
 * What each damaged part does to the flying, in the words the HUD and debrief use:
 * [{ part, text, level: 'warn'|'danger' }], the worst first.
 */
export function damageEffects(body) {
  const list = [];
  const cap = enginePowerCap(body.engine);
  if (!body.engine.running && body.engine.failed) list.push({ part: 'ENGINE', text: 'STOPPED', level: 'danger' });
  else if (cap < 0.995) list.push({ part: 'ENGINE', text: `POWER CAPPED ${Math.round(cap * 100)}%`, level: cap < 0.8 ? 'danger' : 'warn' });
  if (body.airframe < 0.97) list.push({ part: 'WING', text: `PULLS ${body.wingPull < 0 ? 'RIGHT' : 'LEFT'}`, level: body.airframe < 0.7 ? 'danger' : 'warn' });
  if (body.gearHealth < 0.97) {
    const stuck = body.spec.gearRetracts && !gearWillRetract(body);
    list.push({ part: 'GEAR', text: stuck ? "STUCK DOWN · LAND SOFT" : `LAND UNDER ${Math.round(gearLimits(body).limitFpm / 10) * 10} FPM`, level: body.gearHealth < 0.5 ? 'danger' : 'warn' });
  }
  if (body.flapsJammed) list.push({ part: 'FLAPS', text: `JAMMED AT ${Math.round(body.flapPosition * 35)}°`, level: 'warn' });
  return list;
}

/** Is anything on the aircraft damaged? */
export function isDamaged(body) {
  return body.airframe < 0.999 || body.engine.health < 0.999 || body.gearHealth < 0.999 || body.flapsJammed;
}

/** Overall condition 0..1 shown on the HUD and used to grade cargo. */
export function overallCondition(body) {
  return Math.min(body.airframe, 0.4 + 0.6 * body.engine.health, 0.5 + 0.5 * body.gearHealth);
}
