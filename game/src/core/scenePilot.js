// A plain autopilot for the screenshot scenes: it flies the real aircraft through the real
// controls, one fixed game frame at a time, the way a steady pilot would: a take-off and climb,
// a ring course flown gate to gate (slowing for a last gate on final), and an approach down the
// glide path with flaps, a flare, the brakes and a stop. It answers a bingo decision when one
// opens. Everything it touches (fuel, damage, discipline, bonus goals, the recorder) is real.
import * as THREE from 'three';

const STEP = 1 / 60;
const KT = 1.94384;
const clamp = THREE.MathUtils.clamp;
const angleDiff = (a, b) => ((a - b + 540) % 360) - 180;
const bearingTo = (from, to) => (THREE.MathUtils.radToDeg(Math.atan2(to.x - from.x, -(to.z - from.z))) + 360) % 360;

/** Creates the pilot over the game director. */
export function createScenePilot(game, { answerCommit = true } = {}) {
  const c = game.controls.controls;
  const queue = [];
  let throttleTarget = c.throttle;
  let runwayHeading = null;
  let bingoSeen = 0;
  let commitSeen = 0;
  let lastObjective = null;
  let stageStart = null;

  const body = () => game.session.body;

  function steer(heading, maxBank) {
    const b = body();
    const want = clamp(angleDiff(heading, b.heading) * 1.4, -maxBank, maxBank);
    c.roll = clamp((want - b.bank) * 0.07, -0.7, 0.7);
    // A little rudder into the slip keeps the ball near the middle.
    c.yaw = b.onGround ? 0 : clamp(b.beta * 2.5, -0.6, 0.6);
  }

  function holdVerticalSpeed(vs, gain = 0.08) {
    const b = body();
    // With flight assist the stick commands load factor, so a gentle gain on the sink-rate error
    // settles the path in about half a second without porpoising.
    c.pitch = clamp((vs - b.verticalSpeed) * gain + 0.02, -0.35, 0.45);
  }

  function powerFor(speed, base = 0.35) {
    throttleTarget = clamp(base + (speed - body().airspeed) * 0.12, 0.05, 1);
  }

  function takeoff(o) {
    const b = body();
    if (runwayHeading === null) runwayHeading = b.heading;
    throttleTarget = 1;
    if (b.onGround) {
      c.yaw = clamp(angleDiff(runwayHeading, b.heading) * 0.12, -1, 1);
      c.pitch = b.airspeed > b.spec.vRotate ? 0.3 : 0;
      c.roll = clamp(-b.bank * 0.03, -0.4, 0.4);
      c.brakes = 0;
      return;
    }
    c.yaw = 0;
    // Climb at the climb speed: faster than it, climb more steeply; slower, less. Never sink near
    // the ground. From 150 ft turn for whatever comes next.
    const turn = b.agl * 3.281 > 150 ? game.runner.bearing() : null;
    steer(turn ?? runwayHeading, 20);
    let vs = clamp(2.5 + (b.airspeed - b.spec.vRotate * 1.35) * 0.5, -1, 5);
    if (b.agl * 3.281 < 50) vs = Math.max(vs, 1.5);
    holdVerticalSpeed(vs);
    void o;
  }

  function rings(o) {
    const b = body();
    const ring = o.rings[o.next];
    if (!ring) return;
    const nextStage = game.runner.mission?.stages[game.runner.stageIndex + 1];
    const finalGate = o.next === o.rings.length - 1 && nextStage?.type === 'land';
    const p = ring.position;
    // Pure pursuit along the line through the ring centres: aim at a point a fixed look-ahead
    // down the path from where the aircraft is, so turns start early and every ring is passed
    // close to its centre.
    const prev = o.next > 0 ? o.rings[o.next - 1].position : stageStart ?? p.clone().addScaledVector(ring.normal, -300);
    const path = [prev, ...o.rings.slice(o.next).map((r) => r.position)];
    const look = Math.max(90, b.airspeed * 1.8);
    const sx = path[1].x - path[0].x;
    const sz = path[1].z - path[0].z;
    const segLen = Math.max(1, Math.hypot(sx, sz));
    const along = THREE.MathUtils.clamp(((b.position.x - path[0].x) * sx + (b.position.z - path[0].z) * sz) / segLen, 0, segLen);
    let remaining = segLen - along + look;
    let aim = { x: path[1].x, z: path[1].z };
    let k = 0;
    while (k < path.length - 1) {
      const ax = path[k + 1].x - path[k].x;
      const az = path[k + 1].z - path[k].z;
      const len = Math.max(1, Math.hypot(ax, az));
      const start = k === 0 ? along : 0;
      if (k === 0) remaining = look;
      if (len - start >= remaining) {
        const f = (start + remaining) / len;
        aim = { x: path[k].x + ax * f, z: path[k].z + az * f };
        break;
      }
      remaining -= len - start;
      aim = { x: path[k + 1].x, z: path[k + 1].z };
      k += 1;
    }
    steer(bearingTo(b.position, aim), 40);
    // Climb or descend toward the ring's height, never faster than the airspeed above the climb
    // speed allows, so a long climb never bleeds her into a stall.
    const vsWanted = clamp((p.y - b.position.y) * 0.1, -4, 3.5);
    const vsCap = (b.airspeed - b.spec.vRotate * 1.25) * 0.8 + 2;
    holdVerticalSpeed(Math.min(vsWanted, vsCap));
    if (finalGate) {
      powerFor(b.spec.vApproach * 1.22, 0.3);
      if (b.flapSetting < 1 && b.airspeed * KT < 84) queue.push('flaps');
    } else throttleTarget = 1;
  }

  function landing(o) {
    const b = body();
    const guide = game.runner.guidance();
    const target = game.runner.approachTarget;
    if (!guide) {
      const t = o.target?.();
      if (b.onGround) {
        throttleTarget = 0;
        c.brakes = 1;
      } else if (t) steer(game.runner.bearing() ?? b.heading, 25);
      return;
    }
    const field = guide.field;
    const flareHeight = field.kind === 'platform' ? Math.min(b.agl, b.position.y - field.elevationResolved) : b.agl;
    // Down the glide path until short of the threshold; from 9 m a flare that eases the sink in
    // proportion to the height left, so she settles on at a hundred-odd feet a minute.
    const onPath = guide.distance > 60;
    const vsTarget = flareHeight > 9 ? -b.airspeed * Math.tan((3 * Math.PI) / 180) - (onPath ? guide.glideDev * 3 : 0) : -Math.max(0.45, flareHeight * 0.13);
    c.pitch = flareHeight > 9 ? clamp((vsTarget - b.verticalSpeed) * 0.14 + 0.02, -0.5, 0.6) : clamp((vsTarget - b.verticalSpeed) * 0.1, -0.4, 0.5);
    // Fly the ground track, not the heading, so the crosswind is crabbed out.
    const track = b.groundSpeed > 5 ? (THREE.MathUtils.radToDeg(Math.atan2(b.velocity.x, -b.velocity.z)) + 360) % 360 : b.heading;
    const wantTrack = guide.heading - clamp(guide.lateral * 0.35, -35, 35);
    const hdgErr = angleDiff(wantTrack, b.onGround ? b.heading : track);
    const maxBank = guide.distance > 1500 ? 25 : 15;
    c.roll = clamp((clamp(hdgErr * 1.5, -maxBank, maxBank) - b.bank) * 0.08, -0.6, 0.6);
    c.yaw = b.onGround ? clamp(angleDiff(guide.heading, b.heading) * 0.1 - guide.lateral * 0.02, -1, 1) : 0;
    const speed = (target?.targetKt ?? b.spec.vApproach * KT) / KT;
    if (b.onGround || b.agl < 2.5) throttleTarget = 0;
    else if (flareHeight < 9) throttleTarget = Math.min(throttleTarget, 0.25);
    else powerFor(speed, 0.45);
    c.brakes = b.onGround ? 1 : 0;
    const kt = b.airspeed * KT;
    if (guide.distance < 4000 && b.flapSetting < 1 && kt < 85) queue.push('flaps');
    else if (guide.distance < 2600 && b.flapSetting === 1 && kt < 76) queue.push('flaps');
  }

  return {
    /** Queues an action (as a key press would) for the next frame. */
    act(name) {
      queue.push(name);
    },
    /** One fixed game frame flown by the pilot (`render` draws it too). Returns false once the flight has ended. */
    frame(onBingo = 'press-on', render = false) {
      if (game.state !== 'flying') return false;
      const o = game.runner.objective;
      if (o !== lastObjective) {
        lastObjective = o;
        stageStart = body().position.clone();
      }
      if (o?.kind === 'takeoff') takeoff(o);
      else if (o?.kind === 'rings' || o?.kind === 'race') rings(o);
      else if (o?.kind === 'landing' || o?.kind === 'water-landing') landing(o);
      if (game.runner.bingo?.pending) {
        bingoSeen += 1;
        // A pilot reads the panel for a few seconds, then answers with the key.
        if (bingoSeen === 200) queue.push(onBingo === 'divert' ? 'divert' : 'pressOn');
      }
      // The short-final call: read it, then commit to the landing with K.
      if (game.runner.commit?.pending) {
        commitSeen += 1;
        if (commitSeen === 240 && answerCommit) queue.push('pressOn');
      }
      c.throttle += clamp(throttleTarget - c.throttle, -0.5 * STEP, 0.5 * STEP);
      const unique = [...new Set(queue.splice(0))];
      if (render) game.frameFixed(STEP, unique);
      else game.updateFlying(STEP, unique, { quiet: true });
      return game.state === 'flying';
    },
    /** Flies until `stop()` is true or the flight ends; returns true if stopped by the condition. */
    flyUntil(stop, maxSeconds = 900, onBingo = 'press-on') {
      for (let i = 0; i < maxSeconds * 60; i += 1) {
        if (stop()) return true;
        if (!this.frame(onBingo)) return false;
      }
      return false;
    },
  };
}
