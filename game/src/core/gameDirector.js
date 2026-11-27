// The game's state machine: title backdrop and menus, mission board and briefing, hangar,
// logbook, settings, the flight itself, pause and results. It owns the career and its save,
// starts missions (weather, aircraft, placement) and turns their results into pay and progress.
import * as THREE from 'three';
import { missionById } from '../missions/missionCatalog.js';
import { createMissionRunner } from '../missions/missionRunner.js';
import { applyFlightResult, buyAircraft, buyUpgrade, careerSummary, createCareer } from '../career/careerProgress.js';
import { careerRank } from '../career/careerProgress.js';
import { applyStartingDamage, damageEffects } from '../flight/damageModel.js';
import { UPGRADES, aircraftById, tunedSpec } from '../aircraft/aircraftCatalog.js';
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
import { challengesHtml } from '../ui/challengesScreen.js';
import { controlsHelpHtml } from '../ui/controlsHelp.js';
import { settingsHtml, FREE_STARTS } from '../ui/settingsScreen.js';
import { pauseMenuHtml } from '../ui/pauseMenu.js';
import { debriefHtml, paintDebriefCharts } from '../ui/debriefScreen.js';
import { applyCarriedCondition, buyTopUp, repairAircraft, storeAircraftCondition, suggestedUpgrade } from '../career/aircraftTurnaround.js';
import { paintPortrait } from '../ui/portraitPainter.js';
import { createCameraDirector } from '../camera/cameraDirector.js';
import { createFlightControls } from '../controls/flightControls.js';
import { createAudioEngine } from '../audio/audioEngine.js';
import { createFlightSounds } from '../audio/flightSounds.js';
import { createSoundEffects } from '../audio/soundEffects.js';
import { createMusicLoop } from '../audio/musicLoop.js';
import { createEffectsDirector } from '../effects/effectsDirector.js';
import { createGlidePathGates } from '../effects/glidePathGates.js';
import { createTowBanner } from '../effects/towBanner.js';
import { hasSavedCareer, loadCareer, saveCareer, clearCareer } from '../save/saveStore.js';
import { approachPlacement, createFlightSession, runwayPlacement } from './flightSession.js';
import { createFlightEventHandler } from './flightEventHandler.js';
import { createTitleBackdrop } from './titleBackdrop.js';
import { parkDisplayAircraft } from './apronDisplay.js';
import { createAirTraffic } from '../world/airTraffic.js';
import { createAtcRadio } from './atcRadio.js';
import { createAiFlyer } from '../aircraft/aiFlyer.js';

const SCREENS = ['screen-title', 'screen-mission-board', 'screen-hangar', 'screen-logbook', 'screen-challenges', 'screen-controls-help', 'screen-settings', 'screen-mission-briefing', 'screen-pause-menu', 'screen-mission-results'];

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
  if (new URLSearchParams(window.location.search).get('unlock') === 'all') career.xp = Math.max(career.xp, 5000);
  const settings = career.settings;
  const wind = createWindField();
  wind.attachTerrain(world.terrain);
  const cameras = createCameraDirector(view.camera);
  const controls = createFlightControls(canvas, settings);
  const session = createFlightSession({ scene: view.scene, world, wind, director: cameras, controls });
  const effects = createEffectsDirector(view.scene, world.landmarks.emitters);
  const gates = createGlidePathGates(view.scene);
  parkDisplayAircraft(view.scene);
  const traffic = createAirTraffic(view.scene, world.terrain);
  const atc = createAtcRadio({ say: (who, text) => hud.radio.say(who, text), wind, traffic });
  const audio = createAudioEngine();
  const flightSounds = createFlightSounds(audio);
  const sfx = createSoundEffects(audio);
  const music = createMusicLoop(audio);
  const hud = createHudController(world.terrain, { onRadio: () => sfx.play('radio') });
  const router = createScreenRouter(SCREENS, () => sfx.play('click'));
  const flightEvents = createFlightEventHandler({ effects, sfx, hud, radioFor: (kind) => (kind === 'coach' && mission?.giver) || 'dario' });
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
  let banner = null;
  const dropBanner = () => {
    banner?.dispose();
    banner = null;
  };
  const flashEl = document.createElement('div');
  flashEl.style.cssText = 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.25s';
  document.body.appendChild(flashEl);
  const frostEl = document.createElement('div');
  frostEl.id = 'windscreen-frost';
  frostEl.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none;background:radial-gradient(ellipse 60% 54% at 50% 36%, rgba(225,236,248,0) 50%, rgba(222,234,247,0.6) 78%, rgba(240,247,255,0.9) 100%);-webkit-mask-image:linear-gradient(to bottom,#000 50%,transparent 66%);mask-image:linear-gradient(to bottom,#000 50%,transparent 66%)';
  document.getElementById('hud').before(frostEl);

  const ctx = {
    get body() {
      return session.body;
    },
    get sim() {
      return session.simulation;
    },
    get controls() {
      return controls.controls;
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
    report: () => {},
    // Race rivals and formation leaders: AI aircraft flown along a path.
    createAiFlyer,
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
    dropBanner();
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
      challenges: () => showChallenges('title'),
      controls: () => showControls('title'),
      settings: () => showSettings('title'),
      back: () => {},
    });
    if (audio.ready) music.start();
  }

  function showBoard() {
    state = 'menu';
    dropBanner();
    // The menus always sit over the golden-hour archipelago, whatever the last sortie's weather.
    effects.setRain(0);
    light = world.setTimeOfDay('golden', view.renderer);
    if (audio.ready) music.start();
    router.show('screen-mission-board', missionBoardHtml(career), {
      brief: (id) => showBriefing(missionById(id)),
      back: showTitle,
      hangar: () => showHangar('board'),
      challenges: () => showChallenges('board'),
      free: () => startMission(null),
    });
  }

  function showBriefing(def) {
    state = 'menu';
    const refresh = () => {
      router.show('screen-mission-briefing', briefingHtml(def, career), handlers);
      for (const c of document.querySelectorAll('#screen-mission-briefing canvas[data-portrait]')) paintPortrait(c.getContext('2d'), c.dataset.portrait, c.width);
    };
    const handlers = {
      fly: () => startMission(def),
      back: showBoard,
      confirm: () => startMission(def),
      repair: () => {
        if (repairAircraft(career, def.aircraft)) {
          sfx.play('stage');
          save();
        }
        refresh();
      },
    };
    refresh();
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

  function showChallenges(from) {
    menuReturn = from;
    router.show('screen-challenges', challengesHtml(career), { back: () => back(menuReturn) });
  }

  function showControls(from) {
    menuReturn = from;
    router.show('screen-controls-help', controlsHelpHtml(), { back: () => back(menuReturn) });
  }

  function showSettings(from) {
    menuReturn = from;
    const refresh = () => {
      router.show('screen-settings', settingsHtml(settings), handlers);
      for (const select of document.querySelectorAll('#screen-settings select[data-setting]')) {
        select.addEventListener('change', () => {
          settings[select.dataset.setting] = select.value;
          save();
        });
      }
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
        if (!mission) finishFlight({ ...runner.endFreeFlight(), rows: [['Flight time', `${Math.round(session.simulation.flightTime)} s`], ['Landings', String(landingsThisFlight.length)]], landing: landingsThisFlight.at(-1) ?? null });
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
    controls.keyboard.takePressed();
    state = 'flying';
  }

  // ----- Flight -----
  function startMission(def, aircraftOverride = null) {
    mission = def;
    const id = def ? def.aircraft : aircraftOverride ?? freeAircraft ?? career.selected;
    freeAircraft = def ? freeAircraft : id;
    const upgrades = career.upgrades[id] ?? [];
    light = world.setTimeOfDay(def ? def.time : settings.timeOfDay, view.renderer);
    // The gust cycle restarts with every flight, so a mission's air is the same on every attempt.
    wind.set({ from: 250, speed: 4, gust: 1.5, turbulence: 0.35, ...(def?.wind ?? {}), time: 0 });
    effects.clearMissionEffects();
    effects.setRain(light.storm ? 1 : 0);
    const spec = tunedSpec(id, upgrades);
    const freeStart = (FREE_STARTS.find((s) => s.id === settings.freeStart) ?? FREE_STARTS[0]).start;
    const placement = placementFor(def?.start ?? freeStart, spec, world);
    // Birds strike only where a mission briefs them (coastal cliffs, the beach) and in free flight.
    session.start(id, upgrades, placement, { birds: settings.birdStrikes && !shotMode && (!def || def.birds === true), flocks: (def?.hazards ?? []).filter((h) => h.kind === 'birds'), fuelFraction: def?.fuel ?? 1, icing: def?.icing ?? null });
    dropBanner();
    if (def?.banner) {
      banner = createTowBanner(def.banner);
      session.rig.root.add(banner.group);
    }
    session.body.payload = def?.payload ?? 0;
    session.body.flightAssist = settings.flightAssist;
    // Damage left by the last sortie stays on the aircraft until it is repaired at a turnaround.
    applyCarriedCondition(career, id, session.body, def?.fuel ?? 1);
    // Some missions start with the aircraft already hurt (bringing a damaged aircraft home).
    applyStartingDamage(session.body, def?.damage);
    controls.mouse.state.sensitivity = 0.0045 * settings.mouseSensitivity;
    cockpitFor(session.rig);
    runner.start(def);
    ending = null;
    landingsThisFlight = [];
    atc.reset();
    hud.radio.clear();
    hud.popup.clear();
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
    const progress = applyFlightResult(career, result, { title: result.title, aircraft: spec.name, aircraftId: spec.id, night: light.night > 0.5, seconds: session.simulation.flightTime, distance: session.simulation.distance, landings: landingsThisFlight });
    storeAircraftCondition(career, spec.id, body, result.severity);
    save();
    state = 'results';
    controls.mouse.unlock();
    cameras.replay.start(session.simulation.recorder.frames(), world);
    cameras.view = 'replay';
    gates.set(null);
    hud.show(false);
    sfx.play(result.success ? 'success' : 'fail');
    const showDebrief = () => {
      router.show('screen-mission-results', debriefHtml(result, { ...progress, summary: careerSummary(career), upgrade: suggestedUpgrade(career, spec.id, UPGRADES) }, career, spec.id), handlers);
      paintDebriefCharts(document.getElementById('screen-mission-results'), result);
    };
    const turnaround = (fn) => (arg) => {
      if (fn(arg)) {
        sfx.play('stage');
        save();
      }
      showDebrief();
    };
    const handlers = {
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
      repair: turnaround(() => repairAircraft(career, spec.id)),
      'top-up': turnaround(() => buyTopUp(career, spec.id)),
      upgrade: turnaround((uid) => buyUpgrade(career, spec.id, uid)),
    };
    showDebrief();
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
      for (const e of simEvents) {
        if (e.kind === 'landed') landingsThisFlight.push(e.report);
        if (e.kind === 'refuelled') career.money = Math.max(0, career.money - e.kg * 2);
        if (e.kind === 'refuel-full') save();
      }
      const result = runner.update(dt, simEvents, actions);
      if (result) ending = { result, timer: result.severity === 'crash' ? 2.6 : 1.6 };
      if (!mission && !ending) atc.update(dt, session.body, session.spec.registration);
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
    updateReadout(readout, body, controls.controls, { ...guidanceExtras(guidance), refuelling: session.refuelling, icing: session.simulation.icing });
    readout.bandKt = runner.speedBand();
    const rank = careerRank(career);
    const approachTarget = runner.approachTarget;
    hud.update({
      readout,
      view: cameras.view,
      position: body.position,
      mission: runner.trackerInfo(),
      markers: runner.markers(),
      others: [...runner.others(), ...[...traffic.flyers, ...traffic.holding].map((f) => ({ x: f.rig.root.position.x, z: f.rig.root.position.z, color: '#d8e2ee' }))],
      guidance,
      targetKt: approachTarget ? approachTarget.targetKt : body.spec.vApproach * 1.944,
      career: { rank: rank.name, money: career.money, clock: light.clock, weather: light.label, aircraft: body.spec.name, medals: careerSummary(career) },
      load: runner.load(),
      fuelPlan: runner.fuelPlan,
      damage: damageEffects(body),
      decision: runner.decisionPanel(),
      stick: { active: controls.mouse.state.locked || controls.mouse.state.dragging, x: controls.mouse.state.x, y: controls.mouse.state.y },
      dt,
      force,
    });
    const cockpit = cockpitFor(session.rig);
    cockpit.visible = cameras.view === 'cockpit';
    cockpit.update(readout, controls.controls, dt, { landingLights: body.landingLights, clock: light.clock });
    // Rime creeping in from the edges of the windscreen as ice builds (cockpit view only).
    frostEl.style.opacity = cameras.view === 'cockpit' && state !== 'results' ? Math.min(0.95, readout.ice * 1.3).toFixed(2) : '0';
    flightSounds.update(state === 'flying' && !ending, readout, hud.warnings, time);
  }

  // ----- Frame -----
  canvas.addEventListener('click', () => {
    if (state === 'flying') controls.mouse.lock();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'flying' && !shotMode) showPause();
  });
  window.addEventListener('keydown', (event) => {
    if (state === 'flying') return;
    if (event.code === 'Escape') router.back();
    if (event.code === 'Enter') router.confirm();
  });

  function frame(dt, actionsOverride = null) {
    time += dt;
    const viewScale = view.viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(view.camera.fov) / 2));
    let focus;
    if (state === 'title' || (state === 'menu' && !session.body)) {
      controls.update(dt, false);
      focus = backdrop.update(dt, time, career.selected, state === 'title');
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
      banner?.update(time);
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
    if (state !== 'flying' && state !== 'paused') frostEl.style.opacity = '0';
    effects.update(dt, viewScale, wind.state.current, state === 'flying' ? session.body : null, view.camera, session.body?.smokeOn);
    traffic.update(dt, time);
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
    traffic,
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
