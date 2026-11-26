// The settings screen: controls (invert pitch, flight assist, mouse sensitivity), sound and
// music volume, bird strikes, and the hour for free flight.
import { TIME_OF_DAY_NAMES, lightingFor } from '../world/timeOfDay.js';

export function settingsHtml(settings) {
  const times = TIME_OF_DAY_NAMES.map((t) => `<option value="${t}" ${settings.timeOfDay === t ? 'selected' : ''}>${lightingFor(t).label}</option>`).join('');
  const toggle = (key, label) => `<div class="setting"><span>${label}</span><button class="btn" style="width:auto" data-action="toggle" data-arg="${key}">${settings[key] ? 'On' : 'Off'}</button></div>`;
  const slider = (key, label) => `<div class="setting"><span>${label}</span><span><button class="btn" style="width:auto;display:inline-block" data-action="less" data-arg="${key}">−</button> ${Math.round(settings[key] * 100)}% <button class="btn" style="width:auto;display:inline-block" data-action="more" data-arg="${key}">+</button></span></div>`;
  return `<div class="sheet"><h2>Settings</h2>${toggle('invertPitch', 'Invert pitch (W = nose up)')}${toggle('flightAssist', 'Flight assist (holds the nose up in banks)')}${toggle('birdStrikes', 'Bird strikes when flying low')}${slider('mouseSensitivity', 'Mouse stick sensitivity')}${slider('volume', 'Sound volume')}${slider('music', 'Music volume')}
  <div class="setting"><span>Free flight conditions</span><select data-setting="timeOfDay">${times}</select></div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn" data-action="reset-career">Reset career</button></div></div>`;
}
