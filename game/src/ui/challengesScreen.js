// The challenges board screen: every long-running goal with its progress bar, reward and a tick
// once it has paid out.
import { challengeStatus } from '../career/challengeBoard.js';

export function challengesHtml(career) {
  const list = challengeStatus(career);
  const done = list.filter((c) => c.done).length;
  const cards = list.map((c) => `<div class="challenge-card${c.done ? ' is-done' : ''}">
    <div class="challenge-head"><b>${c.done ? '✔ ' : ''}${c.title}</b><span>+${c.reward.money} cr · +${c.reward.xp} XP</span></div>
    <div class="challenge-text">${c.describe}</div>
    <div class="challenge-progress"><span class="debrief-bar wide"><i class="tone-${c.done ? 'good' : 'warn'}" style="width:${Math.round((c.value / c.goal) * 100)}%"></i></span><small>${c.value} / ${c.goal}</small></div></div>`).join('');
  return `<div class="sheet"><h2>Challenges</h2><p>${done} of ${list.length} complete. Each one pays once, the moment you meet it.</p><div class="challenge-grid">${cards}</div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button></div></div>`;
}
