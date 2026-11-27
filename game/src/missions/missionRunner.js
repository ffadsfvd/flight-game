// Runs one mission (or free flight): builds the stage objectives, feeds them the flight events,
// advances stage by stage with radio calls, and fails the mission on a crash. Beside the main
// stages it runs the bonus goals, the live flying-discipline score, the flight data recorder, the
// fuel plan and the bingo decision (divert or press on). At the end it writes the result the
// debrief shows: score (main goals 75 + bonus goals 15 + discipline 10, less penalties), medal,
// pay and bonus credits, experience, the touchdown, fuel and damage, the decision and the record.
import { createTakeoffObjective } from './objectives/takeoffObjective.js';
import { createRingCourseObjective } from './objectives/ringCourseObjective.js';
import { createLandingObjective } from './objectives/landingObjective.js';
import { createReachObjective } from './objectives/reachObjective.js';
import { createSupplyDropObjective } from './objectives/supplyDropObjective.js';
import { createFirefightingObjective } from './objectives/firefightingObjective.js';
import { createPhotoObjective } from './objectives/photoObjective.js';
import { createAerobaticsObjective } from './objectives/aerobaticsObjective.js';
import { createFormationObjective } from './objectives/formationObjective.js';
import { createSearchObjective } from './objectives/searchObjective.js';
import { createSightseeingObjective } from './objectives/sightseeingObjective.js';
import { createBonusGoalTracker } from './bonusGoals.js';
import { createFlyingDiscipline } from './flyingDiscipline.js';
import { createBingoDecision, DIVERT_PAY } from './bingoDecision.js';
import { createFlightDataRecorder } from '../flight/flightDataRecorder.js';
import { createFuelPlanner } from '../flight/fuelPlanner.js';
import { damageEffects, overallCondition } from '../flight/damageModel.js';
import { airfieldById, nearestAirfield } from '../world/airfieldDirectory.js';
import { CHAPTERS, medalFor } from './missionCatalog.js';

const KT = 1.94384;

const FACTORIES = {
  takeoff: createTakeoffObjective,
  rings: createRingCourseObjective,
  land: createLandingObjective,
  reach: createReachObjective,
  'supply-drop': createSupplyDropObjective,
  firefighting: createFirefightingObjective,
  photo: createPhotoObjective,
  aerobatics: createAerobaticsObjective,
  formation: createFormationObjective,
  search: createSearchObjective,
  sightseeing: createSightseeingObjective,
};

const DAMAGE_MARKS = { bird: 'BIRD STRIKE', overstress: 'OVER-G', overspeed: 'OVERSPEED', 'hard-landing': 'HARD LANDING', flaps: 'FLAPS JAMMED', gear: 'GEAR DAMAGED', 'engine-out': 'ENGINE OUT' };

/** A short checklist line for a main stage. */
export function stageGoal(stage) {
  if (stage.goal) return stage.goal;
  if (stage.label && stage.label.length <= 34) return stage.label;
  const n = stage.course?.length ?? 0;
  switch (stage.type) {
    case 'takeoff': return `Take off, climb to ${stage.altitudeFt ?? 800} ft`;
    case 'rings': return stage.rivals ? `Race through ${n} gates` : stage.engineOff ? `Soar through ${n} rings` : `Fly the ${n} rings`;
    case 'land': return stage.failEngine ? 'Glide to a runway and land' : stage.field === 'nearest' ? 'Land at the nearest field' : `Land at ${airfieldById(stage.field).name}`;
    case 'reach': return `Fly to ${stage.name}`;
    case 'supply-drop': return 'Drop supplies on the flare';
    case 'firefighting': return 'Put out the fire';
    case 'photo': return `Photograph ${stage.targets.length} landmarks`;
    case 'aerobatics': return `Fly ${stage.figures.length} display figures`;
    case 'formation': return "Hold the leader's wing";
    case 'search': return 'Find the boat in the dark';
    case 'sightseeing': return `Show the ${stage.sights.length} sights`;
    default: return stage.type;
  }
}

function formatTime(t) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
}

/** Creates a runner around the shared mission context (see gameDirector). */
export function createMissionRunner(ctx) {
  let mission = null;
  let objectives = [];
  let stageDefs = [];
  let index = 0;
  let result = null;
  let cleanups = [];
  let landings = [];
  let bonus = null;
  let discipline = createFlyingDiscipline();
  let bingo = createBingoDecision(null);
  let approach = null;
  let startFuel = 0;
  let damageLog = [];
  let diverted = null;
  const recorder = createFlightDataRecorder();
  const planner = createFuelPlanner();

  /** The mission's next landing from the current stage on: { field, distance } or null. */
  function destination() {
    for (let i = index; i < stageDefs.length; i += 1) {
      const s = stageDefs[i];
      if (s.type !== 'land' || s.failEngine) continue;
      const target = objectives[i]?.target?.();
      const id = i === index && target ? target.fieldId : s.field;
      if (!id || id === 'nearest') return null;
      const field = airfieldById(id);
      return { field, distance: Math.hypot(field.x - ctx.body.position.x, field.z - ctx.body.position.z) };
    }
    return null;
  }

  function report(r) {
    discipline.onReport(r);
    bonus?.onReport(r);
    if (r.kind === 'ring') recorder.mark('ring', `${r.hit ? '' : '✗'}${r.n}`, { hit: r.hit });
    else if (r.kind === 'drop') recorder.mark('drop', 'DROP');
    else if (r.kind === 'release') recorder.mark('drop', 'CRATE');
    else if (r.kind === 'photo') recorder.mark('photo', 'PHOTO');
    else if (r.kind === 'figure') recorder.mark('ring', r.name.split(' ')[0].toUpperCase());
    else if (r.kind === 'sight') recorder.mark('photo', 'SIGHT');
    else if (r.kind === 'contact') recorder.mark('photo', 'CONTACT');
  }

  function noteSimEvent(e) {
    discipline.onSimEvent(e);
    if (mission) bonus?.onSimEvent(e, runner);
    if (e.kind === 'liftoff') recorder.mark('takeoff', 'TAKE-OFF');
    else if (e.kind === 'touchdown') recorder.mark('touchdown', e.touchdown.water ? 'SPLASHDOWN' : 'TOUCHDOWN', { fpm: e.touchdown.fpm });
    else if (DAMAGE_MARKS[e.kind]) {
      recorder.mark('damage', DAMAGE_MARKS[e.kind]);
      damageLog.push({ t: ctx.time, kind: e.kind, text: e.text ?? `Engine failure: ${e.cause}` });
    } else if (e.kind === 'ended') recorder.mark('crash', e.result.severity === 'ditch' ? 'DITCHED' : e.result.severity === 'belly' ? 'BELLY' : 'CRASH');
  }

  function decide(kind, auto = false) {
    if (!bingo.choose(kind, ctx.time, ctx.body, auto)) return;
    const d = bingo.decision;
    const who = mission.giver ?? 'dario';
    if (kind === 'divert') {
      recorder.mark('decision', 'DIVERT');
      objectives[index]?.end?.(ctx);
      const stage = { type: 'land', field: d.nearest.id, goal: `Divert: land at ${d.nearest.name}`, label: `Divert: land at ${d.nearest.name}`, say: [who, `Copy, diverting to ${d.nearest.name}. Good call, land on your reserve and we'll sort the rest.`] };
      const landing = createLandingObjective(stage);
      objectives.splice(index, objectives.length - index, landing);
      stageDefs.splice(index, stageDefs.length - index, stage);
      diverted = { field: d.nearest, stagesDone: index, stages: mission.stages.length };
      landing.begin(ctx);
      ctx.toast(`DIVERTING TO ${d.nearest.code}`, 'good');
    } else {
      recorder.mark('decision', 'PRESS ON');
      ctx.radio(who, auto ? 'No answer, so you are pressing on. Lean the mixture and fly it straight.' : `Pressing on${d.dest ? ` to ${d.dest.name}` : ''}. Watch that gauge and fly it straight.`, { priority: true });
      ctx.toast('PRESSING ON BELOW BINGO', 'bad');
    }
  }

  const runner = {
    get mission() {
      return mission;
    },
    get result() {
      return result;
    },
    get stageIndex() {
      return index;
    },
    get objective() {
      return objectives[index] ?? null;
    },
    get discipline() {
      return discipline;
    },
    get bonus() {
      return bonus;
    },
    get recorder() {
      return recorder;
    },
    get fuelPlan() {
      return planner.plan;
    },
    get bingo() {
      return bingo;
    },
    /** The approach speed the final is judged against (kt), with an allowance for gusts. */
    get approachTarget() {
      return approach;
    },
    /** Starts `def` (a catalogue mission) or free flight when def is null. */
    start(def) {
      runner.stop();
      mission = def;
      result = null;
      index = 0;
      landings = [];
      damageLog = [];
      diverted = null;
      ctx.time = 0;
      ctx.cleanup = (fn) => cleanups.push(fn);
      ctx.report = report;
      const spec = ctx.body.spec;
      const gustKt = Math.max(0, ((def?.wind?.gust ?? 1) - 1) * KT);
      approach = { targetKt: spec.vApproach * KT + gustKt * 0.5, toleranceKt: 7 + gustKt * 0.4 };
      discipline = createFlyingDiscipline();
      bonus = def ? createBonusGoalTracker(def, spec) : null;
      bingo = createBingoDecision(def);
      recorder.reset();
      planner.reset();
      startFuel = ctx.body.engine.fuel;
      stageDefs = def ? def.stages.slice() : [];
      objectives = stageDefs.map((stage) => FACTORIES[stage.type](stage));
      if (objectives[0]) objectives[0].begin(ctx);
    },
    stop() {
      for (const fn of cleanups) fn();
      cleanups = [];
      ctx.effects.clearMissionEffects();
      objectives = [];
      mission = null;
    },
    /** Jumps straight to stage `target` (used by the screenshot scenes and tests). */
    skipTo(target) {
      while (index < target && index < objectives.length - 1) {
        objectives[index].end?.(ctx);
        index += 1;
        objectives[index].begin(ctx);
      }
      return objectives[index];
    },
    /** Passes simulation events and actions; advances the current stage. */
    update(dt, events, actions) {
      if (result) return result;
      ctx.time += dt;
      const body = ctx.body;
      planner.update(body, dt);
      recorder.record(body, dt);
      for (const e of events) {
        if (e.kind === 'landed') landings.push(e.report);
        noteSimEvent(e);
        if (e.kind === 'ended') return finish(false, e.result);
        for (const o of objectives.slice(index, index + 1)) o.onEvent?.(e, ctx);
      }
      const current = objectives[index];
      const guide = runner.guidance();
      discipline.update(dt, body, ctx.controls, guide, { kind: current?.kind ?? 'free', approach: guide ? approach : null });
      if (!mission) return null;
      bonus.update(dt, ctx, runner, approach);
      for (const a of actions) {
        if (a === 'divert' || a === 'pressOn') {
          if (bingo.pending) decide(a === 'divert' ? 'divert' : 'press-on');
        } else current?.onAction?.(a, ctx);
      }
      const offer = bingo.update(dt, body, planner.plan, destination(), ctx.time);
      if (offer === 'offer') {
        const d = bingo.decision;
        recorder.mark('decision', 'BINGO');
        ctx.sound('warning');
        ctx.toast('BINGO FUEL · J DIVERT · K PRESS ON', 'bad');
        ctx.radio(mission.giver ?? 'dario', `That's bingo fuel, ${Math.round(d.fuelKg)} kilos. ${d.nearest.name} is ${d.nearestNm.toFixed(1)} miles: divert there, or press on${d.dest ? ` to ${d.dest.name}` : ''} on a thin reserve?`, { priority: true });
      } else if (offer === 'timeout') decide('press-on', true);
      const active = objectives[index];
      if (!active) return null;
      const status = active.update(dt, ctx);
      if (status === 'failed') return finish(false, { severity: 'fail', cause: active.failedReason ?? 'Objective failed', place: '' });
      if (status === 'done') {
        active.end?.(ctx);
        index += 1;
        if (index >= objectives.length) return finish(true, null);
        ctx.sound('stage');
        ctx.toast(`STAGE ${index + 1} OF ${objectives.length}`, 'good');
        objectives[index].begin(ctx);
      }
      return null;
    },
    /** The checklist of main goals (a window of four around the current one) and bonus goals. */
    checklist() {
      if (!mission) return [];
      const from = stageDefs.length > 4 ? Math.max(0, Math.min(index - 1, stageDefs.length - 4)) : 0;
      const main = stageDefs.slice(from, from + 4).map((s, k) => {
        const i = from + k;
        return { text: stageGoal(s), status: i < index ? 'met' : i === index ? 'current' : 'open', main: true };
      });
      const extra = (bonus?.goals ?? []).map((g) => ({ text: g.label, status: g.status, reward: g.reward, detail: g.detail, main: false }));
      return [...main, ...extra];
    },
    /** What the mission tracker shows. */
    trackerInfo() {
      const disc = { points: discipline.state.points, multiplier: discipline.multiplier, streak: discipline.state.streak, last: discipline.state.last };
      if (!mission) {
        const b = ctx.body;
        const near = nearestAirfield(b.position.x, b.position.z);
        const last = landings.at(-1);
        return {
          chapter: 'Free flight',
          title: 'Solvara Archipelago',
          stage: 0,
          stages: 0,
          objective: b.onGround ? 'Take off when ready (Shift for power)' : `Explore. Nearest field: ${near.field.name}`,
          next: last ? `Last landing: ${last.grade} (${last.fpm} fpm)` : 'Land anywhere for a graded landing; R refuels at an airfield',
          stats: [['NEAREST', `${(near.distance / 1852).toFixed(1)} NM`], ['LANDINGS', String(landings.length)], ['FLIGHT', `${Math.floor(ctx.sim.flightTime / 60)}:${String(Math.floor(ctx.sim.flightTime % 60)).padStart(2, '0')}`]],
          progress: 0,
          goals: [],
          discipline: disc,
        };
      }
      const chapter = CHAPTERS.find((c) => c.id === mission.chapter);
      const o = objectives[Math.min(index, objectives.length - 1)];
      const info = o.info(ctx);
      return { chapter: `Chapter ${mission.chapter} · ${chapter?.name ?? ''} · ${mission.kind}`, title: mission.title, stage: Math.min(index + 1, objectives.length), stages: objectives.length, status: formatTime(ctx.time), ...info, progress: (index + Math.max(0, Math.min(1, info.progress ?? 0))) / objectives.length, goals: runner.checklist(), discipline: disc };
    },
    /** The bingo choice for the HUD's decision panel, or null. */
    decisionPanel() {
      return mission ? bingo.panel(mission.reward?.money ?? 0) : null;
    },
    markers() {
      return objectives[index]?.markers(ctx) ?? [];
    },
    others() {
      return objectives[index]?.others?.(ctx) ?? [];
    },
    guidance() {
      return objectives[index]?.guidance(ctx) ?? null;
    },
    bearing() {
      return objectives[index]?.bearing?.(ctx) ?? null;
    },
    /** The ring speed band (kt) of the current stage, for the speed tape. */
    speedBand() {
      return objectives[index]?.band ?? null;
    },
    /** Ends a free flight at the pilot's request: a logged flight with its record, no score. */
    endFreeFlight() {
      const r = finish(true, null);
      Object.assign(r, { score: 0, medal: 'none', money: 0, xp: 20, cause: 'Free flight ended by the pilot.' });
      return r;
    },
    load() {
      const o = objectives[index];
      if (o?.load) return o.load(ctx);
      if (ctx.body.payload > 0) return { label: 'CARGO', fraction: Math.min(1, ctx.body.payload / Math.max(1, ctx.body.spec.cargoCapacity)), text: `${Math.round(ctx.body.payload)}kg`, color: '#c8a06a' };
      return null;
    },
  };

  function finish(completed, ending) {
    const body = ctx.body;
    const spec = body.spec;
    const scores = objectives.map((o) => o.score ?? 0);
    const main = objectives.length ? scores.reduce((s, v) => s + v, 0) / objectives.length : 0;
    const success = completed && !diverted;
    const rows = [];
    for (const o of objectives) for (const r of o.rows ?? []) rows.push(r);
    const severityCondition = { crash: 0, ditch: 0.3, belly: 0.5 }[ending?.severity];
    const condition = severityCondition ?? overallCondition(body);
    const penalties = [];
    if (mission?.cargo && success) {
      rows.push(['Cargo condition', `${Math.round(Math.max(0, condition) * 100)}%`]);
      if (condition < 0.995) penalties.push({ item: 'Cargo damage', points: Math.round(main * 0.4 * (1 - condition) * 0.75) });
    }
    // Icing missions reward running the anti-ice: a wing that carried heavy ice costs up to 40%.
    if (mission?.icing) {
      const peak = ctx.sim.peakIce ?? 0;
      rows.push(['Worst ice load', `${Math.round(peak * 100)}%`]);
      const factor = Math.max(0, Math.min(1, (peak - 0.2) / 0.8));
      if (success && factor > 0) penalties.push({ item: 'Ice on the wings', points: Math.round(main * 0.4 * factor * 0.75) });
    }
    const bonusResult = bonus ? bonus.finish(success, ctx) : { met: 0, total: 0, points: 0, credits: 0 };
    const disc = discipline.summary();
    const mainPoints = Math.round(main * 0.75);
    const penaltyPoints = penalties.reduce((s, p) => s + p.points, 0);
    const score = success ? Math.max(0, Math.min(100, mainPoints - penaltyPoints + bonusResult.points + disc.scorePoints)) : 0;
    const breakdown = [
      { item: 'Main goals', value: `${Math.round(main)} / 100`, points: success ? mainPoints : 0, max: 75 },
      { item: 'Bonus goals', value: `${bonusResult.met} of ${bonusResult.total}`, points: bonusResult.points, max: 15 },
      { item: 'Flying discipline', value: `${disc.good} clean · ${disc.faults} faults`, points: success ? disc.scorePoints : 0, max: 10 },
      ...penalties.map((p) => ({ item: p.item, value: '', points: -p.points, max: 0 })),
    ];
    rows.push(['Fuel used', `${Math.round(body.engine.fuelUsed)} kg`], ['Aircraft condition', `${Math.round(condition * 100)}%`], ['Mission time', formatTime(ctx.time)]);
    const medal = success ? medalFor(mission, score) : 'none';
    const reward = mission?.reward ?? { money: 0, xp: 0 };
    let money = success ? Math.round(reward.money * (0.5 + score / 200)) + bonusResult.credits : 0;
    let xp = success ? Math.round(reward.xp * ({ gold: 1.3, silver: 1.1, bronze: 1, none: 0.8 }[medal])) : Math.round(reward.xp * 0.1);
    if (diverted && completed) {
      money = Math.round(reward.money * DIVERT_PAY);
      xp = Math.round(reward.xp * 0.5);
    }
    // A crash, ditching or belly landing is repaired at once; lesser damage waits for the turnaround.
    const repairs = severityCondition !== undefined ? Math.round((1 - condition) * 500) : 0;
    const landing = objectives.map((o) => o.report).filter(Boolean).at(-1) ?? landings.at(-1) ?? null;
    const impact = ending && ending.severity !== 'fail' ? { kt: Math.round(body.airspeed * KT), fpm: Math.max(0, Math.round(-body.verticalSpeed * 196.85)), pitch: Math.round(body.pitch), bank: Math.round(body.bank), flaps: body.flapSetting, gear: body.gearDown, engine: body.engine.running, fuelKg: Math.round(body.engine.fuel ?? 0) } : null;
    const d = bingo.decision;
    let decision = null;
    if (d && d.state !== 'pending') {
      const fullPay = reward.money;
      decision = {
        kind: d.state,
        auto: d.auto,
        at: d.at,
        fuelKg: Math.round(d.fuelKg),
        reserveKg: Math.round(d.reserveKg),
        field: d.nearest.name,
        dest: d.dest?.name ?? null,
        fuelEnd: Math.round(body.engine.fuel),
        outcome: d.state === 'divert'
          ? (completed ? `Diverted to ${d.nearest.name}: landed safe with ${Math.round(body.engine.fuel)} kg, paid ${money} of ${fullPay} cr` : `Diverted to ${d.nearest.name}, but did not get down there`)
          : (success ? `Pressed on: full pay ${money} cr (a divert paid ${Math.round(fullPay * DIVERT_PAY)}), landed with ${Math.round(body.engine.fuel)} kg against a ${Math.round(d.reserveKg)} kg reserve` : `Pressed on below bingo${body.engine.fuel < 0.5 ? ' and ran the tank dry' : ''}`),
      };
      rows.push(['Bingo decision', d.state === 'divert' ? `diverted at ${Math.round(d.fuelKg)} kg` : `pressed on at ${Math.round(d.fuelKg)} kg`]);
    }
    const cause = diverted && completed
      ? `Diverted to ${diverted.field.name} at bingo fuel after ${diverted.stagesDone} of ${diverted.stages} stages: a safe landing on the reserve, ${DIVERT_PAY * 100}% of the pay.`
      : ending ? `${ending.cause}${ending.place ? ` ${ending.place}` : ''}.` : null;
    const plan = planner.plan;
    result = {
      success,
      missionId: mission?.id ?? null,
      title: mission?.title ?? 'Free flight',
      chapter: mission ? CHAPTERS.find((c) => c.id === mission.chapter) : null,
      kind: mission?.kind ?? 'Free flight',
      aircraft: spec.name,
      severity: diverted && completed ? 'divert' : ending?.severity ?? null,
      cause,
      score,
      medal,
      medals: mission ? { gold: 85, silver: 65, bronze: 40, ...(mission.medals ?? {}) } : null,
      money,
      basePay: success ? money - bonusResult.credits : money,
      repairs,
      xp,
      rows,
      breakdown,
      bonus: { goals: (bonus?.goals ?? []).map((g) => ({ label: g.label, status: g.status, reward: g.reward, detail: g.detail })), ...bonusResult },
      discipline: disc,
      decision,
      landing,
      targetKt: approach ? Math.round(approach.targetKt) : null,
      impact,
      fuel: { start: Math.round(startFuel), used: Math.round(body.engine.fuelUsed), end: Math.round(body.engine.fuel), reserve: Math.round(plan.reserveKg) },
      damage: { log: damageLog.slice(), effects: damageEffects(body), engine: body.engine.health, airframe: body.airframe, gear: body.gearHealth, condition },
      record: recorder.snapshot(),
      time: ctx.time,
      courseTime: objectives.find((o) => o.time)?.time ?? null,
    };
    return result;
  }

  return runner;
}
