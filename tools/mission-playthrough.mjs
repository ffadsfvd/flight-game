// Plays whole missions with real input through the DevTools Protocol, the way a player would:
// clicks New Career, the mission card and Fly, then holds and taps keys (W/S/A/D, number keys for
// power, F flaps, B brakes, Space for the camera shutter, K to press on at bingo) until the results
// screen. Runtime.evaluate only READS the game state for the test pilot's decisions and the verdict.
//   node tools/mission-playthrough.mjs [--only=postcards,orsa-gale]   (run `node serve.ts` first)
// Missions: medevac (a bird strike on the climb-out, the bingo call answered with K, the route
// gates in their speed band), banner-run (seven beach gates, the discipline streak), lagoon,
// postcards, orsa-gale, sette-night and the three sightseeing tours. Run one Chrome at a time: a
// hidden tab pauses the game.
import { launchChrome, openPage, sleep } from './cdp.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));

const READ = `(() => { const g = window.__solvara.game; const b = g.session.body; const flying = g.state === 'flying';
  const guide = flying ? g.runner.guidance() : null; const info = flying && b ? g.runner.trackerInfo() : null;
  return { state: g.state, mission: g.runner.mission ? g.runner.mission.id : null, stage: g.runner.stageIndex,
    kt: b ? b.airspeed * 1.944 : 0, gs: b ? b.groundSpeed : 0, agl: b ? b.agl * 3.281 : 0, alt: b ? b.position.y : 0,
    vs: b ? b.verticalSpeed * 196.85 : 0, hdg: b ? b.heading : 0, bank: b ? b.bank : 0, pitch: b ? b.pitch : 0,
    onGround: b ? b.onGround : false, onWater: b ? b.onWater : false, flaps: b ? b.flaps : 0, throttle: g.controls.controls.throttle,
    bearing: flying ? g.runner.bearing() : null, glide: guide ? guide.glideDev : null, guideHdg: guide ? guide.heading : null,
    guideLat: guide ? guide.lateral : null, guideDist: guide ? guide.distance : null,
    stats: info && info.stats ? info.stats.map((r) => r.join(':')).join(' ') : '', next: info ? info.next : '',
    ringY: g.runner.objective && g.runner.objective.rings && g.runner.objective.rings[g.runner.objective.next] ? g.runner.objective.rings[g.runner.objective.next].position.y : null,
    ringIndex: g.runner.objective && g.runner.objective.rings ? g.runner.objective.next : null,
    kind: g.runner.objective ? g.runner.objective.kind : null,
    bingoPending: Boolean(g.runner.bingo && g.runner.bingo.pending), decision: g.runner.bingo && g.runner.bingo.decision ? g.runner.bingo.decision.state : null,
    discipline: g.runner.discipline ? { points: g.runner.discipline.state.points, streak: g.runner.discipline.state.streak, best: g.runner.discipline.state.bestStreak } : null,
    damage: b ? window.__solvara.systems.damageEffects(b).map((e) => e.part + ' ' + e.text) : [],
    result: window.__lastResult ? { success: window.__lastResult.success, cause: window.__lastResult.cause ?? null, score: window.__lastResult.score, decision: window.__lastResult.decision ? window.__lastResult.decision.kind : null, damageLog: window.__lastResult.damage ? window.__lastResult.damage.log.map((d) => d.text) : [], bestStreak: window.__lastResult.discipline ? window.__lastResult.discipline.bestStreak : 0, severity: window.__lastResult.severity } : null }; })()`;

function angleDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

/** One control step: bank toward a heading, pitch toward a sink rate (attitude held with short pulses). */
async function step(page, s, { heading, vs, maxBank = 20, pitchBias = 1, pitchTarget = null }) {
  const desiredBank = Math.max(-maxBank, Math.min(maxBank, angleDiff(heading, s.hdg) * 1.2));
  const bankError = desiredBank - s.bank;
  const keys = [];
  if (Math.abs(bankError) > 3) keys.push([bankError > 0 ? 'KeyD' : 'KeyA', Math.min(220, 35 + Math.abs(bankError) * 5)]);
  const targetPitch = pitchTarget ?? Math.max(-8, Math.min(9, pitchBias + (vs - s.vs) * 0.006));
  const pitchError = targetPitch - s.pitch;
  if (Math.abs(pitchError) > 1.2) keys.push([pitchError > 0 ? 'KeyS' : 'KeyW', Math.min(160, 30 + Math.abs(pitchError) * 14)]);
  if (!keys.length) {
    await sleep(70);
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
    await sleep(12);
  }
  for (const [code] of keys) if (!released.has(code)) await page.keyUp(code);
}

/** Sets power with the number keys: a base setting trimmed by the airspeed error. */
async function power(page, s, targetKt, base = 5, glide = 0) {
  // Below the glide path add power, above it take some off: the path is flown with the throttle.
  const digit = Math.max(1, Math.min(9, Math.round(base + (targetKt - s.kt) * 0.35 - glide * 2.5)));
  if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
}

async function idle(page, s) {
  if (s.throttle > 0.01) {
    await page.keyDown('ControlLeft');
    await sleep(Math.min(2000, s.throttle * 1900 + 100));
    await page.keyUp('ControlLeft');
  }
}

/** Flies the approach guide down to the surface, flares and stops. */
async function flyLanding(page, { vref, flapsDown = 2, water = false, deck = false, log }) {
  let s = await page.evaluate(READ);
  let flapsSet = 0;
  let touched = false;
  let last = 0;
  for (let i = 0; i < 2600; i += 1) {
    s = await page.evaluate(READ);
    if (s.state !== 'flying') return s;
    if (Date.now() - last > 4000) {
      last = Date.now();
      log(`  dist ${s.guideDist?.toFixed(0)} lat ${s.guideLat?.toFixed(0)} glide ${s.glide?.toFixed(2)} agl ${s.agl.toFixed(0)} ft ${s.kt.toFixed(0)} kt vs ${s.vs.toFixed(0)} thr ${s.throttle.toFixed(1)}`);
    }
    const down = s.onGround || s.onWater;
    if (down || touched) {
      if (!touched) log(`  touchdown: ${s.kt.toFixed(0)} kt, dist ${s.guideDist?.toFixed(0)} m, lat ${s.guideLat?.toFixed(0)} m`);
      touched = true;
      await idle(page, s);
      await page.keyDown('KeyB');
      // Keep the wings level and the nose straight down the runway while slowing.
      const steer = s.guideHdg !== null ? angleDiff(s.guideHdg, s.hdg) : 0;
      if (Math.abs(steer) > 2) await page.holdKey(steer > 0 ? 'KeyE' : 'KeyQ', Math.min(200, 40 + Math.abs(steer) * 20));
      else await sleep(150);
      continue;
    }
    if (s.guideDist !== null && s.guideDist < 3500 && flapsSet < flapsDown) {
      await page.press('KeyF');
      flapsSet += 1;
      await sleep(150);
      continue;
    }
    // Over the threshold (or in the flare) the glide path no longer applies: idle and hold the attitude.
    // A deck stands above the sea, so there the guide is flown until the wheels are over it.
    const flare = deck ? s.guideDist !== null && s.guideDist < 0 && s.agl < 18 : s.agl < 25 || (s.guideDist !== null && s.guideDist < 120);
    const glideVs = s.glide === null ? -300 : -380 - 420 * Math.max(-1, Math.min(1, s.glide));
    const lateral = s.guideLat ?? 0;
    const heading = s.guideHdg === null ? s.bearing ?? s.hdg : s.guideHdg - Math.max(-30, Math.min(30, lateral * 0.4));
    // Pitch for speed, power for the path: the nose holds the approach speed, the throttle
    // holds the glide path (more power when low, less when high).
    if (flare) await idle(page, s);
    else {
      const digit = Math.max(1, Math.min(9, Math.round(4 - (s.glide ?? 0) * 3)));
      if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
    }
    const pitchTarget = flare ? (s.agl < 25 ? (deck ? 3 : 5) : 2) : Math.max(-4, Math.min(8, 1.5 + (s.kt - vref) * 0.45));
    await step(page, s, { heading, vs: glideVs, maxBank: s.agl < 150 ? 10 : 20, pitchTarget });
  }
  return s;
}

async function startMission(page, id) {
  const click = async (action, arg = null) => {
    const selector = arg ? `[data-action="${action}"][data-arg="${arg}"]` : `[data-action="${action}"]`;
    const box = await page.evaluate(`(() => { const e = [...document.querySelectorAll('${selector}')].find((x) => x.offsetParent !== null); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!box) throw new Error(`no visible button ${selector}`);
    await page.click(box.x, box.y);
    await sleep(400);
  };
  await click('new');
  // The ?unlock=all flag opens every chapter of the saved career when the page loads.
  await page.goto('http://localhost:8080/?unlock=all');
  await page.waitFor('window.__solvara && window.__solvara.game.state === "title"', 30000);
  await click('continue');
  await click('brief', id);
  await click('fly', id);
  await page.click(640, 300);
  await sleep(300);
}

async function finish(page, s) {
  for (let i = 0; i < 60 && s.state === 'flying'; i += 1) {
    await sleep(250);
    s = await page.evaluate(READ);
  }
  return s;
}

/** Flies a sightseeing tour gently: shallow banks, soft pitch changes, sights in their height bands, terrain ahead cleared. */
async function flyTour(page, id, log) {
  const TOUR = `(() => { const g = window.__solvara.game; const b = g.session.body; const t = g.world.terrain;
    const def = window.__solvara.missions.missionById('${id}'); const stage = def.stages[g.runner.stageIndex];
    const info = g.state === 'flying' ? g.runner.trackerInfo() : null;
    const seen = info && info.stats ? Number(/(\\d+) \\//.exec(info.stats.find((r) => r[0] === 'SIGHTS')?.[1] ?? '0')?.[1] ?? 0) : 0;
    const sight = stage && stage.type === 'sightseeing' ? stage.sights[seen] : null;
    let ahead = 0; const h = b ? b.heading * Math.PI / 180 : 0;
    for (const d of [150, 400, 700, 1000, 1400]) ahead = Math.max(ahead, t.heightAt(b.position.x + Math.sin(h) * d, b.position.z - Math.cos(h) * d));
    return { sightseeing: Boolean(stage && stage.type === 'sightseeing'), seen, sight, sightGround: sight ? Math.max(0, t.heightAt(sight.x, sight.z)) : 0, ahead: Math.max(0, ahead),
      comfort: info && info.stats ? info.stats.find((r) => r[0] === 'COMFORT')?.[1] : null }; })()`;
  let s = await page.evaluate(READ);
  let last = 0;
  for (let i = 0; i < 6000; i += 1) {
    s = await page.evaluate(READ);
    if (s.state !== 'flying') return s;
    const tour = await page.evaluate(TOUR);
    if (!tour.sightseeing || !tour.sight) return s;
    const sight = tour.sight;
    let wanted = sight.maxFt !== undefined ? tour.sightGround + Math.min(sight.maxFt / 3.281 * 0.6, 240) : sight.minFt !== undefined ? tour.sightGround + sight.minFt / 3.281 + 120 : tour.sightGround + 200;
    wanted = Math.max(wanted, tour.ahead + 130);
    if (Date.now() - last > 4000) {
      last = Date.now();
      log(`  sight ${tour.seen + 1} (${sight.name}) comfort ${tour.comfort} alt ${s.alt.toFixed(0)} m -> ${wanted.toFixed(0)} m, ${s.kt.toFixed(0)} kt, bank ${s.bank.toFixed(0)}, hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)}, ${s.stats}`);
    }
    const climbing = wanted - s.alt > 40;
    // Full power for the climbs, power back for the descents, otherwise about 72 kt; the nose holds
    // a gentle climb or descent rate toward the wanted height: never more than 750 fpm down.
    const altErr = wanted - s.alt;
    const vsTarget = Math.max(-750, Math.min(900, altErr * 5));
    const digit = climbing ? 9 : altErr < -60 ? 3 : Math.max(3, Math.min(8, Math.round(5 + (72 - s.kt) * 0.25)));
    if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
    // Soft attitude limits keep the passengers comfortable: never more than 7 degrees up or 5 down.
    const pitchTarget = Math.max(-5, Math.min(7, 2 + (vsTarget - s.vs) * 0.005 + (s.kt - 75) * 0.1));
    await step(page, s, { heading: s.bearing ?? s.hdg, vs: vsTarget, maxBank: 22, pitchTarget });
  }
  return s;
}

const PLAYS = {
  async 'bring-her-home'(page, log) {
    // Real-input damaged-aircraft mission: the Wren starts with the engine capped, the left wing
    // pulling and a cracked gear leg; the test pilot holds the wings level against the pull on the
    // way to the final, then flies the approach guide down to a soft landing on 09.
    let s = await page.evaluate(READ);
    log(`  start damage: ${s.damage.join(', ')}`);
    let last = 0;
    for (let i = 0; i < 4000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying' || s.guideDist !== null) break;
      if (Date.now() - last > 3000) {
        last = Date.now();
        log(`  alt ${s.alt.toFixed(0)} m ${s.kt.toFixed(0)} kt hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)} bank ${s.bank.toFixed(0)}`);
      }
      const digit = s.alt > 180 ? 5 : 7;
      if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
      const pitchTarget = Math.max(-5, Math.min(6, (150 - s.alt) * 0.05 + (s.kt - 75) * 0.25));
      await step(page, s, { heading: s.bearing ?? s.hdg, vs: 0, maxBank: 18, pitchTarget });
    }
    if (s.state === 'flying') s = await flyLanding(page, { vref: 63, flapsDown: 2, log });
    return finish(page, s);
  },
  async 'long-hop'(page, log) {
    // Real-input fuel decision: fast cruise north from Coral Keys, K to press on when the bingo call
    // comes near Orsa Cay, then the approach guide down to runway 09 at Marenza on what is left.
    let s = await page.evaluate(READ);
    let last = 0;
    let answered = false;
    for (let i = 0; i < 5000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying' || s.guideDist !== null) break;
      if (s.bingoPending && !answered) {
        log(`  bingo near Orsa: ${s.stats}; pressing on with K`);
        await page.press('KeyK');
        answered = true;
        continue;
      }
      if (Date.now() - last > 3000) {
        last = Date.now();
        log(`  ${s.kind} alt ${s.alt.toFixed(0)} m ${s.kt.toFixed(0)} kt hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)} ${s.stats}`);
      }
      if (Math.abs(s.throttle - 0.8) > 0.01) await page.press('Digit8');
      const pitchTarget = Math.max(-5, Math.min(7, (190 - s.alt) * 0.05 + (s.kt - 90) * 0.2));
      await step(page, s, { heading: s.bearing ?? s.hdg, vs: 0, maxBank: 25, pitchTarget });
    }
    log(`  decision: ${s.decision}`);
    if (s.state === 'flying') s = await flyLanding(page, { vref: 63, flapsDown: 2, log });
    return finish(page, s);
  },
  async 'banner-run'(page, log) {
    // Real-input ring run: the festival banner towed through the seven beach gates on the bearing
    // bug at about 72 kt, power for the height and the nose for the speed; every gate inside the
    // 60-90 kt band grows the discipline streak.
    let s = await page.evaluate(READ);
    let last = 0;
    for (let i = 0; i < 4000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying') break;
      if (Date.now() - last > 3000) {
        last = Date.now();
        log(`  ring ${s.ringIndex} alt ${s.alt.toFixed(0)} m -> ${s.ringY?.toFixed(0)} ${s.kt.toFixed(0)} kt hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)} streak ${s.discipline?.streak} (${s.discipline?.points} pts)`);
      }
      const targetAlt = s.ringY ?? s.alt;
      const low = targetAlt - s.alt;
      const digit = Math.max(3, Math.min(9, Math.round(7 + low * 0.12)));
      if (Math.abs(s.throttle - digit / 10) > 0.01) await page.press(`Digit${digit}`);
      const pitchTarget = Math.max(-4, Math.min(7, 2 + low * 0.08 + (s.kt - 72) * 0.25));
      await step(page, s, { heading: s.bearing ?? s.hdg, vs: 0, maxBank: 15, pitchTarget });
    }
    log(`  gates done: best streak ${s.discipline?.best}, ${s.discipline?.points} pts`);
    return finish(page, s);
  },
  async 'first-solo'(page, log) {
    // Real-input First Solo: take-off on 09, the circuit's rings on the bearing bug at 80 kt, then the
    // approach guide down to runway 09. (Not in the default run: the first ring lies on the runway
    // line, so this simple pilot often meets it before 500 ft and has to come back round for it.)
    await page.press('Digit0');
    let s = await page.evaluate(READ);
    for (let i = 0; i < 80 && s.kt < 52; i += 1) {
      await sleep(250);
      s = await page.evaluate(READ);
    }
    await page.keyDown('KeyS');
    for (let i = 0; i < 40; i += 1) {
      await sleep(100);
      s = await page.evaluate(READ);
      if (!s.onGround && s.agl > 10) break;
    }
    await page.keyUp('KeyS');
    const runway = s.hdg;
    let last = 0;
    for (let i = 0; i < 6000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying' || s.guideDist !== null) break;
      if (Date.now() - last > 4000) {
        last = Date.now();
        log(`  ${s.kind} ring ${s.ringIndex} alt ${s.alt.toFixed(0)} m -> ${s.ringY?.toFixed(0)} ${s.kt.toFixed(0)} kt hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)} streak ${s.discipline?.streak} (${s.discipline?.points} pts)`);
      }
      const heading = s.kind === 'takeoff' ? runway : s.bearing ?? s.hdg;
      const targetAlt = s.kind === 'takeoff' ? s.alt + 60 : s.ringY ?? s.alt;
      const high = s.alt - targetAlt;
      const digit = s.kind === 'takeoff' ? 0 : high > 30 ? 3 : high < -30 ? 8 : 6;
      if (Math.abs(s.throttle - (digit === 0 ? 1 : digit / 10)) > 0.01) await page.press(`Digit${digit}`);
      const pitchTarget = Math.max(-6, Math.min(9, (targetAlt - s.alt) * 0.06 + (s.kt - 80) * 0.25));
      await step(page, s, { heading, vs: 0, maxBank: 25, pitchTarget });
    }
    log(`  circuit done: streak best ${s.discipline?.best}, ${s.discipline?.points} pts`);
    if (s.state === 'flying') s = await flyLanding(page, { vref: 62, flapsDown: 2, log });
    return finish(page, s);
  },
  async medevac(page, log) {
    // Real-input medevac: full power off Orsa's runway 04, a straight climb-out through the gull
    // colony past the runway end (the bird strike caps the engine), the route gates flown on the
    // bearing bug inside their speed band (the discipline streak), K to press on when the bingo
    // call comes, then the approach guide down to runway 09 at Marenza.
    await page.press('Digit0');
    let s = await page.evaluate(READ);
    for (let i = 0; i < 80 && s.kt < 52; i += 1) {
      await sleep(250);
      s = await page.evaluate(READ);
    }
    await page.keyDown('KeyS');
    for (let i = 0; i < 40; i += 1) {
      await sleep(100);
      s = await page.evaluate(READ);
      if (!s.onGround && s.agl > 10) break;
    }
    await page.keyUp('KeyS');
    const runway = s.hdg;
    let last = 0;
    let pressedOn = false;
    for (let i = 0; i < 6000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying' || s.guideDist !== null) break;
      if (s.bingoPending && !pressedOn) {
        log(`  bingo: ${s.stats}; pressing on with K`);
        await page.press('KeyK');
        pressedOn = true;
        continue;
      }
      if (Date.now() - last > 4000) {
        last = Date.now();
        log(`  ${s.kind} ring ${s.ringIndex} alt ${s.alt.toFixed(0)} m -> ${s.ringY?.toFixed(0)} ${s.kt.toFixed(0)} kt hdg ${s.hdg.toFixed(0)} -> ${s.bearing?.toFixed(0)} streak ${s.discipline?.streak} damage ${s.damage.join(', ') || 'none'}`);
      }
      // Straight ahead to 350 ft (through the gulls), then the bearing bug to each gate.
      const heading = s.kind === 'takeoff' || s.agl < 350 ? runway : s.bearing ?? s.hdg;
      const targetAlt = s.ringY ?? 300;
      const high = s.alt - targetAlt;
      // Full power for the climb and the run to the gates; power back to come down to a lower gate.
      const digit = s.ringIndex === 3 || high > 40 ? (high > 40 ? 3 : 5) : 0;
      if (Math.abs(s.throttle - (digit === 0 ? 1 : digit / 10)) > 0.01) await page.press(`Digit${digit}`);
      const pitchTarget = Math.max(-9, Math.min(9, (targetAlt - s.alt) * 0.06 + (s.kt - 72) * 0.25));
      await step(page, s, { heading, vs: 0, maxBank: 28, pitchTarget });
    }
    log(`  final: decision ${s.decision}, damage ${s.damage.join(', ') || 'none'}, streak best ${s.discipline?.best}`);
    if (s.state === 'flying') s = await flyLanding(page, { vref: 63, flapsDown: 2, log });
    return finish(page, s);
  },
  async 'sunset-tour'(page, log) {
    let s = await flyTour(page, 'sunset-tour', log);
    if (s.state !== 'flying') return s;
    const vref = await page.evaluate('window.__solvara.game.session.spec.vApproach * 1.944');
    s = await flyLanding(page, { vref, flapsDown: 2, log });
    return finish(page, s);
  },
  async 'ignara-honeymoon'(page, log) {
    return finish(page, await flyTour(page, 'ignara-honeymoon', log));
  },
  async 'lumeno-tour'(page, log) {
    return finish(page, await flyTour(page, 'lumeno-tour', log));
  },
  async lagoon(page, log) {
    await page.press('KeyF');
    const s = await flyLanding(page, { vref: 56, flapsDown: 2, water: true, log });
    return finish(page, s);
  },
  async 'orsa-gale'(page, log) {
    const s = await flyLanding(page, { vref: 70, flapsDown: 1, log });
    return finish(page, s);
  },
  async 'sette-night'(page, log) {
    const s = await flyLanding(page, { vref: 57, flapsDown: 2, deck: true, log });
    return finish(page, s);
  },
  async postcards(page, log) {
    // Climb to a sightseeing height, fly the bearing bug to each landmark and press Space once it
    // is in range and dead ahead. The volcano is shot from higher up, the sea arch from lower down.
    let s = await page.evaluate(READ);
    let last = 0;
    for (let i = 0; i < 6000; i += 1) {
      s = await page.evaluate(READ);
      if (s.state !== 'flying') break;
      const photos = /PHOTOS:(\d)/.exec(s.stats)?.[1] ?? '0';
      // The volcano is shot from above its flanks, the sea arch from low over the water.
      const targetAlt = photos === '1' ? 1250 : photos === '2' ? 140 : 230;
      const inRange = /RANGE:IN/.test(s.stats);
      const nm = /DIST:([\d.]+) NM/.exec(s.stats);
      const distance = nm ? Number(nm[1]) * 1852 : Number(/DIST:(\d+) m/.exec(s.stats)?.[1] ?? 99999);
      if (Date.now() - last > 4000) {
        last = Date.now();
        log(`  photos ${photos} ${s.stats} alt ${s.alt.toFixed(0)} m ${s.kt.toFixed(0)} kt bearing ${s.bearing?.toFixed(0)} hdg ${s.hdg.toFixed(0)}`);
      }
      const off = s.bearing === null ? 0 : angleDiff(s.bearing, s.hdg);
      if (inRange && Math.abs(off) < 6 && Math.abs(s.bank) < 10 && distance < 1500) {
        await page.press('Space');
        await sleep(600);
        continue;
      }
      // Too close and not lined up: fly away and come round again.
      const heading = inRange && distance < 450 && Math.abs(off) > 20 ? s.hdg : s.bearing ?? s.hdg;
      // Climb at full power with the nose up, cruise and descend on less.
      const climbing = targetAlt - s.alt > 40;
      const digit = climbing ? 0 : s.kt > 85 ? 3 : 6;
      if (Math.abs(s.throttle - (digit === 0 ? 1 : digit / 10)) > 0.01) await page.press(`Digit${digit}`);
      const pitchTarget = Math.max(-6, Math.min(9, (targetAlt - s.alt) * 0.06 + (s.kt - 70) * 0.25));
      await step(page, s, { heading, vs: 0, maxBank: 25, pitchTarget });
    }
    return finish(page, s);
  },
};

const only = args.only ? String(args.only).split(',') : Object.keys(PLAYS).filter((id) => id !== 'first-solo');
// Plays that end, as flown, in a safe divert at bingo rather than at the mission's destination.
const DIVERT_PLAYS = new Set();
const outcomes = [];
for (const id of only) {
  const chrome = await launchChrome({ port: 9339 });
  try {
    const page = await openPage(chrome.port, 'http://localhost:8080/?unlock=all');
    await page.waitFor('window.__solvara && window.__solvara.game.state === "title"', 30000);
    await startMission(page, id);
    let s = await page.evaluate(READ);
    const log = (line) => console.log(`[${id}] ${line}`);
    log(`started: ${s.state} ${s.mission}`);
    const t0 = Date.now();
    s = await PLAYS[id](page, log);
    const accepted = s.result && (s.result.success || (DIVERT_PLAYS.has(id) && s.result.severity === 'divert'));
    const ok = s.state === 'results' && accepted;
    const errors = page.consoleMessages.filter((m) => m.type === 'error' || m.type === 'exception');
    outcomes.push({ id, ok: ok && !errors.length });
    console.log(`${ok && !errors.length ? 'PASS' : 'FAIL'}  ${id} played to the end in ${((Date.now() - t0) / 1000).toFixed(0)} s  (${s.state}${s.result ? `, ${s.result.success ? 'success' : 'fail'}, score ${s.result.score}${s.result.cause ? `, ${s.result.cause}` : ''}` : ''}${errors.length ? `, console errors: ${errors.map((e) => e.text).join(' | ')}` : ''})`);
    if (s.result) console.log(`      decision: ${s.result.decision ?? 'none'} · damage: ${s.result.damageLog.join('; ') || 'none'} · best discipline streak: ${s.result.bestStreak}`);
    page.close();
  } catch (error) {
    outcomes.push({ id, ok: false });
    console.log(`FAIL  ${id}: ${error.message}`);
  } finally {
    await chrome.close();
  }
}
console.log(`\n${outcomes.filter((o) => o.ok).length} of ${outcomes.length} missions played through`);
process.exitCode = outcomes.every((o) => o.ok) ? 0 : 1;
