// The turnaround between sorties, paid with credits: damage a flight leaves on an aircraft stays
// on it (an engine capped below full power, a wing that pulls, weak gear) until it is repaired;
// the tanks can be topped up above a mission's planned fuel for the next sortie; and one upgrade
// can be fitted on the spot. A crash, ditching or belly landing is always repaired after it.
import { UPGRADES } from '../aircraft/aircraftCatalog.js';

// Damage carried into the next sortie never goes below these: careful flying stays possible.
const FLOOR = { engine: 0.6, airframe: 0.72, gear: 0.6 };
const REPAIR_RATE = 380;
export const TOP_UP = { fraction: 0.25, price: 45 };

function fleetEntry(career, id) {
  career.fleet = career.fleet ?? {};
  career.fleet[id] = career.fleet[id] ?? { engine: 1, airframe: 1, gear: 1, wingPull: 1, wingBend: 0, topUp: 0 };
  return career.fleet[id];
}

/** Keeps what the flight did to the aircraft; a wreck is repaired by the crash fee instead. */
export function storeAircraftCondition(career, id, body, severity) {
  const entry = fleetEntry(career, id);
  if (severity === 'crash' || severity === 'ditch' || severity === 'belly') {
    Object.assign(entry, { engine: 1, airframe: 1, gear: 1, wingPull: 1, wingBend: 0 });
    return entry;
  }
  entry.engine = Math.max(FLOOR.engine, Math.min(1, body.engine.health));
  entry.airframe = Math.max(FLOOR.airframe, Math.min(1, body.airframe));
  entry.gear = Math.max(FLOOR.gear, Math.min(1, body.gearHealth));
  entry.wingPull = body.wingPull ?? 1;
  entry.wingBend = Math.min(0.2, body.wingBend ?? 0);
  return entry;
}

/** The aircraft's carried condition { engine, airframe, gear, wingPull, topUp }. */
export function aircraftCondition(career, id) {
  return { ...fleetEntry(career, id) };
}

/** Credits to put the aircraft back to 100%. */
export function repairQuote(career, id) {
  const e = fleetEntry(career, id);
  return Math.round(((1 - e.engine) * 1.4 + (1 - e.airframe) + (1 - e.gear) * 0.8) * REPAIR_RATE / 5) * 5;
}

export function repairAircraft(career, id) {
  const cost = repairQuote(career, id);
  if (cost <= 0 || career.money < cost) return false;
  career.money -= cost;
  Object.assign(fleetEntry(career, id), { engine: 1, airframe: 1, gear: 1, wingPull: 1, wingBend: 0 });
  return true;
}

export function buyTopUp(career, id) {
  const e = fleetEntry(career, id);
  if (e.topUp > 0 || career.money < TOP_UP.price) return false;
  career.money -= TOP_UP.price;
  e.topUp = TOP_UP.fraction;
  return true;
}

/** The cheapest upgrade the aircraft does not have yet, offered at the turnaround. */
export function suggestedUpgrade(career, id) {
  const owned = career.upgrades[id] ?? [];
  return UPGRADES.filter((u) => !owned.includes(u.id)).sort((a, b) => a.price - b.price)[0] ?? null;
}

/** Puts the carried condition on a new flight's body and uses up a bought top-up. */
export function applyCarriedCondition(career, id, body, plannedFuelFraction) {
  const e = fleetEntry(career, id);
  body.engine.health = e.engine;
  body.airframe = e.airframe;
  body.gearHealth = e.gear;
  body.wingPull = e.wingPull ?? 1;
  body.wingBend = e.wingBend ?? 0;
  if (e.topUp > 0) {
    body.engine.fuel = Math.min(body.spec.fuelCapacity, body.spec.fuelCapacity * (plannedFuelFraction + e.topUp));
    e.topUp = 0;
  }
  return e;
}
