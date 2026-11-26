// Airframe icing for cold, wet mountain air: above a mission's freezing level ice builds on the
// wings and the propeller (faster the higher you go), costing lift, thrust and adding drag, so the
// climb dies and the stall comes early. The anti-ice (I) holds most of it off at a cost in engine
// power, but high above the freezing level some ice still creeps on; below the freezing level it melts.

const BUILD_RATE = 0.016;
const ANTI_ICE_LEFT = 0.3;
const ANTI_ICE_SHED_ABOVE = 0.004;
const ANTI_ICE_MELT = 0.02;
const SHED_RATE = 0.05;
const MELT_RATE = 0.012;

/** Lift multiplier for an ice load 0..1. */
export function iceLiftFactor(ice) {
  return 1 - 0.32 * ice;
}

/** Extra drag coefficient for an ice load 0..1. */
export function iceDrag(ice) {
  return 0.065 * ice;
}

/** Thrust multiplier: the anti-ice costs engine power, but without it ice on the propeller costs more. */
export function iceThrustFactor(body) {
  return body.antiIce ? 0.92 : 1 - 0.2 * (body.ice ?? 0);
}

/**
 * Advances the ice load on `body` for the mission's `icing` ({ level } in metres, or null).
 * Returns 'icing' the moment the load first passes a quarter, so the radio can warn.
 */
export function stepIcing(body, icing, dt) {
  const before = body.ice ?? 0;
  const above = Boolean(icing) && body.position.y > icing.level;
  const build = above ? BUILD_RATE * (1 + (body.position.y - icing.level) / 400) : 0;
  let rate;
  if (body.antiIce) rate = above ? build * ANTI_ICE_LEFT - ANTI_ICE_SHED_ABOVE - ANTI_ICE_MELT * before : -SHED_RATE;
  else rate = above ? build : -MELT_RATE;
  body.ice = Math.max(0, Math.min(1, before + rate * dt));
  return before < 0.25 && body.ice >= 0.25 ? 'icing' : null;
}
