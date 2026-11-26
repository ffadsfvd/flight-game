// Runs one mission (or free flight): builds the stage objectives, feeds them the flight events,
// advances stage by stage with radio calls, fails the mission on a crash, and writes the result:
// score, medal, pay, experience and the breakdown rows the results screen shows.
import { CHAPTERS, medalFor } from './missionCatalog.js';
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
import { overallCondition } from '../flight/damageModel.js';
import { nearestAirfield } from '../world/airfieldDirectory.js';

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
};

/** Creates a runner around the shared mission context (see gameDirector). */
export function createMissionRunner(ctx) {
  let mission = null;
  let objectives = [];
  let index = 0;
  let result = null;
  let cleanups = [];
  let landings = [];
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
    /** Starts `def` (a catalogue mission) or free flight when def is null. */
    start(def) {
      runner.stop();
      mission = def;
      result = null;
      index = 0;
      landings = [];
      ctx.time = 0;
      ctx.cleanup = (fn) => cleanups.push(fn);
      objectives = def ? def.stages.map((stage) => FACTORIES[stage.type](stage)) : [];
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
      for (const e of events) {
        if (e.kind === 'landed') landings.push(e.report);
        if (e.kind === 'ended') return finish(false, e.result);
        for (const o of objectives.slice(index, index + 1)) o.onEvent?.(e, ctx);
      }
      if (!mission) return null;
      const current = objectives[index];
      for (const a of actions) current?.onAction?.(a, ctx);
      if (!current) return null;
      const status = current.update(dt, ctx);
      if (status === 'failed') return finish(false, { severity: 'fail', cause: current.failedReason ?? 'Objective failed', place: '' });
      if (status === 'done') {
        current.end?.(ctx);
        index += 1;
        if (index >= objectives.length) return finish(true, null);
        ctx.sound('stage');
        ctx.toast(`STAGE ${index + 1} OF ${objectives.length}`, 'good');
        objectives[index].begin(ctx);
      }
      return null;
    },
    /** What the mission tracker shows. */
    trackerInfo() {
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
        };
      }
      const chapter = CHAPTERS.find((c) => c.id === mission.chapter);
      const o = objectives[Math.min(index, objectives.length - 1)];
      const info = o.info(ctx);
      return { chapter: `Chapter ${mission.chapter} · ${chapter?.name ?? ''} · ${mission.kind}`, title: mission.title, stage: Math.min(index + 1, objectives.length), stages: objectives.length, status: formatTime(ctx.time), ...info, progress: (index + Math.max(0, Math.min(1, info.progress ?? 0))) / objectives.length };
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
    load() {
      const o = objectives[index];
      if (o?.load) return o.load(ctx);
      if (ctx.body.payload > 0) return { label: 'CARGO', fraction: Math.min(1, ctx.body.payload / Math.max(1, ctx.body.spec.cargoCapacity)), text: `${Math.round(ctx.body.payload)}kg`, color: '#c8a06a' };
      return null;
    },
  };

  function finish(success, ending) {
    const scores = objectives.map((o) => o.score ?? 0);
    const weighted = objectives.length ? scores.reduce((s, v) => s + v, 0) / objectives.length : 0;
    let score = success ? Math.round(weighted) : 0;
    const rows = [];
    for (const o of objectives) for (const r of o.rows ?? []) rows.push(r);
    const body = ctx.body;
    const severityCondition = { crash: 0, ditch: 0.3, belly: 0.5 }[ending?.severity];
    const condition = severityCondition ?? overallCondition(body);
    if (mission?.cargo && success) {
      const cargo = Math.round(Math.max(0, condition) * 100);
      rows.push(['Cargo condition', `${cargo}%`]);
      score = Math.round(score * (0.6 + 0.4 * condition));
    }
    // Icing missions reward running the anti-ice: a wing that carried heavy ice costs up to 40%.
    if (mission?.icing) {
      const peak = ctx.sim.peakIce ?? 0;
      rows.push(['Worst ice load', `${Math.round(peak * 100)}%`]);
      if (success) score = Math.round(score * (1 - 0.4 * Math.max(0, Math.min(1, (peak - 0.2) / 0.8))));
    }
    rows.push(['Fuel used', `${Math.round(body.engine.fuelUsed)} kg`], ['Aircraft condition', `${Math.round(condition * 100)}%`], ['Mission time', formatTime(ctx.time)]);
    const medal = success ? medalFor(mission, score) : 'none';
    const reward = mission?.reward ?? { money: 0, xp: 0 };
    const money = success ? Math.round(reward.money * (0.5 + score / 200)) : 0;
    const repairs = Math.round((1 - condition) * 500);
    const xp = success ? Math.round(reward.xp * ({ gold: 1.3, silver: 1.1, bronze: 1, none: 0.8 }[medal])) : Math.round(reward.xp * 0.1);
    const landing = objectives.map((o) => o.report).filter(Boolean).at(-1) ?? landings.at(-1) ?? null;
    const impact = ending && ending.severity !== 'fail' ? { kt: Math.round(body.airspeed * 1.944), fpm: Math.max(0, Math.round(-body.verticalSpeed * 196.85)), pitch: Math.round(body.pitch), bank: Math.round(body.bank), flaps: body.flapSetting, gear: body.gearDown, engine: body.engine.running, fuelKg: Math.round(body.engine.fuel ?? 0) } : null;
    result = {
      success,
      missionId: mission?.id ?? null,
      title: mission?.title ?? 'Free flight',
      severity: ending?.severity ?? null,
      cause: ending ? `${ending.cause}${ending.place ? ` ${ending.place}` : ''}.` : null,
      score,
      medal,
      medals: mission ? { gold: 85, silver: 65, bronze: 40, ...(mission.medals ?? {}) } : null,
      money,
      repairs,
      xp,
      rows,
      landing,
      impact,
      time: ctx.time,
      courseTime: objectives.find((o) => o.time)?.time ?? null,
    };
    return result;
  }

  return runner;
}

function formatTime(t) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
}
