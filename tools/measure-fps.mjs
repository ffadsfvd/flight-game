// Measures frame rate and frame cost in desktop Chrome: the title backdrop, then a flight in the
// chase view, the cockpit view and the busiest mission (the firefight), sampling the game's own
// frame counter every half second. Run `node serve.ts` first.
import { launchChrome, openPage, sleep } from './cdp.mjs';

const chrome = await launchChrome({ port: 9338 });
const report = [];
async function sample(page, label, seconds) {
  const fps = [];
  const ms = [];
  for (let i = 0; i < seconds * 2; i += 1) {
    await sleep(500);
    const s = await page.evaluate('({ fps: window.__solvara.stats.fps, ms: window.__solvara.stats.frameMs })');
    fps.push(s.fps);
    ms.push(s.ms);
  }
  const steady = fps.slice(2);
  const line = `${label.padEnd(22)} fps avg ${(steady.reduce((a, b) => a + b, 0) / steady.length).toFixed(1)}  min ${Math.min(...steady)}  frame work ${(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(2)} ms`;
  report.push(line);
  console.log(line);
}
async function click(page, selector) {
  const box = await page.evaluate(`(() => { const e = document.querySelector('${selector}'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await page.click(box.x, box.y);
  await sleep(400);
}
try {
  const page = await openPage(chrome.port, 'http://localhost:8080/?unlock=all');
  await page.waitFor('window.__solvara && window.__solvara.stats', 30000);
  await sample(page, 'title backdrop', 5);
  await click(page, '[data-action="new"]');
  await click(page, '[data-action="brief"][data-arg="first-solo"]');
  await click(page, '[data-action="fly"]');
  await page.press('Digit0');
  await sample(page, 'take-off roll (chase)', 6);
  await page.holdKey('KeyS', 2500);
  await sample(page, 'climb-out (chase)', 5);
  await page.press('KeyC');
  await sample(page, 'cockpit view', 5);
  await page.press('Escape');
  await click(page, '[data-action="quit"]');
  await page.goto('http://localhost:8080/?unlock=all');
  await page.waitFor('window.__solvara && window.__solvara.stats', 30000);
  await click(page, '[data-action="continue"]');
  await click(page, '[data-action="brief"][data-arg="firebreak"]');
  await click(page, '[data-action="fly"]');
  await sample(page, 'firefight (chase)', 8);
  const info = await page.evaluate('(() => { const r = window.__solvara.game.session.rig; return { gl: document.querySelector("canvas").getContext("webgl2") ? "webgl2" : "?" }; })()');
  console.log(JSON.stringify(info));
  page.close();
} finally {
  await chrome.close();
}
