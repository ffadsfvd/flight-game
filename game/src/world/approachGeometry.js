// Approach geometry for any runway end: distance to the threshold along the extended centreline,
// lateral offset, and the deviation from the 3° glide path, as the approach guide, the course
// needle and the 3D glide-path gates need them.
import { airfieldById, landingDirection, toRunwayFrame } from './airfieldDirectory.js';

export const GLIDE_SLOPE_DEG = 3;
export const THRESHOLD_CROSSING_M = 12;

/** Height over the threshold on the glide path: 12 m, or a field's own (a short deck wants less). */
export function crossingHeight(field) {
  return field.crossingHeight ?? THRESHOLD_CROSSING_M;
}

/** Guidance from position p to runway `fieldId` end `end`. */
export function approachGuidance(fieldId, end, p) {
  const field = airfieldById(fieldId);
  const dir = landingDirection(field, end);
  const frame = toRunwayFrame(field, p.x, p.z);
  const distance = dir.sign * (-frame.along) - field.length * 0.5;
  const lateral = frame.across * dir.sign;
  const elevation = field.kind === 'water' ? 0 : field.elevationResolved;
  const height = p.y - elevation;
  const crossing = crossingHeight(field);
  const ideal = crossing + Math.tan((GLIDE_SLOPE_DEG * Math.PI) / 180) * Math.max(0, distance);
  const along = Math.max(30, distance);
  const glideAngle = (Math.atan2(height - crossing, along) * 180) / Math.PI;
  const glideDev = glideAngle - GLIDE_SLOPE_DEG;
  const locDev = (Math.atan2(lateral, along + field.length) * 180) / Math.PI;
  return { field, end, name: dir.name, heading: dir.heading, threshold: dir.threshold, distance, lateral, height, ideal, glideDev, locDev, elevation };
}

/** Plain words for the guidance, e.g. "ON GLIDE PATH" or "HIGH - REDUCE POWER". */
export function approachVerdict(g) {
  if (g.distance < -50) return { text: 'ROLLOUT', tone: 'good' };
  const parts = [];
  let tone = 'good';
  if (g.glideDev > 0.9) {
    parts.push('HIGH');
    tone = 'warn';
  } else if (g.glideDev > 0.35) parts.push('SLIGHTLY HIGH');
  else if (g.glideDev < -0.9) {
    parts.push('LOW - ADD POWER');
    tone = 'danger';
  } else if (g.glideDev < -0.35) {
    parts.push('SLIGHTLY LOW');
    tone = 'warn';
  } else parts.push('ON GLIDE PATH');
  if (Math.abs(g.locDev) > 1.2) {
    parts.push(g.locDev > 0 ? 'FLY LEFT' : 'FLY RIGHT');
    if (tone === 'good') tone = 'warn';
  }
  return { text: parts.join(' · '), tone };
}
