// Mission logic smoke test: proves every mission can be completed. Unlike the input test, it
// drives the simulation inside the page: for each stage it puts the aircraft where that stage
// needs it (before each ring, on short final, over the flare or the fire, facing a landmark, in
// the formation slot...) and flies the last part with simple control laws, then checks the
// mission ends in success. Run `node serve.ts` first.
import { launchChrome, openPage, sleep } from './cdp.mjs';

const DRIVER = String.raw`(async (id) => {
  const THREE = window.__solvara.three;
  const g = window.__solvara.game;
  const { missionById } = window.__solvara.missions;
  const def = missionById(id);
  g.startMission(def);
  const s = g.session;
  const dt = 1 / 60;
  let actions = [];
  const step = (n = 1) => { for (let i = 0; i < n && g.state === 'flying'; i += 1) { g.updateFlying(dt, actions); actions = []; } };
  const place = (p) => { const water = s.body ? s.body.water : 0; s.simulation.start(s.spec, p, { birds: false }); s.body.water = water; };
  const c = g.controls.controls;
  const headingTo = (from, to) => (THREE.MathUtils.radToDeg(Math.atan2(to.x - from.x, -(to.z - from.z))) + 360) % 360;
  const ground = (x, z) => Math.max(0, g.world.terrain.heightAt(x, z));
  let guard = 0;
  while (g.state === 'flying' && guard < 60) {
    guard += 1;
    const o = g.runner.objective;
    if (!o) { step(30); continue; }
    const kind = o.kind;
    const b = () => s.body;
    if (kind === 'takeoff') {
      c.throttle = 1;
      for (let i = 0; i < 60 * 60 && g.runner.objective === o && g.state === 'flying'; i += 1) {
        c.pitch = b().airspeed > b().spec.vRotate ? (b().agl < 30 ? 0.55 : 0.25) : 0;
        c.roll = 0;
        step();
      }
    } else if (kind === 'rings' || kind === 'race') {
      const rings = o.rings;
      for (let r = 0; r < rings.length && g.runner.objective === o; r += 1) {
        const ring = rings[r];
        const p = ring.position.clone().addScaledVector(ring.normal, -45);
        place({ x: p.x, y: p.y, z: p.z, heading: headingTo(p, ring.position), pitch: THREE.MathUtils.radToDeg(Math.asin(ring.normal.y)), speed: Math.max(45, s.spec.vApproach * 1.6), throttle: 0.8, gearDown: false });
        c.pitch = 0; c.roll = 0; c.throttle = 0.8;
        step(90);
      }
      step(10);
    } else if (kind === 'reach') {
      const t = def.stages[g.runner.stageIndex];
      place({ x: t.x, y: ground(t.x, t.z) + 250, z: t.z, heading: 90, speed: 50, throttle: 0.7 });
      step(30);
    } else if (kind === 'landing' || kind === 'water-landing' || kind === 'dead-stick') {
      const { fieldId, end } = o.target();
      const spec = s.spec;
      const field = window.__solvara.airfields.airfieldById(fieldId);
      const water = field.kind === 'water';
      const ap = window.__solvara.placements.approachPlacement(spec, fieldId, end, kind === 'dead-stick' ? 900 : 700, { flaps: kind === 'dead-stick' ? 1 : 2, height: kind === 'dead-stick' ? 70 : 0 });
      place({ ...ap, gearDown: !water, throttle: kind === 'dead-stick' ? 0 : 0.3 });
      if (kind === 'dead-stick') s.body.engine.running = false;
      for (let i = 0; i < 60 * 120 && g.runner.objective === o && g.state === 'flying'; i += 1) {
        const body = b();
        const guide = window.__solvara.approach.approachGuidance(fieldId, end, body.position);
        const vsTarget = body.agl > 6 ? -body.airspeed * Math.tan(3 * Math.PI / 180) - guide.glideDev * 3 : -0.7;
        c.pitch = THREE.MathUtils.clamp((vsTarget - body.verticalSpeed) * 0.25 + 0.05, -0.6, 0.8);
        if (kind === 'dead-stick' && body.agl > 6) c.pitch = THREE.MathUtils.clamp((body.airspeed - spec.vApproach * 1.2) * 0.06, -0.5, 0.5);
        const hdgErr = ((guide.heading - body.heading + 540) % 360) - 180 - guide.lateral * 0.15;
        c.roll = THREE.MathUtils.clamp((THREE.MathUtils.clamp(hdgErr * 1.5, -15, 15) - body.bank) * 0.08, -0.6, 0.6);
        c.yaw = body.onGround ? THREE.MathUtils.clamp(hdgErr * 0.1, -1, 1) : 0;
        c.throttle = body.onGround || body.agl < 5 ? 0 : kind === 'dead-stick' ? 0 : THREE.MathUtils.clamp(0.3 + (spec.vApproach - body.airspeed) * 0.08, 0.05, 0.9);
        c.brakes = body.onGround ? 1 : 0;
        step();
      }
      c.brakes = 0;
    } else if (kind === 'supply-drop') {
      const t = def.stages[g.runner.stageIndex];
      for (let n = 0; n < 3 && g.runner.objective === o; n += 1) {
        const w = g.wind.state.current;
        const start = { x: t.x - 500, z: t.z };
        place({ x: start.x, y: ground(t.x, t.z) + 80, z: start.z, heading: 90, speed: 36, throttle: 0.6, flaps: 1 });
        c.pitch = 0; c.roll = 0; c.throttle = 0.6;
        for (let i = 0; i < 60 * 30 && g.runner.objective === o; i += 1) {
          const body = b();
          c.pitch = THREE.MathUtils.clamp((ground(t.x, t.z) + 80 - body.position.y) * 0.03 - body.verticalSpeed * 0.08 + 0.1, -0.5, 0.7);
          const fall = 1.2 + (body.agl - 9) / 6.5;
          const aim = { x: t.x - (body.velocity.x - w.x) * 1.2 - w.x * fall, z: t.z - (body.velocity.z - w.z) * 1.2 - w.z * fall };
          if (body.position.x > aim.x - 3 && body.position.x < aim.x + 30 && !o.__dropped) { actions = ['action']; o.__dropped = true; }
          step();
          if (o.__dropped && i > 60 * 18) break;
        }
        o.__dropped = false;
      }
    } else if (kind === 'firefighting') {
      const t = def.stages[g.runner.stageIndex];
      for (let pass = 0; pass < 12 && g.runner.objective === o; pass += 1) {
        if (s.body.water < 50) {
          place({ x: 3300, y: 1.62, z: -900, heading: 270, speed: 24, throttle: 0.8, gearDown: false, flaps: 1 });
          c.pitch = -0.05; c.throttle = 0.8;
          step(60 * 9);
        }
        const [fx, fz] = t.fires[pass % t.fires.length];
        place({ x: fx - 150, y: ground(fx, fz) + 45, z: fz, heading: 90, speed: 42, throttle: 0.85, gearDown: false, flaps: 1 });
        s.body.water = s.body.water;
        c.throttle = 0.85;
        const holdY = ground(fx, fz) + 45;
        for (let i = 0; i < 60 * 5.6; i += 1) { const body = b(); c.pitch = THREE.MathUtils.clamp((holdY + (i > 96 ? 110 : 0) - body.position.y) * 0.03 - body.verticalSpeed * 0.08 + 0.1, -0.5, 0.7); if (i === 96) actions = ['action']; step(); }
      }
    } else if (kind === 'photo') {
      const t = def.stages[g.runner.stageIndex];
      for (const lid of t.targets) {
        const l = window.__solvara.landmarks.find((x) => x.id === lid);
        const p = { x: l.x - 650, z: l.z + 120 };
        const ly = l.y ?? 0;
        place({ x: p.x, y: Math.max(ly, ground(p.x, p.z) + 60), z: p.z, heading: headingTo(p, l), speed: 45, throttle: 0.6 });
        c.pitch = 0; c.roll = 0;
        step(30);
        g.cameras.view = 'cockpit';
        step(5);
        actions = ['action'];
        step(5);
        g.cameras.view = 'chase';
      }
      step(10);
    } else if (kind === 'aerobatics') {
      place({ x: -500, y: 1100, z: 5200, heading: 90, speed: 110, throttle: 0.9, gearDown: false });
      c.throttle = 0.95;
      c.pitch = 1; step(60 * 14); c.pitch = 0; step(60 * 2);
      place({ x: -500, y: 1100, z: 5200, heading: 90, speed: 110, throttle: 0.9, gearDown: false });
      c.pitch = 0.15; step(20); c.pitch = 0; c.roll = 1; step(60 * 2.6); c.roll = 0; step(60);
      place({ x: -500, y: 1100, z: 5200, heading: 90, speed: 110, throttle: 0.9, gearDown: false });
      for (let i = 0; i < 60 * 8; i += 1) { const bk = Math.abs(b().bank); c.roll = bk < 170 ? 1 : 0; c.pitch = bk > 150 ? -0.35 : 0; step(); }
      c.roll = 0; c.pitch = 0;
      place({ x: -500, y: 1100, z: 5200, heading: 90, speed: 110, throttle: 0.9, gearDown: false });
      for (let i = 0; i < 60 * 14 && g.runner.objective === o; i += 1) { const body = b(); const turned = Math.abs(((body.heading - 90 + 540) % 360) - 180); if (turned < 150) { c.roll = Math.abs(body.bank) < 80 ? 1 : 0; c.pitch = 0.7; } else { c.roll = body.bank > 10 ? -1 : body.bank < -10 ? 1 : 0; c.pitch = 0; } step(); }
      c.roll = 0; c.pitch = 0;
      step(60);
    } else if (kind === 'formation') {
      step();
      for (let i = 0; i < 60 * 400 && g.runner.objective === o && g.state === 'flying'; i += 1) {
        const slot = o.__slot();
        if (slot) { s.body.position.copy(slot.position); s.body.velocity.copy(slot.velocity); s.body.quaternion.copy(slot.quaternion); }
        step();
      }
    } else {
      return { id, ok: false, why: 'no strategy for ' + kind };
    }
  }
  let wait = 0;
  while (g.state === 'flying' && wait < 600) { g.updateFlying(dt, []); wait += 1; }
  const r = window.__lastResult;
  return { id, ok: Boolean(r && r.success && r.missionId === id), why: r ? (r.cause || 'score ' + r.score + ' ' + r.medal) : g.state };
})`;

const chrome = await launchChrome({ port: 9339 });
let failed = 0;
try {
  const page = await openPage(chrome.port, 'http://localhost:8080/?shot=none&unlock=all');
  await page.waitFor('Boolean(window.__solvara && window.__solvara.game)', 30000);
  await sleep(1500);
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
  const ids = (await page.evaluate('window.__solvara.missions.MISSIONS.map((m) => m.id)')).filter((id) => !only || id === only);
  for (const id of ids) {
    const r = await page.evaluate(`${DRIVER}(${JSON.stringify(id)})`);
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${id}  ${r.why}`);
    if (!r.ok) failed += 1;
    const log = await page.evaluate('JSON.stringify(window.__fireLog || null)');
    if (log !== 'null' && only) console.log(log);
  }
  const errors = page.consoleMessages.filter((m) => m.type === 'error' || m.type === 'exception');
  if (errors.length) {
    failed += 1;
    console.log(`FAIL  console errors: ${errors.map((e) => e.text).slice(0, 3).join(' | ')}`);
  }
  page.close();
} finally {
  await chrome.close();
}
console.log(failed ? `${failed} failed` : 'all missions completed');
process.exit(failed ? 1 : 0);
