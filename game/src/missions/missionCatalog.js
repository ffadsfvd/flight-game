// The Solvara career: six chapters of missions, one small file per mission under career/, each
// with its giver, aircraft, start, weather (wind, light, icing), briefing dialogue, stages and pay.
// Stage types: takeoff, rings (with rivals: a race; engineOff: soaring), land (water, short field,
// engine failure), reach, supply-drop, firefighting, photo, aerobatics, formation, search and
// sightseeing (a passenger tour scored on comfort).
import { firstSolo } from './career/flightSchool/firstSolo.js';
import { corvoCanyon } from './career/flightSchool/corvoCanyon.js';
import { highstripShortField } from './career/flightSchool/highstripShortField.js';
import { nightCircuits } from './career/flightSchool/nightCircuits.js';
import { mailRunToOrsa } from './career/islandWork/mailRunToOrsa.js';
import { lagoonTouchdown } from './career/islandWork/lagoonTouchdown.js';
import { postcardsFromSolvara } from './career/islandWork/postcardsFromSolvara.js';
import { heritageSurvey } from './career/islandWork/heritageSurvey.js';
import { islandHopperCargo } from './career/islandWork/islandHopperCargo.js';
import { theLongHop } from './career/islandWork/theLongHop.js';
import { marketDayShuttle } from './career/islandWork/marketDayShuttle.js';
import { setteDeckLanding } from './career/islandWork/setteDeckLanding.js';
import { sunsetSightseers } from './career/islandWork/sunsetSightseers.js';
import { ignaraHoneymoon } from './career/islandWork/ignaraHoneymoon.js';
import { lumenoGardenTour } from './career/islandWork/lumenoGardenTour.js';
import { flareOnGannetSkerry } from './career/rescueService/flareOnGannetSkerry.js';
import { fireOnCalvera } from './career/rescueService/fireOnCalvera.js';
import { coralKeysDrop } from './career/rescueService/coralKeysDrop.js';
import { medevacToMarenza } from './career/rescueService/medevacToMarenza.js';
import { fireOnNesta } from './career/rescueService/fireOnNesta.js';
import { reefDoctor } from './career/rescueService/reefDoctor.js';
import { offTheMountain } from './career/rescueService/offTheMountain.js';
import { skyBallet } from './career/racingAndAirshow/skyBallet.js';
import { barnstormer } from './career/racingAndAirshow/barnstormer.js';
import { wingOfTheLead } from './career/racingAndAirshow/wingOfTheLead.js';
import { beachBannerRun } from './career/racingAndAirshow/beachBannerRun.js';
import { ignaraRingRun } from './career/racingAndAirshow/ignaraRingRun.js';
import { mesaGrandPrix } from './career/racingAndAirshow/mesaGrandPrix.js';
import { celesteCoastSprint } from './career/racingAndAirshow/celesteCoastSprint.js';
import { archipelagoCup } from './career/racingAndAirshow/archipelagoCup.js';
import { deadStick } from './career/nightAndStorm/deadStick.js';
import { stormFront } from './career/nightAndStorm/stormFront.js';
import { nightMail } from './career/nightAndStorm/nightMail.js';
import { orsaGale } from './career/nightAndStorm/orsaGale.js';
import { darkWater } from './career/nightAndStorm/darkWater.js';
import { lightsOnTheDeck } from './career/nightAndStorm/lightsOnTheDeck.js';
import { bringHerHome } from './career/nightAndStorm/bringHerHome.js';
import { snowsOfMonteNesta } from './career/expedition/snowsOfMonteNesta.js';
import { iceOnVeloSaddle } from './career/expedition/iceOnVeloSaddle.js';
import { silentWings } from './career/expedition/silentWings.js';
import { nestaHutSupply } from './career/expedition/nestaHutSupply.js';
import { grandTour } from './career/expedition/grandTour.js';

export const CHAPTERS = [
  { id: 1, name: 'Flight School', subtitle: 'Marenza Flight School with Ines Varga', rank: 0 },
  { id: 2, name: 'Island Work', subtitle: 'Freight, mail, survey and tour flying for Brightwater, the Gazette and Celeste Air Tours', rank: 1 },
  { id: 3, name: 'Rescue Service', subtitle: 'Supply drops, a medevac and fire duty with Rescue Control and Fire Base Calvera', rank: 1 },
  { id: 4, name: 'Racing and Airshow', subtitle: 'Display flying, formation, banners and the races of the summer season', rank: 2 },
  { id: 5, name: 'Night and Storm', subtitle: 'Engine failure, squall lines, gales, the night mail and night work at sea', rank: 2 },
  { id: 6, name: 'The Expedition', subtitle: 'Mountain flying and icing over Nesta and Aurio, and the grand tour of the archipelago', rank: 3 },
];

export const MISSIONS = [
  firstSolo, corvoCanyon, highstripShortField, nightCircuits,
  mailRunToOrsa, lagoonTouchdown, postcardsFromSolvara, heritageSurvey, islandHopperCargo, theLongHop, marketDayShuttle, setteDeckLanding, sunsetSightseers, ignaraHoneymoon, lumenoGardenTour,
  flareOnGannetSkerry, fireOnCalvera, coralKeysDrop, medevacToMarenza, fireOnNesta, reefDoctor, offTheMountain,
  skyBallet, barnstormer, wingOfTheLead, beachBannerRun, ignaraRingRun, mesaGrandPrix, celesteCoastSprint, archipelagoCup,
  deadStick, stormFront, nightMail, orsaGale, darkWater, lightsOnTheDeck, bringHerHome,
  snowsOfMonteNesta, iceOnVeloSaddle, silentWings, nestaHutSupply, grandTour,
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
