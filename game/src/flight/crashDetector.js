// Decides when a flight ends badly and says what happened: which part hit what, where, how fast,
// at what attitude. A belly landing or a gentle ditching is survivable; the rest are crashes.
import * as THREE from 'three';
import { describePlace } from '../world/placeNames.js';

const point = new THREE.Vector3();
const KT = 1.944;
const FPM = 196.85;

function attitudeWords(body) {
  const pitch = Math.round(body.pitch);
  const bank = Math.round(Math.abs(body.bank));
  const pitchText = pitch < -3 ? `${-pitch}° nose down` : pitch > 3 ? `${pitch}° nose up` : 'wings level';
  return bank > 8 ? `${pitchText}, ${bank}° bank` : pitchText;
}

/** Returns null while the flight is fine, else { severity: 'crash'|'ditch'|'belly', cause, place }. */
export function detectCrash(body, world) {
  const spec = body.spec;
  const kt = Math.round(body.airspeed * KT);
  const fpm = Math.round(-body.verticalSpeed * FPM);
  const ground = world.terrain.heightAt(body.position.x, body.position.z);
  const place = describePlace(body.position.x, body.position.z, ground);

  if (body.airframe <= 0) {
    return { severity: 'crash', cause: `The airframe broke up in flight at ${kt} kt (${body.gForce.toFixed(1)} G)`, place };
  }
  if (spec.floats && body.onWater && body.gearPosition > 0.5 && body.groundSpeed > 9) {
    return { severity: 'crash', cause: `Landed on water with the wheels down: the ${spec.name} flipped over at ${kt} kt`, place };
  }
  for (const [x, y, z, kind] of spec.crashPoints) {
    point.set(x, y, z).applyQuaternion(body.quaternion).add(body.position);
    const surface = world.surfaceAt(point.x, point.z);
    if (point.y >= surface.height - 0.05) continue;
    const gentle = body.airspeed < 38 && fpm < 420 && Math.abs(body.bank) < 15 && body.pitch > -6;
    if (surface.water) {
      if (gentle) return { severity: 'ditch', cause: `Ditched in the sea at ${kt} kt and ${Math.max(0, fpm)} fpm, the crew is safe`, place };
      return { severity: 'crash', cause: `Crashed into the sea at ${kt} kt, ${attitudeWords(body)}`, place };
    }
    if (kind === 'belly' && gentle && body.gearPosition < 0.5) {
      return { severity: 'belly', cause: `Belly landing at ${kt} kt: the gear was still up`, place };
    }
    if (kind === 'wingtip') return { severity: 'crash', cause: `Caught a wingtip at ${kt} kt in a ${Math.round(Math.abs(body.bank))}° bank`, place };
    if (kind === 'tail') {
      if (body.verticalSpeed > -3 && body.airspeed < body.spec.vRotate * 1.6) continue;
      return { severity: 'crash', cause: `Tail strike: slammed the tail down at ${Math.round(body.pitch)}° nose up, ${kt} kt`, place };
    }
    if (kind === 'canopy' || kind === 'fin') return { severity: 'crash', cause: `Flipped over at ${kt} kt`, place };
    if (kind === 'prop' && body.airspeed < 14 && fpm < 300) return { severity: 'crash', cause: `Prop strike at ${kt} kt: nosed over on the ground`, place };
    return { severity: 'crash', cause: `Flew into the ground at ${kt} kt, ${Math.max(0, fpm)} fpm down, ${attitudeWords(body)}`, place };
  }
  const obstacle = world.obstacleAt(body.position);
  if (obstacle) {
    const verb = obstacle === 'the treetops' ? 'Clipped' : 'Flew into';
    return { severity: 'crash', cause: `${verb} ${obstacle} at ${kt} kt`, place };
  }
  return null;
}
