// The hangar: the seven aircraft with their numbers and roles, buying and selecting them, the damage
// each owned one still carries from its last sortie with the repair on offer, and the upgrades
// (engine, tank, gear, cooling) for the selected one.
import { AIRCRAFT, UPGRADES, stallSpeed } from '../aircraft/aircraftCatalog.js';
import { aircraftAvailability } from '../career/careerProgress.js';
import { aircraftCondition, repairQuote } from '../career/aircraftTurnaround.js';

const KT = 1.944;

/** The condition line of an owned aircraft: sound, or what is damaged with a repair button. */
function conditionLine(career, id) {
  const quote = repairQuote(career, id);
  if (quote <= 0) return '<p class="hangar-condition">Condition: ready</p>';
  const c = aircraftCondition(career, id);
  const parts = [['engine', c.engine], ['airframe', c.airframe], ['gear', c.gear]].filter(([, v]) => v < 0.995).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ');
  return `<p class="hangar-condition is-damaged">Damaged: ${parts}</p><button class="btn" data-action="repair" data-arg="${id}" ${career.money >= quote ? '' : 'disabled'}>Repair · ${quote} cr</button>`;
}

/** HTML for the hangar. */
export function hangarHtml(career) {
  const cards = AIRCRAFT.map((a) => {
    const avail = aircraftAvailability(career, a.id);
    const selected = career.selected === a.id;
    const action = avail.owned ? (selected ? '<button class="btn" disabled>Selected</button>' : `<button class="btn" data-action="select" data-arg="${a.id}">Select</button>`) : `<button class="btn" data-action="buy" data-arg="${a.id}" ${avail.canBuy ? '' : 'disabled'}>${avail.reason}</button>`;
    return `<div class="aircraft-card${selected ? ' is-selected' : ''}"><h4>${a.name}</h4><div class="role">${a.role} · ${a.registration}</div><p>${a.blurb}</p>
      <dl><dt>Stall</dt><dd>${Math.round(stallSpeed(a, a.mass + a.fuelCapacity * 0.5) * KT)} kt</dd><dt>Never exceed</dt><dd>${Math.round(a.vne * KT)} kt</dd><dt>Thrust</dt><dd>${(a.thrustStatic / 1000).toFixed(1)} kN ${a.engine}</dd><dt>Fuel</dt><dd>${a.fuelCapacity} kg</dd><dt>G limit</dt><dd>${a.gLimit} G</dd><dt>Gear</dt><dd>${a.floats ? 'floats + wheels' : a.gearRetracts ? 'retractable' : 'fixed'}</dd></dl>${avail.owned ? conditionLine(career, a.id) : ''}${action}</div>`;
  }).join('');
  const sel = career.selected;
  const owned = career.upgrades[sel] ?? [];
  const upgrades = UPGRADES.map((u) => `<div class="upgrade"><span><b>${u.name}</b> · ${u.describe}</span><button data-action="upgrade" data-arg="${u.id}" ${owned.includes(u.id) || career.money < u.price ? 'disabled' : ''}>${owned.includes(u.id) ? 'Fitted' : `${u.price} cr`}</button></div>`).join('');
  return `<div class="sheet keeps-buttons"><h2>Hangar</h2><p>${career.money.toLocaleString('en-US')} cr available</p><div class="sheet-body"><div class="aircraft-row">${cards}</div><h3>Upgrades for ${AIRCRAFT.find((a) => a.id === sel).name}</h3>${upgrades}</div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn" data-action="free">Free Flight in ${AIRCRAFT.find((a) => a.id === sel).name}</button></div></div>`;
}
