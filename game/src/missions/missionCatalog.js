// The Solvara career: six chapters of missions, one small file per mission under career/, each
// with its giver, aircraft, start, weather, briefing dialogue, stages and pay. Stage types:
// takeoff, rings (with rivals: a race), land (water, short field, engine failure), reach,
// supply-drop, firefighting, photo, aerobatics and formation.
import { firstSolo } from './career/flightSchool/firstSolo.js';
import { corvoCanyon } from './career/flightSchool/corvoCanyon.js';
import { highstripShortField } from './career/flightSchool/highstripShortField.js';
import { nightCircuits } from './career/flightSchool/nightCircuits.js';
import { mailRunToOrsa } from './career/islandWork/mailRunToOrsa.js';
import { lagoonTouchdown } from './career/islandWork/lagoonTouchdown.js';
import { postcardsFromSolvara } from './career/islandWork/postcardsFromSolvara.js';
import { heritageSurvey } from './career/islandWork/heritageSurvey.js';
import { islandHopperCargo } from './career/islandWork/islandHopperCargo.js';
import { flareOnGannetSkerry } from './career/rescueService/flareOnGannetSkerry.js';
import { fireOnCalvera } from './career/rescueService/fireOnCalvera.js';
import { coralKeysDrop } from './career/rescueService/coralKeysDrop.js';
import { medevacToMarenza } from './career/rescueService/medevacToMarenza.js';
import { fireOnNesta } from './career/rescueService/fireOnNesta.js';
import { skyBallet } from './career/racingAndAirshow/skyBallet.js';
import { wingOfTheLead } from './career/racingAndAirshow/wingOfTheLead.js';
import { beachBannerRun } from './career/racingAndAirshow/beachBannerRun.js';
import { ignaraRingRun } from './career/racingAndAirshow/ignaraRingRun.js';
import { mesaGrandPrix } from './career/racingAndAirshow/mesaGrandPrix.js';
import { archipelagoCup } from './career/racingAndAirshow/archipelagoCup.js';
import { deadStick } from './career/nightAndStorm/deadStick.js';
import { stormFront } from './career/nightAndStorm/stormFront.js';
import { nightMail } from './career/nightAndStorm/nightMail.js';
import { orsaGale } from './career/nightAndStorm/orsaGale.js';
import { snowsOfMonteNesta } from './career/expedition/snowsOfMonteNesta.js';
import { grandTour } from './career/expedition/grandTour.js';

export const CHAPTERS = [
  { id: 1, name: 'Flight School', subtitle: 'Marenza Flight School with Ines Varga', rank: 0 },
  { id: 2, name: 'Island Work', subtitle: 'Freight, mail and survey flying for Brightwater and the Gazette', rank: 1 },
  { id: 3, name: 'Rescue Service', subtitle: 'Supply drops, a medevac and fire duty with Rescue Control and Fire Base Calvera', rank: 1 },
  { id: 4, name: 'Racing and Airshow', subtitle: 'Display flying, formation, banners and the races of the summer season', rank: 2 },
  { id: 5, name: 'Night and Storm', subtitle: 'Engine failure, squall lines, gales and the night mail', rank: 2 },
  { id: 6, name: 'The Expedition', subtitle: 'Mountain flying over Nesta and the grand tour of the archipelago', rank: 3 },
];

export const MISSIONS = [
  firstSolo, corvoCanyon, highstripShortField, nightCircuits,
  mailRunToOrsa, lagoonTouchdown, postcardsFromSolvara, heritageSurvey, islandHopperCargo,
  flareOnGannetSkerry, fireOnCalvera, coralKeysDrop, medevacToMarenza, fireOnNesta,
  skyBallet, wingOfTheLead, beachBannerRun, ignaraRingRun, mesaGrandPrix, archipelagoCup,
  deadStick, stormFront, nightMail, orsaGale,
  snowsOfMonteNesta, grandTour,
];

/** The mission with this id. */
export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) ?? null;
}

/** Medal for a 0..100 score with the mission's thresholds. */
export function medalFor(mission, score) {
  const m = mission?.medals ?? { gold: 85, silver: 65, bronze: 40 };
  return score >= m.gold ? 'gold' : score >= m.silver ? 'silver' : score >= m.bronze ? 'bronze' : 'none';
}
