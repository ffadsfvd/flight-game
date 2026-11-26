// Takes the entry's screenshots: serves nothing itself (run `node serve.ts` first), opens each
// ?shot= URL from shots.json in desktop Chrome at 1280x800, waits for window.__shotReady and saves
// a JPEG through the DevTools Protocol, lowering the quality until the file fits the size budget.
// Then it builds tmp/contact-sheet.jpg the way the judge sees the entry (cover 768x480 on top,
// the others small beneath) for review. --review also renders the review-only scenes (the
// shoreline from high and low, night and storm) to tmp/review-*.jpg, without touching screenshots/.
//   node tools/take-screenshots.mjs [--only=1-cover.jpg] [--budget=235000] [--review]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { launchChrome, openPage, sleep } from './cdp.mjs';

const REVIEW_SCENES = ['coast-high', 'coast-low', 'night', 'storm', 'orsa', 'nesta', 'ice', 'ice-cockpit'];

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));
const budget = Number(args.budget ?? 235000);
const shots = JSON.parse(readFileSync('shots.json', 'utf8'));
mkdirSync('screenshots', { recursive: true });
mkdirSync('tmp', { recursive: true });

const chrome = await launchChrome({ port: 9335 });
try {
  if (args.review) {
    for (const scene of REVIEW_SCENES) {
      const page = await openPage(chrome.port, `http://localhost:8080/?shot=${scene}`);
      await page.waitFor('window.__shotReady === true', 60000);
      await sleep(400);
      writeFileSync(`tmp/review-${scene}.jpg`, await page.screenshot({ quality: 85 }));
      const errors = page.consoleMessages.filter((m) => m.type === 'error' || m.type === 'exception');
      console.log(`tmp/review-${scene}.jpg${errors.length ? `, console errors: ${errors.map((e) => e.text).join(' | ')}` : ''}`);
      page.close();
    }
  }
  for (const shot of shots) {
    if (args.review && !args.only) break;
    if (args.only && args.only !== shot.name) continue;
    const page = await openPage(chrome.port, `http://localhost:8080/${shot.query}`);
    try {
      await page.waitFor('window.__shotReady === true', 60000);
    } catch (error) {
      console.log(`${shot.name}: ${error.message}`);
      for (const m of page.consoleMessages) console.log(`  [${m.type}] ${m.text}`);
      page.close();
      continue;
    }
    await sleep(600);
    let quality = 90;
    let data = await page.screenshot({ quality });
    while (data.length > budget && quality > 40) {
      quality -= 4;
      data = await page.screenshot({ quality });
    }
    writeFileSync(`screenshots/${shot.name}`, data);
    const errors = page.consoleMessages.filter((m) => m.type === 'error' || m.type === 'exception');
    console.log(`${shot.name}: ${data.length} bytes at quality ${quality}${errors.length ? `, ${errors.length} console errors: ${errors.map((e) => e.text).join(' | ')}` : ''}`);
    page.close();
  }

  // Contact sheet for review, shaped like the judge's view.
  const files = shots.filter((s) => existsSync(`screenshots/${s.name}`)).map((s) => `data:image/jpeg;base64,${readFileSync(`screenshots/${s.name}`).toString('base64')}`);
  const page = await openPage(chrome.port, 'about:blank', { width: 800, height: 700 });
  const sheet = await page.evaluate(`(async () => {
    const files = ${JSON.stringify(files)};
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const imgs = await Promise.all(files.map(load));
    const c = document.createElement('canvas');
    c.width = 768; c.height = 480 + 8 + 160;
    const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(imgs[0], 0, 0, 768, 480);
    const n = imgs.length - 1;
    const w = Math.floor((768 - (n - 1) * 6) / n);
    imgs.slice(1).forEach((img, i) => x.drawImage(img, i * (w + 6), 488, w, Math.round(w * 0.625)));
    return c.toDataURL('image/jpeg', 0.9).split(',')[1];
  })()`);
  writeFileSync('tmp/contact-sheet.jpg', Buffer.from(sheet, 'base64'));
  console.log('tmp/contact-sheet.jpg written');
  page.close();
} finally {
  await chrome.close();
}
