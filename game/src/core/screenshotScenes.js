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
    game.startMission(missionById('first-solo'));
    game.runner.skipTo(2);
    const spec = session.spec;
    session.simulation.start(spec, { ...approachPlacement(spec, 'marenza', 0, 760, { flaps: 2, offset: 0, height: 2 }), throttle: 0.3 }, { birds: false });
    session.body.landingLights = true;
    game.controls.controls.throttle = 0.3;
    Object.assign(game.cameras.chaseFraming, { height: 1.65, distance: 1.12, lookAhead: 120, lookUp: -3, yaw: 0 });
    run(game, 2.6);
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
  } else if (name === 'firefight') {
    game.startMission(missionById('firebreak'));
    const fire = { x: 3250, z: -1780 };
    const ground = Math.max(0, game.world.terrain.heightAt(fire.x, fire.z));
    for (let i = 0; i < 420; i += 1) game.effects.update(STEP, 700, game.wind.state.current, null, game.camera, false);
    const heading = 100;
    const h = THREE.MathUtils.degToRad(heading);
    const start = { x: fire.x - Math.sin(h) * 280, z: fire.z + Math.cos(h) * 280 };
    session.simulation.start(session.spec, { x: start.x, y: ground + 58, z: start.z, heading, pitch: 2, speed: 41, flaps: 0, throttle: 0.85, gearDown: false }, { birds: false });
    session.body.water = session.spec.waterCapacity;
    game.controls.controls.throttle = 0.85;
    Object.assign(game.cameras.chaseFraming, { height: 1.55, distance: 1.2, lookAhead: 150, lookUp: -2 });
    run(game, 2.4, { 105: ['action'] });
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
