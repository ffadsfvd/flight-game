// The mission briefing: who is asking, what they say, and the facts of the sortie (aircraft,
// weather, fuel, stages, pay) before the pilot presses Fly.
import { aircraftById } from '../aircraft/aircraftCatalog.js';
import { characterById } from '../career/characterRoster.js';
import { lightingFor } from '../world/timeOfDay.js';

/** HTML for a mission's briefing; portraits are drawn into the canvases afterwards. */
export function briefingHtml(mission) {
  const lines = mission.briefing.map(([who, text], i) => `<div class="dialogue"><canvas width="92" height="92" data-portrait="${who}" data-index="${i}"></canvas><div><div class="who">${characterById(who).name} · ${characterById(who).role}</div><p>${text}</p></div></div>`).join('');
  const wind = mission.wind ?? { from: 250, speed: 3 };
  return `<div class="sheet"><h2>${mission.title}</h2><p><b>${mission.kind}</b> · ${mission.summary}</p>${lines}
  <div class="brief-facts"><div><b>${aircraftById(mission.aircraft).name}</b>aircraft</div><div><b>${lightingFor(mission.time).label}</b>conditions</div><div><b>${String(wind.from).padStart(3, '0')}° / ${Math.round(wind.speed * 1.944)} kt</b>wind</div><div><b>${Math.round((mission.fuel ?? 1) * 100)}%</b>fuel</div><div><b>${mission.stages.length}</b>${mission.stages.length === 1 ? 'stage' : 'stages'}</div><div><b>${mission.reward.money} cr</b>pay</div></div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn is-focus" data-action="fly" data-arg="${mission.id}">Fly ▶</button></div></div>`;
}
