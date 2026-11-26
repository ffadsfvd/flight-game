// The game's state machine: title backdrop and menus, mission board and briefing, hangar,
// logbook, settings, the flight itself, pause and results. It owns the career and its save,
// starts missions (weather, aircraft, placement) and turns their results into pay and progress.
import * as THREE from 'three';
import { missionById } from '../missions/missionCatalog.js';
import { createMissionRunner } from '../missions/missionRunner.js';
import { applyFlightResult, buyAircraft, buyUpgrade, createCareer } from '../career/careerProgress.js';
import { careerRank } from '../career/careerProgress.js';
import { aircraftById, tunedSpec } from '../aircraft/aircraftCatalog.js';
import { createCockpitPanel } from '../aircraft/cockpitPanel.js';
import { createWindField } from '../flight/windField.js';
import { createReadout, updateReadout } from '../hud/flightReadout.js';
import { createHudController } from '../hud/hudController.js';
import { createScreenRouter } from '../ui/screenRouter.js';
import { titleScreenHtml } from '../ui/titleScreen.js';
import { missionBoardHtml } from '../ui/missionBoard.js';
import { briefingHtml } from '../ui/briefingScreen.js';
import { hangarHtml } from '../ui/hangarScreen.js';
import { logbookHtml } from '../ui/logbookScreen.js';
import { controlsHelpHtml } from '../ui/controlsHelp.js';
import { settingsHtml } from '../ui/settingsScreen.js';
import { pauseMenuHtml } from '../ui/pauseMenu.js';
import { resultsHtml } from '../ui/resultsScreen.js';
import { paintPortrait } from '../ui/portraitPainter.js';
import { createCameraDirector } from '../camera/cameraDirector.js';
import { createFlightControls } from '../controls/flightControls.js';
import { createAudioEngine } from '../audio/audioEngine.js';
import { createFlightSounds } from '../audio/flightSounds.js';
import { createSoundEffects } from '../audio/soundEffects.js';
import { createMusicLoop } from '../audio/musicLoop.js';
import { createEffectsDirector } from '../effects/effectsDirector.js';
import { createGlidePathGates } from '../effects/glidePathGates.js';
import { hasSavedCareer, loadCareer, saveCareer, clearCareer } from '../save/saveStore.js';
import { approachPlacement, createFlightSession, runwayPlacement } from './flightSession.js';
import { createFlightEventHandler } from './flightEventHandler.js';
import { createTitleBackdrop } from './titleBackdrop.js';

const SCREENS = ['screen-title', 'screen-mission-board', 'screen-hangar', 'screen-logbook', 'screen-controls-help', 'screen-settings', 'screen-mission-briefing', 'screen-pause-menu', 'screen-mission-results'];

/** Where a mission's `start` puts an aircraft of `spec`. */
export function placementFor(start, spec, world) {
  if (start.type === 'runway') return runwayPlacement(spec, start.field, start.end);
  if (start.type === 'approach') return { ...approachPlacement(spec, start.field, start.end, start.distance, { flaps: start.flaps ?? 1, height: start.height ?? 0 }), gearDown: start.gearDown ?? true };
  const ground = Math.max(0, world.terrain.heightAt(start.x, start.z));
  return { x: start.x, y: Math.max(start.y, ground + 60), z: start.z, heading: start.heading, speed: start.speed, flaps: start.flaps ?? 0, gearDown: start.gearDown ?? true, throttle: start.throttle ?? 0.6, pitch: 0 };
}

/** Creates the director over the renderer view and the built world. */
export function createGameDirector({ view, world, shotMode = false }) {
  const canvas = view.renderer.domElement;
  let career = loadCareer() ?? createCareer();
  const settings = career.settings;
  const wind = createWindField();
  const cameras = createCameraDirector(view.camera);
  const controls = createFlightControls(canvas, settings);
  const session = createFlightSession({ scene: view.scene, world, wind, director: cameras, controls });
  const effects = createEffectsDirector(view.scene, world.landmarks.emitters);
  const gates = createGlidePathGates(view.scene);
  const audio = createAudioEngine();
  const flightSounds = createFlightSounds(audio);
  const sfx = createSoundEffects(audio);
  const music = createMusicLoop(audio);
  const hud = createHudController(world.terrain, { onRadio: () => sfx.play('radio') });
  const router = createScreenRouter(SCREENS, () => sfx.play('click'));
  const flightEvents = createFlightEventHandler({ effects, sfx, hud, radioFor: () => 'dario' });
  const backdrop = createTitleBackdrop(session, cameras, view.camera);
  const readout = createReadout();
  const cockpits = new Map();
  let light = world.setTimeOfDay(settings.timeOfDay ?? 'golden', view.renderer);
  let state = 'title';
  let mission = null;
  let freeAircraft = career.selected;
  let time = 0;
  let ending = null;
  let landingsThisFlight = [];
  let menuReturn = 'title';
  let flashLevel = 0;
  const flashEl = document.createElement('div');
  flashEl.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.25s';
  document.body.appendChild(flashEl);

  const ctx = {
    get body() {
      return session.body;
    },
    get sim() {
      return session.simulation;
    },
    world,
    scene: view.scene,
    effects,
    get camera() {
      return view.camera;
    },
    radio: (who, text, options) => hud.radio.say(who, text, options),
    toast: (text, tone) => hud.toast(text, tone),
    sound: (name) => sfx.play(name),
    windFrom: () => wind.state.from,
    windVector: () => wind.state.current,
    flash: () => {
      flashLevel = 0.85;
    },
    time: 0,
    cleanup: () => {},
  };
  const runner = createMissionRunner(ctx);
  audio.setVolume(settings.volume, settings.music);
  audio.onReady.push(() => {
    if (state !== 'flying') music.start();
  });

  function save() {
    saveCareer(career);
  }

  function cockpitFor(rig) {
    if (!cockpits.has(rig.id)) cockpits.set(rig.id, createCockpitPanel(rig));
    return cockpits.get(rig.id);
  }

  // ----- Menus -----
  function showTitle() {
    state = 'title';
    runner.stop();
    hud.show(false);
    gates.set(null);
    effects.setRain(0);
    light = world.setTimeOfDay('golden', view.renderer);
    backdrop.enter(career.selected);
    controls.mouse.unlock();
    router.show('screen-title', titleScreenHtml(career, hasSavedCareer()), {
      continue: showBoard,
      new: () => {
        career = createCareer();
        Object.assign(settings, career.settings);
        career.settings = settings;
        save();
        showBoard();
      },
      free: () => startMission(null),
      hangar: () => showHangar('title'),
      logbook: () => showLogbook('title'),
      controls: () => showControls('title'),
      settings: () => showSettings('title'),
      back: () => {},
    });
    if (audio.ready) music.start();
  }

  function showBoard() {
    state = 'menu';
    router.show('screen-mission-board', missionBoardHtml(career), {
      brief: (id) => showBriefing(missionById(id)),
      back: showTitle,
      hangar: () => showHangar('board'),
      free: () => startMission(null),
    });
  }

  function showBriefing(def) {
    state = 'menu';
    router.show('screen-mission-briefing', briefingHtml(def), {
      fly: () => startMission(def),
      back: showBoard,
      confirm: () => startMission(def),
    });
    for (const c of document.querySelectorAll('#screen-mission-briefing canvas[data-portrait]')) paintPortrait(c.getContext('2d'), c.dataset.portrait, c.width);
  }

  function back(target) {
    if (target === 'board') showBoard();
    else if (target === 'pause') showPause();
    else showTitle();
  }

  function showHangar(from) {
    menuReturn = from;
    state = state === 'paused' ? 'paused' : 'menu';
    const refresh = () => router.show('screen-hangar', hangarHtml(career), handlers);
    const handlers = {
      select: (id) => {
        career.selected = id;
        freeAircraft = id;
        save();
        refresh();
      },
      buy: (id) => {
        if (buyAircraft(career, id)) {
          sfx.play('success');
          save();
        }
        refresh();
      },
      upgrade: (uid) => {
        if (buyUpgrade(career, career.selected, uid)) {
          sfx.play('stage');
          save();
        }
        refresh();
      },
      free: () => startMission(null),
      back: () => back(menuReturn),
    };
    refresh();
  }

  function showLogbook(from) {
    menuReturn = from;
    router.show('screen-logbook', logbookHtml(career), { back: () => back(menuReturn) });
  }

  function showControls(from) {
    menuReturn = from;
    router.show('screen-controls-help', controlsHelpHtml(), { back: () => back(menuReturn) });
  }

  function showSettings(from) {
    menuReturn = from;
    const refresh = () => {
      router.show('screen-settings', settingsHtml(settings), handlers);
      const select = document.querySelector('#screen-settings select[data-setting]');
      select?.addEventListener('change', () => {
        settings.timeOfDay = select.value;
        save();
      });
    };
    const clamp = (v) => Math.max(0, Math.min(1.5, Math.round(v * 10) / 10));
    const handlers = {
      toggle: (key) => {
        settings[key] = !settings[key];
        if (session.body && key === 'flightAssist') session.body.flightAssist = settings.flightAssist;
        save();
        refresh();
      },
      less: (key) => {
        settings[key] = clamp(settings[key] - 0.1);
        apply();
      },
      more: (key) => {
        settings[key] = clamp(settings[key] + 0.1);
        apply();
      },
      'reset-career': () => {
        clearCareer();
        career = createCareer();
        Object.assign(career.settings, settings);
        save();
        refresh();
      },
      back: () => back(menuReturn),
    };
    function apply() {
      audio.setVolume(settings.volume, settings.music);
      controls.mouse.state.sensitivity = 0.0045 * settings.mouseSensitivity;
      save();
      refresh();
    }
    refresh();
  }

  function showPause() {
    state = 'paused';
    controls.mouse.unlock();
    router.show('screen-pause-menu', pauseMenuHtml(mission ? mission.title : 'Free flight'), {
      resume,
      restart: () => startMission(mission, freeAircraft),
      controls: () => showControls('pause'),
      settings: () => showSettings('pause'),
      quit: () => {
        if (!mission) finishFlight({ success: true, missionId: null, title: 'Free flight', severity: null, cause: 'Free flight ended by the pilot.', score: 0, medal: 'none', money: 0, repairs: 0, xp: 20, rows: [['Flight time', `${Math.round(session.simulation.flightTime)} s`], ['Landings', String(landingsThisFlight.length)]], landing: landingsThisFlight.at(-1) ?? null, time: ctx.time });
        else {
          runner.stop();
          showBoard();
          hud.show(false);
        }
      },
      title: showTitle,
      back: resume,
    });
  }

  function resume() {
    router.hideAll();
    state = 'flying';
  }

  // ----- Flight -----
  function startMission(def, aircraftOverride = null) {
    mission = def;
    const id = def ? def.aircraft : aircraftOverride ?? freeAircraft ?? career.selected;
    freeAircraft = def ? freeAircraft : id;
    const upgrades = career.upgrades[id] ?? [];
    light = world.setTimeOfDay(def ? def.time : settings.timeOfDay, view.renderer);
    wind.set({ from: 250, speed: 4, gust: 1.5, turbulence: 0.35, ...(def?.wind ?? {}) });
    effects.clearMissionEffects();
    effects.setRain(light.storm ? 1 : 0);
    const spec = tunedSpec(id, upgrades);
    const placement = placementFor(def?.start ?? { type: 'runway', field: 'marenza', end: 1 }, spec, world);
    session.start(id, upgrades, placement, { birds: settings.birdStrikes && !shotMode, fuelFraction: def?.fuel ?? 1 });
    session.body.payload = def?.payload ?? 0;
    session.body.flightAssist = settings.flightAssist;
    controls.mouse.state.sensitivity = 0.0045 * settings.mouseSensitivity;
    cockpitFor(session.rig);
    runner.start(def);
    ending = null;
    landingsThisFlight = [];
    hud.radio.clear();
    hud.show(true);
    router.hideAll();
    cameras.view = 'chase';
    cameras.replay.stop();
    gates.set(null);
    music.stop();
    state = 'flying';
    if (!def) hud.radio.say('dario', `Marenza Tower: ${spec.registration}, free flight approved. Wind ${String(wind.state.from).padStart(3, '0')} at ${Math.round(wind.state.speed * 1.944)}.`);
    return session.body;
  }

  function finishFlight(result) {
    const body = session.body;
    const spec = body.spec;
    const progress = applyFlightResult(career, result, { title: result.title, aircraft: spec.name, seconds: session.simulation.flightTime, distance: session.simulation.distance, landings: landingsThisFlight });
    save();
    state = 'results';
    controls.mouse.unlock();
    cameras.replay.start(session.simulation.recorder.frames(), world);
    cameras.view = 'replay';
    gates.set(null);
    sfx.play(result.success ? 'success' : 'fail');
    router.show('screen-mission-results', resultsHtml(result, progress), {
      retry: () => startMission(mission, freeAircraft),
      board: () => {
        runner.stop();
        hud.show(false);
        showBoard();
      },
      back: () => {
        runner.stop();
        hud.show(false);
        showBoard();
      },
      confirm: () => startMission(mission, freeAircraft),
    });
    window.__lastResult = result;
  }

  function guidanceExtras(guidance) {
    if (!guidance) return { bug: runner.bearing() };
    return { bug: runner.bearing(), course: guidance.heading, cdi: Math.max(-1, Math.min(1, -guidance.locDev / 2.5)), glide: guidance.glideDev };
  }

  /** One in-flight frame; `actionsOverride` lets screenshot scenes inject actions. */
  function updateFlying(dt, actionsOverride = null) {
    const actions = actionsOverride ?? controls.update(dt, true);
    for (const a of actions) {
      if (a === 'pause') {
        showPause();
        return;
      }
      if (a === 'help') {
        showPause();
        showControls('pause');
        return;
      }
      if (a === 'radio') hud.radio.clear();
    }
    if (ending) {
      ending.timer -= dt;
      session.update(dt, time, light.lightsOn, false);
      if (ending.timer <= 0) finishFlight(ending.result);
    } else {
      flightEvents.handleNotices(session.handleActions(actions));
      const simEvents = session.update(dt, time, light.lightsOn, true);
      flightEvents.handleSim(simEvents, session.body);
      for (const e of simEvents) if (e.kind === 'landed') landingsThisFlight.push(e.report);
      const result = runner.update(dt, simEvents, actions);
      if (result) ending = { result, timer: result.severity === 'crash' ? 2.6 : 1.6 };
    }
    feedHud(dt);
  }

  function feedHud(dt, force = false) {
    const body = session.body;
    const guidance = runner.guidance();
    if (guidance) {
      gates.set(guidance.field.id, guidance.end);
      gates.update(guidance.distance, time);
    } else {
      gates.set(null);
    }
    updateReadout(readout, body, controls.controls, { ...guidanceExtras(guidance), refuelling: session.refuelling });
    const rank = careerRank(career);
    hud.update({
      readout,
      view: cameras.view,
      position: body.position,
      mission: runner.trackerInfo(),
      markers: runner.markers(),
      others: runner.others(),
      guidance,
      targetKt: body.spec.vApproach * 1.944,
      career: { rank: rank.name, money: career.money, clock: light.clock, weather: light.label, aircraft: body.spec.name },
      load: runner.load(),
      dt,
      force,
    });
    const cockpit = cockpitFor(session.rig);
    cockpit.visible = cameras.view === 'cockpit';
    cockpit.update(readout, controls.controls, dt);
    flightSounds.update(state === 'flying' && !ending, readout, hud.warnings, time);
  }

  // ----- Frame -----
  canvas.addEventListener('click', () => {
    if (state === 'flying') controls.mouse.lock();
  });
  window.addEventListener('keydown', (event) => {
    if (state === 'flying') return;
    if (event.code === 'Escape') router.back();
    if (event.code === 'Enter') {
      if (state === 'results') startMission(mission, freeAircraft);
      else if (router.open === 'screen-mission-briefing') startMission(mission ?? null);
    }
  });

  function frame(dt, actionsOverride = null) {
    time += dt;
    const viewScale = view.viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2));
    let focus;
    if (state === 'title' || (state === 'menu' && !session.body)) {
      controls.update(dt, false);
      focus = backdrop.update(dt, time, career.selected);
      cameras.update(dt, null, null, world, controls.mouse.state, false);
      flightSounds.update(false, readout, [], time);
    } else if (state === 'menu') {
      controls.update(dt, false);
      focus = backdrop.update(dt, time, career.selected);
      cameras.view = 'manual';
      cameras.update(dt, null, null, world, controls.mouse.state, false);
      flightSounds.update(false, readout, [], time);
    } else if (state === 'flying') {
      updateFlying(dt, actionsOverride);
      focus = session.body.position;
    } else {
      controls.update(dt, false);
      session.update(dt, time, light.lightsOn, false);
      if (state === 'paused') feedHud(0, true);
      focus = session.body.position;
      flightSounds.update(false, readout, [], time);
    }
    if (flashLevel > 0) {
      flashEl.style.opacity = String(flashLevel);
      flashLevel = Math.max(0, flashLevel - dt * 3);
    } else flashEl.style.opacity = '0';
    effects.update(dt, viewScale, wind.state.current, state === 'flying' ? session.body : null, view.camera, session.body?.smokeOn);
    world.update(time, wind.state.current, focus, view.camera, view.viewHeight);
    view.render();
  }

  showTitle();

  return {
    frame,
    frameFixed: (dt, actions) => frame(dt, actions),
    render: () => view.render(),
    runnerContext: ctx,
    backdrop,
    camera: view.camera,
    startMission,
    showTitle,
    showBoard,
    runner,
    session,
    cameras,
    hud,
    effects,
    world,
    wind,
    controls,
    feedHud,
    updateFlying,
    get state() {
      return state;
    },
    get career() {
      return career;
    },
    get light() {
      return light;
    },
    set time(t) {
      time = t;
    },
    get time() {
      return time;
    },
  };
}
