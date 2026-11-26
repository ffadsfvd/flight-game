// Deterministic screenshot scenes behind ?shot=cover|cockpit|firefight|title. Each starts a real
// mission through the director, places the real aircraft where the scene needs it, runs the real
// simulation and effects forward in fixed steps, then paints and sets window.__shotReady.
import * as THREE from 'three';
import { missionById } from '../missions/missionCatalog.js';
import { createSeededRandom } from './seededRandom.js';
import { approachPlacement } from './flightSession.js';

const STEP = 1 / 60;

function run(game, seconds, actionsAt = {}) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const actions = actionsAt[i] ?? [];
    game.controls.update(STEP, true);
    game.frameFixed(STEP, actions);
  }
}

/** Sets up scene `name` on the game director; resolves when painted. */
export function stageScreenshot(name, game) {
  Math.random = createSeededRandom(20261126);
  const session = game.session;
  if (name === 'title') {
    game.showTitle();
    game.backdrop.setAngle(80);
    for (let i = 0; i < 240; i += 1) game.frame(STEP);
  } else if (name === 'cover') {
    // Short final to runway 09 at Marenza International, coming in off the sea at golden hour:
    // the beach, Porto Celeste and the Monte Aurio range ahead, seen from behind the right wing.
    game.startMission(missionById('first-solo'));
    game.runner.skipTo(2);
    const spec = session.spec;
    session.simulation.start(spec, { ...approachPlacement(spec, 'marenza', 0, 1180, { flaps: 2, offset: -10, height: 0 }), bank: 8, throttle: 0.32 }, { birds: false });
    session.body.landingLights = true;
    game.controls.controls.throttle = 0.32;
    Object.assign(game.cameras.chaseFraming, { height: 1.5, distance: 1.0, lookAhead: 10, lookUp: -1.5, yaw: -0.17 });
    run(game, 1.6);
    game.hud.radio.say('dario', 'SV-102, Marenza Tower, runway 09, wind 075 at 6, cleared to land.', { priority: true });
    game.hud.radio.hold();
    run(game, 0.4);
  } else if (name === 'cockpit') {
    game.startMission(missionById('canyon-run'));
    const objective = game.runner.objective;
    const ring = objective.jumpTo(4, game.runnerContext, 31.4);
    const n = ring.normal;
    const p = ring.position.clone().addScaledVector(n, -175);
    const heading = (THREE.MathUtils.radToDeg(Math.atan2(n.x, -n.z)) + 360) % 360;
    session.simulation.start(session.spec, { x: p.x, y: p.y + 2, z: p.z, heading, pitch: 1, speed: 52, flaps: 0, throttle: 0.82 }, { birds: false });
    game.controls.controls.throttle = 0.82;
    game.cameras.view = 'cockpit';
    run(game, 1.2);
    game.hud.radio.say('ines', 'Ring four. Keep your eyes outside, not on the walls.', { priority: true });
    game.hud.radio.hold();
    run(game, 0.3);
    // Glance down a little so the stick, the throttle and the pilot's gloves are in the frame.
    game.controls.mouse.state.lookY = 0.09;
    run(game, 1 / 60);
  } else if (name === 'firefight') {
    // Second pass over the fire line on Calvera's south slope: the west flank is already out, the
    // Heron banks along the slope with its water curtain falling on the east hot spot, the smoke
    // drifting off to the side, San Calvo and the coast beyond.
    game.startMission(missionById('firebreak'));
    for (let i = 0; i < 420; i += 1) game.effects.update(STEP, 700, game.wind.state.current, null, game.camera, false);
    const passOver = (fire, heading, height, back, aside = 0) => {
      const h = THREE.MathUtils.degToRad(heading);
      const x = fire.x - Math.sin(h) * back - Math.cos(h) * aside;
      const z = fire.z + Math.cos(h) * back - Math.sin(h) * aside;
      return { x, y: Math.max(0, game.world.terrain.heightAt(x, z)) + height, z, heading };
    };
    session.simulation.start(session.spec, { ...passOver({ x: 3250, z: -1780 }, 100, 55, 130), pitch: 1, speed: 41, flaps: 0, throttle: 0.85, gearDown: false }, { birds: false });
    session.body.water = session.spec.waterCapacity;
    game.controls.controls.throttle = 0.85;
    run(game, 5, { 2: ['action'] });
    session.simulation.start(session.spec, { ...passOver({ x: 3600, z: -1730 }, 95, 50, 150, 35), pitch: 2, bank: 14, speed: 41, flaps: 0, throttle: 0.85, gearDown: false }, { birds: false });
    session.body.water = session.spec.waterCapacity;
    document.getElementById('toast-messages').replaceChildren();
    Object.assign(game.cameras.chaseFraming, { height: 2.3, distance: 1.2, lookAhead: 6, lookUp: -7, yaw: -0.42 });
    game.cameras.view = 'chase';
    run(game, 1.9, { 62: ['action'] });
    game.hud.radio.say('bruno', 'Good drop on the west flank! Two hot spots left, come round again.', { priority: true });
    game.hud.radio.hold();
    run(game, 0.2);
  }
  if (name === 'night' || name === 'storm') {
    game.startMission(missionById(name === 'night' ? 'night-mail' : 'storm-approach'));
    game.runner.skipTo(name === 'night' ? 2 : 0);
    const spec = session.spec;
    session.simulation.start(spec, { ...approachPlacement(spec, 'marenza', 1, 1400, { flaps: 2 }), throttle: 0.32 }, { birds: false });
    game.controls.controls.throttle = 0.32;
    run(game, 3);
  }
  if (name === 'coast-high' || name === 'coast-low') {
    // Shoreline review scenes (not in shots.json): a shallow look along Marenza's south coast,
    // from 1100 m and from 120 m, where land and sea used to flicker through each other.
    const high = name === 'coast-high';
    game.startMission(null);
    session.simulation.start(session.spec, { x: -4600, y: high ? 1100 : 120, z: 4700, heading: 64, pitch: 0, speed: 60, flaps: 0, throttle: 0.62, gearDown: false }, { birds: false });
    game.controls.controls.throttle = 0.62;
    run(game, 1.5);
  }
  if (name === 'search' || name === 'platform' || name === 'nesta-strip' || name === 'coral-strip') {
    // Mission review scenes (not in shots.json): the night search with the boat caught in the
    // light, and short finals to the Sette platform, the Nesta mountain strip and Coral Keys.
    const approach = { platform: ['sette-deck', 'sette', 1], 'nesta-strip': ['nesta-hut', 'nesta', 0], 'coral-strip': ['reef-doctor', 'coral', 0] }[name];
    game.startMission(missionById(name === 'search' ? 'dark-water' : approach[0]));
    if (name === 'search') {
      session.simulation.start(session.spec, { x: 150, y: 75, z: -3900 + 380, heading: 0, pitch: -3, speed: 40, flaps: 1, throttle: 0.5 }, { birds: false });
      session.body.landingLights = true;
    } else {
      session.simulation.start(session.spec, { ...approachPlacement(session.spec, approach[1], approach[2], 520, { flaps: 2, offset: 6 }), bank: -6, throttle: 0.3 }, { birds: false });
    }
    Object.assign(game.cameras.chaseFraming, { height: 1.3, distance: 1.0, lookAhead: 40, lookUp: -3, yaw: 0.35 });
    run(game, 2.5);
  }
  if (name === 'kestrel' || name === 'pelican' || name === 'swallow') {
    // Aircraft review scenes (not in shots.json): the new aircraft in flight in a 3/4 view.
    game.startMission(missionById({ kestrel: 'barnstormer', pelican: 'market-shuttle', swallow: 'silent-wings' }[name]));
    if (name === 'pelican') session.simulation.start(session.spec, { x: -3600, y: 260, z: 3300, heading: 300, pitch: 0, speed: 50, flaps: 0, throttle: 0.7 }, { birds: false });
    Object.assign(game.cameras.chaseFraming, { height: 1.1, distance: 0.9, lookAhead: 6, lookUp: -0.5, yaw: -0.7 });
    run(game, 1.2);
  }
  if (name === 'orsa' || name === 'nesta') {
    // Island character review scenes (not in shots.json): Orsa Cay's red mesas, alpine Nesta.
    game.startMission(null);
    const at = name === 'orsa' ? { x: -7000, y: 380, z: -1800, heading: 47 } : { x: -1700, y: 620, z: -4250, heading: 62 };
    session.simulation.start(session.spec, { ...at, pitch: 0, speed: 60, flaps: 0, throttle: 0.62, gearDown: false }, { birds: false });
    game.controls.controls.throttle = 0.62;
    run(game, 1.5);
  }
  if (game.state === 'flying') game.feedHud(0, true);
  game.render();
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      game.render();
      requestAnimationFrame(() => {
        window.__shotReady = true;
        resolve();
      });
    });
  });
}
