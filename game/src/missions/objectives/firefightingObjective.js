// Objective: put out a forest fire. Scoop water by skimming the sea at speed on the floats (gear
// up), then release it with Space low over the flames. Each hot spot burns as patches
// (effects/burningPatches.js): the water puts out the patches it lands on, so a drop on the flames
// knocks the fire down where it hits and a miss changes nothing. The HUD callout tells the pilot
// what to do next (drop now, scoop here) and how each drop did.
import * as THREE from 'three';

const FT = 3.28084;
const RELEASE_SECONDS = 2;
const PROMPT_RANGE = 520;
const RESULT_SECONDS = 3.2;

export function createFirefightingObjective(stage) {
  let fires = [];
  let releasing = 0;
  let drops = 0;
  let hits = 0;
  let scooped = 0;
  let initial = 1;
  let lastDrop = null;
  const pending = [];
  // Heat knocked off the fire by each drop, reported once all of that drop has landed.
  const dropKnock = new Map();
  const totalHeat = () => fires.reduce((s, f) => s + f.intensity, 0);
  const objective = {
    kind: 'firefighting',
    score: 0,
    rows: [],
    /** How much of the fire is out, 0..1 (the fire-contained figure on the HUD). */
    get contained() {
      return Math.max(0, Math.min(1, 1 - totalHeat() / Math.max(0.01, initial)));
    },
    begin(ctx) {
      fires = stage.fires.map(([x, z, radius]) => ctx.effects.addFire(x, Math.max(0, ctx.world.terrain.heightAt(x, z)), z, radius, ctx.world.terrain));
      initial = totalHeat();
      if (stage.startFull) ctx.body.water = ctx.body.spec.waterCapacity;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    onAction(action, ctx) {
      if (action !== 'action' || ctx.body.water <= 1 || releasing > 0 || ctx.body.onGround) return;
      releasing = RELEASE_SECONDS;
      drops += 1;
      dropKnock.set(drops, 0);
      ctx.sound('release');
      ctx.report({ kind: 'drop', count: drops });
    },
    update(dt, ctx) {
      const b = ctx.body;
      const cap = b.spec.waterCapacity;
      if (b.onWater && b.groundSpeed > 13 && b.water < cap) {
        const add = Math.min(cap - b.water, cap * 0.12 * dt);
        b.water += add;
        scooped += add;
      }
      if (releasing > 0) {
        const out = Math.min(b.water, (cap / RELEASE_SECONDS) * dt);
        b.water -= out;
        releasing -= dt;
        ctx.effects.burst('drop-water', b.position, b.velocity);
        const fall = Math.sqrt((2 * Math.max(1, b.agl)) / 9.81);
        // The curtain spreads as it falls: low drops land narrow and heavy, high ones wide and thin.
        const spread = THREE.MathUtils.clamp(26 + b.agl * 0.2, 30, 48);
        pending.push({ x: b.position.x + b.velocity.x * fall * 0.75, z: b.position.z + b.velocity.z * fall * 0.75, at: ctx.time + fall, amount: out / cap, spread, drop: drops });
        if (b.water <= 0.5) releasing = 0;
      }
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const w = pending[i];
        if (ctx.time < w.at) continue;
        pending.splice(i, 1);
        let knock = 0;
        for (const f of fires) knock += f.douse(w.x, w.z, w.amount, w.spread);
        hits += knock;
        dropKnock.set(w.drop, (dropKnock.get(w.drop) ?? 0) + knock);
        if ((w.drop !== drops || releasing <= 0) && !pending.some((p) => p.drop === w.drop) && dropKnock.has(w.drop)) {
          const total = dropKnock.get(w.drop);
          ctx.report({ kind: 'drop-hit', knock: total });
          lastDrop = { hit: total > 0.12, partial: total > 0.02, timer: RESULT_SECONDS };
          dropKnock.delete(w.drop);
        }
      }
      if (lastDrop) {
        lastDrop.timer -= dt;
        if (lastDrop.timer <= 0) lastDrop = null;
      }
      // Steam fades and a hot spot down to its last patches dies down on its own.
      for (const f of fires) f.update(dt);
      if (fires.every((f) => !f.burning)) {
        for (const f of fires) f.intensity = 0;
        const efficiency = Math.min(1, fires.length / Math.max(1, drops * 0.75));
        objective.score = Math.round(55 + 45 * efficiency);
        objective.rows.push(['Water drops', String(drops)], ['Water scooped', `${Math.round(scooped)} kg`], ['Hot spots out', `${fires.length} / ${fires.length}`]);
        ctx.report({ kind: 'fire-out', drops });
        return 'done';
      }
      return 'active';
    },
    info(ctx) {
      const b = ctx.body;
      const burning = fires.filter((f) => f.burning);
      const target = burning[0] ?? fires[0];
      const d = target ? Math.hypot(target.x - b.position.x, target.z - b.position.z) : 0;
      const tank = b.spec.waterCapacity ? b.water / b.spec.waterCapacity : 0;
      let next;
      if (tank < 0.1) next = 'Tank empty: skim the sea on the floats at 30 kt+, gear UP, to scoop';
      else if (d > 1200) next = 'Fly to the smoke, line up downwind of the flames';
      else next = 'Release over the flames at 150-300 ft: SPACE';
      return {
        objective: stage.label ?? `Put out the fire: ${burning.length} hot spot${burning.length === 1 ? '' : 's'} left`,
        next,
        stats: [['WATER', `${Math.round(tank * 100)}%`], ['CONTAINED', `${Math.round(objective.contained * 100)}%`], ['AGL FT', Math.round(b.agl * FT)]],
        progress: objective.contained,
      };
    },
    /** The big HUD callout: how the last drop did, or what to do now (drop, scoop, fly to the smoke). */
    callout(ctx) {
      const b = ctx.body;
      const contained = `${Math.round(objective.contained * 100)}% CONTAINED`;
      if (lastDrop) {
        if (lastDrop.hit) return { text: 'DIRECT HIT', sub: contained, tone: 'good' };
        if (lastDrop.partial) return { text: 'EDGE OF THE FIRE', sub: `${contained} · drop on the flames`, tone: 'warn' };
        return { text: 'MISSED', sub: 'Drop right over the flames', tone: 'bad' };
      }
      if (releasing > 0) return { text: 'WATER AWAY', sub: contained, tone: 'good' };
      const cap = b.spec.waterCapacity;
      const tank = cap ? b.water / cap : 0;
      if (b.onWater) {
        if (tank >= 0.98) return { text: 'TANK FULL', sub: 'Full power, lift off, back to the fire', tone: 'good' };
        if (b.groundSpeed > 13) return { text: `SCOOPING ${Math.round(tank * 100)}%`, sub: 'Hold 30 kt+ on the floats', tone: 'info' };
        return { text: 'SPEED UP TO SCOOP', sub: 'Power up: the scoops fill at 30 kt+', tone: 'info' };
      }
      const nearest = fires.filter((f) => f.burning).reduce((best, f) => {
        const d = Math.hypot(f.x - b.position.x, f.z - b.position.z) - f.radius;
        return d < best.d ? { f, d } : best;
      }, { f: null, d: Infinity });
      if (tank > 0.1 && nearest.f && nearest.d < PROMPT_RANGE) {
        const over = nearest.d < 60;
        return { text: over ? 'SPACE · DROP WATER' : 'LINE UP ON THE FLAMES', sub: `${contained} · drop at 150-300 ft`, tone: over ? 'go' : 'info', key: 'SPACE' };
      }
      if (tank <= 0.1 && b.agl < 120 && ctx.world.surfaceAt(b.position.x, b.position.z).water) return { text: 'SKIM TO SCOOP', sub: 'Gear up, flaps 1, settle on the water at 30 kt+', tone: 'info' };
      return null;
    },
    load(ctx) {
      const cap = ctx.body.spec.waterCapacity;
      return cap ? { label: 'WATER', fraction: ctx.body.water / cap, text: `${Math.round(ctx.body.water)}kg`, color: '#4fb8ff' } : null;
    },
    markers: () => fires.map((f) => ({ x: f.x, z: f.z, kind: 'area', radius: f.radius, active: f.burning, label: f.burning ? 'FIRE' : null, color: f.burning ? '#ff6a2a' : '#6be38a' })),
    guidance: () => null,
    bearing(ctx) {
      const f = fires.find((x) => x.burning) ?? fires[0];
      if (!f) return null;
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(f.x - p.x, -(f.z - p.z))) + 360) % 360;
    },
  };
  return objective;
}
