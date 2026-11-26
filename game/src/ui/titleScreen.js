// The title screen over the golden-hour archipelago: the game's name, a feature line counted from
// the real data, the main menu and a card with the current career.
import { AIRFIELDS } from '../world/airfieldDirectory.js';
import { ISLANDS } from '../world/archipelagoMap.js';
import { featureCounts, careerRank } from '../career/careerProgress.js';

/** HTML for the title screen. */
export function titleScreenHtml(career, hasSave) {
  const c = featureCounts();
  const islands = ISLANDS.filter((i) => i.rx > 1000).length;
  const features = `${c.missions} missions in ${c.chapters} chapters · ${c.aircraft} aircraft · ${AIRFIELDS.length} airfields · ${islands} islands · medals & logbook`;
  const rank = career ? careerRank(career) : null;
  const passed = career ? Object.values(career.missions).filter((m) => m.passed).length : 0;
  return `
  <div class="brand">
    <h1>SOLVARA <span>SKIES</span></h1>
    <div class="tagline">An island flight career over the sun-soaked Solvara Archipelago</div>
    <div class="features">${features}</div>
  </div>
  <div class="sheet menu">
    ${hasSave ? '<button class="btn is-focus" data-action="continue">Continue Career <small>mission board</small></button>' : ''}
    <button class="btn${hasSave ? '' : ' is-focus'}" data-action="new">New Career <small>flight school</small></button>
    <button class="btn" data-action="free">Free Flight <small>any aircraft</small></button>
    <button class="btn" data-action="hangar">Hangar <small>aircraft &amp; upgrades</small></button>
    <button class="btn" data-action="logbook">Logbook</button>
    <button class="btn" data-action="controls">Controls</button>
    <button class="btn" data-action="settings">Settings</button>
  </div>
  ${rank ? `<div class="sheet career-card"><div><b>${rank.name}</b> · ${career.money.toLocaleString('en-US')} cr</div><div>${passed} of ${c.missions} missions passed · ${career.logbook.hours.toFixed(1)} h logged · ${career.logbook.landings} landings</div><div>${rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Top rank reached'}</div></div>` : ''}
  <div class="hint">Mouse or W/S A/D Q/E to fly · Shift/Ctrl throttle · F flaps · G gear · C camera · Esc pause</div>`;
}
