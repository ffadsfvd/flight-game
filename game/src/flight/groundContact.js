// Wheels and floats meeting the world: each wheel is a sprung, damped strut with rolling
// resistance, brakes, side grip and nose-wheel steering; each float point gives buoyancy and water
// drag that peaks at the hump speed and falls away once the hull planes. Returns the total force
// and torque for the rigid body.
import * as THREE from 'three';

const SURFACE_FRICTION = {
  asphalt: { roll: 0.022, brake: 0.75, side: 0.9 },
  grass: { roll: 0.07, brake: 0.45, side: 0.7 },
  sand: { roll: 0.16, brake: 0.35, side: 0.55 },
  water: { roll: 0, brake: 0, side: 0 },
};

const scratch = {
  arm: new THREE.Vector3(),
  point: new THREE.Vector3(),
  pointVelocity: new THREE.Vector3(),
  omegaWorld: new THREE.Vector3(),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  force: new THREE.Vector3(),
  torque: new THREE.Vector3(),
  local: new THREE.Vector3(),
};

/** Contact result reused every step. */
export function createContactResult() {
  return { force: new THREE.Vector3(), torque: new THREE.Vector3(), wheelsDown: 0, floatsWet: 0, maxCompression: 0, surface: null, runway: null, wheelSink: 0 };
}

/** Sums wheel and float forces for body state `s` (see flightDynamics) on `world`. */
export function computeGroundContact(s, world, controls, out) {
  const { spec } = s;
  out.force.set(0, 0, 0);
  out.torque.set(0, 0, 0);
  out.wheelsDown = 0;
  out.floatsWet = 0;
  out.maxCompression = 0;
  out.surface = null;
  out.runway = null;
  const { arm, point, pointVelocity, omegaWorld, forward, right, force, torque, local } = scratch;
  omegaWorld.copy(s.angularVelocity).applyQuaternion(s.quaternion);
  const mass = s.mass;
  const gearShare = spec.gear.length;
  const k = (mass * 9.81) / (gearShare * 0.085);
  const c = 2 * 0.75 * Math.sqrt((k * mass) / gearShare);
  const wheelsOut = s.gearPosition > 0.95;

  if (wheelsOut) {
    for (const [gx, gy, gz, kind] of spec.gear) {
      arm.set(gx, gy, gz).applyQuaternion(s.quaternion);
      point.copy(s.position).add(arm);
      const surface = world.surfaceAt(point.x, point.z);
      if (surface.water) continue;
      const compression = surface.height - (point.y - spec.wheelRadius);
      if (compression <= 0) continue;
      pointVelocity.crossVectors(omegaWorld, arm).add(s.velocity);
      const normalForce = Math.max(0, Math.min(k * Math.min(compression, 0.6) - c * pointVelocity.y, mass * 9.81 * 6));
      forward.set(0, 0, -1).applyQuaternion(s.quaternion);
      forward.y = 0;
      forward.normalize();
      if (kind === 'nose' || kind === 'tailwheel') {
        // A steered tailwheel sits behind the mains, so it turns the opposite way to a nosewheel.
        const speed = Math.hypot(s.velocity.x, s.velocity.z);
        const steer = (kind === 'nose' ? -1 : 1) * controls.yaw * THREE.MathUtils.degToRad(kind === 'nose' ? 32 : 24) * THREE.MathUtils.clamp(1.4 - speed / 22, 0.15, 1);
        forward.applyAxisAngle(THREE.Object3D.DEFAULT_UP, steer);
      }
      right.set(-forward.z, 0, forward.x);
      const friction = SURFACE_FRICTION[surface.kind] ?? SURFACE_FRICTION.grass;
      const vf = pointVelocity.dot(forward);
      const vs = pointVelocity.dot(right);
      const brake = kind === 'main' ? controls.brakes : 0;
      const longLimit = (friction.roll + brake * friction.brake) * normalForce;
      const fLong = -THREE.MathUtils.clamp(vf * mass * 2.5, -longLimit, longLimit);
      const sideLimit = friction.side * normalForce * (s.gearHealth < 0.5 && kind === 'main' && gx < 0 ? 0.6 : 1);
      const fSide = -THREE.MathUtils.clamp(vs * mass * 3, -sideLimit, sideLimit);
      force.set(0, normalForce, 0).addScaledVector(forward, fLong).addScaledVector(right, fSide);
      out.force.add(force);
      torque.crossVectors(arm, force);
      out.torque.add(torque);
      out.wheelsDown += 1;
      out.maxCompression = Math.max(out.maxCompression, compression);
      out.surface = surface.kind;
      out.runway = surface.runway;
    }
  }

  // Tail and wingtip skids: an over-rotation or a wing-low touchdown scrapes instead of digging in.
  // The damage model reads the scrape (which skid, how fast it slides) and decides what it costs.
  s.tailScrape = false;
  s.scrapeKind = null;
  s.scrapeSpeed = 0;
  for (const [tx, ty, tz, kind] of spec.crashPoints) {
    if (kind !== 'tail' && kind !== 'wingtip') continue;
    arm.set(tx, ty, tz).applyQuaternion(s.quaternion);
    point.copy(s.position).add(arm);
    const surface = world.surfaceAt(point.x, point.z);
    if (surface.water) continue;
    const compression = surface.height - point.y;
    if (compression <= 0) continue;
    pointVelocity.crossVectors(omegaWorld, arm).add(s.velocity);
    const normalForce = Math.max(0, Math.min(k * 2 * Math.min(compression, 0.4) - c * pointVelocity.y, mass * 9.81 * 4));
    const horizontal = scratch.forward.set(pointVelocity.x, 0, pointVelocity.z);
    const speed = horizontal.length();
    force.set(0, normalForce, 0);
    if (speed > 0.01) force.addScaledVector(horizontal, (-0.5 * normalForce) / speed);
    out.force.add(force);
    torque.crossVectors(arm, force);
    out.torque.add(torque);
    s.tailScrape = true;
    if (kind === 'tail' || !s.scrapeKind) s.scrapeKind = kind;
    s.scrapeSpeed = Math.max(s.scrapeSpeed, speed);
  }

  if (spec.floats) {
    const share = spec.floats.length;
    const kb = (mass * 9.81) / (share * 0.32);
    const cb = 2 * 0.55 * Math.sqrt((kb * mass) / share);
    for (const [fx, fy, fz] of spec.floats) {
      arm.set(fx, fy, fz).applyQuaternion(s.quaternion);
      point.copy(s.position).add(arm);
      const surface = world.surfaceAt(point.x, point.z);
      const depth = surface.height - point.y;
      if (depth <= 0) continue;
      pointVelocity.crossVectors(omegaWorld, arm).add(s.velocity);
      forward.set(0, 0, -1).applyQuaternion(s.quaternion);
      forward.y = 0;
      forward.normalize();
      if (fz < -1) forward.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -controls.yaw * 0.35);
      right.set(-forward.z, 0, forward.x);
      const vf = pointVelocity.dot(forward);
      const vs = pointVelocity.dot(right);
      let normalForce;
      let longLimit;
      let sideLimit;
      if (surface.water) {
        normalForce = Math.max(0, Math.min(kb * Math.min(depth, 1.2) - cb * pointVelocity.y, mass * 9.81 * 4));
        const hump = Math.exp(-(((Math.abs(vf) - 9) / 5.5) ** 2));
        longLimit = (0.06 + 0.16 * hump) * normalForce + controls.brakes * 0.05 * normalForce;
        sideLimit = 0.55 * normalForce;
        out.floatsWet += 1;
      } else {
        // Floats sliding on land act as skids: they hold the aircraft up but scrape hard.
        normalForce = Math.max(0, Math.min(k * Math.min(depth, 0.6) - c * pointVelocity.y, mass * 9.81 * 6));
        longLimit = 0.45 * normalForce;
        sideLimit = 0.6 * normalForce;
        out.wheelsDown += 0;
        s.skidding = true;
      }
      const fLong = -THREE.MathUtils.clamp(vf * mass * 2.5, -longLimit, longLimit);
      const fSide = -THREE.MathUtils.clamp(vs * mass * 3, -sideLimit, sideLimit);
      force.set(0, normalForce, 0).addScaledVector(forward, fLong).addScaledVector(right, fSide);
      out.force.add(force);
      torque.crossVectors(arm, force);
      out.torque.add(torque);
      out.surface = surface.kind;
      local.copy(point);
    }
  }
  return out;
}
