// The mission board: the career's chapters with a card per mission (kind, giver, aircraft, best
// medal), locked chapters greyed out until the rank allows them.
import { CHAPTERS, MISSIONS } from '../missions/missionCatalog.js';
import { aircraftById } from '../aircraft/aircraftCatalog.js';
import { characterById } from '../career/characterRoster.js';
import { careerRank, isMissionUnlocked } from '../career/careerProgress.js';
import { RANKS } from '../career/pilotRanks.js';

const MEDAL = { gold: '● GOLD', silver: '● SILVER', bronze: '● BRONZE', none: '' };

/** HTML for the board. */
export function missionBoardHtml(career) {
  const rank = careerRank(career);
  const chapters = CHAPTERS.map((chapter) => {
    const cards = MISSIONS.filter((m) => m.chapter === chapter.id).map((m) => {
      const record = career.missions[m.id];
      const open = isMissionUnlocked(career, m);
      const medal = record?.medal ?? 'none';
      return `<div class="mission-card${open ? '' : ' is-locked'}" ${open ? `data-action="brief" data-arg="${m.id}"` : ''}>
        <span class="medal medal-${medal}">${record?.passed ? MEDAL[medal] || '✓' : ''}</span>
        <div class="kind">${m.kind}</div><div class="name">${m.title}</div>
        <div class="meta">${characterById(m.giver).name} · ${aircraftById(m.aircraft).name} · ${m.reward.money} cr</div></div>`;
    }).join('');
    const locked = rank.index < chapter.rank;
    return `<h3>Chapter ${chapter.id}: ${chapter.name}${locked ? ` · unlocks at ${RANKS[chapter.rank].name}` : ''}</h3><p>${chapter.subtitle}</p><div class="mission-grid">${cards}</div>`;
  }).join('');
  return `<div class="sheet"><h2>Mission Board</h2><p><b>${rank.name}</b> · ${career.money.toLocaleString('en-US')} cr · ${career.xp} XP${rank.next ? ` · ${rank.toNext} XP to ${rank.next}` : ''}</p>${chapters}
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn" data-action="hangar">Hangar</button><button class="btn" data-action="challenges">Challenges</button><button class="btn" data-action="free">Free Flight</button></div></div>`;
}
