// The debrief after every mission or free flight, over the replay of its last seconds: the medal
// and score, what happened in one line, the flight recorder chart of the whole sortie, the
// touchdown report (or the crash report naming its cause), the score breakdown (main goals, bonus
// goals, discipline, penalties) with the bonus checklist, fuel and damage with the bingo decision,
// the career's progress, and the turnaround (repair, top-up, one upgrade) for the next sortie.
import { paintFlightRecorder } from './flightRecorderChart.js';
import { careerSummary } from '../career/careerProgress.js';
import { TOP_UP, aircraftCondition, repairQuote, suggestedUpgrade } from '../career/aircraftTurnaround.js';

const BANNER = { true: 'MISSION COMPLETE', crash: 'CRASHED', ditch: 'DITCHED', belly: 'BELLY LANDING', divert: 'DIVERTED', fail: 'MISSION FAILED' };
const MEDALS = ['bronze', 'silver', 'gold'];
const TICK = { met: '✓', failed: '✗', open: '○', current: '▸' };

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function medalRow(result) {
  if (!result.medals) return '';
  const earned = MEDALS.indexOf(result.medal);
  const cells = MEDALS.map((m, i) => `<div class="debrief-medal medal-${m}${i <= earned ? ' is-earned' : ''}"><i></i><b>${m.toUpperCase()}</b><small>${result.medals[m]}+</small></div>`).join('');
  return `<div class="debrief-medals">${cells}<div class="debrief-score"><b>${result.success ? result.score : 0}</b><small>score</small></div></div>`;
}

function toneFor(fraction) {
  return fraction >= 0.8 ? 'good' : fraction >= 0.45 ? 'warn' : 'bad';
}

function touchdownReport(result) {
  const landing = result.landing;
  if (!landing) return '';
  const rows = (landing.breakdown ?? []).map((r) => {
    const tone = toneFor(r.max ? r.points / r.max : 0);
    return `<tr><td>${r.item.replace('Touchdown sink rate', 'Sink rate')}</td><td>${r.value}</td><td class="tone-${tone}">${r.verdict}</td></tr>`;
  });
  if (result.targetKt && landing.thresholdKt) {
    const diff = Math.round(landing.thresholdKt - result.targetKt);
    rows.splice(1, 0, `<tr><td>Speed</td><td>${landing.thresholdKt} kt <small>at the fence</small></td><td class="tone-${Math.abs(diff) <= 5 ? 'good' : Math.abs(diff) <= 10 ? 'warn' : 'bad'}">${diff === 0 ? 'on target' : `${diff > 0 ? '+' : ''}${diff} vs ${result.targetKt}`}</td></tr>`);
  }
  const where = landing.runway ? `${landing.runway.code} ${landing.endName ?? ''}` : 'off field';
  return `<h3>Touchdown <span class="debrief-grade">${landing.grade}</span> <small>${landing.score}/100 · ${where}</small></h3><table class="result-table debrief-table">${rows.join('')}</table>`;
}

function crashReport(impact, severity) {
  if (!impact) return '';
  const flaps = ['up', '15°', '35°'][impact.flaps] ?? 'up';
  const rows = [
    ['Impact speed', `${impact.kt} kt`],
    ['Sink rate', `${impact.fpm} fpm`],
    ['Attitude', `${Math.abs(impact.pitch)}° nose ${impact.pitch >= 0 ? 'up' : 'down'}, ${Math.abs(impact.bank)}° ${impact.bank >= 0 ? 'right' : 'left'} bank`],
    ['Flaps / gear', `${flaps} / ${impact.gear ? 'down' : 'up'}`],
    ['Engine', impact.engine ? 'running' : 'stopped'],
  ];
  const title = severity === 'ditch' ? 'Ditching report' : severity === 'belly' ? 'Belly landing report' : 'Crash report';
  return `<h3>${title}</h3><table class="result-table">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
}

function scoreBreakdown(result) {
  if (!result.missionId) return `<h3>Flight</h3><table class="result-table">${result.rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  const rows = (result.breakdown ?? []).map((r) => `<tr><td>${r.item}</td><td class="debrief-muted">${r.value}</td><td class="${r.points < 0 ? 'tone-bad' : ''}">${r.points > 0 ? '+' : ''}${r.points}${r.max ? `<small>/${r.max}</small>` : ''}</td></tr>`).join('');
  const goals = (result.bonus?.goals ?? []).map((g) => `<li class="goal-${g.status}"><b>${TICK[g.status] ?? '○'}</b>${g.label}<span>${g.status === 'met' ? `+${g.reward} cr` : g.detail || ''}</span></li>`).join('');
  const disc = result.discipline;
  const streak = disc ? `<div class="debrief-streak">Discipline ${disc.points.toLocaleString('en-US')} pts · best streak ${disc.bestStreak} (×${disc.bestMultiplier})${disc.topFaults?.length ? ` · faults: ${disc.topFaults.map(([k, n]) => `${k}${n > 1 ? ` ×${n}` : ''}`).join(', ')}` : ''}</div>` : '';
  return `<h3>Score <span class="debrief-grade">${result.success ? result.score : 0}</span></h3><table class="result-table debrief-table">${rows}</table>${streak}<ul class="debrief-goals">${goals}</ul>`;
}

function fuelAndDamage(result) {
  const f = result.fuel;
  const rows = [];
  if (f) {
    rows.push(['Fuel used', `${f.used} kg of ${f.start}`]);
    rows.push(['Fuel left', `${f.end} kg <small>(reserve ${f.reserve})</small>`, f.end >= f.reserve ? 'good' : 'bad']);
  }
  if (result.decision) rows.push(['Bingo', result.decision.kind === 'divert' ? `diverted at ${result.decision.fuelKg} kg` : `pressed on at ${result.decision.fuelKg} kg${result.decision.auto ? ' (no answer)' : ''}`, 'warn']);
  const dmg = result.damage;
  if (dmg) {
    const effect = (part) => (dmg.effects ?? []).find((e) => e.part === part)?.text.toLowerCase();
    const parts = [['Engine', dmg.engine, effect('ENGINE')], ['Airframe', dmg.airframe, effect('WING')], ['Gear', dmg.gear, effect('GEAR')]].filter(([, v]) => v < 0.995);
    if (!parts.length) rows.push(['Damage', 'none', 'good']);
    for (const [k, v, what] of parts) rows.push([k, `${Math.round(v * 100)}%${what ? ` · ${what}` : ''}`, v > 0.75 ? 'warn' : 'bad']);
    const first = (dmg.log ?? [])[0];
    if (first) rows.push([clock(first.t), first.text, 'bad']);
  }
  const outcome = result.decision ? `<p class="debrief-decision">${result.decision.outcome}.</p>` : '';
  return `<h3>Fuel &amp; damage</h3><table class="result-table debrief-table">${rows.map(([k, v, tone]) => `<tr><td>${k}</td><td class="${tone ? `tone-${tone}` : ''}">${v}</td></tr>`).join('')}</table>${outcome}`;
}

function careerStrip(result, progress, career) {
  const rank = progress?.rank;
  const s = careerSummary(career);
  const news = [progress?.promoted ? `Promoted to ${rank.name}!` : '', ...(progress?.challenges ?? []).map((ch) => `Challenge: ${ch.title} +${ch.reward.money} cr`)].filter(Boolean).join(' · ');
  const tile = (value, label) => `<div class="debrief-tile"><b>${value}</b><span>${label}</span></div>`;
  return `<div class="debrief-career">${rank ? `<div class="debrief-rank"><span>${rank.name}</span><span class="debrief-bar wide"><i class="tone-good" style="width:${Math.round(rank.fraction * 100)}%"></i></span><small>${rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Top rank'}${news ? ` · <em>${news}</em>` : ''}</small></div>` : ''}
  ${tile(`+${result.money.toLocaleString('en-US')}`, `cr earned${result.repairs ? ` · −${result.repairs} repairs` : ''}`)}${tile(`+${result.xp}`, 'XP')}${tile(career.money.toLocaleString('en-US'), 'credits')}${tile(`${s.medals}/${s.missions}`, `medals · ${s.gold} gold`)}${tile(`${s.passed}/${s.missions}`, 'missions')}${tile(`${s.aircraft}/${s.aircraftTotal}`, 'aircraft')}</div>`;
}

function turnaround(career, aircraftId, aircraftName) {
  const c = aircraftCondition(career, aircraftId);
  const quote = repairQuote(career, aircraftId);
  const damaged = quote > 0;
  const parts = [['engine', c.engine], ['airframe', c.airframe], ['gear', c.gear]].filter(([, v]) => v < 0.995).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ');
  const upgrade = suggestedUpgrade(career, aircraftId);
  const buttons = [
    `<button class="btn" data-action="repair" ${damaged && career.money >= quote ? '' : 'disabled'}>${damaged ? `Repair ${parts} · ${quote} cr` : 'No repairs needed'}</button>`,
    `<button class="btn" data-action="top-up" ${c.topUp > 0 || career.money < TOP_UP.price ? 'disabled' : ''}>${c.topUp > 0 ? 'Tanks topped up' : `Top up +${TOP_UP.fraction * 100}% fuel · ${TOP_UP.price} cr`}</button>`,
    upgrade ? `<button class="btn" data-action="upgrade" data-arg="${upgrade.id}" ${career.money < upgrade.price ? 'disabled' : ''}>Fit ${upgrade.name} · ${upgrade.price} cr</button>` : '<button class="btn" disabled>All upgrades fitted</button>',
  ].join('');
  return `<div class="debrief-turnaround-label"><b>Turnaround · ${aircraftName}</b><small>${damaged ? 'Damage stays on until repaired' : 'Ready for the next sortie'}</small></div>${buttons}`;
}

/** HTML for the debrief; paintDebriefCharts draws the recorder chart once it is in the page. */
export function debriefHtml(result, progress, career, aircraftId) {
  const banner = result.success ? (result.missionId ? BANNER.true : 'FLIGHT LOGGED') : BANNER[result.severity] ?? BANNER.fail;
  const tone = result.success ? 'good' : result.severity === 'divert' ? 'warn' : 'bad';
  const what = result.cause ?? (result.success && result.landing ? `Landed on ${result.landing.runway ? `runway ${result.landing.endName ?? ''} at ${result.landing.runway.name}` : result.landing.place ?? 'open ground'}, grade ${result.landing.grade}: ${result.landing.remarks.slice(0, 3).join(', ').toLowerCase()}.` : result.success ? `${result.title}: score ${result.score} of 100.` : '');
  const sub = [result.chapter ? `Chapter ${result.chapter.id} · ${result.chapter.name}` : null, result.kind, result.aircraft, clock(result.time ?? 0)].filter(Boolean).join(' · ');
  const left = touchdownReport(result) || crashReport(result.impact, result.severity) || '<h3>Touchdown</h3><p class="debrief-none">No landing on this flight.</p>';
  const replay = result.severity === 'crash' ? 'the crash' : result.landing ? 'the touchdown' : 'the last seconds';
  return `<div class="replay-tag">● REPLAY · ${replay}</div><div class="sheet debrief">
  <div class="debrief-head"><div><div class="result-banner ${tone}">${banner}</div><div class="debrief-title">${result.title}</div><div class="debrief-sub">${sub}</div></div>${medalRow(result)}</div>
  <div class="result-cause"><b>What happened:</b> ${what}</div>
  <div class="debrief-recorder"><canvas class="debrief-chart" width="1100" height="172"></canvas></div>
  <div class="debrief-columns"><div>${left}</div><div>${scoreBreakdown(result)}</div><div>${fuelAndDamage(result)}</div></div>
  ${careerStrip(result, progress, career)}
  <div class="debrief-actions">${result.missionId || result.damage ? turnaround(career, aircraftId, result.aircraft) : ''}<button class="btn" data-action="retry">Retry <small>Enter</small></button><button class="btn" data-action="board">Mission board</button></div></div>`;
}

/** Draws the flight recorder into the debrief's canvas. */
export function paintDebriefCharts(root, result) {
  const canvas = root.querySelector('.debrief-chart');
  if (canvas) paintFlightRecorder(canvas, result.record);
}
