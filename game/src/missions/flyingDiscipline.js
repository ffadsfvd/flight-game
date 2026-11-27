// Flying discipline, scored live: points for the throttle and turn discipline a good pilot shows,
// each one growing a streak whose multiplier (x1 to x4) rewards keeping it up. Scored: every
// glide-path gate passed stable (on speed, on the path, on the centreline), coordinated turns
// with the ball in the middle, rings flown inside their speed band, smooth power, clean drops,
// photos and figures, and the landing itself. A fault (a stall warning, a power slam, an
// unstable gate, a skidding turn, over-G, a bounce) breaks the streak. One short line at a time
// tells the pilot what was scored; the debrief turns the record into points out of 10.
import { APPROACH_GATES, GLIDE_SLOPE_DEG } from '../world/approachGeometry.js';

const FT = 3.28084;
const KT = 1.94384;
const SLAM_WINDOW = 0.5;
const SLAM_CHANGE = 0.45;
const SMOOTH_POWER_EVERY = 45;

/** Streak multiplier for the number of good items in a row before this one. */
export function streakMultiplier(streak) {
  return Math.min(4, 1 + Math.floor(streak / 2));
}

/** Creates the scorer for one sortie. `options.kind` is the mission's main objective kind. */
export function createFlyingDiscipline() {
  const state = { points: 0, streak: 0, bestMultiplier: 1, bestStreak: 0, good: 0, faults: 0, last: null, lastFault: null, counts: {} };
  let popupId = 0;
  let turn = null;
  let levelTime = 0;
  let throttleLog = [];
  let slamCooldown = 0;
  let stallCooldown = 0;
  let smoothTimer = 0;
  let lastGateDistance = null;
  let gateField = null;
  let clock = 0;

  function award(item, label, base) {
    const mult = streakMultiplier(state.streak);
    const points = base * mult;
    state.points += points;
    state.streak += 1;
    state.good += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.bestMultiplier = Math.max(state.bestMultiplier, streakMultiplier(state.streak));
    state.counts[item] = (state.counts[item] ?? 0) + 1;
    state.last = { id: (popupId += 1), text: `+${points}${mult > 1 ? ` ×${mult}` : ''}  ${label}`, tone: 'good', time: clock };
  }

  function fault(item, label) {
    const broken = state.streak >= 2;
    state.streak = 0;
    state.faults += 1;
    state.counts[`fault:${item}`] = (state.counts[`fault:${item}`] ?? 0) + 1;
    state.lastFault = label;
    state.last = { id: (popupId += 1), text: `${broken ? 'STREAK LOST · ' : ''}${label}`, tone: 'bad', time: clock };
  }

  /** Judges a glide-path gate the aircraft has just flown through. */
  function judgeGate(g, body, approach) {
    const kt = body.airspeed * KT;
    const target = approach.targetKt;
    const tolerance = approach.toleranceKt;
    const speedErr = kt - target;
    const heightFt = Math.round(((g.height ?? 0) * FT) / 10) * 10;
    const errors = [
      [Math.abs(speedErr) / tolerance, speedErr > 0 ? `FAST +${Math.round(speedErr)} KT` : `SLOW ${Math.round(speedErr)} KT`],
      [Math.abs(g.glideDev) / 0.7, g.glideDev > 0 ? 'HIGH ON THE PATH' : 'LOW ON THE PATH'],
      [Math.abs(g.locDev) / 1.5, 'OFF THE CENTRELINE'],
    ].sort((a, b) => b[0] - a[0]);
    if (errors[0][0] <= 1) award('gate', `STABLE AT ${heightFt} FT`, 20);
    else fault('gate', `${errors[0][1]} AT ${heightFt} FT`);
  }

  return {
    state,
    get multiplier() {
      return streakMultiplier(state.streak);
    },
    /** Good items out of all judged ones, with one free good item so an empty record is clean. */
    rating() {
      return (state.good + 1) / (state.good + state.faults + 1);
    },
    /** Points out of 10 for the mission score. */
    scorePoints() {
      return Math.round(10 * this.rating());
    },
    /**
     * One frame: body, controls, guidance (null when not on an approach) and the stage context
     * { kind, approach: { targetKt, toleranceKt } }.
     */
    update(dt, body, controls, guidance, stage = {}) {
      clock += dt;
      slamCooldown -= dt;
      stallCooldown -= dt;
      const airborne = !body.onGround && body.agl > 3;
      const aerobatic = stage.kind === 'aerobatics' || stage.kind === 'race' || stage.kind === 'formation';

      // Smooth power: no slams of the throttle in the air; a slam breaks the streak.
      throttleLog.push([clock, controls.throttle]);
      while (throttleLog.length && throttleLog[0][0] < clock - SLAM_WINDOW) throttleLog.shift();
      if (airborne) {
        const span = Math.max(...throttleLog.map((t) => t[1])) - Math.min(...throttleLog.map((t) => t[1]));
        if (span > SLAM_CHANGE && slamCooldown <= 0 && body.stall < 0.3) {
          fault('power', 'POWER SLAMMED');
          slamCooldown = 8;
          smoothTimer = 0;
          throttleLog = [[clock, controls.throttle]];
        }
        smoothTimer += dt;
        if (smoothTimer >= SMOOTH_POWER_EVERY) {
          smoothTimer = 0;
          award('power', 'SMOOTH POWER', 10);
        }
        if (body.stall > 0.5 && stallCooldown <= 0 && stage.kind !== 'aerobatics') {
          fault('stall', 'STALL WARNING');
          stallCooldown = 8;
        }
      }

      // Turns: from 15° of bank until the wings are level again; judged on the ball and the bank.
      const bank = Math.abs(body.bank);
      if (airborne && body.agl * FT > 60 && bank > 15 && bank < 120) {
        if (!turn) turn = { start: body.heading, last: body.heading, turned: 0, time: 0, slip: 0, maxBank: 0 };
        const step = ((body.heading - turn.last + 540) % 360) - 180;
        turn.turned += step;
        turn.last = body.heading;
        turn.time += dt;
        turn.maxBank = Math.max(turn.maxBank, bank);
        if (Math.abs(body.beta) > 0.105) turn.slip += dt;
        levelTime = 0;
      } else if (turn) {
        levelTime += dt;
        if (levelTime > 0.8 || !airborne) {
          const t = turn;
          turn = null;
          if (Math.abs(t.turned) >= 30 && t.time > 2) {
            const low = body.agl * FT < 500;
            if (t.slip / t.time > 0.35) fault('turn', 'BALL OUT IN THE TURN');
            else if (!aerobatic && low && t.maxBank > 50) fault('turn', `STEEP TURN LOW · ${Math.round(t.maxBank)}°`);
            else award('turn', 'COORDINATED TURN', 15);
          }
        }
      }

      // The approach: each glide-path gate is judged as the aircraft flies through it.
      if (guidance && stage.approach && guidance.field.kind !== 'water') {
        const key = `${guidance.field.id}:${guidance.end}`;
        if (key !== gateField) {
          gateField = key;
          lastGateDistance = null;
        }
        const d = guidance.distance;
        if (lastGateDistance !== null && Math.abs(guidance.lateral) < 200 && airborne) {
          for (const gate of APPROACH_GATES) {
            if (lastGateDistance > gate && d <= gate) {
              const height = guidance.ideal ?? (12 + Math.tan((GLIDE_SLOPE_DEG * Math.PI) / 180) * gate);
              judgeGate({ ...guidance, height }, body, stage.approach);
            }
          }
        }
        lastGateDistance = d;
      } else {
        lastGateDistance = null;
      }
    },
    /** Flight-model events: damage faults, bounces and the landing grade. */
    onSimEvent(e) {
      if (e.kind === 'overstress') fault('g', 'OVER-G');
      else if (e.kind === 'overspeed') fault('speed', 'OVERSPEED');
      else if (e.kind === 'flaps') fault('flaps', 'FLAPS OVER THEIR SPEED');
      else if (e.kind === 'gear') fault('gear', 'GEAR OVER ITS SPEED');
      else if (e.kind === 'bounce') fault('bounce', 'BOUNCED');
      else if (e.kind === 'landed') {
        const g = e.report.grade;
        if (g === 'A+') award('landing', 'GREASER · A+', 50);
        else if (g === 'A') award('landing', 'GOOD LANDING · A', 35);
        else if (g === 'B') award('landing', 'LANDING · B', 20);
        else if (g === 'D' || g === 'F') fault('landing', `ROUGH LANDING · ${g}`);
      }
    },
    /** Mission reports from the objectives (rings, drops, crates, photos, figures...). */
    onReport(r) {
      if (r.kind === 'ring') {
        if (!r.hit) fault('ring', `MISSED RING ${r.n}`);
        else if (r.band) {
          const kt = Math.round(r.kt);
          if (kt >= r.band[0] && kt <= r.band[1]) award('ring', `RING ${r.n} IN THE BAND`, 20);
          else fault('ring', `RING ${r.n} ${kt < r.band[0] ? 'SLOW' : 'FAST'} ${kt} KT`);
        } else award('ring', `RING ${r.n}`, 10);
      } else if (r.kind === 'drop-hit') {
        if (r.knock > 0.12) award('drop', 'WATER ON THE FLAMES', 25);
        else fault('drop', 'DROP MISSED THE FIRE');
      } else if (r.kind === 'crate') {
        if (r.distance <= r.radius) award('crate', `CRATE ON TARGET · ${Math.round(r.distance)} M`, 25);
        else fault('crate', `CRATE WIDE · ${Math.round(r.distance)} M`);
      } else if (r.kind === 'photo') {
        if (r.score >= 80) award('photo', `SHARP PHOTO · ${r.score}%`, 20);
      } else if (r.kind === 'figure') {
        if (r.score >= 75) award('figure', `CLEAN ${r.name.toUpperCase()}`, 25);
      } else if (r.kind === 'sight') {
        if (r.comfort >= 80) award('sight', `SMOOTH PAST ${r.name.toUpperCase()}`, 15);
      } else if (r.kind === 'slot-hold') {
        award('slot', 'TIGHT FORMATION', 15);
      } else if (r.kind === 'contact') {
        award('search', 'CONTACT IN THE LIGHT', 30);
      }
    },
    /** What the debrief shows. */
    summary() {
      const faults = Object.entries(state.counts).filter(([k]) => k.startsWith('fault:')).map(([k, n]) => [k.slice(6), n]).sort((a, b) => b[1] - a[1]);
      return { points: state.points, good: state.good, faults: state.faults, bestStreak: state.bestStreak, bestMultiplier: state.bestMultiplier, rating: this.rating(), scorePoints: this.scorePoints(), topFaults: faults.slice(0, 3), counts: { ...state.counts } };
    },
  };
}
