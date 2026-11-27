// Turns the flight model's SI state into what the pilot reads: knots, feet, feet per minute,
// degrees, percentages, minutes of fuel left, airframe ice, and the aircraft's own speed limits
// in knots (stall speeds rise as ice spoils the wing).
import { stallSpeed } from '../aircraft/aircraftCatalog.js';
import { ENGINE_REDLINE } from '../flight/engineModel.js';
import { iceLiftFactor } from '../flight/icingModel.js';

const KT = 1.94384;
const FT = 3.28084;

/** A fresh readout object, filled in place by updateReadout every frame. */
export function createReadout() {
  return { kt: 0, gsKt: 0, altFt: 0, aglFt: 0, vsFpm: 0, heading: 0, pitch: 0, bank: 0, gForce: 1, aoaDeg: 0, stall: 0, rpm: 0, temp: 0, tempRed: ENGINE_REDLINE, isJet: false, engineRunning: true, engineHealth: 1, airframe: 1, gearHealth: 1, fuelKg: 0, fuelFrac: 1, fuelMinutes: 0, throttle: 0, flaps: 0, flapSetting: 0, flapDetents: 3, gear: 1, gearDown: true, gearRetracts: false, brakes: 0, onGround: true, onWater: false, lights: true, vsoKt: 40, vs1Kt: 45, vfeKt: 85, vneKt: 150, bug: null, course: null, cdi: null, glide: null, payloadKg: 0, waterKg: 0, waterCapacity: 0, windFrom: 0, windKt: 0, refuelling: false, smoke: false, assist: true, ice: 0, antiIce: false, icingLevelFt: null };
}

/** Fills `r` from the session body and controls. */
export function updateReadout(r, body, controls, extras = {}) {
  const spec = body.spec;
  r.kt = body.airspeed * KT;
  r.gsKt = body.groundSpeed * KT;
  r.altFt = body.position.y * FT;
  r.aglFt = body.agl * FT;
  r.vsFpm = body.verticalSpeed * FT * 60;
  r.heading = body.heading;
  r.pitch = body.pitch;
  r.bank = body.bank;
  r.slipDeg = body.onGround ? 0 : (body.beta * 180) / Math.PI;
  r.gForce = body.gForce;
  r.aoaDeg = (body.alpha * 180) / Math.PI;
  r.stall = body.onGround ? 0 : body.stall;
  r.rpm = body.engine.rpm;
  r.temp = body.engine.temperature;
  r.isJet = spec.engine === 'jet';
  r.engineRunning = body.engine.running;
  r.engineHealth = body.engine.health;
  r.airframe = body.airframe;
  r.gearHealth = body.gearHealth;
  r.fuelKg = body.engine.fuel;
  r.fuelFrac = body.engine.fuel / spec.fuelCapacity;
  const power = Math.max(0, (body.engine.rpm - 0.22) / 0.78);
  const burn = spec.fuelBurnIdle + (spec.fuelBurnFull - spec.fuelBurnIdle) * Math.pow(power, 1.4);
  r.fuelMinutes = body.engine.running ? body.engine.fuel / burn / 60 : 0;
  r.throttle = controls.throttle;
  r.flaps = body.flapPosition;
  r.flapSetting = body.flapSetting;
  r.flapDetents = spec.flapDetents.length;
  r.gear = body.gearPosition;
  r.gearDown = body.gearDown;
  r.gearRetracts = spec.gearRetracts;
  r.brakes = controls.brakes;
  r.onGround = body.onGround;
  r.onWater = body.onWater;
  r.lights = body.landingLights;
  r.smoke = body.smokeOn;
  r.assist = body.flightAssist;
  r.ice = body.ice ?? 0;
  r.antiIce = Boolean(body.antiIce);
  r.icingLevelFt = extras.icing ? extras.icing.level * FT : null;
  const iceStall = 1 / Math.sqrt(iceLiftFactor(r.ice));
  r.vsoKt = stallSpeed(spec, body.mass, 1) * KT * iceStall;
  r.vs1Kt = stallSpeed(spec, body.mass, 0) * KT * iceStall;
  r.vfeKt = spec.vFlapMax * KT;
  r.vneKt = spec.vne * KT;
  r.payloadKg = body.payload;
  r.waterKg = body.water;
  r.waterCapacity = spec.waterCapacity;
  const windFrom = (Math.atan2(-body.wind.x, body.wind.z) * 180) / Math.PI;
  r.windFrom = (windFrom + 360) % 360;
  r.windKt = Math.hypot(body.wind.x, body.wind.z) * KT;
  r.bug = extras.bug ?? null;
  r.course = extras.course ?? null;
  r.cdi = extras.cdi ?? null;
  r.glide = extras.glide ?? null;
  r.refuelling = extras.refuelling ?? false;
  return r;
}
