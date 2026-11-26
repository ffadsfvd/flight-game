// The settings screen: controls (invert pitch, flight assist, mouse sensitivity), sound and
// music volume, bird strikes, and the hour for free flight.
import { TIME_OF_DAY_NAMES, lightingFor } from '../world/timeOfDay.js';

/** Where free flight can begin. */
export const FREE_STARTS = [
  { id: 'marenza-27', label: 'Marenza International, runway 27', start: { type: 'runway', field: 'marenza', end: 1 } },
  { id: 'marenza-09', label: 'Marenza International, runway 09', start: { type: 'runway', field: 'marenza', end: 0 } },
  { id: 'orsa-22', label: 'Orsa Cay Field, runway 22', start: { type: 'runway', field: 'orsa', end: 1 } },
  { id: 'calvera-35', label: 'Calvera Highstrip, runway 35', start: { type: 'runway', field: 'calvera', end: 1 } },
  { id: 'air-marenza', label: 'In the air over Porto Celeste', start: { type: 'air', x: 1200, y: 450, z: 4600, heading: 300, speed: 55, throttle: 0.7 } },
  { id: 'final-marenza', label: 'On final for Marenza 09', start: { type: 'approach', field: 'marenza', end: 0, distance: 2400, flaps: 1 } },
];

export function settingsHtml(settings) {
  const times = TIME_OF_DAY_NAMES.map((t) => `<option value="${t}" ${settings.timeOfDay === t ? 'selected' : ''}>${lightingFor(t).label}</option>`).join('');
  const toggle = (key, label) => `<div class="setting"><span>${label}</span><button class="btn" style="width:auto" data-action="toggle" data-arg="${key}">${settings[key] ? 'On' : 'Off'}</button></div>`;
  const slider = (key, label) => `<div class="setting"><span>${label}</span><span><button class="btn" style="width:auto;display:inline-block" data-action="less" data-arg="${key}">−</button> ${Math.round(settings[key] * 100)}% <button class="btn" style="width:auto;display:inline-block" data-action="more" data-arg="${key}">+</button></span></div>`;
  return `<div class="sheet"><h2>Settings</h2>${toggle('invertPitch', 'Invert pitch (W = nose up)')}${toggle('flightAssist', 'Flight assist (holds the nose up in banks)')}${toggle('birdStrikes', 'Bird strikes when flying low')}${slider('mouseSensitivity', 'Mouse stick sensitivity')}${slider('volume', 'Sound volume')}${slider('music', 'Music volume')}
  <div class="setting"><span>Free flight conditions</span><select data-setting="timeOfDay">${times}</select></div>
  <div class="setting"><span>Free flight start</span><select data-setting="freeStart">${FREE_STARTS.map((s) => `<option value="${s.id}" ${settings.freeStart === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn" data-action="reset-career">Reset career</button></div></div>`;
}
