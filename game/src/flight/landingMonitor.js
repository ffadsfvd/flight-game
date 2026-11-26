// Watches every touchdown and grades it: vertical speed at contact, distance from the centreline,
// where on the runway it touched (the touchdown zone is 100 to 450 m past the threshold), bounces
// and alignment. Emits liftoff, touchdown, bounce and landed events.
import { AIRFIELDS, landingDirection, toRunwayFrame } from '../world/airfieldDirectory.js';
import { describePlace } from '../world/placeNames.js';

const FPM = 196.85;
const KT = 1.944;

/** A monitor starting on the ground (parked) or in the air. */
export function createLandingMonitor(startsAirborne) {
  return { airborne: startsAirborne, offGroundTime: startsAirborne ? 10 : 0, onGroundTime: 0, lastVs: 0, touchdown: null, bounces: 0, bouncing: false, landings: 0 };
}

function findRunway(x, z, heading) {
  let best = null;
  for (const field of AIRFIELDS) {
    const p = toRunwayFrame(field, x, z);
    const lateral = Math.abs(p.across);
    if (lateral > Math.max(160, field.width * 2) || Math.abs(p.along) > field.length * 0.5 + 300) continue;
    const forward = ((heading - field.heading + 540) % 360) - 180;
    const end = Math.abs(forward) <= 90 ? 0 : 1;
    if (!best || lateral < best.lateral) best = { field, end, lateral, frame: p };
  }
  return best;
}

/** Grades the recorded touchdown; returns { score, grade, remarks, ... } */
export function gradeLanding(touchdown, bounces, spec) {
  const remarks = [];
  let score = 0;
  const fpm = touchdown.fpm;
  if (fpm <= 120) {
    score += 35;
    remarks.push(`Butter: ${fpm} fpm`);
  } else if (fpm <= 250) {
    score += 30;
    remarks.push(`Smooth: ${fpm} fpm`);
  } else if (fpm <= 400) {
    score += 22;
    remarks.push(`Firm: ${fpm} fpm`);
  } else if (fpm <= spec.gearLimitFpm) {
    score += 12;
    remarks.push(`Hard: ${fpm} fpm`);
  } else {
    remarks.push(`Gear-bending: ${fpm} fpm`);
  }
  if (!touchdown.runway) {
    remarks.push('Off-field landing');
  } else {
    const off = touchdown.centreline;
    if (off <= 2) score += 20;
    else if (off <= 5) score += 15;
    else if (off <= 10) score += 8;
    remarks.push(off <= 2 ? 'On the centreline' : `${off.toFixed(1)} m ${touchdown.side} of centreline`);
    const d = touchdown.distance;
    if (d < 0) remarks.push(`Landed ${Math.round(-d)} m short of the threshold`);
    else if (d < 100) {
      score += 8;
      remarks.push(`Touched down early, ${Math.round(d)} m past the threshold`);
    } else if (d <= 450) {
      score += 20;
      remarks.push(`In the touchdown zone, ${Math.round(d)} m past the threshold`);
    } else if (d <= 700) {
      score += 12;
      remarks.push(`Long: ${Math.round(d)} m past the threshold`);
    } else {
      score += 4;
      remarks.push(`Very long: ${Math.round(d)} m past the threshold`);
    }
    const err = Math.abs(touchdown.headingError);
    score += err <= 3 ? 10 : err <= 8 ? 6 : 2;
    if (err > 8) remarks.push(`Crabbed ${Math.round(err)}° off the runway heading`);
  }
  score += bounces === 0 ? 15 : bounces === 1 ? 7 : 0;
  if (bounces > 0) remarks.push(bounces === 1 ? 'One bounce' : `${bounces} bounces`);
  const grade = score >= 92 ? 'A+' : score >= 82 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade, remarks };
}

/** Advances the monitor; returns an array of events. */
export function stepLandingMonitor(m, body, world, dt) {
  const events = [];
  const touching = body.onGround;
  if (touching) {
    m.onGroundTime += dt;
    if (m.airborne && m.offGroundTime > 0.35) {
      const fpm = Math.max(0, Math.round(-m.lastVs * FPM));
      if (m.touchdown && m.bouncing) {
        m.bounces += 1;
        m.touchdown.fpm = Math.max(m.touchdown.fpm, fpm);
        events.push({ kind: 'bounce', fpm, bounces: m.bounces });
      } else {
        const found = findRunway(body.position.x, body.position.z, body.heading);
        const td = { fpm, kt: Math.round(body.airspeed * KT), bank: body.bank, pitch: body.pitch, x: body.position.x, z: body.position.z, water: body.onWater, runway: null, end: 0, centreline: 0, side: 'left', distance: 0, headingError: 0, place: describePlace(body.position.x, body.position.z, world.terrain.heightAt(body.position.x, body.position.z)) };
        if (found && (found.field.kind === 'water') === body.onWater) {
          const dir = landingDirection(found.field, found.end);
          td.runway = found.field;
          td.end = found.end;
          td.endName = dir.name;
          td.centreline = Math.abs(found.frame.across);
          td.side = found.frame.across * dir.sign > 0 ? 'right' : 'left';
          td.distance = dir.sign * found.frame.along + found.field.length * 0.5;
          td.headingError = ((body.heading - dir.heading + 540) % 360) - 180;
        }
        m.touchdown = td;
        m.bounces = 0;
        events.push({ kind: 'touchdown', touchdown: td });
      }
      m.airborne = false;
      m.bouncing = false;
    }
    m.offGroundTime = 0;
    if (m.touchdown && !m.airborne && body.groundSpeed < (body.onWater ? 4 : 3) && m.onGroundTime > 1) {
      const report = { ...m.touchdown, bounces: m.bounces, ...gradeLanding(m.touchdown, m.bounces, body.spec) };
      m.landings += 1;
      events.push({ kind: 'landed', report });
      m.touchdown = null;
    }
  } else {
    m.offGroundTime += dt;
    m.onGroundTime = 0;
    m.lastVs = body.verticalSpeed;
    if (!m.airborne && m.offGroundTime > 0.3 && body.agl > 0.6) {
      m.airborne = true;
      if (m.touchdown) {
        m.bouncing = true;
      } else {
        events.push({ kind: 'liftoff' });
      }
    }
    if (m.bouncing && m.offGroundTime > 4) {
      m.bouncing = false;
      m.touchdown = null;
      events.push({ kind: 'go-around' });
    }
  }
  return events;
}
