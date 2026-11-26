// The logbook screen: totals (hours, landings, greasers, crashes, distance, missions) and the
// most recent flights.
import { missionById } from '../missions/missionCatalog.js';

export function logbookHtml(career) {
  const log = career.logbook;
  const best = Object.entries(log.bestTimes).map(([id, t]) => `<tr><td>Best time · ${missionById(id)?.title ?? id}</td><td>${t} s</td></tr>`).join('');
  const rows = log.entries.map((e) => `<tr><td>${e.date} · ${e.title} · ${e.aircraft}</td><td>${e.minutes} min · ${e.outcome} · landing ${e.landing}</td></tr>`).join('') || '<tr><td>No flights yet</td><td></td></tr>';
  return `<div class="sheet"><h2>Pilot Logbook</h2>
  <table class="result-table"><tr><td>Flight time</td><td>${log.hours.toFixed(2)} h</td></tr><tr><td>Landings (smooth / hard)</td><td>${log.landings} (${log.greasers} / ${log.hardLandings})</td></tr><tr><td>Crashes</td><td>${log.crashes}</td></tr><tr><td>Distance flown</td><td>${Math.round(log.distanceKm)} km</td></tr><tr><td>Missions passed / flown</td><td>${log.missionsPassed} / ${log.missionsFlown}</td></tr>${best}</table>
  <h3>Recent flights</h3><table class="result-table">${rows}</table>
  <div class="btn-row"><button class="btn" data-action="back">Back</button></div></div>`;
}
