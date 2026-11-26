// Objective: put out a forest fire. Scoop water by skimming the sea at speed on the floats, then
// release it (Space) low over the flames; every drop knocks the fire down where it lands. The
// fire is out when every hot spot is below a flicker.
import * as THREE from 'three';

const FT = 3.28084;

export function createFirefightingObjective(stage) {
  let fires = [];
  let releasing = 0;
  let drops = 0;
  let hits = 0;
  let scooped = 0;
  const pending = [];
  const objective = {
    kind: 'firefighting',
    score: 0,
    rows: [],
    begin(ctx) {
      fires = stage.fires.map(([x, z, radius]) => ctx.effects.addFire(x, Math.max(0, ctx.world.terrain.heightAt(x, z)), z, radius, ctx.world.terrain));
      if (stage.startFull) ctx.body.water = ctx.body.spec.waterCapacity;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    onAction(action, ctx) {
      if (action !== 'action' || ctx.body.water <= 1 || releasing > 0 || ctx.body.onGround) return;
      releasing = 1.4;
      drops += 1;
      ctx.sound('release');
      ctx.toast('WATER AWAY', 'good');
    },
    update(dt, ctx) {
      const b = ctx.body;
      const cap = b.spec.waterCapacity;
      if (b.onWater && b.groundSpeed > 13 && b.water < cap) {
        const add = Math.min(cap - b.water, cap * 0.12 * dt);
        b.water += add;
        scooped += add;
        if (b.water >= cap - 0.5) ctx.toast('TANK FULL', 'good');
      }
      if (releasing > 0) {
        const out = Math.min(b.water, (cap / 1.4) * dt);
        b.water -= out;
        releasing -= dt;
        ctx.effects.burst('drop-water', b.position, b.velocity);
        const fall = Math.sqrt((2 * Math.max(1, b.agl)) / 9.81);
        const impact = { x: b.position.x + b.velocity.x * fall * 0.75, z: b.position.z + b.velocity.z * fall * 0.75, at: ctx.time + fall, amount: out / cap };
        pending.push(impact);
        if (b.water <= 0.5) releasing = 0;
      }
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const w = pending[i];
        if (ctx.time < w.at) continue;
        pending.splice(i, 1);
        for (const f of fires) {
          const d = Math.hypot(w.x - f.x, w.z - f.z);
          if (d < f.radius + 30) {
            const knock = w.amount * 1.35 * (1 - d / (f.radius + 30));
            if (knock > 0.01) hits += knock;
            f.intensity = Math.max(0, f.intensity - knock);
          }
        }
      }
      if (fires.every((f) => f.intensity < 0.15)) {
        for (const f of fires) f.intensity = 0;
        const efficiency = Math.min(1, fires.length / Math.max(1, drops * 0.75));
        objective.score = Math.round(55 + 45 * efficiency);
        objective.rows.push(['Water drops', String(drops)], ['Water scooped', `${Math.round(scooped)} kg`], ['Hot spots out', `${fires.length} / ${fires.length}`]);
        return 'done';
      }
      return 'active';
    },
    info(ctx) {
      const b = ctx.body;
      const burning = fires.filter((f) => f.intensity >= 0.15);
      const target = burning[0] ?? fires[0];
      const d = target ? Math.hypot(target.x - b.position.x, target.z - b.position.z) : 0;
      const tank = b.spec.waterCapacity ? b.water / b.spec.waterCapacity : 0;
      let next;
      if (tank < 0.1) next = 'Tank empty: skim the sea on the floats at 30 kt+ to scoop (gear UP)';
      else if (d > 1200) next = 'Fly to the smoke, line up downwind of the flames';
      else next = `Release over the flames at ${Math.round(150)}-300 ft (Space)`;
      return {
        objective: stage.label ?? `Put out the fire: ${burning.length} hot spot${burning.length === 1 ? '' : 's'} left`,
        next,
        stats: [['WATER', `${Math.round(tank * 100)}%`], ['FIRE', `${Math.round((fires.reduce((s, f) => s + f.intensity, 0) / Math.max(1, fires.length)) * 100)}%`], ['AGL FT', Math.round(b.agl * FT)]],
        progress: 1 - fires.reduce((s, f) => s + f.intensity, 0) / Math.max(1, fires.length),
      };
    },
    load(ctx) {
      const cap = ctx.body.spec.waterCapacity;
      return cap ? { label: 'WATER', fraction: ctx.body.water / cap, text: `${Math.round(ctx.body.water)}kg`, color: '#4fb8ff' } : null;
    },
    markers: () => fires.map((f) => ({ x: f.x, z: f.z, kind: 'area', radius: f.radius, active: f.intensity >= 0.15, label: f.intensity >= 0.15 ? 'FIRE' : null, color: f.intensity >= 0.15 ? '#ff6a2a' : '#6be38a' })),
    guidance: () => null,
    bearing(ctx) {
      const f = fires.find((x) => x.intensity >= 0.15) ?? fires[0];
      if (!f) return null;
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(f.x - p.x, -(f.z - p.z))) + 360) % 360;
    },
  };
  return objective;
}
