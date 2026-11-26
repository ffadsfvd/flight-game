// The engine: RPM that spools toward the throttle, thrust that fades with airspeed for a propeller
// and holds for a jet, fuel burn, cylinder temperature that climbs at high power and low airspeed,
// wear when it overheats, and failures (fuel starvation, overheating, a scripted dead stick).

export const ENGINE_REDLINE = 220;

/** A fresh engine state for a spec with `fuel` kg aboard. */
export function createEngineState(spec, fuel) {
  return { running: true, rpm: 0.25, temperature: 70, health: 1, failed: false, failureCause: '', fuel, fuelUsed: 0, overheatTime: 0 };
}

/** Advances the engine by dt; returns the thrust in newtons. */
export function stepEngine(engine, spec, throttle, airspeed, dt) {
  if (engine.fuel <= 0 && engine.running) {
    engine.running = false;
    engine.failed = true;
    engine.failureCause = 'fuel starvation';
    engine.fuel = 0;
  }
  if (engine.health <= 0 && engine.running) {
    engine.running = false;
    engine.failed = true;
    engine.failureCause = engine.failureCause || 'engine seized';
  }
  const idle = spec.engine === 'jet' ? 0.3 : 0.22;
  const windmill = spec.engine === 'jet' ? Math.min(0.12, airspeed / 600) : Math.min(0.35, airspeed / 160);
  const target = engine.running ? idle + (1 - idle) * throttle : windmill;
  const rate = engine.running ? 1 / spec.spool : 0.6;
  engine.rpm += (target - engine.rpm) * Math.min(1, rate * dt);

  if (engine.running) {
    const power = Math.max(0, (engine.rpm - idle) / (1 - idle));
    const burn = spec.fuelBurnIdle + (spec.fuelBurnFull - spec.fuelBurnIdle) * Math.pow(power, 1.4);
    engine.fuel = Math.max(0, engine.fuel - burn * dt);
    engine.fuelUsed += burn * dt;
  }

  const power = engine.running ? engine.rpm : 0;
  const heatTarget = 55 + 185 * power * power * spec.heatRate - Math.min(80, airspeed * (spec.engine === 'jet' ? 0.35 : 1.25));
  engine.temperature += (Math.max(40, heatTarget) - engine.temperature) * Math.min(1, dt / 18);
  if (engine.temperature > ENGINE_REDLINE) {
    engine.overheatTime += dt;
    engine.health = Math.max(0, engine.health - (engine.temperature - ENGINE_REDLINE) * 0.0009 * dt);
    if (engine.health <= 0) engine.failureCause = 'overheated and seized';
  } else {
    engine.overheatTime = Math.max(0, engine.overheatTime - dt * 0.5);
  }

  if (!engine.running) return 0;
  const healthFactor = 0.35 + 0.65 * engine.health;
  if (spec.engine === 'jet') {
    return spec.thrustStatic * Math.pow(engine.rpm, 1.6) * (1 - Math.min(0.3, airspeed / 900)) * healthFactor;
  }
  const speedFactor = Math.max(0.05, 1 - (airspeed / spec.propSpeedLimit) ** 2);
  return spec.thrustStatic * engine.rpm * engine.rpm * speedFactor * healthFactor;
}

/** Stops the engine on purpose (the dead-stick mission) with a cause the HUD can show. */
export function failEngine(engine, cause) {
  engine.running = false;
  engine.failed = true;
  engine.failureCause = cause;
}
