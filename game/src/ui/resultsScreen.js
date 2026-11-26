// The results screen after every mission or free flight: what happened in one line, the grade,
// the landing report, the scoring rows, pay, repairs and experience, while the replay camera
// shows the last seconds behind it.

const BANNER = { true: 'MISSION COMPLETE', crash: 'CRASHED', ditch: 'DITCHED', belly: 'BELLY LANDING', fail: 'MISSION FAILED' };

export function resultsHtml(result, progress) {
  const banner = result.success ? (result.missionId ? BANNER.true : 'FLIGHT LOGGED') : BANNER[result.severity] ?? BANNER.fail;
  const tone = result.success ? 'good' : 'bad';
  const grade = result.success ? (result.medal !== 'none' ? result.medal.toUpperCase() : `${result.score}%`) : '—';
  const landing = result.landing ? `<h3>Landing report · ${result.landing.grade}</h3><table class="result-table">${result.landing.remarks.map((r) => `<tr><td>${r}</td><td></td></tr>`).join('')}</table>` : '';
  const rows = result.rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const promoted = progress?.promoted ? `<p style="color:#ffc46a"><b>Promoted to ${progress.rank.name}!</b></p>` : '';
  return `<div class="sheet"><div class="grade-badge">${grade}</div><div class="result-banner ${tone}">${banner}</div>
  <div class="result-cause">${result.cause ?? (result.success ? `${result.title}: score ${result.score} of 100.` : '')}</div>
  ${landing}<h3>Flight</h3><table class="result-table">${rows}<tr><td>Pay</td><td>+${result.money} cr</td></tr><tr><td>Repairs</td><td>−${result.repairs} cr</td></tr><tr><td>Experience</td><td>+${result.xp} XP</td></tr></table>${promoted}
  <div class="btn-row"><button class="btn" data-action="retry">Retry <small>Enter</small></button><button class="btn" data-action="board">Mission board</button></div></div>`;
}
