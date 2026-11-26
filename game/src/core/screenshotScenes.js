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
    // Short final to runway 09 at Marenza International at golden hour, about 150 ft AGL and
    // 640 m from the threshold on the 3° path, seen through a long lens from behind and a little
    // to the left: the aircraft in the lower third, the approach lights leading to the runway
    // with its edge lights, PAPI and markings, Porto Celeste and the hills beyond.
    game.startMission(missionById('first-solo'));
    game.runner.skipTo(2);
    const spec = session.spec;
    session.simulation.start(spec, { ...approachPlacement(spec, 'marenza', 0, 640, { flaps: 2 }), bank: 4, throttle: 0.32 }, { birds: false });
    session.body.landingLights = true;
    game.controls.controls.throttle = 0.32;
    Object.assign(game.cameras.chaseFraming, { height: 2.6, distance: 3.4, lookAhead: 750, lookUp: -52, yaw: -0.1, fov: 24 });
    // The club Wren ahead has just gone round over the far end; the Pelican holds short of 09.
    game.traffic.place('Marenza circuit', 0.16);
    run(game, 1.6);
    // The 3D glide-path frames would stand between the camera and the runway: hide them here.
    game.runnerContext.scene.getObjectByName('glide-path-gates').visible = false;
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
  if (name === 'town' || name === 'harbour' || name === 'town-low') {
    // Town review scenes (not in shots.json): Porto Celeste from about 250 ft and from low over
    // its streets, and its harbour seen from over the sea.
    game.startMission(null);
    const at = { town: { x: -1150, y: 80, z: 3250, heading: 80 }, 'town-low': { x: -760, y: 42, z: 3330, heading: 75 }, harbour: { x: -250, y: 70, z: 4450, heading: 345 } }[name];
    session.simulation.start(session.spec, { ...at, pitch: 0, speed: 50, flaps: 0, throttle: 0.6, gearDown: false }, { birds: false });
    game.controls.controls.throttle = 0.6;
    Object.assign(game.cameras.chaseFraming, { height: 1.4, distance: 1.2, lookAhead: 60, lookUp: -10, yaw: 0.45 });
    run(game, 1.2);
  }
  if (name === 'duster' || name === 'seaplane') {
    // Traffic review scenes (not in shots.json): the crop duster spraying north of Marenza, and
    // the Heron seaplane touching down on Lumeno Lagoon.
    game.startMission(null);
    const duster = name === 'duster';
    game.traffic.place(duster ? 'Crop duster' : 'Lagoon seaplane', duster ? 0.06 : 0.16);
    const at = duster ? { x: -2750, y: 70, z: 2330, heading: 80 } : { x: 2600, y: 110, z: 2900, heading: 70 };
    session.simulation.start(session.spec, { ...at, pitch: 0, speed: 45, flaps: 0, throttle: 0.55, gearDown: false }, { birds: false });
    game.controls.controls.throttle = 0.55;
    Object.assign(game.cameras.chaseFraming, { height: 1.4, distance: 1.1, lookAhead: 80, lookUp: -14, yaw: 0.3, fov: 50 });
    run(game, 1.0);
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
  if (name === 'search' || name === 'platform' || name === 'platform-night' || name === 'nesta-strip' || name === 'coral-strip') {
    // Mission review scenes (not in shots.json): the night search with the boat caught in the
    // light, and short finals to the Sette platform by day and night, the Nesta mountain strip
    // and Coral Keys.
    const approach = { platform: ['sette-deck', 'sette', 1], 'platform-night': ['sette-night', 'sette', 1], 'nesta-strip': ['nesta-hut', 'nesta', 0], 'coral-strip': ['reef-doctor', 'coral', 0] }[name];
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
  if (name === 'kestrel' || name === 'pelican' || name === 'swallow' || name === 'saker') {
    // Aircraft review scenes (not in shots.json): the new aircraft in flight in a 3/4 view.
    game.startMission(name === 'saker' ? null : missionById({ kestrel: 'barnstormer', pelican: 'market-shuttle', swallow: 'silent-wings' }[name]), name === 'saker' ? 'saker' : null);
    if (name === 'pelican' || name === 'saker') session.simulation.start(session.spec, { x: -3600, y: 260, z: 3300, heading: 300, pitch: 0, speed: name === 'saker' ? 85 : 50, flaps: 0, throttle: 0.7, gearDown: name !== 'saker' }, { birds: false });
    if (name === 'saker') game.controls.controls.throttle = 0.85;
    Object.assign(game.cameras.chaseFraming, { height: 1.1, distance: 0.9, lookAhead: 6, lookUp: -0.5, yaw: name === 'saker' ? -0.45 : -0.7 });
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
  if (name === 'terrace-takeoff') {
    // Review scene (not in shots.json): lined up on the Nesta terrace for the rescue take-off.
    game.startMission(missionById('off-the-mountain'));
    Object.assign(game.cameras.chaseFraming, { height: 1.4, distance: 1.1, lookAhead: 20, lookUp: -1, yaw: 0.6 });
    run(game, 1.5);
  }
  if (name === 'sprint') {
    // Review scene (not in shots.json): the Saker racing a rival down the beach toward gate 4.
    game.startMission(missionById('coast-sprint'));
    const ring = game.runner.objective.jumpTo(3, game.runnerContext, 34);
    const p = ring.position.clone().addScaledVector(ring.normal, -420);
    const heading = (THREE.MathUtils.radToDeg(Math.atan2(ring.normal.x, -ring.normal.z)) + 360) % 360;
    session.simulation.start(session.spec, { x: p.x, y: p.y, z: p.z, heading, pitch: 0, bank: -12, speed: 98, flaps: 0, throttle: 1, gearDown: false }, { birds: false });
    game.controls.controls.throttle = 1;
    Object.assign(game.cameras.chaseFraming, { height: 1.2, distance: 1.0, lookAhead: 30, lookUp: -1.5, yaw: -0.4 });
    run(game, 1.2);
  }
  if (name === 'ice' || name === 'ice-cockpit') {
    // Icing review scenes (not in shots.json): climbing at the Velo Saddle gate in the cold front
    // with ice on the wings, from the chase view and from the frosted cockpit.
    game.startMission(missionById('velo-ice'));
    const ring = game.runner.objective.jumpTo(1, game.runnerContext, 38);
    const p = ring.position.clone().addScaledVector(ring.normal, -380);
    session.simulation.start(session.spec, { x: p.x, y: p.y - 22, z: p.z, heading: 180, pitch: 4, speed: 37, flaps: 0, throttle: 1 }, { birds: false });
    session.body.ice = 0.55;
    game.controls.controls.throttle = 1;
    if (name === 'ice-cockpit') game.cameras.view = 'cockpit';
    else Object.assign(game.cameras.chaseFraming, { height: 1.3, distance: 1.0, lookAhead: 30, lookUp: -2, yaw: -0.5 });
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
