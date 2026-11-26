// The debrief after every mission or free flight, over the replay of its last seconds: what
// happened in one line, the medal earned against the gold, silver and bronze marks, the landing
// grade broken down (sink rate, centreline, touchdown zone, alignment, bounce, flare), the scoring
// rows, and the pay, repairs and experience with the rank bar.

const BANNER = { true: 'MISSION COMPLETE', crash: 'CRASHED', ditch: 'DITCHED', belly: 'BELLY LANDING', fail: 'MISSION FAILED' };
const MEDALS = ['bronze', 'silver', 'gold'];

function medalRow(result) {
  if (!result.medals) return '';
  const earned = MEDALS.indexOf(result.medal);
  const cells = MEDALS.map((m, i) => `<div class="debrief-medal medal-${m}${i <= earned ? ' is-earned' : ''}"><i></i><b>${m.toUpperCase()}</b><small>${result.medals[m]}+</small></div>`).join('');
  return `<div class="debrief-medals">${cells}<div class="debrief-score"><b>${result.success ? result.score : 0}</b><small>score</small></div></div>`;
}

function landingBreakdown(landing) {
  if (!landing) return '';
  const rows = (landing.breakdown ?? []).map((r) => {
    const fraction = r.max ? r.points / r.max : 0;
    const tone = fraction >= 0.8 ? 'good' : fraction >= 0.45 ? 'warn' : 'bad';
    return `<tr><td>${r.item}</td><td>${r.value}</td><td class="tone-${tone}">${r.verdict}</td><td><span class="debrief-bar"><i class="tone-${tone}" style="width:${Math.round(fraction * 100)}%"></i></span>${r.points}/${r.max}</td></tr>`;
  }).join('');
  const where = landing.runway ? `runway ${landing.endName ?? ''} at ${landing.runway.name}` : landing.place ?? 'off field';
  return `<h3>Landing grade <span class="debrief-grade">${landing.grade}</span> <small>${landing.score}/100 · ${where}</small></h3><table class="result-table debrief-table">${rows}</table>`;
}

function crashReport(impact, severity) {
  if (!impact) return '';
  const flaps = ['up', '15°', '35°'][impact.flaps] ?? 'up';
  const rows = [
    ['Impact speed', `${impact.kt} kt`],
    ['Sink rate', `${impact.fpm} fpm`],
    ['Attitude', `${Math.abs(impact.pitch)}° nose ${impact.pitch >= 0 ? 'up' : 'down'}, ${Math.abs(impact.bank)}° bank`],
    ['Flaps / gear', `${flaps} / ${impact.gear ? 'down' : 'up'}`],
    ['Engine', impact.engine ? 'running' : 'stopped'],
  ];
  const title = severity === 'ditch' ? 'Ditching report' : severity === 'belly' ? 'Belly landing report' : 'Crash report';
  return `<h3>${title}</h3><table class="result-table">${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
}

export function resultsHtml(result, progress) {
  const banner = result.success ? (result.missionId ? BANNER.true : 'FLIGHT LOGGED') : BANNER[result.severity] ?? BANNER.fail;
  const tone = result.success ? 'good' : 'bad';
  const what = result.cause ?? (result.success && result.landing ? `Landed on ${result.landing.runway ? `runway ${result.landing.endName ?? ''} at ${result.landing.runway.name}` : result.landing.place ?? 'open ground'}, grade ${result.landing.grade}: ${result.landing.remarks.slice(0, 3).join(', ').toLowerCase()}.` : result.success ? `${result.title}: score ${result.score} of 100.` : '');
  const rows = result.rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const rank = progress?.rank;
  const rankBar = rank ? `<div class="debrief-rank"><span>${rank.name}</span><span class="debrief-bar wide"><i class="tone-good" style="width:${Math.round(rank.fraction * 100)}%"></i></span><small>${rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Top rank'}</small></div>` : '';
  const promoted = progress?.promoted ? `<p class="debrief-promoted">Promoted to ${rank.name}!</p>` : '';
  const challenges = (progress?.challenges ?? []).map((ch) => `<p class="debrief-promoted">Challenge complete: ${ch.title} (+${ch.reward.money} cr, +${ch.reward.xp} XP)</p>`).join('');
  return `<div class="replay-tag">● REPLAY · ${result.severity === 'crash' ? 'the crash' : result.landing ? 'the touchdown' : 'the last seconds'}</div><div class="sheet debrief">
  <div class="debrief-head"><div><div class="result-banner ${tone}">${banner}</div><div class="debrief-title">${result.title}</div></div>${medalRow(result)}</div>
  <div class="result-cause"><b>What happened:</b> ${what}</div>
  <div class="debrief-columns"><div>${landingBreakdown(result.landing) || crashReport(result.impact, result.severity) || '<h3>Landing grade</h3><p class="debrief-none">No landing on this flight.</p>'}</div>
  <div><h3>Flight</h3><table class="result-table">${rows}</table>
  <h3>Earned</h3><table class="result-table"><tr><td>Pay</td><td>+${result.money} cr</td></tr><tr><td>Repairs</td><td>−${result.repairs} cr</td></tr><tr><td>Experience</td><td>+${result.xp} XP</td></tr></table>${rankBar}${promoted}${challenges}</div></div>
  <div class="btn-row"><button class="btn" data-action="retry">Retry <small>Enter</small></button><button class="btn" data-action="board">Mission board</button></div></div>`;
}
