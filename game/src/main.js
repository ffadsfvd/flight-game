// Solvara Skies boot. The imports are listed by system, the game's depth first: the flight model
// and the systems that turn a sortie into decisions (damage, the fuel plan with bingo, the flight
// data recorder), the debrief, the mission runner with its objectives, bonus goals, discipline
// score and every mission of the career, the career, the aircraft, the world and its airfields,
// the HUD, then the director, renderer and loop that tie them together.
//
// ?shot=cover|cockpit|firefight|debrief stages a deterministic screenshot scene instead of the menus.
import { stepAircraft } from './flight/flightDynamics.js';
import { damageEffects } from './flight/damageModel.js';
import { createFuelPlanner } from './flight/fuelPlanner.js';
import { createFlightDataRecorder } from './flight/flightDataRecorder.js';
import { createAircraftSimulation } from './flight/aircraftSimulation.js';
import { debriefHtml } from './ui/debriefScreen.js';
import { createMissionRunner } from './missions/missionRunner.js';
import { CHAPTERS, MISSIONS, missionById } from './missions/missionCatalog.js';
import { createCareer } from './career/careerProgress.js';
import { CHARACTERS } from './career/characterRoster.js';
import { AIRCRAFT } from './aircraft/aircraftCatalog.js';
import { buildAircraftModel } from './aircraft/aircraftModelBuilder.js';
import { createArchipelagoWorld } from './world/archipelagoWorld.js';
import { AIRFIELDS, airfieldById } from './world/airfieldDirectory.js';
import { LANDMARKS } from './world/archipelagoMap.js';
import { approachGuidance } from './world/approachGeometry.js';
import { createHudController } from './hud/hudController.js';
import { createGameDirector } from './core/gameDirector.js';
import { approachPlacement } from './core/flightSession.js';
import { createGameRenderer } from './core/gameRenderer.js';
import { stageScreenshot } from './core/screenshotScenes.js';
import { startMainLoop } from './core/mainLoop.js';
import * as THREE from 'three';

/** Builds the renderer, the world and the director, then runs the menus (or stages a screenshot). */
function startSolvaraSkies() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  document.getElementById('status-line').textContent = `Solvara Skies: ${MISSIONS.length} missions in ${CHAPTERS.length} chapters, ${AIRCRAFT.length} aircraft, ${AIRFIELDS.length} airfields, ${Object.keys(CHARACTERS).length} characters.`;
  const view = createGameRenderer(document.getElementById('world-view'));
  const world = createArchipelagoWorld(view.scene);
  const game = createGameDirector({ view, world, shotMode: Boolean(shot) });

  // A handle for the input tests and the perf tool to read state, and for the mission logic smoke
  // test and the screenshot tool to drive missions.
  window.__solvara = {
    game,
    systems: { createMissionRunner, createCareer, buildAircraftModel, stepAircraft, createAircraftSimulation, createHudController, damageEffects, createFuelPlanner, createFlightDataRecorder, debriefHtml },
    missions: { MISSIONS, missionById },
    airfields: { airfieldById },
    placements: { approachPlacement },
    approach: { approachGuidance },
    landmarks: LANDMARKS,
    three: THREE,
    stats: null,
  };

  if (shot) stageScreenshot(shot, game);
  else window.__solvara.stats = startMainLoop((dt) => game.frame(dt));
}

startSolvaraSkies();
