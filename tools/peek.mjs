// Development helper: opens a game URL in Chrome, waits, optionally holds keys, saves a
// screenshot to tmp/ and prints the console. Usage:
//   node tools/peek.mjs --q=?shot=cover --out=tmp/peek.jpg --wait=4000 --keys=ShiftLeft:3000,wait:500,KeyS:1500
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { launchChrome, openPage, sleep } from './cdp.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=')];
}));
const query = args.q ?? '';
const out = args.out ?? 'tmp/peek.jpg';
const chrome = await launchChrome({ port: 9334 });
try {
  const page = await openPage(chrome.port, `http://localhost:8080/${query}`);
  await sleep(Number(args.wait ?? 4000));
  for (const step of (args.keys ?? '').split(',').filter(Boolean)) {
    const [code, ms] = step.split(':');
    if (code === 'wait') await sleep(Number(ms));
    else if (code === 'click') {
      const [x, y] = (ms ?? '640/400').split('/').map(Number);
      await page.click(x, y);
    } else await page.holdKey(code, Number(ms ?? 100));
  }
  const info = await page.evaluate(args.eval ?? 'JSON.stringify(window.__peek ? window.__peek() : null)').catch((e) => String(e));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await page.screenshot({ quality: 85 }));
  console.log('info', info);
  for (const m of page.consoleMessages.slice(0, 40)) console.log(`[${m.type}] ${m.text}`);
  page.close();
} finally {
  await chrome.close();
}
