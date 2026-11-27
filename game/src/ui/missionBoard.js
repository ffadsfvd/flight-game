// The mission board: the career's chapters with a card per mission (kind, giver, the aircraft it is
// flown in and how many of the pilot's own suit it, pay and the credits its bonus goals add, best
// medal), locked chapters greyed out until the rank allows them.
import { CHAPTERS, MISSIONS, aircraftChoices, missionAircraft } from '../missions/missionCatalog.js';
import { bonusGoalsFor } from '../missions/bonusGoals.js';
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
      const flown = aircraftById(missionAircraft(m, career));
      const others = aircraftChoices(m, career).length - 1;
      const bonus = bonusGoalsFor(m, flown);
      const bonusCr = bonus.reduce((s, g) => s + g.reward, 0);
      return `<div class="mission-card${open ? '' : ' is-locked'}" ${open ? `data-action="brief" data-arg="${m.id}"` : ''}>
        <span class="medal medal-${medal}">${record?.passed ? MEDAL[medal] || '✓' : ''}</span>
        <div class="kind">${m.kind}</div><div class="name">${m.title}</div>
        <div class="meta">${characterById(m.giver).name} · ${flown.name}${others ? ` (+${others} of yours)` : ''} · ${m.reward.money} cr + ${bonus.length} bonus goals ${bonusCr} cr</div></div>`;
    }).join('');
    const locked = rank.index < chapter.rank;
    return `<h3>Chapter ${chapter.id}: ${chapter.name}${locked ? ` · unlocks at ${RANKS[chapter.rank].name}` : ''}</h3><p>${chapter.subtitle}</p><div class="mission-grid">${cards}</div>`;
  }).join('');
  return `<div class="sheet keeps-buttons"><h2>Mission Board</h2><p><b>${rank.name}</b> · ${career.money.toLocaleString('en-US')} cr · ${career.xp} XP${rank.next ? ` · ${rank.toNext} XP to ${rank.next}` : ''}</p><div class="sheet-body">${chapters}</div>
  <div class="btn-row"><button class="btn" data-action="back">Back</button><button class="btn" data-action="hangar">Hangar</button><button class="btn" data-action="challenges">Challenges</button><button class="btn" data-action="free">Free Flight</button></div></div>`;
}
