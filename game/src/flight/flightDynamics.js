// The rigid-body flight model. Forces: lift from airspeed and angle of attack (with ground effect),
// parasite and induced drag, side force from sideslip, thrust, gravity and the wheels or floats.
// Moments: control surfaces whose authority grows with dynamic pressure (and propeller wash on the
// tail at low speed), pitch and yaw stability that swing the nose into the airflow, dihedral, the
// stalled wing dropping, and the torques of the landing gear on the ground.
import * as THREE from 'three';
import { AIR_DENSITY, dragCoefficient, liftCoefficient, stallAmount } from './aerodynamics.js';
import { iceDrag, iceLiftFactor, iceThrustFactor } from './icingModel.js';
import { createEngineState, stepEngine } from './engineModel.js';
import { computeGroundContact, createContactResult } from './groundContact.js';

const G = 9.81;
const FORWARD = new THREE.Vector3(0, 0, -1);
const UP = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);

const tmp = {
  air: new THREE.Vector3(),
  bodyAir: new THREE.Vector3(),
  inverse: new THREE.Quaternion(),
  forward: new THREE.Vector3(),
  up: new THREE.Vector3(),
  right: new THREE.Vector3(),
  liftDir: new THREE.Vector3(),
  force: new THREE.Vector3(),
  aero: new THREE.Vector3(),
  torque: new THREE.Vector3(),
  axis: new THREE.Vector3(),
  dq: new THREE.Quaternion(),
  wind: new THREE.Vector3(),
};

/** A new aircraft body for a spec, parked at the origin with full fuel. */
export function createAircraftBody(spec) {
  return {
    spec,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    angularVelocity: new THREE.Vector3(),
    mass: spec.mass,
    engine: createEngineState(spec, spec.fuelCapacity),
    flapSetting: 0,
    flapPosition: 0,
    gearDown: true,
    gearPosition: 1,
    landingLights: true,
    airframe: 1,
    wingPull: 1,
    wingBend: 0,
    gearHealth: 1,
    flapsJammed: false,
    payload: 0,
    water: 0,
    smokeOn: false,
    airspeed: 0,
    groundSpeed: 0,
    alpha: 0,
    beta: 0,
    gForce: 1,
    verticalSpeed: 0,
    altitude: 0,
    agl: 0,
    heading: 0,
    pitch: 0,
    bank: 0,
    stall: 0,
    onGround: false,
    onWater: false,
    skidding: false,
    thrust: 0,
    wind: new THREE.Vector3(),
    contact: createContactResult(),
    wingDrop: 1,
    flightAssist: true,
    time: 0,
  };
}

/** Puts the body at a position and attitude with a speed along its nose. Angles in degrees. */
export function placeAircraft(body, { x, y, z, heading = 0, pitch = 0, bank = 0, speed = 0, gearDown = true, flaps = 0, throttle = 0, fuel = null }) {
  body.position.set(x, y, z);
  body.quaternion.setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(pitch), -THREE.MathUtils.degToRad(heading), -THREE.MathUtils.degToRad(bank), 'YXZ'));
  body.velocity.copy(FORWARD).applyQuaternion(body.quaternion).multiplyScalar(speed);
  body.angularVelocity.set(0, 0, 0);
  body.gearDown = gearDown || !body.spec.gearRetracts;
  body.gearPosition = body.gearDown ? 1 : 0;
  body.flapSetting = flaps;
  body.flapPosition = body.spec.flapDetents[flaps] ?? 0;
  body.engine = createEngineState(body.spec, fuel ?? body.spec.fuelCapacity);
  body.engine.rpm = 0.22 + 0.78 * throttle;
  body.airframe = 1;
  body.wingPull = 1;
  body.wingBend = 0;
  body.gearHealth = 1;
  body.flapsJammed = false;
  body.stall = 0;
  body.time = 0;
  updateDerived(body, null);
}

function approach(value, target, step) {
  if (value < target) return Math.min(target, value + step);
  return Math.max(target, value - step);
}

/** Recomputes heading, pitch, bank, airspeed and heights from the state. */
export function updateDerived(body, world) {
  const f = tmp.forward.copy(FORWARD).applyQuaternion(body.quaternion);
  const r = tmp.right.copy(RIGHT).applyQuaternion(body.quaternion);
  const u = tmp.up.copy(UP).applyQuaternion(body.quaternion);
  body.heading = (THREE.MathUtils.radToDeg(Math.atan2(f.x, -f.z)) + 360) % 360;
  body.pitch = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(f.y, -1, 1)));
  body.bank = THREE.MathUtils.radToDeg(Math.atan2(-r.y, u.y));
  body.groundSpeed = Math.hypot(body.velocity.x, body.velocity.z);
  body.verticalSpeed = body.velocity.y;
  body.altitude = body.position.y;
  if (world) {
    const ground = world.groundHeightAt ? world.groundHeightAt(body.position.x, body.position.z) : Math.max(0, world.terrain.heightAt(body.position.x, body.position.z));
    body.agl = body.position.y - ground;
  }
}

/** Advances the aircraft by dt seconds under `controls` (pitch, roll, yaw -1..1, throttle 0..1, brakes 0..1). */
export function stepAircraft(body, world, wind, controls, dt) {
  const spec = body.spec;
  body.time += dt;
  if (!body.flapsJammed) body.flapPosition = approach(body.flapPosition, spec.flapDetents[body.flapSetting], dt * 0.4);
  if (spec.gearRetracts) body.gearPosition = approach(body.gearPosition, body.gearDown ? 1 : 0, dt * 0.28);
  body.mass = spec.mass + body.engine.fuel + body.payload + body.water;

  wind.sample(body.position, tmp.wind);
  body.wind.copy(tmp.wind);
  const air = tmp.air.copy(body.velocity).sub(tmp.wind);
  const V = air.length();
  tmp.inverse.copy(body.quaternion).invert();
  const vb = tmp.bodyAir.copy(air).applyQuaternion(tmp.inverse);
  const forwardSpeed = -vb.z;
  const alpha = V > 0.5 ? Math.atan2(-vb.y, forwardSpeed) : 0;
  const beta = V > 0.5 ? THREE.MathUtils.clamp(Math.atan2(vb.x, Math.max(1, Math.abs(forwardSpeed))), -0.7, 0.7) : 0;
  body.airspeed = V;
  body.alpha = alpha;
  body.beta = beta;
  const q = 0.5 * AIR_DENSITY * V * V;

  const f = tmp.forward.copy(FORWARD).applyQuaternion(body.quaternion);
  const u = tmp.up.copy(UP).applyQuaternion(body.quaternion);
  const r = tmp.right.copy(RIGHT).applyQuaternion(body.quaternion);

  const groundBelow = world.groundHeightAt ? world.groundHeightAt(body.position.x, body.position.z) : Math.max(0, world.terrain.heightAt(body.position.x, body.position.z));
  const heightAbove = body.position.y - groundBelow;
  const groundEffect = THREE.MathUtils.clamp(1 - heightAbove / spec.span, 0, 1);
  const wingDamage = 1 - body.airframe;
  let cl = liftCoefficient(spec, alpha, body.flapPosition, wingDamage) * (1 + 0.1 * groundEffect) * iceLiftFactor(body.ice ?? 0);
  const gearDrag = spec.gearRetracts ? body.gearPosition : 1;
  const cd = dragCoefficient(spec, cl, alpha, body.flapPosition, gearDrag, wingDamage) - spec.inducedK * cl * cl * 0.4 * groundEffect + iceDrag(body.ice ?? 0);
  const stall = stallAmount(spec, alpha, body.flapPosition);
  body.stall = V > 8 ? stall : 0;

  const force = tmp.force.set(0, -body.mass * G, 0);
  const aero = tmp.aero.set(0, 0, 0);
  if (V > 0.5) {
    const vHat = air.multiplyScalar(1 / V);
    const liftDir = tmp.liftDir.copy(u).addScaledVector(vHat, -u.dot(vHat));
    if (liftDir.lengthSq() > 1e-6) liftDir.normalize();
    aero.addScaledVector(liftDir, q * spec.wingArea * cl);
    aero.addScaledVector(vHat, -q * spec.wingArea * cd);
    aero.addScaledVector(r, -q * spec.wingArea * spec.sideArea * 0.6 * beta);
  }
  const thrust = stepEngine(body.engine, spec, controls.throttle, V, dt) * iceThrustFactor(body);
  body.thrust = thrust;
  aero.addScaledVector(f, thrust);
  force.add(aero);

  const contact = computeGroundContact(body, world, controls, body.contact);
  force.add(contact.force);
  if (body.tailScrape) body.airframe = Math.max(0.05, body.airframe - 0.06 * dt);
  body.onGround = contact.wheelsDown > 0 || contact.floatsWet > 0 || body.skidding;
  body.onWater = contact.floatsWet > 0;
  body.skidding = false;

  // Load factor along the body's up axis, smoothed like a real accelerometer.
  const specific = (aero.dot(u) + contact.force.dot(u)) / (body.mass * G);
  body.gForce += (specific - body.gForce) * Math.min(1, dt * 8);

  // Rotational dynamics in body axes: x pitch up, y yaw left, z roll left.
  const qRef = 0.5 * AIR_DENSITY * spec.refSpeed * spec.refSpeed;
  const authority = Math.min(1.5, q / qRef);
  const wash = spec.engine === 'prop' ? spec.propWash * Math.max(0, body.engine.rpm - 0.18) : 0;
  const pitchAuth = Math.min(1, authority + wash * 0.55);
  const yawAuth = Math.min(1, authority + wash);
  const rollAuth = Math.min(1, authority) * (1 - 0.55 * stall);
  const w = body.angularVelocity;
  const k = spec.response;
  const targetYaw = -spec.yawRate * controls.yaw * yawAuth;
  const targetRoll = -spec.rollRate * controls.roll * rollAuth;
  let dwy = (targetYaw - w.y) * k * 0.7 * (0.25 + yawAuth);
  let dwz = (targetRoll - w.z) * k * (0.25 + rollAuth);

  // Pitch: the stick sets the angle of attack (and so the load factor), the way a real elevator
  // trims the wing; full aft stick goes just past the stall. With flight assist the command is
  // held inside the aircraft's G limit.
  const stability = Math.min(1.4, authority);
  let alphaTrim = spec.alphaTrim - 0.06 * body.flapPosition;
  if (body.flightAssist && !body.onGround) {
    const bankRad = THREE.MathUtils.degToRad(Math.min(65, Math.abs(body.bank)));
    const clLevel = spec.cl0 + spec.clAlpha * spec.alphaTrim;
    alphaTrim += ((1 / Math.cos(bankRad) - 1) * clLevel) / spec.clAlpha;
  }
  const alphaUp = spec.alphaStall * 1.08 - alphaTrim;
  const alphaDown = spec.alphaStall * 0.6 + alphaTrim;
  let alphaCmd = alphaTrim + (controls.pitch >= 0 ? controls.pitch * alphaUp : controls.pitch * alphaDown);
  if (body.flightAssist && !body.onGround && q > 30) {
    // Flight assist in the air: the stick commands load factor. Centred it holds the flight path
    // (1 G, more in a bank so turns stay level), forward or back asks for less or more G, and the
    // wing is kept just short of the stall unless the stick is held fully back.
    const flapLift = spec.cl0 + spec.flapCl * body.flapPosition;
    const bankRad = Math.min(1.13, THREE.MathUtils.degToRad(Math.abs(body.bank)));
    const level = Math.abs(body.bank) < 100 ? 1 + 0.85 * (1 / Math.cos(bankRad) - 1) : 0.6;
    const nCmd = controls.pitch >= 0 ? level + controls.pitch * (spec.gLimit * 0.9 - level) : level + controls.pitch * (level + spec.gLimit * 0.4);
    alphaCmd = ((nCmd * body.mass * G) / (q * spec.wingArea) - flapLift) / spec.clAlpha;
    alphaCmd = THREE.MathUtils.clamp(alphaCmd, -spec.alphaStall * 0.7, spec.alphaStall * (controls.pitch > 0.95 ? 1.12 : 0.96));
  }
  const alphaClamped = THREE.MathUtils.clamp(alpha, -0.7, 0.7);
  const pitchGain = spec.pitchStability * 2.6;
  let dwx = (pitchGain * (alphaCmd - alphaClamped) - 6.5 * w.x) * Math.min(1.2, pitchAuth + 0.04);
  dwy += -spec.yawStability * beta * stability;
  dwz += spec.dihedral * beta * stability;
  if (stall > 0.25 && !body.onGround) {
    if (stall < 0.3) body.wingDrop = Math.sign(beta || w.z || 1);
    dwx -= 1.1 * stall * stability;
    dwz += body.wingDrop * 1.6 * stall * stability;
  }
  // A bent wing (bird strike, over-G, flutter) rolls the aircraft toward it.
  dwz += Math.min(0.4, body.wingBend ?? 0) * 1.2 * stability * (body.wingPull ?? 1);

  if (contact.wheelsDown > 0 || contact.floatsWet > 0 || contact.force.lengthSq() > 0) {
    const tb = tmp.torque.copy(contact.torque).applyQuaternion(tmp.inverse);
    dwx += tb.x / spec.inertia[0];
    dwy += tb.y / spec.inertia[1];
    dwz += tb.z / spec.inertia[2];
  }

  body.velocity.addScaledVector(force, dt / body.mass);
  body.position.addScaledVector(body.velocity, dt);
  w.x += dwx * dt;
  w.y += dwy * dt;
  w.z += dwz * dt;
  if (w.lengthSq() > 49) w.setLength(7);
  const angle = w.length() * dt;
  if (angle > 1e-9) {
    tmp.dq.setFromAxisAngle(tmp.axis.copy(w).normalize(), angle);
    body.quaternion.multiply(tmp.dq).normalize();
  }
  updateDerived(body, world);
  body.agl = body.position.y - groundBelow;
}
