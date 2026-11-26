// One flight in progress: the rigid body, its damage, the landing monitor and the crash detector
// stepped together at a fixed rate, with a flight recorder for the replay camera. Every step
// returns the events (touchdown, crash, bird strike...) that missions, radio and sound react to.
import * as THREE from 'three';
import { createAircraftBody, placeAircraft, stepAircraft } from './flightDynamics.js';
import { applyTouchdownDamage, createDamageTracker, stepDamage } from './damageModel.js';
import { createLandingMonitor, stepLandingMonitor } from './landingMonitor.js';
import { detectCrash } from './crashDetector.js';

export const PHYSICS_STEP = 1 / 120;
const RECORD_SECONDS = 14;
const RECORD_RATE = 30;

/** Ring buffer of recent positions and attitudes for the replay camera. */
function createFlightRecorder() {
  const size = RECORD_SECONDS * RECORD_RATE;
  const frames = Array.from({ length: size }, () => ({ p: new THREE.Vector3(), q: new THREE.Quaternion(), t: 0 }));
  let head = 0;
  let count = 0;
  let accumulator = 0;
  return {
    record(body, dt) {
      accumulator += dt;
      if (accumulator < 1 / RECORD_RATE) return;
      accumulator = 0;
      const f = frames[head];
      f.p.copy(body.position);
      f.q.copy(body.quaternion);
      f.t = body.time;
      head = (head + 1) % size;
      count = Math.min(size, count + 1);
    },
    /** Frames oldest first. */
    frames() {
      const out = [];
      for (let i = 0; i < count; i += 1) out.push(frames[(head - count + i + size) % size]);
      return out;
    },
    clear() {
      count = 0;
      head = 0;
    },
  };
}

/** Puts what led to a crash in front of the impact: a stall in the last seconds or a dead engine. */
function explainCrash(cause, body, history) {
  const tail = cause.charAt(0).toLowerCase() + cause.slice(1);
  const stall = history.stall;
  if (stall && body.time - stall.time < 9) {
    const flaps = ['flaps up', 'flaps 15°', 'full flaps'][stall.flaps] ?? 'flaps up';
    return `Stalled at ${stall.aglFt} ft and ${stall.kt} kt with ${flaps}${body.spec.gearRetracts && !body.gearDown ? ' and the gear up' : ''}, then ${tail}`;
  }
  const out = history.engineOut;
  if (out && !body.engine.running) return `Engine out at ${out.aglFt} ft (${out.cause ?? 'failure'}), then ${tail}`;
  return cause;
}

/** Creates the simulation for a world and wind field. */
export function createAircraftSimulation(world, wind) {
  const sim = {
    body: null,
    damage: null,
    landing: null,
    ended: null,
    recorder: createFlightRecorder(),
    accumulator: 0,
    flightTime: 0,
    distance: 0,
    history: { stall: null, engineOut: null },
  };

  /** Starts a flight in `spec` at `placement` (see placeAircraft). */
  sim.start = function start(spec, placement, { birds = true, random = Math.random } = {}) {
    sim.body = createAircraftBody(spec);
    placeAircraft(sim.body, placement);
    sim.damage = createDamageTracker({ birds, random });
    sim.landing = createLandingMonitor(placement.speed > 10);
    sim.ended = null;
    sim.recorder.clear();
    sim.accumulator = 0;
    sim.flightTime = 0;
    sim.distance = 0;
    sim.history = { stall: null, engineOut: null };
    if (placement.speed < 1) {
      for (let i = 0; i < 240; i += 1) stepOnce({ pitch: 0, roll: 0, yaw: 0, throttle: 0, brakes: 1 }, []);
      sim.body.time = 0;
    }
  };

  function stepOnce(controls, events) {
    const body = sim.body;
    const before = body.position.clone();
    const wasRunning = body.engine.running;
    stepAircraft(body, world, wind, controls, PHYSICS_STEP);
    if (wasRunning && !body.engine.running) {
      events.push({ kind: 'engine-out', cause: body.engine.failureCause });
      sim.history.engineOut = { time: body.time, aglFt: Math.round(body.agl * 3.281), cause: body.engine.failureCause };
    }
    if (!body.onGround && body.stall > 0.55 && (!sim.history.stall || body.time - sim.history.stall.time > 9)) {
      sim.history.stall = { time: body.time, aglFt: Math.round(body.agl * 3.281), kt: Math.round(body.airspeed * 1.944), flaps: body.flapSetting };
    }
    sim.distance += before.distanceTo(body.position);
    if (!body.onGround) sim.flightTime += PHYSICS_STEP;
    for (const e of stepDamage(body, sim.damage, PHYSICS_STEP)) events.push(e);
    for (const e of stepLandingMonitor(sim.landing, body, world, PHYSICS_STEP)) {
      if (e.kind === 'touchdown' && !e.touchdown.water) {
        if (e.touchdown.fpm > body.spec.gearCollapseFpm) {
          sim.ended = { severity: 'crash', cause: explainCrash(`The gear collapsed on a ${e.touchdown.fpm} fpm touchdown`, body, sim.history), place: e.touchdown.place };
        } else {
          const hurt = applyTouchdownDamage(body, sim.damage, e.touchdown.fpm);
          if (hurt) events.push(hurt);
        }
      }
      events.push(e);
    }
    if (!sim.ended) {
      sim.ended = detectCrash(body, world);
      if (sim.ended?.severity === 'crash') sim.ended.cause = explainCrash(sim.ended.cause, body, sim.history);
    }
    if (sim.ended) events.push({ kind: 'ended', result: sim.ended });
    sim.recorder.record(body, PHYSICS_STEP);
  }

  /** Advances by a frame's dt in fixed steps; returns the events of those steps. */
  sim.advance = function advance(controls, dt) {
    const events = [];
    if (!sim.body || sim.ended) return events;
    sim.accumulator += Math.min(dt, 0.1);
    while (sim.accumulator >= PHYSICS_STEP && !sim.ended) {
      wind.advance(PHYSICS_STEP);
      stepOnce(controls, events);
      sim.accumulator -= PHYSICS_STEP;
    }
    return events;
  };

  return sim;
}
