// The career state: money, experience and rank, owned aircraft and upgrades, the best result of
// every mission, the logbook and the settings, with the rules for unlocking and buying.
import { AIRCRAFT, UPGRADES, aircraftById } from '../aircraft/aircraftCatalog.js';
import { CHAPTERS, MISSIONS } from '../missions/missionCatalog.js';
import { RANKS, rankIndexFor, rankProgress } from './pilotRanks.js';
import { createLogbook, logFlight } from './pilotLogbook.js';
import { claimChallenges } from './challengeBoard.js';

export const DEFAULT_SETTINGS = { invertPitch: false, flightAssist: true, volume: 0.8, music: 0.5, mouseSensitivity: 1, birdStrikes: true, timeOfDay: 'golden', freeStart: 'marenza-27', quality: 'high' };

/** A brand new career. */
export function createCareer() {
  return { version: 1, money: 600, xp: 0, owned: ['wren'], selected: 'wren', upgrades: { wren: [], heron: [], kestrel: [], pelican: [], swiftlet: [] }, missions: {}, challenges: {}, logbook: createLogbook(), settings: { ...DEFAULT_SETTINGS }, started: true };
}

export function careerRank(career) {
  return rankProgress(career.xp);
}

/** Is the chapter of this mission open at the career's rank? */
export function isMissionUnlocked(career, mission) {
  const chapter = CHAPTERS.find((c) => c.id === mission.chapter);
  return rankIndexFor(career.xp) >= (chapter?.rank ?? 0);
}

/** Can the career buy (or has it unlocked) an aircraft? */
export function aircraftAvailability(career, id) {
  const spec = aircraftById(id);
  if (career.owned.includes(id)) return { owned: true, canBuy: false, reason: 'Owned' };
  const rank = rankIndexFor(career.xp);
  if (rank < spec.unlockRank) return { owned: false, canBuy: false, reason: `Needs ${RANKS[spec.unlockRank].name}` };
  if (career.money < spec.price) return { owned: false, canBuy: false, reason: `${spec.price} cr` };
  return { owned: false, canBuy: true, reason: `Buy ${spec.price} cr` };
}

export function buyAircraft(career, id) {
  const a = aircraftAvailability(career, id);
  if (!a.canBuy) return false;
  career.money -= aircraftById(id).price;
  career.owned.push(id);
  career.selected = id;
  return true;
}

export function buyUpgrade(career, aircraftId, upgradeId) {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  const list = career.upgrades[aircraftId] ?? (career.upgrades[aircraftId] = []);
  if (!upgrade || list.includes(upgradeId) || career.money < upgrade.price || !career.owned.includes(aircraftId)) return false;
  career.money -= upgrade.price;
  list.push(upgradeId);
  return true;
}

/** Applies a finished flight: pay, repairs, experience, best medal and the logbook. */
export function applyFlightResult(career, result, flight) {
  if (result.missionId) {
    const record = career.missions[result.missionId] ?? { best: 0, medal: 'none', passed: false, attempts: 0 };
    record.attempts += 1;
    if (result.success) {
      record.passed = true;
      if (result.score > record.best) record.best = result.score;
      const order = ['none', 'bronze', 'silver', 'gold'];
      if (order.indexOf(result.medal) > order.indexOf(record.medal)) record.medal = result.medal;
    }
    career.missions[result.missionId] = record;
  }
  const before = rankIndexFor(career.xp);
  career.money = Math.max(0, career.money + result.money - result.repairs);
  career.xp += result.xp;
  logFlight(career.logbook, { ...flight, result, crashed: result.severity === 'crash' });
  const challenges = claimChallenges(career);
  const after = rankIndexFor(career.xp);
  return { promoted: after > before, rank: rankProgress(career.xp), challenges };
}

/** Counts for the title screen's feature line, computed from the real data. */
export function featureCounts() {
  return { missions: MISSIONS.length, aircraft: AIRCRAFT.length, chapters: CHAPTERS.length };
}

/** Career progress in numbers: medals and golds won, missions passed, aircraft owned, of the totals. */
export function careerSummary(career) {
  const records = Object.values(career.missions);
  return {
    medals: records.filter((r) => r.medal && r.medal !== 'none').length,
    gold: records.filter((r) => r.medal === 'gold').length,
    passed: records.filter((r) => r.passed).length,
    missions: MISSIONS.length,
    aircraft: career.owned.length,
    aircraftTotal: AIRCRAFT.length,
  };
}
