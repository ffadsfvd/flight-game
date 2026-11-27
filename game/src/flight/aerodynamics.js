// Lift and drag coefficients: lift grows with angle of attack up to the stall, then breaks away;
// drag is parasite plus induced, with flaps, gear, damage and the stalled wing's extra drag.

export const AIR_DENSITY = 1.225;

/** 0 below edge0, 1 above edge1, a smooth S between. */
function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** How far into the stall the wing is at `alpha` (rad): 0 attached, 1 fully stalled. */
export function stallAmount(spec, alpha, flaps) {
  const stallAngle = spec.alphaStall - flaps * 0.02;
  return smoothstep(stallAngle * 0.97, stallAngle * 1.3, Math.abs(alpha));
}

/** Lift coefficient for angle of attack `alpha` (rad), flap extension 0..1 and wing damage 0..1. */
export function liftCoefficient(spec, alpha, flaps, wingDamage = 0) {
  const flapLift = spec.flapCl * flaps;
  const attached = spec.cl0 + flapLift + spec.clAlpha * alpha;
  const stalled = (spec.cl0 + flapLift) * 0.5 + 1.05 * Math.sin(2 * alpha);
  const s = stallAmount(spec, alpha, flaps);
  const clMax = spec.cl0 + flapLift + spec.clAlpha * spec.alphaStall;
  const limited = Math.max(-clMax * 0.8, Math.min(clMax, attached));
  return (limited * (1 - s) + stalled * s) * (1 - wingDamage * 0.25);
}

/** Drag coefficient for a lift coefficient and configuration. */
export function dragCoefficient(spec, cl, alpha, flaps, gear, damage) {
  const parasite = spec.cd0 * (1 + damage * 0.8) + spec.flapCd * flaps + spec.gearCd * gear;
  const induced = spec.inducedK * cl * cl * (1 + flaps * 0.15);
  const stalled = stallAmount(spec, alpha, flaps) * Math.sin(Math.abs(alpha)) * 0.9;
  return parasite + induced + stalled;
}
