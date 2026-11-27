// The bingo-fuel decision. When the fuel left falls to bingo (the reserve plus the fuel to reach
// the nearest airfield), the pilot must choose: DIVERT (J) to that field now, a safe landing on
// the reserve for part of the pay, or PRESS ON (K) to the mission's destination for the full pay
// on a thinner reserve, and maybe a dry tank. No answer in 25 seconds is pressing on. The
// debrief shows what the choice cost or earned.
import { fuelForDistance } from '../flight/fuelPlanner.js';

export const DIVERT_PAY = 0.4;
const ANSWER_SECONDS = 25;
const AIRBORNE_BEFORE_BINGO = 15;

/** Creates the decision for one mission (`mission.bingo === false` turns it off). */
export function createBingoDecision(mission) {
  let decision = null;
  let airborne = 0;
  return {
    get decision() {
      return decision;
    },
    get pending() {
      return decision?.state === 'pending';
    },
    /**
     * Each frame: opens the choice when the plan reaches bingo with somewhere else to go.
     * `destination` is { field, distance } of the mission's next landing, or null.
     * Returns 'offer' when the choice opens, 'timeout' when it runs out unanswered.
     */
    update(dt, body, plan, destination, time) {
      if (!mission || mission.bingo === false) return null;
      if (!body.onGround) airborne += dt;
      if (decision?.state === 'pending') {
        decision.timer -= dt;
        decision.fuelAtDest = destination ? body.engine.fuel - fuelForDistance(body.spec, destination.distance) : null;
        return decision.timer <= 0 ? 'timeout' : null;
      }
      if (decision || plan.state === 'ok' || airborne < AIRBORNE_BEFORE_BINGO || body.onGround || !body.engine.running || !plan.nearest) return null;
      if (destination && destination.field.id === plan.nearest.id) return null;
      decision = {
        state: 'pending',
        at: time,
        fuelKg: body.engine.fuel,
        reserveKg: plan.reserveKg,
        bingoKg: plan.bingoKg,
        nearest: plan.nearest,
        nearestNm: plan.nearestNm,
        dest: destination?.field ?? null,
        destNm: destination ? destination.distance / 1852 : null,
        fuelAtDest: destination ? body.engine.fuel - fuelForDistance(body.spec, destination.distance) : null,
        timer: ANSWER_SECONDS,
        auto: false,
      };
      return 'offer';
    },
    /** Records the pilot's answer: 'divert' or 'press-on'. */
    choose(kind, time, body, auto = false) {
      if (decision?.state !== 'pending') return false;
      decision.state = kind;
      decision.answeredAt = time;
      decision.answerFuelKg = body.engine.fuel;
      decision.auto = auto;
      return true;
    },
    /** What the HUD's decision panel shows while the choice is open. */
    panel(missionPay) {
      if (decision?.state !== 'pending') return null;
      const d = decision;
      const left = d.fuelAtDest === null ? null : Math.round(d.fuelAtDest);
      return {
        title: 'BINGO FUEL',
        fuel: `${Math.round(d.fuelKg)} kg left · reserve ${Math.round(d.reserveKg)} kg`,
        timer: Math.max(0, Math.ceil(d.timer)),
        options: [
          { key: 'J', label: `DIVERT to ${d.nearest.name}`, detail: `${d.nearestNm.toFixed(1)} NM · lands on the reserve · ${Math.round(missionPay * DIVERT_PAY)} cr pay` },
          { key: 'K', label: d.dest ? `PRESS ON to ${d.dest.name}` : 'PRESS ON with the mission', detail: `${d.dest ? `${d.destNm.toFixed(1)} NM · ` : ''}full pay ${missionPay} cr${left === null ? '' : left > 0 ? ` · ≈${left} kg at landing` : ' · not enough fuel!'}` },
        ],
      };
    },
  };
}
