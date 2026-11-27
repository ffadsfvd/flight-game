// The settings screen: controls (invert pitch, flight assist, mouse sensitivity), sound and
// music volume, bird strikes, and the hour for free flight.
import { TIME_OF_DAY_NAMES, lightingFor } from '../world/timeOfDay.js';

/** Where free flight can begin. */
export const FREE_STARTS = [
  { id: 'marenza-27', label: 'Marenza International, runway 27', start: { type: 'runway', field: 'marenza', end: 1 } },
  { id: 'marenza-09', label: 'Marenza International, runway 09', start: { type: 'runway', field: 'marenza', end: 0 } },
  { id: 'orsa-22', label: 'Orsa Cay Field, runway 22', start: { type: 'runway', field: 'orsa', end: 1 } },
  { id: 'calvera-35', label: 'Calvera Highstrip, runway 35', start: { type: 'runway', field: 'calvera', end: 1 } },
  { id: 'nesta-09', label: 'Nesta Mountain Strip, runway 09', start: { type: 'runway', field: 'nesta', end: 0 } },
  { id: 'coral-08', label: 'Coral Keys Strip, runway 08', start: { type: 'runway', field: 'coral', end: 0 } },
  { id: 'sette-27', label: 'Sette Offshore Platform deck, runway 27', start: { type: 'runway', field: 'sette', end: 1 } },
  { id: 'air-marenza', label: 'In the air over Porto Celeste', start: { type: 'air', x: 1200, y: 450, z: 4600, heading: 300, speed: 55, throttle: 0.7 } },
  { id: 'air-orsa-thermals', label: 'Soaring over the Orsa mesas', start: { type: 'air', x: -6200, y: 520, z: -3300, heading: 70, speed: 30, throttle: 0.5 } },
  { id: 'final-marenza', label: 'On final for Marenza 09', start: { type: 'approach', field: 'marenza', end: 0, distance: 2400, flaps: 1 } },
  { id: 'final-sette', label: 'On final for the Sette platform', start: { type: 'approach', field: 'sette', end: 1, distance: 2200, flaps: 1 } },
];

/** HUD sizes the settings offer (a factor on the HUD's text and panels). */
export const HUD_SIZES = [
  { scale: 0.9, label: 'Small' },
  { scale: 1, label: 'Normal' },
  { scale: 1.15, label: 'Large' },
  { scale: 1.3, label: 'Extra large' },
];

/** Applies a HUD size to the page: every HUD panel, tape and gauge is sized in em from it. */
export function applyHudScale(scale) {
  document.documentElement.style.setProperty('--hud-scale', String(scale ?? 1));
}

export function settingsHtml(settings, { resetArmed = false } = {}) {
  const times = TIME_OF_DAY_NAMES.map((t) => `<option value="${t}" ${settings.timeOfDay === t ? 'selected' : ''}>${lightingFor(t).label}</option>`).join('');
  const toggle = (key, label) => `<div class="setting"><span>${label}</span><button class="btn" style="width:auto" data-action="toggle" data-arg="${key}">${settings[key] ? 'On' : 'Off'}</button></div>`;
  const slider = (key, label) => `<div class="setting"><span>${label}</span><span><button class="btn" style="width:auto;display:inline-block" data-action="less" data-arg="${key}">−</button> ${Math.round(settings[key] * 100)}% <button class="btn" style="width:auto;display:inline-block" data-action="more" data-arg="${key}">+</button></span></div>`;
  const hudSize = HUD_SIZES.find((s) => s.scale === (settings.hudScale ?? 1)) ?? HUD_SIZES[1];
  return `<div class="sheet"><h2>Settings</h2>${toggle('invertPitch', 'Invert pitch (W = nose up)')}${toggle('flightAssist', 'Flight assist (holds the nose up in banks)')}${toggle('birdStrikes', 'Bird strikes when flying low')}${slider('mouseSensitivity', 'Mouse stick sensitivity')}${slider('volume', 'Sound volume')}${slider('music', 'Music volume')}
  <div class="setting"><span>HUD size (text and panels in flight)</span><button class="btn" style="width:auto" data-action="hud-size">${hudSize.label} · ${Math.round(hudSize.scale * 100)}%</button></div>
  <div class="setting"><span>Free flight conditions</span><select data-setting="timeOfDay">${times}</select></div>
  <div class="setting"><span>Free flight start</span><select data-setting="freeStart">${FREE_STARTS.map((s) => `<option value="${s.id}" ${settings.freeStart === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn${resetArmed ? ' is-danger' : ''}" data-action="reset-career">${resetArmed ? 'Erase the whole career? Click again' : 'Reset career'}</button></div></div>`;
}
