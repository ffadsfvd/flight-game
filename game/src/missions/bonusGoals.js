// Bonus goals: two or three optional goals beside every mission's main stages, each with its own
// credit reward and a share of 15 score points, so they count in the medal. A mission may list
// its own (mission.bonus); otherwise they are drawn from what the mission asks for: a speed band
// or a par time on a ring course, a stable final and a soft touchdown on a landing, a fuel reserve
// on a multi-leg run, no damage, and the skill goal of each mission kind (drops, crates, photos,
// comfort, the formation slot, the figures, the search time, a race win, the ice load).
import { reserveFuel } from '../flight/fuelPlanner.js';
import { isDamaged } from '../flight/damageModel.js';

const KT = 1.94384;
const BONUS_POINTS = 15;

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const round5 = (v) => Math.round(v / 5) * 5;

/** The speed band (kt) a ring course is judged in: the stage's own, or one from the aircraft. */
export function ringSpeedBand(stage, spec) {
  if (stage.band) return stage.band;
  const v = spec.vApproach * KT;
  return [round5(v * 1.4), round5(v * 1.95)];
}

/** The goal's checklist text. */
function goalLabel(g) {
  switch (g.type) {
    case 'band': return `Every ring at ${g.min}-${g.max} kt`;
    case 'par': return `Course under ${clock(g.seconds)}`;
    case 'mission-par': return `Done within ${clock(g.seconds)}`;
    case 'clean': return 'Every ring flown through';
    case 'win': return 'Win the race';
    case 'stable': return 'Stable final: on speed, on the path';
    case 'soft': return `Touch down under ${g.fpm} fpm`;
    case 'zone': return 'Touch down in the zone';
    case 'reserve': return `Land with ${g.kg} kg reserve`;
    case 'intact': return 'No damage';
    case 'comfort': return `Comfort above ${g.pct}%`;
    case 'drops': return `Fire out in ${g.max} drops`;
    case 'crate': return `A crate within ${g.metres} m`;
    case 'photos': return `Every photo ${g.pct}%+`;
    case 'slot': return `${g.pct}% in the slot`;
    case 'figures': return `Every figure ${g.pct}%+`;
    case 'search': return `Found within ${g.minutes} min`;
    case 'ice': return `Ice under ${g.pct}%`;
    default: return g.type;
  }
}

/** The goals drawn from the mission's stages, before rewards and points are shared out. */
function derivedGoals(mission, spec) {
  const stages = mission.stages;
  const has = (type) => stages.find((s) => s.type === type);
  const rings = has('rings');
  const lands = stages.filter((s) => s.type === 'land');
  const lastLand = stages.at(-1).type === 'land' ? stages.at(-1) : null;
  const goals = [];
  if (rings?.rivals) goals.push({ type: 'win' }, { type: 'clean' });
  else if (rings?.engineOff) goals.push({ type: 'clean' });
  else if (rings) {
    const [min, max] = ringSpeedBand(rings, spec);
    goals.push({ type: 'band', min, max });
  }
  const firefight = has('firefighting');
  if (firefight) goals.push({ type: 'drops', max: firefight.fires.length + 2 });
  const drop = has('supply-drop');
  if (drop) goals.push({ type: 'crate', metres: Math.round((drop.radius ?? 60) * 0.35) });
  if (has('photo')) goals.push({ type: 'photos', pct: 75 });
  if (has('sightseeing')) goals.push({ type: 'comfort', pct: 85 });
  if (has('formation')) goals.push({ type: 'slot', pct: 75 });
  if (has('aerobatics')) goals.push({ type: 'figures', pct: 70 });
  const search = has('search');
  if (search) goals.push({ type: 'search', minutes: search.parMinutes ?? 3 });
  if (mission.icing) goals.push({ type: 'ice', pct: 25 });
  if (lastLand && lastLand.failEngine) goals.push({ type: 'zone' });
  else if (lastLand && !lastLand.water) goals.push({ type: 'stable' });
  else if (lastLand) goals.push({ type: 'soft', fpm: 200 });
  if (rings && !rings.rivals && !rings.engineOff && goals.length < 3 && !lastLand) goals.push({ type: 'par', seconds: rings.par ?? 120 });
  const multiLeg = lands.length > 1 || stages.some((s) => s.type === 'reach');
  if (multiLeg && lastLand) goals.push({ type: 'reserve', kg: Math.ceil(reserveFuel(spec)) });
  goals.push({ type: 'intact' });
  return goals.slice(0, 3);
}

/** The bonus goals of a mission, with labels, rewards (cr) and score points. */
export function bonusGoalsFor(mission, spec) {
  const list = (mission.bonus ?? derivedGoals(mission, spec)).slice(0, 3);
  const reward = Math.max(30, round5((mission.reward?.money ?? 300) * 0.12));
  let left = BONUS_POINTS;
  return list.map((g, i) => {
    const points = i === list.length - 1 ? left : Math.round(BONUS_POINTS / list.length);
    left -= points;
    return { ...g, id: `${g.type}-${i}`, label: g.label ?? goalLabel(g), reward: g.reward ?? reward, points };
  });
}

/** Tracks a mission's bonus goals through the sortie: open, met or failed, with a short detail. */
export function createBonusGoalTracker(mission, spec) {
  const goals = bonusGoalsFor(mission, spec).map((g) => ({ ...g, status: 'open', detail: '' }));
  const lastLandIndex = mission.stages.map((s) => s.type).lastIndexOf('land');
  let courseStart = null;
  let courseDone = false;
  let finalSeen = 0;
  let unstable = 0;
  let worstFinal = '';
  const set = (g, status, detail = g.detail) => {
    if (g.status === status && g.detail === detail) return;
    g.status = status;
    g.detail = detail;
  };
  const each = (type, fn) => {
    for (const g of goals) if (g.type === type) fn(g);
  };
  const onFinalStage = (runner) => runner.stageIndex === lastLandIndex;

  return {
    goals,
    /** Objective reports: rings, the course, drops, crates, photos, figures, tours and races. */
    onReport(r) {
      if (r.kind === 'course-start') courseStart = r.time;
      if (r.kind === 'ring') {
        each('band', (g) => {
          if (g.status !== 'open') return;
          if (!r.hit) set(g, 'failed', `missed ring ${r.n}`);
          else if (r.kt < g.min || r.kt > g.max) set(g, 'failed', `ring ${r.n} at ${Math.round(r.kt)} kt`);
          else g.detail = `${r.n} of ${r.total} in the band`;
        });
        if (!r.hit) each('clean', (g) => set(g, 'failed', `missed ring ${r.n}`));
      }
      if (r.kind === 'course-done') {
        courseDone = true;
        each('band', (g) => g.status === 'open' && set(g, 'met', `all ${r.total} in the band`));
        each('clean', (g) => g.status === 'open' && set(g, 'met', `${r.total} of ${r.total}`));
        each('par', (g) => set(g, r.time <= g.seconds ? 'met' : 'failed', `${r.time.toFixed(1)} s`));
      }
      if (r.kind === 'race-done') each('win', (g) => set(g, r.place === 1 ? 'met' : 'failed', `finished ${r.place}${['st', 'nd', 'rd'][r.place - 1] ?? 'th'}`));
      if (r.kind === 'drop') each('drops', (g) => g.status === 'open' && r.count > g.max && set(g, 'failed', `${r.count} drops`));
      if (r.kind === 'fire-out') each('drops', (g) => set(g, r.drops <= g.max ? 'met' : 'failed', `out in ${r.drops}`));
      if (r.kind === 'crate') each('crate', (g) => g.status === 'open' && r.distance <= g.metres && set(g, 'met', `${Math.round(r.distance)} m`));
      if (r.kind === 'crate') each('crate', (g) => g.status === 'open' && (g.detail = `best ${Math.round(r.best)} m`));
      if (r.kind === 'photo') each('photos', (g) => g.status === 'open' && r.score < g.pct && set(g, 'failed', `${r.name} ${r.score}%`));
      if (r.kind === 'figure') each('figures', (g) => g.status === 'open' && r.score < g.pct && set(g, 'failed', `${r.name} ${r.score}%`));
      if (r.kind === 'tour-done') each('comfort', (g) => g.status === 'open' && set(g, r.comfort >= g.pct ? 'met' : 'failed', `${Math.round(r.comfort)}%`));
      if (r.kind === 'formation-done') each('slot', (g) => set(g, r.pct >= g.pct ? 'met' : 'failed', `${r.pct}%`));
      if (r.kind === 'search-done') each('search', (g) => set(g, r.minutes <= g.minutes ? 'met' : 'failed', clock(r.minutes * 60)));
    },
    /** Flight-model events: the touchdown of the final landing. */
    onSimEvent(e, runner) {
      if (!onFinalStage(runner)) return;
      if (e.kind === 'landed') {
        const r = e.report;
        each('soft', (g) => set(g, r.fpm <= g.fpm ? 'met' : 'failed', `${r.fpm} fpm`));
        each('zone', (g) => set(g, r.runway && r.distance >= 100 && r.distance <= 450 ? 'met' : 'failed', r.runway ? `${Math.round(r.distance)} m in` : 'off the runway'));
      }
    },
    /** Live checks each frame: the final approach, the fuel, damage, comfort, ice and par time. */
    update(dt, ctx, runner, approach) {
      const b = ctx.body;
      if (courseStart !== null && !courseDone) each('par', (g) => g.status === 'open' && ctx.time - courseStart > g.seconds && set(g, 'failed', 'over par'));
      each('mission-par', (g) => g.status === 'open' && ctx.time > g.seconds && set(g, 'failed', 'over time'));
      each('intact', (g) => g.status === 'open' && isDamaged(b) && set(g, 'failed', 'damaged'));
      each('ice', (g) => g.status === 'open' && (b.ice ?? 0) * 100 > g.pct && set(g, 'failed', `${Math.round(b.ice * 100)}% ice`));
      each('reserve', (g) => {
        if (g.status === 'met') return;
        set(g, b.engine.fuel >= g.kg ? 'open' : 'failed', `${Math.round(b.engine.fuel)} kg now`);
      });
      const objective = runner.objective;
      if (objective?.kind === 'sightseeing') each('comfort', (g) => g.status === 'open' && objective.comfort < g.pct && set(g, 'failed', `fell to ${Math.round(objective.comfort)}%`));
      // The stable final: from 700 ft down to the flare on the last landing, on speed and on the path.
      const guide = runner.guidance();
      if (guide && approach && onFinalStage(runner) && !b.onGround) {
        const heightFt = (b.position.y - guide.elevation) * 3.28084;
        if (guide.distance > 120 && guide.distance < 3000 && heightFt < 700) {
          finalSeen += dt;
          const err = b.airspeed * KT - approach.targetKt;
          const off = Math.abs(err) > approach.toleranceKt + 3 ? (err > 0 ? `fast +${Math.round(err)} kt` : `slow ${Math.round(err)} kt`) : Math.abs(guide.glideDev) > 0.9 ? (guide.glideDev > 0 ? 'high on the path' : 'low on the path') : Math.abs(guide.locDev) > 2 ? 'off the centreline' : '';
          if (off) {
            unstable += dt;
            worstFinal = `${off} at ${Math.round(heightFt / 10) * 10} ft`;
          }
          each('stable', (g) => g.status === 'open' && (unstable > 3 ? set(g, 'failed', worstFinal) : (g.detail = 'on speed, on the path')));
        }
      }
    },
    /** Settles every goal when the mission ends; returns the points and credits earned. */
    finish(success, ctx) {
      const b = ctx.body;
      for (const g of goals) {
        if (!success) {
          if (g.status === 'open') set(g, 'failed', g.detail || 'mission not completed');
          continue;
        }
        if (g.status !== 'open') continue;
        if (g.type === 'reserve') set(g, b.engine.fuel >= g.kg ? 'met' : 'failed', `${Math.round(b.engine.fuel)} kg left`);
        else if (g.type === 'stable') set(g, finalSeen > 3 ? 'met' : 'failed', finalSeen > 3 ? 'on speed, on the path' : 'no final flown');
        else if (g.type === 'crate') set(g, 'failed', g.detail);
        else if (['intact', 'ice', 'mission-par', 'photos', 'figures'].includes(g.type)) set(g, 'met', g.type === 'intact' ? 'not a scratch' : g.detail);
        else set(g, 'failed', g.detail || 'not met');
      }
      const met = goals.filter((g) => g.status === 'met');
      return { met: met.length, total: goals.length, points: success ? met.reduce((s, g) => s + g.points, 0) : 0, credits: success ? met.reduce((s, g) => s + g.reward, 0) : 0 };
    },
  };
}
