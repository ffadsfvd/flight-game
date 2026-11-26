// A small Chrome DevTools Protocol client for the screenshot, input-test and perf tools: launches
// desktop Chrome with remote debugging on a throwaway profile, opens a page and sends commands.
// Node 22+ only (global WebSocket and fetch), no dependencies.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Launches Chrome; returns { port, process, close() }. */
export async function launchChrome({ port = 9333, width = 1280, height = 800, headless = false } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'flight-chrome-'));
  const args = [
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width + 16},${height + 140}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1', '--hide-scrollbars', '--mute-audio',
  ];
  if (headless) args.push('--headless=new', '--use-angle=d3d11', '--enable-unsafe-swiftshader');
  args.push('about:blank');
  const child = spawn(CHROME, args, { stdio: 'ignore', detached: false });
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) break;
    } catch {
      // not up yet
    }
    await sleep(150);
  }
  return {
    port,
    process: child,
    async close() {
      try {
        child.kill();
      } catch {
        // already gone
      }
      await sleep(400);
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome may still hold files for a moment; the OS temp cleaner gets them.
      }
    },
  };
}

/** Opens a new tab at `url` and connects to it; returns a page client. */
export async function openPage(port, url, { width = 1280, height = 800 } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const target = await res.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();
  const consoleMessages = [];
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) {
      if (msg.method === 'Runtime.consoleAPICalled') consoleMessages.push({ type: msg.params.type, text: msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ') });
      if (msg.method === 'Runtime.exceptionThrown') consoleMessages.push({ type: 'exception', text: msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text });
      if (msg.method === 'Log.entryAdded') consoleMessages.push({ type: msg.params.entry.level, text: msg.params.entry.text });
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const page = {
    send,
    consoleMessages,
    on(method, fn) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    },
    async goto(address) {
      const loaded = new Promise((resolve) => page.on('Page.loadEventFired', resolve));
      await send('Page.navigate', { url: address });
      await loaded;
    },
    /** Evaluates an expression in the page and returns its value (awaiting promises). */
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'evaluate failed');
      return result.result.value;
    },
    async waitFor(expression, timeout = 30000, interval = 200) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          if (await page.evaluate(expression)) return true;
        } catch {
          // page still loading
        }
        await sleep(interval);
      }
      throw new Error(`timed out waiting for ${expression}`);
    },
    async screenshot({ format = 'jpeg', quality = 88 } = {}) {
      const shot = await send('Page.captureScreenshot', { format, quality, captureBeyondViewport: false, fromSurface: true });
      return Buffer.from(shot.data, 'base64');
    },
    async keyDown(code, key = code) {
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code, key, windowsVirtualKeyCode: virtualKey(code) });
    },
    async keyUp(code, key = code) {
      await send('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: virtualKey(code) });
    },
    /** Holds a key for `ms` milliseconds. */
    async holdKey(code, ms) {
      await page.keyDown(code);
      await sleep(ms);
      await page.keyUp(code);
    },
    async press(code) {
      await page.holdKey(code, 60);
    },
    async click(x, y) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    },
    async wheel(x, y, deltaY) {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY });
    },
    close() {
      socket.close();
    },
  };
  await page.goto(url);
  return page;
}

const KEY_CODES = { Space: 32, Enter: 13, Escape: 27, ShiftLeft: 16, ControlLeft: 17, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Tab: 9 };

function virtualKey(code) {
  if (KEY_CODES[code]) return KEY_CODES[code];
  if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
  if (/^Digit[0-9]$/.test(code)) return code.charCodeAt(5);
  return 0;
}

export { sleep };
