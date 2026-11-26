// Damage that turns a sortie into decisions: overspeed flutter, over-G stress, flaps or gear left
// out too fast, and bird strikes when flying low over the coast. Each returns an event the radio,
// the HUD and the results screen can name.

/** Per-flight damage bookkeeping. */
export function createDamageTracker({ birds = true, random = Math.random } = {}) {
  return { birds, random, overspeedTime: 0, overstressTime: 0, birdCooldown: 25, birdStrikes: 0, log: [] };
}

function record(tracker, event) {
  tracker.log.push(event);
  return event;
}

/** Applies a step's worth of damage to `body`; returns an array of new events (usually empty). */
export function stepDamage(body, tracker, dt) {
  const spec = body.spec;
  const events = [];
  if (body.onGround) return events;
  if (body.airspeed > spec.vne) {
    tracker.overspeedTime += dt;
    body.airframe = Math.max(0, body.airframe - (body.airspeed / spec.vne - 1) * 0.35 * dt);
    if (tracker.overspeedTime > 0.6 && tracker.overspeedTime - dt <= 0.6) events.push(record(tracker, { kind: 'overspeed', text: 'Airframe flutter from overspeed' }));
  } else {
    tracker.overspeedTime = 0;
  }
  const g = body.gForce;
  if (g > spec.gLimit || g < -spec.gLimit * 0.5) {
    tracker.overstressTime += dt;
    const excess = g > 0 ? g / spec.gLimit - 1 : -g / (spec.gLimit * 0.5) - 1;
    body.airframe = Math.max(0, body.airframe - excess * 0.5 * dt);
    if (tracker.overstressTime - dt <= 0) events.push(record(tracker, { kind: 'overstress', text: `Wings overstressed at ${g.toFixed(1)} G` }));
  } else {
    tracker.overstressTime = 0;
  }
  if (body.flapPosition > 0.05 && body.airspeed > spec.vFlapMax * 1.12 && !body.flapsJammed) {
    body.flapsJammed = true;
    body.airframe = Math.max(0, body.airframe - 0.08);
    events.push(record(tracker, { kind: 'flaps', text: 'Flaps jammed: extended above their limit speed' }));
  }
  if (spec.gearRetracts && body.gearPosition > 0.05 && body.airspeed > spec.vGearMax * 1.12 && body.gearHealth > 0.6) {
    body.gearHealth = 0.55;
    events.push(record(tracker, { kind: 'gear', text: 'Gear doors damaged: lowered above limit speed' }));
  }
  tracker.birdCooldown -= dt;
  if (tracker.birds && tracker.birdCooldown <= 0 && body.agl < 170 && body.airspeed > 22) {
    if (tracker.random() < dt * 0.006) {
      tracker.birdCooldown = 60;
      tracker.birdStrikes += 1;
      const engineHit = tracker.random() < 0.6;
      if (engineHit) body.engine.health = Math.max(0.05, body.engine.health - 0.22 - tracker.random() * 0.15);
      body.airframe = Math.max(0.05, body.airframe - 0.05);
      events.push(record(tracker, { kind: 'bird', text: engineHit ? 'Bird strike: engine running rough' : 'Bird strike on the wing' }));
    }
  }
  return events;
}

/** Applies the gear and airframe damage of a firm touchdown; returns an event or null. */
export function applyTouchdownDamage(body, tracker, fpm) {
  const spec = body.spec;
  if (fpm <= spec.gearLimitFpm) return null;
  const severity = (fpm - spec.gearLimitFpm) / (spec.gearCollapseFpm - spec.gearLimitFpm);
  body.gearHealth = Math.max(0, body.gearHealth - severity * 0.7);
  body.airframe = Math.max(0, body.airframe - severity * 0.15);
  return record(tracker, { kind: 'hard-landing', text: `Hard landing at ${Math.round(fpm)} fpm: gear damaged` });
}

/** Overall condition 0..1 shown on the HUD and used to grade cargo. */
export function overallCondition(body) {
  return Math.min(body.airframe, 0.4 + 0.6 * body.engine.health, 0.5 + 0.5 * body.gearHealth);
}
