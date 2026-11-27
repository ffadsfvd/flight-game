// The debrief after every mission or free flight, over the replay of its last seconds, laid out to
// read at a glance on a bright sheet: the mission name with the outcome in one big headline
// (DELIVERED, FIRE OUT, CRASHED), the medal as a large stamp with the score, the flight recorder
// chart of the whole sortie across half the sheet, then at most eight large lines (the score's
// parts, the touchdown, fuel, damage, the bingo call, the pay), with the finer detail smaller under
// them: the touchdown or crash report, the bonus checklist, fuel and damage, the career's progress
// and the turnaround (repair, top-up, one upgrade). Continue (Enter) and Retry (R) stay in view.
import { paintFlightRecorder } from './flightRecorderChart.js';
import { TOP_UP, aircraftCondition, repairQuote } from '../career/aircraftTurnaround.js';

/** HTML for the debrief; paintDebriefCharts draws the recorder chart once it is in the page. */
export function debriefHtml(result, progress, career, aircraftId) {
  const banner = result.success ? (result.missionId ? outcomeWord(result) : 'FLIGHT LOGGED') : BANNER[result.severity] ?? BANNER.fail;
  const tone = result.success ? 'good' : result.severity === 'divert' ? 'warn' : 'bad';
  const what = result.cause ?? (result.success && result.landing ? `Landed on ${result.landing.runway ? `runway ${result.landing.endName ?? ''} at ${result.landing.runway.name}` : result.landing.place ?? 'open ground'}, grade ${result.landing.grade}: ${result.landing.remarks.slice(0, 3).join(', ').toLowerCase()}.` : result.success ? `${result.title}: score ${result.score} of 100.` : '');
  const sub = [result.chapter ? `Chapter ${result.chapter.id} · ${result.chapter.name}` : null, result.kind, result.aircraft, clock(result.time ?? 0)].filter(Boolean).join(' · ');
  const report = touchdownReport(result) || crashReport(result.impact, result.severity) || '<h3>Touchdown</h3><p class="debrief-none">No landing on this flight.</p>';
  const replay = result.severity === 'crash' ? 'the crash' : result.landing ? 'the touchdown' : 'the last seconds';
  return `<div class="replay-tag">● REPLAY · ${replay}</div><div class="sheet debrief fits-window is-${tone}"><div class="sheet-body">
  <div class="debrief-head"><div class="debrief-headline"><div class="debrief-title">${result.title}</div><div class="result-banner ${tone}">${banner}</div><div class="debrief-sub">${sub}</div></div>${careerStrip(result, progress, career)}${medalStamp(result)}</div>
  <div class="result-cause"><b>What happened:</b> ${what}</div>
  <div class="debrief-recorder"><canvas class="debrief-chart" width="1320" height="410"></canvas></div>
  <div class="debrief-lines">${bigLines(result).map(([label, value, tone]) => `<div class="debrief-line${tone ? ` tone-${tone}` : ''}"><span>${label}</span><b>${value}</b></div>`).join('')}</div>
  <div class="debrief-columns"><div>${report}</div><div>${scoreDetail(result)}</div><div>${fuelAndDamage(result)}</div></div></div>
  <div class="debrief-actions">${result.missionId || result.damage ? turnaround(career, aircraftId, result.aircraft, progress?.upgrade ?? null) : ''}<button class="btn" data-action="retry">Retry <small>R</small></button><button class="btn btn-primary" data-action="board">Continue <small>Enter</small></button></div></div>`;
}

/** Draws the flight recorder into the debrief's canvas. */
export function paintDebriefCharts(root, result) {
  const canvas = root.querySelector('.debrief-chart');
  if (canvas) paintFlightRecorder(canvas, result.record);
}

/** The headline word for a completed mission, by what the mission was for. */
function outcomeWord(result) {
  const kind = (result.kind ?? '').toLowerCase();
  if (result.cargo || /cargo|medical|mail|supply drop|expedition/.test(kind)) return 'DELIVERED';
  if (kind.includes('fire')) return 'FIRE OUT';
  if (/search|rescue/.test(kind)) return 'RESCUED';
  if (/photo/.test(kind)) return 'PHOTOS TAKEN';
  if (/race/.test(kind)) return 'RACE FINISHED';
  if (/tour/.test(kind)) return 'TOUR FLOWN';
  if (/damaged|emergency/.test(kind)) return 'BROUGHT HOME';
  if (/landing|strip|seaplane|short field|approach/.test(kind)) return 'LANDED';
  return 'COMPLETE';
}

/** The medal as a big stamp with the score in it (a grey NO MEDAL stamp below bronze or on a failure). */
function medalStamp(result) {
  if (!result.medals) return '';
  const medal = result.success && MEDALS.includes(result.medal) ? result.medal : 'none';
  const next = MEDALS.find((m) => result.medals[m] > (result.success ? result.score : 0));
  return `<div class="debrief-stamp medal-${medal}"><i>${medal === 'none' ? 'NO MEDAL' : medal.toUpperCase()}</i><b>${result.success ? result.score : 0}</b><small>${next ? `${next} at ${result.medals[next]}` : 'top medal'}</small></div>`;
}

/** At most eight large lines: the score's parts, the touchdown, fuel, damage, the bingo call and the pay. */
function bigLines(result) {
  const lines = [];
  for (const r of (result.breakdown ?? []).slice(0, 3)) lines.push([r.item, `${r.points > 0 ? '+' : ''}${r.points}${r.max ? `<small>/${r.max}</small>` : ''}`, r.points < 0 ? 'bad' : r.max && r.points >= r.max * 0.8 ? 'good' : '']);
  if (!result.missionId) for (const [k, v] of (result.rows ?? []).slice(0, 3)) lines.push([k, v, '']);
  const landing = result.landing;
  if (landing) lines.push(['Touchdown', `${landing.grade} <small>${landing.fpm ?? ''}${landing.fpm !== undefined ? ' fpm' : ''}</small>`, toneFor(landing.score / 100)]);
  else if (result.impact) lines.push(['Impact', `${result.impact.kt} kt <small>${result.impact.fpm} fpm</small>`, 'bad']);
  const f = result.fuel;
  if (f) lines.push(['Fuel left', `${f.end} kg <small>reserve ${f.reserve}</small>`, f.end >= f.reserve ? 'good' : 'bad']);
  const dmg = result.damage;
  if (dmg) {
    const worst = [['Engine', dmg.engine], ['Airframe', dmg.airframe], ['Gear', dmg.gear]].filter(([, v]) => v < 0.995).sort((a, b) => a[1] - b[1])[0];
    lines.push(['Damage', worst ? `${worst[0]} ${Math.round(worst[1] * 100)}%` : 'none', worst ? (worst[1] > 0.75 ? 'warn' : 'bad') : 'good']);
  }
  if (result.decision || result.finalCall) {
    const calls = [result.decision ? (result.decision.kind === 'divert' ? 'diverted' : 'pressed on') : null, result.finalCall ? (result.finalCall.kind === 'land' ? 'committed' : 'went around') : null].filter(Boolean);
    lines.push([result.decision ? 'Bingo call' : 'Final call', calls.join(' · '), 'warn']);
  }
  lines.push(['Pay', `+${result.money.toLocaleString('en-US')} cr <small>+${result.xp} XP</small>`, result.money > 0 ? 'good' : '']);
  return lines.slice(0, 8);
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

/** The bonus checklist and the discipline streak (the score's parts are in the big lines). */
function scoreDetail(result) {
  if (!result.missionId) return `<h3>Flight</h3><table class="result-table">${result.rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  const goals = (result.bonus?.goals ?? []).map((g) => `<li class="goal-${g.status}"><b>${TICK[g.status] ?? '○'}</b>${g.label}<span>${g.status === 'met' ? `+${g.reward} cr` : g.detail || ''}</span></li>`).join('');
  const disc = result.discipline;
  const streak = disc ? `<div class="debrief-streak">Discipline ${disc.points.toLocaleString('en-US')} pts · best streak ${disc.bestStreak} (×${disc.bestMultiplier})${disc.topFaults?.length ? ` · faults: ${disc.topFaults.map(([k, n]) => `${k}${n > 1 ? ` ×${n}` : ''}`).join(', ')}` : ''}</div>` : '';
  const penalties = (result.breakdown ?? []).slice(3).map((r) => `<div class="debrief-streak">${r.item} ${r.points}</div>`).join('');
  return `<h3>Bonus goals</h3><ul class="debrief-goals">${goals}</ul>${streak}${penalties}`;
}

function fuelAndDamage(result) {
  const f = result.fuel;
  const rows = [];
  if (f) rows.push(['Fuel used', `${f.used} kg of ${f.start}`]);
  if (result.decision) rows.push(['Bingo', result.decision.kind === 'divert' ? `diverted at ${result.decision.fuelKg} kg` : `pressed on at ${result.decision.fuelKg} kg${result.decision.auto ? ' (no answer)' : ''}`, 'warn']);
  if (result.finalCall) rows.push(['Final call', `${result.finalCall.kind === 'land' ? 'committed' : 'went around'} at ${result.finalCall.fuelKg} kg${result.finalCall.auto ? ' (no answer)' : ''}`, 'warn']);
  const dmg = result.damage;
  if (dmg) {
    const effect = (part) => (dmg.effects ?? []).find((e) => e.part === part)?.text.toLowerCase();
    const parts = [['Engine', dmg.engine, effect('ENGINE')], ['Airframe', dmg.airframe, effect('WING')], ['Gear', dmg.gear, effect('GEAR')]].filter(([, v]) => v < 0.995);
    for (const [k, v, what] of parts) rows.push([k, `${Math.round(v * 100)}%${what ? ` · ${what}` : ''}`, v > 0.75 ? 'warn' : 'bad']);
    const first = (dmg.log ?? [])[0];
    if (first) rows.push([clock(first.t), first.text, 'bad']);
  }
  const outcome = [result.decision?.outcome, result.finalCall?.outcome].filter(Boolean).map((o) => `<p class="debrief-decision">${o}.</p>`).join('');
  return `<h3>Fuel &amp; damage</h3><table class="result-table debrief-table">${rows.map(([k, v, tone]) => `<tr><td>${k}</td><td class="${tone ? `tone-${tone}` : ''}">${v}</td></tr>`).join('')}</table>${outcome}`;
}

/** The career's progress, compact in the header: rank and its bar, then credits, medals, missions and aircraft from the real totals. */
function careerStrip(result, progress, career) {
  const rank = progress?.rank;
  const s = progress?.summary ?? { medals: 0, gold: 0, passed: 0, missions: 0, aircraft: career.owned.length, aircraftTotal: 0 };
  const news = [progress?.promoted ? `Promoted to ${rank.name}!` : '', ...(progress?.challenges ?? []).map((ch) => `Challenge: ${ch.title} +${ch.reward.money} cr`)].filter(Boolean).join(' · ');
  const tile = (value, label) => `<div class="debrief-tile"><b>${value}</b><span>${label}</span></div>`;
  return `<div class="debrief-career">${rank ? `<div class="debrief-rank"><span>${rank.name}</span><span class="debrief-bar wide"><i class="tone-good" style="width:${Math.round(rank.fraction * 100)}%"></i></span><small>${rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Top rank'}${news ? ` · <em>${news}</em>` : ''}</small></div>` : ''}
  <div class="debrief-tiles">${tile(career.money.toLocaleString('en-US'), `credits${result.repairsCharged ? ` · −${result.repairsCharged} repairs` : ''}${result.repairsCovered ? ` · insurance ${result.repairsCovered}` : ''}`)}${tile(`${s.medals}/${s.missions}`, `medals · ${s.gold} gold`)}${tile(`${s.passed}/${s.missions}`, 'missions')}${tile(`${s.aircraft}/${s.aircraftTotal}`, 'aircraft')}</div></div>`;
}

function turnaround(career, aircraftId, aircraftName, upgrade) {
  const c = aircraftCondition(career, aircraftId);
  const quote = repairQuote(career, aircraftId);
  const damaged = quote > 0;
  const parts = [['engine', c.engine], ['airframe', c.airframe], ['gear', c.gear]].filter(([, v]) => v < 0.995).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ');
  const buttons = [
    `<button class="btn" data-action="repair" ${damaged && career.money >= quote ? '' : 'disabled'}>${damaged ? `Repair ${parts} · ${quote} cr` : 'No repairs needed'}</button>`,
    `<button class="btn" data-action="top-up" ${c.topUp > 0 || career.money < TOP_UP.price ? 'disabled' : ''}>${c.topUp > 0 ? 'Tanks topped up' : `Top up +${TOP_UP.fraction * 100}% fuel · ${TOP_UP.price} cr`}</button>`,
    upgrade ? `<button class="btn" data-action="upgrade" data-arg="${upgrade.id}" ${career.money < upgrade.price ? 'disabled' : ''}>Fit ${upgrade.name} · ${upgrade.price} cr</button>` : '<button class="btn" disabled>All upgrades fitted</button>',
  ].join('');
  return `<div class="debrief-turnaround-label"><b>Turnaround · ${aircraftName}</b><small>${damaged ? 'Damage stays on until repaired' : 'Ready for the next sortie'}</small></div>${buttons}`;
}

function clock(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const BANNER = { crash: 'CRASHED', ditch: 'DITCHED', belly: 'BELLY LANDING', divert: 'DIVERTED', fail: 'MISSION FAILED' };
const MEDALS = ['bronze', 'silver', 'gold'];
const TICK = { met: '✓', failed: '✗', open: '○', current: '▸' };
