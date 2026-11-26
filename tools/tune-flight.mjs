// Development helper for tuning the flight model: runs scripted control inputs through the real
// simulation inside the page (no rendering) and prints a trace.
//   node tools/tune-flight.mjs --aircraft=wren --script=takeoff
import { launchChrome, openPage, sleep } from './cdp.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=')];
}));
const aircraft = args.aircraft ?? 'wren';
const script = args.script ?? 'takeoff';
const chrome = await launchChrome({ port: 9336 });
try {
  const page = await openPage(chrome.port, 'http://localhost:8080/?shot=none');
  await sleep(4000);
  const trace = await page.evaluate(`(() => {
    const g = window.__solvara.game;
    const scripts = {
      takeoff: (t) => ({ throttle: 1, pitch: t > 9 ? 0.75 : 0, roll: 0, yaw: 0, brakes: 0 }),
      rotate: (t) => ({ throttle: 1, pitch: t > 9.5 && t < 11.5 ? 0.7 : t >= 11.5 && t < 13 ? 0.15 : 0, roll: 0, yaw: 0, brakes: 0 }),
      climb: (t) => ({ throttle: 1, pitch: t > 9 && t < 14 ? 0.7 : t >= 14 ? 0.1 : 0, roll: 0, yaw: 0, brakes: 0 }),
      turn: (t) => ({ throttle: 0.8, pitch: t < 4 ? 0 : 0.25, roll: t > 2 && t < 3.2 ? 0.8 : 0, yaw: 0, brakes: 0 }),
      approach: (t) => ({ throttle: 0.3, pitch: 0, roll: 0, yaw: 0, brakes: 0 }),
      stall: (t) => ({ throttle: 0.1, pitch: t > 2 ? 1 : 0, roll: 0, yaw: 0, brakes: 0 }),
    };
    const air = !['takeoff', 'climb', 'rotate'].includes('${script}');
    g.startMission(null, '${aircraft}');
    const s = g.session;
    if (air) s.simulation.start(s.spec, { x: -1000, y: 400, z: 4500, heading: 90, speed: s.spec.vApproach * 1.4, flaps: 0, throttle: 0.7 }, { birds: false });
    const out = [];
    const fn = scripts['${script}'];
    for (let i = 0; i < 60 * 30; i += 1) {
      const t = i / 60;
      const c = fn(t);
      s.simulation.advance(c, 1 / 60);
      const b = s.body;
      if (i % 30 === 0) out.push([t.toFixed(1), Math.round(b.airspeed * 1.944), Math.round(b.pitch), Math.round(b.bank), Math.round(b.agl * 3.28), Math.round(b.verticalSpeed * 196.85), b.onGround ? 'G' : 'A', (b.alpha * 57.3).toFixed(1), b.gForce.toFixed(2), Math.round(b.engine.temperature), s.simulation.ended ? s.simulation.ended.cause : ''].join(' '));
      if (s.simulation.ended) break;
    }
    return out.join('\\n');
  })()`);
  console.log('t kt pitch bank aglFt vsFpm G/A alpha g temp');
  console.log(trace);
  page.close();
} finally {
  await chrome.close();
}
