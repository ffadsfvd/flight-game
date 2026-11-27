// The commit decision on short final. When a mission's final approach comes inside half a nautical
// mile of the threshold below 600 ft carrying something that makes a second attempt costly (fuel under the
// reserve, an engine that cannot give full power, a weak gear leg or a bent wing), the game asks
// once: LAND (K), commit to this approach for the full pay, or GO AROUND (J), climb out for one
// more circuit: it burns a circuit's fuel and costs part of the pay for the delay, but buys a
// second try at a stable final. No answer in 14 seconds is landing. The debrief shows the call.

export const GO_AROUND_PAY = 0.8;
const ANSWER_SECONDS = 14;
const COMMIT_METRES = 950;
const COMMIT_FT = 600;
const CIRCUIT_MINUTES = 3.2;

/** Creates the decision for one mission (`mission.commit === false` turns it off). */
export function createFinalCommitDecision(mission) {
  let decision = null;
  return {
    get decision() {
      return decision;
    },
    get pending() {
      return decision?.state === 'pending';
    },
    /**
     * Each frame on a landing stage: opens the choice once, inside the commit point with a reason
     * to think twice. Returns 'offer' when it opens and 'timeout' when it runs out unanswered.
     */
    update(dt, body, guidance, plan, damage, stageKind, time) {
      if (!mission || mission.commit === false) return null;
      if (decision?.state === 'pending') {
        decision.timer -= dt;
        return decision.timer <= 0 ? 'timeout' : null;
      }
      if (decision || stageKind !== 'landing' || !guidance || body.onGround || guidance.field.kind === 'water') return null;
      if (guidance.distance > COMMIT_METRES || guidance.distance < 300 || body.agl * 3.281 > COMMIT_FT) return null;
      const reasons = [];
      if (plan.fuelKg < plan.reserveKg) reasons.push('fuel under the reserve');
      for (const e of damage) if (e.part === 'ENGINE' || e.part === 'GEAR' || e.part === 'WING') reasons.push(e.text.toLowerCase());
      if (!reasons.length) return null;
      const circuitKg = plan.flowKgMin * CIRCUIT_MINUTES;
      decision = {
        state: 'pending',
        at: time,
        timer: ANSWER_SECONDS,
        fuelKg: body.engine.fuel,
        reserveKg: plan.reserveKg,
        circuitKg,
        reasons,
        runway: `${guidance.field.code} ${guidance.name ?? ''}`.trim(),
        end: guidance.name ?? '',
        auto: false,
      };
      return 'offer';
    },
    /** Records the answer: 'land' or 'go-around'. */
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
      const after = Math.round(d.fuelKg - d.circuitKg);
      return {
        title: 'SHORT FINAL · COMMIT?',
        fuel: `${Math.round(d.fuelKg)} kg left · ${d.reasons[0]}`,
        timer: Math.max(0, Math.ceil(d.timer)),
        options: [
          { key: 'K', label: `LAND · commit to ${d.end || 'this runway'}`, detail: `full pay ${missionPay} cr · no fuel or power for a second try` },
          { key: 'J', label: 'GO AROUND', detail: `one more circuit · ${Math.round(missionPay * GO_AROUND_PAY)} cr · burns ≈${Math.round(d.circuitKg)} kg${after > 0 ? `, lands with ≈${after} kg` : ': the tank runs dry!'}` },
        ],
      };
    },
  };
}
