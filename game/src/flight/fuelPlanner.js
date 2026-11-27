// Fuel planning from the real engine: the fuel flow now and at cruise, the endurance and the range
// to dry tanks at the current power, the reserve kept for a safe arrival (six minutes at cruise),
// and the bingo fuel: that reserve plus the fuel to reach the nearest of the archipelago's
// airfields. Below bingo the sortie needs a decision; below the reserve it is an emergency.
import { AIRFIELDS } from '../world/airfieldDirectory.js';
import { fuelBurnAt, fuelFlow } from './engineModel.js';

export const RESERVE_MINUTES = 6;
const CRUISE_POWER = 0.65;
const HEADWIND_MARGIN = 1.15;

/** Cruise speed (m/s) and fuel flow (kg/s) the plan assumes for an aircraft. */
export function cruiseFigures(spec) {
  return { speed: spec.vApproach * 1.55, flow: fuelBurnAt(spec, CRUISE_POWER) };
}

/** The reserve in kg: six minutes at cruise. */
export function reserveFuel(spec) {
  return cruiseFigures(spec).flow * RESERVE_MINUTES * 60;
}

/** Fuel in kg to fly `metres` at cruise, with a margin for headwind. */
export function fuelForDistance(spec, metres) {
  const cruise = cruiseFigures(spec);
  return (metres / cruise.speed) * cruise.flow * HEADWIND_MARGIN;
}

/** Airfields this aircraft can land at: the seaplane base only on floats. */
export function suitableField(spec) {
  return (field) => field.kind !== 'water' || Boolean(spec.floats);
}

/** The nearest suitable airfield to (x, z) and its distance in metres. */
export function nearestLandingField(spec, x, z) {
  const ok = suitableField(spec);
  let best = null;
  let distance = Infinity;
  for (const field of AIRFIELDS) {
    if (!ok(field)) continue;
    const d = Math.hypot(field.x - x, field.z - z);
    if (d < distance) {
      distance = d;
      best = field;
    }
  }
  return { field: best, distance };
}

/** Creates a planner; update() each frame refreshes and returns the plan. */
export function createFuelPlanner() {
  let flow = 0;
  let speed = 0;
  const plan = { fuelKg: 0, flowKgMin: 0, enduranceMin: 0, rangeNm: 0, reserveKg: 0, bingoKg: 0, toNearestKg: 0, nearest: null, nearestNm: 0, state: 'ok' };
  return {
    plan,
    reset() {
      flow = 0;
      speed = 0;
    },
    /** Refreshes the plan from the body; dt smooths the flow and ground speed. */
    update(body, dt) {
      const spec = body.spec;
      const cruise = cruiseFigures(spec);
      const nowFlow = fuelFlow(body.engine, spec);
      const k = flow === 0 ? 1 : Math.min(1, dt * 0.5);
      flow += (nowFlow - flow) * k;
      speed += (body.groundSpeed - speed) * (speed === 0 ? 1 : Math.min(1, dt * 0.5));
      const flying = !body.onGround && speed > spec.vApproach * 0.8 && flow > 0;
      const useFlow = flying ? flow : cruise.flow;
      const useSpeed = flying ? speed : cruise.speed;
      const near = nearestLandingField(spec, body.position.x, body.position.z);
      plan.fuelKg = body.engine.fuel;
      plan.flowKgMin = useFlow * 60;
      plan.enduranceMin = body.engine.running && useFlow > 0 ? body.engine.fuel / useFlow / 60 : 0;
      plan.reserveKg = reserveFuel(spec);
      plan.toNearestKg = fuelForDistance(spec, near.distance);
      plan.bingoKg = plan.reserveKg + plan.toNearestKg;
      plan.rangeNm = useFlow > 0 ? (body.engine.fuel / useFlow) * useSpeed / 1852 : 0;
      plan.nearest = near.field;
      plan.nearestNm = near.distance / 1852;
      plan.state = body.engine.fuel <= plan.reserveKg ? 'reserve' : body.engine.fuel <= plan.bingoKg ? 'bingo' : 'ok';
      return plan;
    },
  };
}
