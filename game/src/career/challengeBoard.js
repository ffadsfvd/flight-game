// The challenges board: long-running goals beside the missions (land at every airfield, collect
// gold medals, fly every aircraft, grease landings, land at night and on water...). Progress is
// read from the career and its logbook; a challenge pays its reward once, the moment it is met.
import { AIRFIELDS } from '../world/airfieldDirectory.js';
import { AIRCRAFT } from '../aircraft/aircraftCatalog.js';
import { CHAPTERS, MISSIONS } from '../missions/missionCatalog.js';

const medals = (career, kind) => Object.values(career.missions).filter((m) => m.medal === kind).length;
const passedIn = (career, chapter) => MISSIONS.filter((m) => m.chapter === chapter && career.missions[m.id]?.passed).length;

export const CHALLENGES = [
  { id: 'all-fields', title: 'Every Field', describe: `Land at all ${AIRFIELDS.length} airfields of the archipelago`, goal: AIRFIELDS.length, progress: (c) => Object.keys(c.logbook.fieldsLanded ?? {}).length, reward: { money: 600, xp: 200 } },
  { id: 'gold-10', title: 'Gold Collector', describe: 'Win 10 gold medals', goal: 10, progress: (c) => medals(c, 'gold'), reward: { money: 1200, xp: 400 } },
  { id: 'all-aircraft', title: 'Full Hangar', describe: `Fly all ${AIRCRAFT.length} aircraft`, goal: AIRCRAFT.length, progress: (c) => Object.keys(c.logbook.aircraftFlown ?? {}).length, reward: { money: 800, xp: 250 } },
  { id: 'greaser-5', title: 'Greaser', describe: 'Make 5 landings softer than 150 fpm', goal: 5, progress: (c) => c.logbook.greasers, reward: { money: 400, xp: 150 } },
  { id: 'night-owl', title: 'Night Owl', describe: 'Land on a runway at night', goal: 1, progress: (c) => c.logbook.nightLandings ?? 0, reward: { money: 300, xp: 120 } },
  { id: 'wet-feet', title: 'Wet Feet', describe: 'Make 3 water landings', goal: 3, progress: (c) => c.logbook.waterLandings ?? 0, reward: { money: 400, xp: 150 } },
  { id: 'a-plus', title: 'A+ Student', describe: 'Score an A+ landing', goal: 1, progress: (c) => c.logbook.aPlusLandings ?? 0, reward: { money: 350, xp: 150 } },
  { id: 'graduate', title: 'Graduate', describe: 'Pass every Flight School mission', goal: MISSIONS.filter((m) => m.chapter === 1).length, progress: (c) => passedIn(c, 1), reward: { money: 500, xp: 200 } },
  { id: 'rescuer', title: 'Guardian of the Islands', describe: 'Pass every Rescue Service mission', goal: MISSIONS.filter((m) => m.chapter === 3).length, progress: (c) => passedIn(c, 3), reward: { money: 900, xp: 300 } },
  { id: 'career-20', title: 'Career Pilot', describe: 'Pass 20 missions', goal: 20, progress: (c) => Object.values(c.missions).filter((m) => m.passed).length, reward: { money: 1500, xp: 500 } },
  { id: 'distance-200', title: 'Long Haul', describe: 'Fly 200 km in total', goal: 200, progress: (c) => Math.floor(c.logbook.distanceKm), reward: { money: 500, xp: 150 } },
  { id: 'every-chapter', title: 'Archipelago Legend', describe: `Pass a mission in all ${CHAPTERS.length} chapters`, goal: CHAPTERS.length, progress: (c) => CHAPTERS.filter((ch) => passedIn(c, ch.id) > 0).length, reward: { money: 1000, xp: 350 } },
];

/** Each challenge with its current progress (capped at the goal) and whether it is done. */
export function challengeStatus(career) {
  const claimed = career.challenges ?? {};
  return CHALLENGES.map((ch) => {
    const value = Math.min(ch.goal, ch.progress(career));
    return { ...ch, value, done: value >= ch.goal, claimed: Boolean(claimed[ch.id]) };
  });
}

/** Pays every challenge that has just been met; returns the newly completed ones. */
export function claimChallenges(career) {
  career.challenges = career.challenges ?? {};
  const fresh = challengeStatus(career).filter((ch) => ch.done && !ch.claimed);
  for (const ch of fresh) {
    career.challenges[ch.id] = true;
    career.money += ch.reward.money;
    career.xp += ch.reward.xp;
  }
  return fresh;
}
