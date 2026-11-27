// The mission briefing: who is asking, what they say, the facts of the sortie (aircraft,
// weather, fuel, stages, pay), the bonus goals with their credits, and any damage the aircraft
// still carries from its last sortie (with the repair on offer) before the pilot presses Fly.
import { aircraftById } from '../aircraft/aircraftCatalog.js';
import { characterById } from '../career/characterRoster.js';
import { lightingFor } from '../world/timeOfDay.js';
import { bonusGoalsFor } from '../missions/bonusGoals.js';
import { aircraftCondition, repairQuote } from '../career/aircraftTurnaround.js';
import { reserveFuel } from '../flight/fuelPlanner.js';

/** The keys this mission's work needs (drop, scoop, shutter, searchlight, bingo), as one line of key caps. */
function missionControls(mission) {
  const types = new Set(mission.stages.map((s) => s.type));
  const keys = [];
  if (types.has('firefighting')) keys.push('<kbd>Space</kbd> drop the water low over the flames', '<b>Scoop:</b> gear up, settle on the sea at 30 kt+ and hold it there until the tank is full');
  if (types.has('supply-drop')) keys.push('<kbd>Space</kbd> drop the crate on the flare');
  if (types.has('photo')) keys.push('<kbd>Space</kbd> take the photo with the landmark centred');
  if (types.has('search')) keys.push('<kbd>L</kbd> landing light on: it is your searchlight');
  if (types.has('aerobatics')) keys.push('<kbd>T</kbd> display smoke');
  if ((mission.fuel ?? 1) < 0.4) keys.push('at bingo fuel: <kbd>J</kbd> divert · <kbd>K</kbd> press on');
  return keys.length ? `<div class="brief-controls"><b>Controls</b>${keys.map((k) => `<span>${k}</span>`).join('')}</div>` : '';
}

/** HTML for a mission's briefing; portraits are drawn into the canvases afterwards. */
export function briefingHtml(mission, career = null) {
  const spec = aircraftById(mission.aircraft);
  const lines = mission.briefing.map(([who, text], i) => `<div class="dialogue"><canvas width="92" height="92" data-portrait="${who}" data-index="${i}"></canvas><div><div class="who">${characterById(who).name} · ${characterById(who).role}</div><p>${text}</p></div></div>`).join('');
  const wind = mission.wind ?? { from: 250, speed: 3 };
  const fuelKg = Math.round(spec.fuelCapacity * (mission.fuel ?? 1));
  const goals = bonusGoalsFor(mission, spec).map((g) => `<li><b>○</b>${g.label}<span>+${g.reward} cr</span></li>`).join('');
  let condition = '';
  if (career) {
    const c = aircraftCondition(career, mission.aircraft);
    const quote = repairQuote(career, mission.aircraft);
    const parts = [['engine', c.engine], ['airframe', c.airframe], ['gear', c.gear]].filter(([, v]) => v < 0.995).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ');
    if (quote > 0) condition = `<div class="brief-damage"><span>The ${spec.name} still carries damage: ${parts}.</span><button class="btn" data-action="repair" ${career.money >= quote ? '' : 'disabled'}>Repair · ${quote} cr</button></div>`;
    if (c.topUp > 0) condition += `<div class="brief-damage is-good"><span>Tanks topped up +${Math.round(c.topUp * 100)}% for this sortie.</span></div>`;
  }
  return `<div class="sheet fits-window"><div class="sheet-body"><h2>${mission.title}</h2><p><b>${mission.kind}</b> · ${mission.summary}</p>${lines}${missionControls(mission)}
  <div class="brief-facts"><div><b>${spec.name}</b>aircraft</div><div><b>${lightingFor(mission.time).label}</b>conditions</div><div><b>${String(wind.from).padStart(3, '0')}° / ${Math.round(wind.speed * 1.944)} kt</b>wind</div><div><b>${fuelKg} kg</b>fuel · reserve ${Math.round(reserveFuel(spec))}</div><div><b>${mission.stages.length}</b>${mission.stages.length === 1 ? 'stage' : 'stages'}</div><div><b>${mission.reward.money} cr</b>pay</div></div>
  <h3>Bonus goals</h3><ul class="brief-goals">${goals}</ul>${mission.damage ? `<p class="brief-hazard">The ${spec.name} is already damaged:${mission.damage.engine !== undefined ? ' the engine is capped below full power,' : ''}${mission.damage.wing ? ` the ${mission.damage.side === -1 ? 'right' : 'left'} wing pulls,` : ''}${mission.damage.gear !== undefined ? ' the gear will not take a firm landing,' : ''} and the panel names each one.</p>` : ''}${mission.birds ? '<p class="brief-hazard">Hazard: birds along the coast. A strike can cap the engine or bend a wing.</p>' : ''}${(mission.hazards ?? []).map((h) => `<p class="brief-hazard">Hazard: ${h.label === 'GULLS' ? 'gulls' : 'birds'} up to ${h.topFt} ft (orange on the map). Fly above or around them: a strike caps the engine.</p>`).join('')}${condition}</div>
  <div class="btn-row"><button class="btn" data-action="back">Back <small>Esc</small></button><button class="btn is-focus" data-action="fly" data-arg="${mission.id}">Fly ▶ <small>Enter</small></button></div></div>`;
}
