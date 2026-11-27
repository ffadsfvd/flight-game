// Watches every touchdown and grades it: vertical speed at contact, distance from the centreline,
// where on the runway it touched (the touchdown zone is 100 to 450 m past the threshold), bounces
// and alignment. Emits liftoff, touchdown, bounce and landed events.
import { AIRFIELDS, landingDirection, toRunwayFrame } from '../world/airfieldDirectory.js';
import { describePlace } from '../world/placeNames.js';

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

/**
 * Grades the recorded touchdown out of 100: sink rate (30), centreline (20), touchdown zone (20),
 * alignment (10), bounces (10) and flare (10). Returns { score, grade, remarks, breakdown } where
 * each breakdown row is { item, value, verdict, points, max } for the debrief screen.
 */
export function gradeLanding(touchdown, bounces, spec) {
  const remarks = [];
  const breakdown = [];
  const add = (item, value, verdict, points, max) => breakdown.push({ item, value, verdict, points, max });
  const fpm = touchdown.fpm;
  const sink = fpm <= 120 ? ['Butter', 30] : fpm <= 250 ? ['Smooth', 26] : fpm <= 400 ? ['Firm', 18] : fpm <= spec.gearLimitFpm ? ['Hard', 9] : ['Gear-bending', 0];
  remarks.push(`${sink[0]}: ${fpm} fpm`);
  add('Touchdown sink rate', `${fpm} fpm`, sink[0], sink[1], 30);
  if (!touchdown.runway) {
    remarks.push('Off-field landing');
    add('Centreline', 'no runway', 'Off-field', 0, 20);
    add('Touchdown zone', 'no runway', 'Off-field', 0, 20);
    add('Alignment', '-', 'Off-field', 0, 10);
  } else {
    const off = touchdown.centreline;
    const line = off <= 2 ? ['On the line', 20] : off <= 5 ? ['Close', 15] : off <= 10 ? ['Wide', 8] : ['Off the side', 2];
    remarks.push(off <= 2 ? 'On the centreline' : `${off.toFixed(1)} m ${touchdown.side} of centreline`);
    add('Centreline', off <= 0.5 ? 'dead centre' : `${off.toFixed(1)} m ${touchdown.side}`, line[0], line[1], 20);
    const d = touchdown.distance;
    let zone;
    if (d < 0) zone = [`Landed ${Math.round(-d)} m short of the threshold`, 'Short', 0];
    else if (d < 100) zone = [`Touched down early, ${Math.round(d)} m past the threshold`, 'Early', 8];
    else if (d <= 450) zone = [`In the touchdown zone, ${Math.round(d)} m past the threshold`, 'In the zone', 20];
    else if (d <= 700) zone = [`Long: ${Math.round(d)} m past the threshold`, 'Long', 12];
    else zone = [`Very long: ${Math.round(d)} m past the threshold`, 'Very long', 4];
    remarks.push(zone[0]);
    add('Touchdown zone', d < 0 ? `${Math.round(-d)} m short` : `${Math.round(d)} m in`, zone[1], zone[2], 20);
    const err = Math.abs(touchdown.headingError);
    if (err > 8) remarks.push(`Crabbed ${Math.round(err)}° off the runway heading`);
    add('Alignment', `${Math.round(err)}° off heading`, err <= 3 ? 'Straight' : err <= 8 ? 'Slight crab' : 'Crabbed', err <= 3 ? 10 : err <= 8 ? 6 : 2, 10);
  }
  if (bounces > 0) remarks.push(bounces === 1 ? 'One bounce' : `${bounces} bounces`);
  add('Bounce', bounces === 0 ? 'none' : `${bounces}`, bounces === 0 ? 'Stuck it' : bounces === 1 ? 'One bounce' : 'Kangaroo', bounces === 0 ? 10 : bounces === 1 ? 5 : 0, 10);
  const pitch = touchdown.pitch ?? 0;
  const flare = touchdown.water ? (pitch >= 1 && pitch <= 9 ? ['Nose up on the step', 10] : ['Flat on the water', 4]) : pitch < 0 ? ['Flat, nosewheel first', 0] : pitch < 2 ? ['Little flare', 5] : pitch <= 10 ? ['Good flare', 10] : ['Over-flared', 5];
  if (flare[1] < 10) remarks.push(flare[0]);
  add('Flare', `${pitch.toFixed(0)}° nose ${pitch >= 0 ? 'up' : 'down'}`, flare[0], flare[1], 10);
  const score = breakdown.reduce((s, r) => s + r.points, 0);
  const grade = score >= 92 ? 'A+' : score >= 82 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade, remarks, breakdown };
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

const FPM = 196.85;
const KT = 1.944;
