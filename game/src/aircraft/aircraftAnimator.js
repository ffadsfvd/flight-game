// Moves the model with the flight model every frame: places it, deflects ailerons, elevators and
// rudders with the pilot's inputs, runs the flaps and gear to their real positions, spins the
// propeller with the engine RPM (blades blur into a disc), lights the jet exhaust, blinks lights
// and frosts the skin with the ice load.
import * as THREE from 'three';
import { deflect } from './aircraftModelBuilder.js';

const MAX_AILERON = THREE.MathUtils.degToRad(20);
const MAX_ELEVATOR = THREE.MathUtils.degToRad(24);
const MAX_RUDDER = THREE.MathUtils.degToRad(26);
const MAX_FLAP = THREE.MathUtils.degToRad(36);

/** Creates an animator for a rig from buildAircraftModel. */
export function createAircraftAnimator(rig) {
  const smooth = { pitch: 0, roll: 0, yaw: 0 };
  let propAngle = 0;
  let frost = -1;
  return {
    rig,
    /** Applies the body state and control inputs to the model. */
    update(body, controls, dt, time, lightLevel) {
      rig.root.position.copy(body.position);
      rig.root.quaternion.copy(body.quaternion);
      const k = Math.min(1, dt * 12);
      smooth.pitch += (controls.pitch - smooth.pitch) * k;
      smooth.roll += (controls.roll - smooth.roll) * k;
      smooth.yaw += (controls.yaw - smooth.yaw) * k;
      const s = rig.surfaces;
      deflect(s.aileronR, -smooth.roll * MAX_AILERON);
      deflect(s.aileronL, smooth.roll * MAX_AILERON);
      for (const e of s.elevators) deflect(e, -smooth.pitch * MAX_ELEVATOR);
      for (const r of s.rudders) deflect(r, smooth.yaw * MAX_RUDDER);
      deflect(s.flapR, body.flapPosition * MAX_FLAP);
      deflect(s.flapL, body.flapPosition * MAX_FLAP);

      if (rig.prop) {
        const rpm = body.engine.rpm;
        propAngle += rpm * dt * 95;
        rig.prop.spin.rotation.z = propAngle;
        const blur = THREE.MathUtils.clamp((rpm - 0.18) * 2.2, 0, 1);
        rig.prop.disc.material.opacity = 0.15 + blur * 0.7;
        for (const blade of rig.prop.blades) blade.visible = blur < 0.85;
      }
      if (rig.jet) {
        const power = body.engine.running ? THREE.MathUtils.clamp((body.engine.rpm - 0.3) / 0.7, 0, 1) : 0;
        rig.jet.glowMaterial.opacity = 0.25 + power * 0.75;
        rig.jet.plumeMaterial.opacity = Math.max(0, power - 0.55) * 1.2;
        rig.jet.plume.scale.z = 0.6 + power * 0.8 + Math.sin(time * 40) * 0.05;
      }

      const g = body.gearPosition;
      for (const leg of rig.gearLegs) {
        if (leg.fold === 'fixed') continue;
        leg.group.visible = g > 0.02;
        if (leg.fold === 'stow') {
          leg.group.position.y = leg.attach[1] + (1 - g) * (leg.stowedY - leg.wheelY) * 0.9;
        } else if (leg.fold === 'forward') {
          leg.group.rotation.x = -(1 - g) * Math.PI * 0.5;
        } else {
          leg.group.rotation.z = (leg.attach[0] < 0 ? -1 : 1) * (1 - g) * Math.PI * 0.5;
        }
      }
      for (const leg of rig.gearLegs) leg.wheel.rotation.x -= (body.onGround ? body.groundSpeed : 0) * dt / 0.3;
      // Rime ice frosts the painted skins pale blue-white as it builds.
      const ice = Math.round((body.ice ?? 0) * 40) / 40;
      if (rig.iceMaterials && ice !== frost) {
        frost = ice;
        for (const m of rig.iceMaterials) m.emissive.setRGB(0.5 * ice, 0.56 * ice, 0.64 * ice);
      }
      rig.lights.update(time, body.landingLights, lightLevel);
    },
  };
}
