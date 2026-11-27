// Real-input play test over the Chrome DevTools Protocol. It clicks menu buttons and the canvas
// and HOLDS keys (keyDown, wait, keyUp) like a player; Runtime.evaluate is used only to READ the
// game state, for assertions and for the test pilot's decisions. Covers: title menu, new career,
// mission board and briefing, take-off, climb, turn, a ring, pause and resume, crash and retry,
// a water landing flown by a keyboard autopilot, save and continue after a reload, every mission
// starting, and the console staying free of errors. Run `node serve.ts` first.
import { launchChrome, openPage, sleep } from './cdp.mjs';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const READ = `(() => { const g = window.__solvara.game; const b = g.session.body; const o = g.runner.objective;
  const info = g.state === 'flying' && b ? g.runner.trackerInfo() : null;
  return { state: g.state, mission: g.runner.mission ? g.runner.mission.id : null, stage: g.runner.stageIndex,
    kt: b ? b.airspeed * 1.944 : 0, agl: b ? b.agl * 3.281 : 0, vs: b ? b.verticalSpeed * 196.85 : 0, hdg: b ? b.heading : 0,
    bank: b ? b.bank : 0, pitch: b ? b.pitch : 0, onGround: b ? b.onGround : false, onWater: b ? b.onWater : false, gear: b ? b.gearDown : true,
    throttle: g.controls.controls.throttle, bearing: g.state === 'flying' ? g.runner.bearing() : null,
    glide: g.state === 'flying' && g.runner.guidance() ? g.runner.guidance().glideDev : null,
    guideHdg: g.state === 'flying' && g.runner.guidance() ? g.runner.guidance().heading : null,
    guideLat: g.state === 'flying' && g.runner.guidance() ? g.runner.guidance().lateral : null,
    rings: info && info.stats && info.stats[0] ? String(info.stats[0][1]) : '', result: window.__lastResult || null }; })()`;

async function read(page) {
  return page.evaluate(READ);
}

async function clickAction(page, action, arg = null) {
  const selector = arg ? `[data-action="${action}"][data-arg="${arg}"]` : `[data-action="${action}"]`;
  const box = await page.evaluate(`(() => { const all = [...document.querySelectorAll('${selector}')].filter((e) => e.offsetParent !== null); const e = all[0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) throw new Error(`no visible button ${selector}`);
  await page.click(box.x, box.y);
  await sleep(350);
}

function angleDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

/** One step of a keyboard autopilot: holds keys toward a heading, vertical speed and airspeed. */
async function pilotStep(page, s, { heading, vs, kt, maxBank = 22, gentle = false }) {
  const desiredBank = Math.max(-maxBank, Math.min(maxBank, angleDiff(heading, s.hdg) * 1.2));
  const bankError = desiredBank - s.bank;
  const vsError = vs - s.vs;
  const keys = [];
  if (Math.abs(bankError) > 4) keys.push([bankError > 0 ? 'KeyD' : 'KeyA', Math.min(260, 40 + Math.abs(bankError) * 6)]);
  if (gentle) {
    // Attitude first: the sink-rate error sets a pitch target, short pulses hold that pitch.
    const targetPitch = Math.max(-7, Math.min(7, 1 + vsError * 0.006));
    const pitchError = targetPitch - s.pitch;
    if (Math.abs(pitchError) > 1.2) keys.push([pitchError > 0 ? 'KeyS' : 'KeyW', Math.min(160, 30 + Math.abs(pitchError) * 14)]);
  } else if (Math.abs(vsError) > 150) keys.push([vsError > 0 ? 'KeyS' : 'KeyW', Math.min(420, 60 + Math.abs(vsError) * 0.35)]);
  if (kt !== undefined && Math.abs(s.kt - kt) > 4) keys.push([s.kt < kt ? 'ShiftLeft' : 'ControlLeft', Math.min(400, Math.abs(s.kt - kt) * 30)]);
  if (!keys.length) {
    await sleep(80);
    return;
  }
  for (const [code] of keys) await page.keyDown(code);
  const longest = Math.max(...keys.map((k) => k[1]));
  const start = Date.now();
  const released = new Set();
  while (Date.now() - start < longest) {
    for (const [code, ms] of keys) {
      if (!released.has(code) && Date.now() - start >= ms) {
        await page.keyUp(code);
        released.add(code);
      }
    }
    await sleep(15);
  }
  for (const [code] of keys) if (!released.has(code)) await page.keyUp(code);
}

const chrome = await launchChrome({ port: 9337 });
try {
  const page = await openPage(chrome.port, 'http://localhost:8080/');
  await page.waitFor('window.__solvara && window.__solvara.game.state === "title"', 30000);
  check('title screen shows', (await read(page)).state === 'title');

  // New career, mission board, briefing, fly.
  await clickAction(page, 'new');
  check('new career opens the mission board', await page.evaluate('document.getElementById("screen-mission-board").classList.contains("is-open")'));
  await clickAction(page, 'brief', 'first-solo');
  check('briefing opens for First Solo', await page.evaluate('document.getElementById("screen-mission-briefing").classList.contains("is-open")'));
  await clickAction(page, 'fly', 'first-solo');
  let s = await read(page);
  check('mission starts flying', s.state === 'flying' && s.mission === 'first-solo', s.state);
  await page.click(640, 300);

  // Take-off: full power with the number key, rotate with S held.
  await page.press('Digit0');
  for (let i = 0; i < 60; i += 1) {
    s = await read(page);
    if (s.kt > 52) break;
    await sleep(250);
  }
  check('accelerates on the runway', s.kt > 50, `${s.kt.toFixed(0)} kt`);
  await page.keyDown('KeyS');
  for (let i = 0; i < 40; i += 1) {
    await sleep(100);
    s = await read(page);
    if (!s.onGround && s.agl > 8) break;
  }
  await page.keyUp('KeyS');
  check('lifts off', !s.onGround, `${s.agl.toFixed(0)} ft`);
  for (let i = 0; i < 400; i += 1) {
    s = await read(page);
    if (s.stage >= 1) break;
    await pilotStep(page, s, { heading: 90, vs: 800, kt: 68 });
  }
  check('climbs to 500 ft and the circuit stage begins', s.stage >= 1, `stage ${s.stage + 1}, ${s.agl.toFixed(0)} ft`);

  // Turn: hold D for a second and check the heading changes.
  const before = s.hdg;
  await page.holdKey('KeyD', 900);
  await sleep(2500);
  s = await read(page);
  check('turns with roll input', Math.abs(angleDiff(s.hdg, before)) > 8 && Math.abs(s.bank) > 5, `heading ${before.toFixed(0)} -> ${s.hdg.toFixed(0)}, bank ${s.bank.toFixed(0)}`);

  // Ring: fly at the first ring using the bearing bug.
  for (let i = 0; i < 500; i += 1) {
    s = await read(page);
    if (s.stage >= 1 && /^[1-9]/.test(s.rings)) break;
    await pilotStep(page, s, { heading: s.bearing ?? 90, vs: s.agl > 520 ? -250 : s.agl < 420 ? 350 : 0, kt: 75 });
  }
  check('flies through a ring', s.stage >= 1 && /^[1-9]/.test(s.rings), s.rings);

  // Pause and resume.
  await page.press('Escape');
  await sleep(300);
  check('Esc pauses', (await read(page)).state === 'paused');
  await page.press('Escape');
  await sleep(300);
  check('Esc resumes', (await read(page)).state === 'flying');

  // Crash and retry: push the nose down into the ground.
  await page.keyDown('KeyW');
  for (let i = 0; i < 120; i += 1) {
    await sleep(150);
    s = await read(page);
    if (s.state !== 'flying' || (s.result && s.result.severity)) break;
  }
  await page.keyUp('KeyW');
  for (let i = 0; i < 30 && s.state !== 'results'; i += 1) {
    await sleep(200);
    s = await read(page);
  }
  check('crash ends the flight with a results screen', s.state === 'results' && s.result && !s.result.success, s.result ? s.result.cause : 'no result');
  await page.press('Enter');
  await sleep(600);
  s = await read(page);
  check('Enter retries the mission', s.state === 'flying' && s.mission === 'first-solo');

  // Save and continue after a reload (the ?unlock=all flag also opens every chapter for the rest).
  await page.press('Escape');
  await sleep(300);
  await clickAction(page, 'quit');
  await page.goto('http://localhost:8080/?unlock=all');
  await page.waitFor('window.__solvara && window.__solvara.game.state === "title"', 30000);
  const hasContinue = await page.evaluate('Boolean(document.querySelector("[data-action=continue]"))');
  check('reload shows Continue Career', hasContinue);
  await clickAction(page, 'continue');
  const records = await page.evaluate('Object.keys(window.__solvara.game.career.missions).length');
  check('continued career kept mission records', records > 0, `${records} missions recorded`);

  // Water landing in the Heron, flown by the keyboard autopilot.
  await clickAction(page, 'brief', 'lagoon');
  await clickAction(page, 'fly', 'lagoon');
  await page.click(640, 300);
  s = await read(page);
  check('lagoon mission starts in the Heron', s.state === 'flying' && s.mission === 'lagoon');
  await page.press('KeyF');
  for (let i = 0; i < 1600; i += 1) {
    s = await read(page);
    if (s.state !== 'flying') break;
    if (s.onWater) {
      await page.press('Digit1');
      await page.keyDown('KeyB');
      await sleep(400);
      await page.keyUp('KeyB');
      continue;
    }
    // Power is set with the number keys (a fixed setting trimmed by the speed error), not by
    // holding Shift/Ctrl: with the CDP round trip a held ramp overshoots and the approach
    // porpoises, which made this step flaky. Pitch pulses are short so the sink rate settles.
    const flare = s.agl < 30;
    const glideVs = s.glide === null ? -250 : -330 - 400 * Math.max(-1, Math.min(1, s.glide));
    const heading = s.guideHdg === null ? s.bearing ?? 70 : s.guideHdg - Math.max(-25, Math.min(25, s.guideLat * 0.25));
    const digit = flare ? 1 : Math.max(2, Math.min(8, Math.round(4 + (60 - s.kt) * 0.3)));
    if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
    await pilotStep(page, s, { heading, vs: flare ? -150 : glideVs, maxBank: s.agl < 120 ? 8 : 20, gentle: true });
  }
  for (let i = 0; i < 40 && s.state === 'flying'; i += 1) {
    await sleep(250);
    s = await read(page);
  }
  check('water landing completes the lagoon mission', s.state === 'results' && s.result && s.result.success, s.result ? `${s.result.success ? 'success' : 'fail'}: ${s.result.cause ?? s.result.score}` : s.state);
  await clickAction(page, 'board');

  // Every mission starts.
  const ids = [];
  const all = await page.evaluate('[...document.querySelectorAll(".mission-card")].map((c) => c.dataset.arg).filter(Boolean)');
  let started = 0;
  for (const id of all) {
    await clickAction(page, 'brief', id);
    await clickAction(page, 'fly', id);
    await sleep(1500);
    s = await read(page);
    if (s.state === 'flying' && s.mission === id) started += 1;
    else console.log(`  mission ${id} did not start: ${s.state}`);
    await page.press('Escape');
    await sleep(250);
    await clickAction(page, 'quit');
  }
  check('every mission starts', started === all.length && all.length >= 12, `${started} of ${all.length} (board showed ${ids.length} open before unlocking)`);

  const errors = page.consoleMessages.filter((m) => m.type === 'error' || m.type === 'exception');
  check('no console errors', errors.length === 0, errors.map((e) => e.text).slice(0, 3).join(' | '));
  page.close();
} catch (error) {
  check('test run', false, error.message);
} finally {
  await chrome.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
