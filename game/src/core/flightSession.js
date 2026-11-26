// One sortie from the pilot's side: the chosen aircraft's model and flight simulation, the pilot's
// controls and the cockpit switches (flaps, gear, lights, smoke, refuelling), the cameras, and the
// placements missions start from (parked on a runway, on final approach, cruising in the air).
import * as THREE from 'three';
import { tunedSpec } from '../aircraft/aircraftCatalog.js';
import { buildAircraftModel } from '../aircraft/aircraftModelBuilder.js';
import { createAircraftAnimator } from '../aircraft/aircraftAnimator.js';
import { createAircraftSimulation } from '../flight/aircraftSimulation.js';
import { airfieldAt, airfieldById, fromRunwayFrame, landingDirection } from '../world/airfieldDirectory.js';

const REFUEL_RATE = 7;

/** Where an aircraft of `spec` sits on a runway threshold of `fieldId` (end 0 or 1). */
export function runwayPlacement(spec, fieldId, end, rollDistance = 45) {
  const field = airfieldById(fieldId);
  const dir = landingDirection(field, end);
  const along = -dir.sign * (field.length / 2 - rollDistance);
  const p = fromRunwayFrame(field, along, 0);
  const ground = field.kind === 'water' ? 0 : field.elevationResolved;
  const lowest = spec.floats && field.kind === 'water' ? -1.62 : Math.min(...spec.gear.map((g) => g[1])) - spec.wheelRadius;
  return { x: p.x, y: ground - lowest + 0.04, z: p.z, heading: dir.heading, speed: 0, gearDown: field.kind !== 'water', flaps: 0, throttle: 0 };
}

/** On the extended centreline `distance` metres before the threshold, on a 3° glide path. */
export function approachPlacement(spec, fieldId, end, distance, { slope = 3, flaps = 1, offset = 0, height = 0 } = {}) {
  const field = airfieldById(fieldId);
  const dir = landingDirection(field, end);
  const along = -dir.sign * (field.length / 2 + distance);
  const p = fromRunwayFrame(field, along, offset);
  const ground = field.kind === 'water' ? 0 : field.elevationResolved;
  const y = ground + 12 + Math.tan(THREE.MathUtils.degToRad(slope)) * distance + height;
  return { x: p.x, y, z: p.z, heading: dir.heading, pitch: -slope, speed: spec.vApproach * 1.05, gearDown: field.kind !== 'water', flaps, throttle: 0.36 };
}

/** Creates the session for a world, wind field, camera director and controls. */
export function createFlightSession({ scene, world, wind, director, controls }) {
  const rigs = new Map();
  const simulation = createAircraftSimulation(world, wind);
  let rig = null;
  let animator = null;
  let spec = null;
  let refuelling = false;
  let lookBackHeld = false;
  const session = {
    simulation,
    get body() {
      return simulation.body;
    },
    get spec() {
      return spec;
    },
    get rig() {
      return rig;
    },
    get refuelling() {
      return refuelling;
    },
    /** Starts a flight in aircraft `id` with `upgrades` at `placement`. */
    start(id, upgrades, placement, options = {}) {
      spec = tunedSpec(id, upgrades);
      if (!rigs.has(id)) {
        const built = buildAircraftModel(id);
        rigs.set(id, built);
        scene.add(built.root);
      }
      for (const [key, r] of rigs) r.root.visible = key === id;
      rig = rigs.get(id);
      animator = createAircraftAnimator(rig);
      simulation.start(spec, placement, options);
      if (options.fuelFraction !== undefined) simulation.body.engine.fuel = spec.fuelCapacity * options.fuelFraction;
      simulation.body.landingLights = true;
      controls.reset(placement.throttle ?? 0);
      refuelling = false;
      if (director.view === 'replay' || director.view === 'orbit') director.view = 'chase';
      return simulation.body;
    },
    /** Shows a parked or display model for menus without a flight. */
    showModel(id, position, quaternion) {
      if (!rigs.has(id)) {
        const built = buildAircraftModel(id);
        rigs.set(id, built);
        scene.add(built.root);
      }
      for (const [key, r] of rigs) r.root.visible = key === id;
      rig = rigs.get(id);
      rig.root.position.copy(position);
      rig.root.quaternion.copy(quaternion);
      return rig;
    },
    hideModels() {
      for (const r of rigs.values()) r.root.visible = false;
    },
    /** Handles the cockpit switches named by flightControls actions; returns a list of notices. */
    handleActions(actions) {
      const body = simulation.body;
      const notices = [];
      if (!body) return notices;
      for (const action of actions) {
        if (action === 'flaps' && !body.flapsJammed) {
          body.flapSetting = (body.flapSetting + 1) % spec.flapDetents.length;
          notices.push({ kind: 'flaps', setting: body.flapSetting });
        } else if (action === 'gear' && spec.gearRetracts) {
          if (body.onGround && body.gearDown && !body.onWater) {
            notices.push({ kind: 'gear-blocked' });
          } else {
            body.gearDown = !body.gearDown;
            notices.push({ kind: 'gear', down: body.gearDown });
          }
        } else if (action === 'gear') {
          notices.push({ kind: 'gear-fixed' });
        } else if (action === 'lights') {
          body.landingLights = !body.landingLights;
          notices.push({ kind: 'lights', on: body.landingLights });
        } else if (action === 'smoke') {
          body.smokeOn = !body.smokeOn;
          notices.push({ kind: 'smoke', on: body.smokeOn });
        } else if (action === 'assist') {
          body.flightAssist = !body.flightAssist;
          notices.push({ kind: 'assist', on: body.flightAssist });
        } else if (action === 'camera') {
          notices.push({ kind: 'camera', view: director.cycle() });
          if (director.view === 'flyby') director.placeFlyby(body, world);
        } else if (action === 'refuel') {
          const field = airfieldAt(body.position.x, body.position.z, 120);
          if (body.onGround && body.groundSpeed < 1.5 && field && field.fuel) {
            refuelling = !refuelling;
            notices.push({ kind: refuelling ? 'refuel-start' : 'refuel-stop', field });
          } else {
            notices.push({ kind: 'refuel-denied' });
          }
        } else if (action === 'lookBack') {
          lookBackHeld = !lookBackHeld;
        }
      }
      return notices;
    },
    /** Advances flight, model and camera; returns simulation events. */
    update(dt, time, lightLevel, flying) {
      const body = simulation.body;
      let events = [];
      if (body && flying) {
        if (refuelling) {
          const field = airfieldAt(body.position.x, body.position.z, 120);
          if (!body.onGround || body.groundSpeed > 1.5 || !field) {
            refuelling = false;
          } else {
            const add = Math.min(REFUEL_RATE * dt, spec.fuelCapacity - body.engine.fuel);
            body.engine.fuel += add;
            events.push({ kind: 'refuelled', kg: add });
            if (body.engine.fuel >= spec.fuelCapacity - 0.01) {
              refuelling = false;
              events.push({ kind: 'refuel-full' });
            }
          }
        }
        events = events.concat(simulation.advance(controls.controls, dt));
      }
      const pose = director.update(dt, body, spec, world, controls.mouse.state, lookBackHeld);
      if (rig && body) {
        animator.update(body, controls.controls, dt, time, lightLevel);
        if (pose) {
          rig.root.position.copy(pose.position);
          rig.root.quaternion.copy(pose.quaternion);
        }
        rig.exterior.visible = director.view !== 'cockpit';
        if (director.view === 'cockpit') rig.lights.beam.visible = false;
      }
      return events;
    },
  };
  return session;
}
