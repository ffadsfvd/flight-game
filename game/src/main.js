// Solvara Skies boot. The imports are listed by system, the game's content first: the career
// missions and their runner, the career itself, the aircraft and their flight model, the world
// and its airfields, the HUD, then the director, renderer and loop that tie them together.
//
// ?shot=cover|cockpit|firefight|title stages a deterministic screenshot scene instead of the menus.
import { CHAPTERS, MISSIONS } from './missions/missionCatalog.js';
import { createMissionRunner } from './missions/missionRunner.js';
import { createCareer } from './career/careerProgress.js';
import { CHARACTERS } from './career/characterRoster.js';
import { AIRCRAFT } from './aircraft/aircraftCatalog.js';
import { buildAircraftModel } from './aircraft/aircraftModelBuilder.js';
import { stepAircraft } from './flight/flightDynamics.js';
import { createAircraftSimulation } from './flight/aircraftSimulation.js';
import { createArchipelagoWorld } from './world/archipelagoWorld.js';
import { AIRFIELDS } from './world/airfieldDirectory.js';
import { createHudController } from './hud/hudController.js';
import { createGameDirector } from './core/gameDirector.js';
import { createGameRenderer } from './core/gameRenderer.js';
import { stageScreenshot } from './core/screenshotScenes.js';
import { startMainLoop } from './core/mainLoop.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const status = document.getElementById('status-line');
status.textContent = `Solvara Skies: ${MISSIONS.length} missions in ${CHAPTERS.length} chapters, ${AIRCRAFT.length} aircraft, ${AIRFIELDS.length} airfields, ${Object.keys(CHARACTERS).length} characters.`;

const view = createGameRenderer(document.getElementById('world-view'));
const world = createArchipelagoWorld(view.scene);
const game = createGameDirector({ view, world, shotMode: Boolean(shot) });

// A handle for the input tests and the perf tool to read state (never to drive the game).
window.__solvara = {
  game,
  systems: { createMissionRunner, createCareer, buildAircraftModel, stepAircraft, createAircraftSimulation, createHudController },
  stats: null,
};

if (shot) {
  stageScreenshot(shot, game);
} else {
  window.__solvara.stats = startMainLoop((dt) => game.frame(dt));
}
