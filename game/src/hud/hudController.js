// Owns every HUD panel and feeds them from the game state each frame: the tapes and instrument
// strip from the flight readout, the minimap and tracker from the mission, the approach guide on
// final, warnings, the radio, and the career badge. Text panels refresh at 15 Hz, gauges every frame.
import { createInstrumentStrip } from './instrumentStrip.js';
import { createAltitudeTape, createHeadingTape, createSpeedTape } from './flightTapes.js';
import { createMinimapPanel } from './minimapPanel.js';
import { createApproachGuidePanel } from './approachGuidePanel.js';
import { createRadioPanel } from './radioPanel.js';
import { createMissionTrackerPanel } from './missionTrackerPanel.js';
import { createAircraftSystemsPanel } from './aircraftSystemsPanel.js';
import { createFuelDamagePanel } from './fuelDamagePanel.js';
import { createBingoDecisionPanel } from './bingoDecisionPanel.js';
import { createDisciplinePopup } from './disciplinePopup.js';
import { activeWarnings, createWarningPanel } from './flightWarnings.js';
import { createCareerBadge } from './careerBadge.js';
import { VIEW_NAMES } from '../camera/cameraDirector.js';

const $ = (id) => document.getElementById(id);

/** Creates the HUD over the page's containers. */
export function createHudController(terrain, { onRadio } = {}) {
  const root = $('hud');
  const strip = createInstrumentStrip($('hud-instrument-strip'));
  const speed = createSpeedTape($('hud-airspeed-tape'));
  const altitude = createAltitudeTape($('hud-altitude-tape'));
  const heading = createHeadingTape($('hud-heading-tape'));
  const minimap = createMinimapPanel($('hud-minimap'), terrain);
  const approach = createApproachGuidePanel($('hud-approach-guide'));
  const radio = createRadioPanel($('hud-radio-message'), onRadio);
  const tracker = createMissionTrackerPanel($('hud-mission-tracker'));
  const systems = createAircraftSystemsPanel($('hud-aircraft-systems'));
  const fuel = createFuelDamagePanel($('hud-fuel-and-damage'));
  const decision = createBingoDecisionPanel($('hud-bingo-decision'));
  const popup = createDisciplinePopup($('hud-discipline-popup'));
  const warnings = createWarningPanel($('hud-flight-warnings'));
  const badge = createCareerBadge($('hud-career-badge'));
  const cameraLabel = $('hud-camera-label');
  const stick = $('hud-stick-indicator');
  const stickDot = stick.querySelector('i');
  const toasts = $('toast-messages');
  let textTimer = 0;
  let currentWarnings = [];

  return {
    radio,
    minimap,
    popup,
    get warnings() {
      return currentWarnings;
    },
    show(visible) {
      root.classList.toggle('is-hidden', !visible);
    },
    toast(text, tone = '') {
      const div = document.createElement('div');
      div.textContent = text;
      if (tone) div.className = tone;
      toasts.appendChild(div);
      setTimeout(() => div.remove(), 2500);
    },
    /** s: { readout, view, mission, markers, others, guidance, targetKt, career, load, fuelPlan, damage, decision, dt, force } */
    update(s) {
      root.classList.toggle('is-cockpit', s.view === 'cockpit');
      const d = s.readout;
      currentWarnings = activeWarnings(d, { approachActive: Boolean(s.guidance), runwayApproach: Boolean(s.guidance && s.guidance.field.kind !== 'water') });
      if (s.view !== 'cockpit') {
        speed.draw(d, s.dt);
        altitude.draw(d);
        strip.draw(d);
      }
      heading.draw(d);
      minimap.draw(s.position, d.heading, s.markers ?? [], s.others ?? [], d);
      radio.update(s.dt);
      popup.update(s.mission?.discipline?.last ?? null, s.dt);
      textTimer -= s.dt;
      if (textTimer <= 0 || s.force) {
        textTimer = 1 / 15;
        systems.update(d);
        fuel.update(d, s.load, s.fuelPlan, s.damage ?? []);
        decision.update(s.decision ?? null);
        warnings.update(currentWarnings);
        tracker.update(s.mission);
        badge.update(s.career);
        cameraLabel.textContent = `${VIEW_NAMES[s.view] ?? ''}  ·  C CAMERA  ·  CLICK MOUSE STICK  ·  ESC PAUSE  ·  H HELP`;
      }
      if (s.stick) {
        stick.classList.toggle('is-active', s.stick.active);
        stickDot.style.transform = `translate(${(s.stick.x * 1.9).toFixed(2)}em, ${(s.stick.y * 1.9).toFixed(2)}em)`;
      }
      if (s.guidance) {
        approach.show(true);
        approach.draw(s.guidance, d, s.targetKt ?? 65);
      } else {
        approach.show(false);
      }
    },
  };
}
