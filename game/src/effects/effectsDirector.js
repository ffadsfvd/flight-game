// Runs the world's moving effects: the volcano's plume and the waterfall's mist, the aircraft's
// exhaust (dark and thick when the engine is hurt), display smoke, wingtip vapour in hard pulls,
// touchdown dust and spray, water drops and scooping spray, forest fires and rescue flares, rain in
// storms, and the fireball and smoke of a crash.
import * as THREE from 'three';
import { createParticleSystem } from './particleSystem.js';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/** Creates the effects director for a scene and the world's emitters. */
export function createEffectsDirector(scene, worldEmitters) {
  const smoke = createParticleSystem(scene, { max: 3200, name: 'smoke' });
  const fire = createParticleSystem(scene, { max: 1400, additive: true, name: 'fire' });
  const water = createParticleSystem(scene, { max: 1800, name: 'water' });
  const fires = [];
  const flares = [];
  let crashFire = null;
  let rain = 0;
  let accumulator = 0;
  const random = Math.random;

  function updateAircraft(body, dt, smokeOn) {
    if (!body) return;
    const spec = body.spec;
    const back = tmp.set(0, 0, spec.engine === 'jet' ? 4.6 : 1.5).applyQuaternion(body.quaternion).add(body.position);
    const hurt = 1 - body.engine.health;
    if (body.engine.running && (hurt > 0.25 || body.engine.temperature > 215)) {
      if (random() < dt * (10 + hurt * 30)) smoke.emit(back.x, back.y, back.z, body.velocity.x * 0.2, 0.5, body.velocity.z * 0.2, { life: 3.5, size: 2.5, grow: 4, alpha: 0.35 + hurt * 0.4, color: [0.25, 0.24, 0.24], drag: 1.2, lift: 0.8 });
    }
    if (smokeOn && !body.onGround) {
      const tail = tmp2.set(0, -0.2, spec.engine === 'jet' ? 4.6 : 4.4).applyQuaternion(body.quaternion).add(body.position);
      for (let i = 0; i < 3; i += 1) smoke.emit(tail.x, tail.y, tail.z, body.velocity.x * 0.05, 0, body.velocity.z * 0.05, { life: 7, size: 3, grow: 3.4, alpha: 0.75, color: [1, 1, 1], drag: 0.8 });
    }
    if (!body.onGround && body.gForce > 3.6 && body.airspeed > 50) {
      for (const side of [-1, 1]) {
        const tip = tmp2.set(side * spec.span * 0.5, 0, 0.3).applyQuaternion(body.quaternion).add(body.position);
        smoke.emit(tip.x, tip.y, tip.z, body.velocity.x * 0.9, body.velocity.y * 0.9, body.velocity.z * 0.9, { life: 0.5, size: 0.8, grow: 2, alpha: 0.5, color: [1, 1, 1], drag: 4 });
      }
    }
    if (body.onWater && body.groundSpeed > 6) {
      for (let i = 0; i < 3; i += 1) {
        const side = i % 2 ? 1 : -1;
        const p = tmp2.set(side * 1.65, -1.9, -1.5 + random() * 2).applyQuaternion(body.quaternion).add(body.position);
        water.emit(p.x, 0.3, p.z, body.velocity.x * 0.3 + side * 2, 1.5 + random() * 2, body.velocity.z * 0.3, { life: 1.2, size: 1.2, grow: 3, alpha: 0.7, color: [0.92, 0.97, 1], drag: 1.5, lift: -6 });
      }
    }
  }

  return {
    smoke,
    fire,
    water,
    /** A burst at position p: 'touchdown', 'splash', 'crash', 'drop-water', 'crate-impact', 'bird'. */
    burst(kind, p, velocity = { x: 0, y: 0, z: 0 }) {
      if (kind === 'touchdown') {
        for (let i = 0; i < 14; i += 1) smoke.emit(p.x + (random() - 0.5) * 2, p.y + 0.2, p.z + (random() - 0.5) * 2, velocity.x * 0.3 + (random() - 0.5) * 3, random() * 1.5, velocity.z * 0.3 + (random() - 0.5) * 3, { life: 1.6, size: 1.2, grow: 2.5, alpha: 0.45, color: [0.75, 0.72, 0.68], drag: 2 });
      } else if (kind === 'splash') {
        for (let i = 0; i < 60; i += 1) water.emit(p.x, 0.5, p.z, (random() - 0.5) * 10 + velocity.x * 0.3, 3 + random() * 9, (random() - 0.5) * 10 + velocity.z * 0.3, { life: 1.8, size: 1.5, grow: 4, alpha: 0.75, color: [0.95, 0.98, 1], drag: 1, lift: -9 });
      } else if (kind === 'crash') {
        for (let i = 0; i < 90; i += 1) fire.emit(p.x, p.y + 1, p.z, (random() - 0.5) * 22, random() * 16, (random() - 0.5) * 22, { life: 1 + random(), size: 4, grow: 7, alpha: 0.9, color: [1, 0.55 + random() * 0.3, 0.2], drag: 2, lift: 3 });
        for (let i = 0; i < 60; i += 1) smoke.emit(p.x, p.y + 2, p.z, (random() - 0.5) * 8, 3 + random() * 5, (random() - 0.5) * 8, { life: 6 + random() * 3, size: 6, grow: 6, alpha: 0.65, color: [0.16, 0.15, 0.15], drag: 0.8, lift: 1.5 });
        crashFire = { x: p.x, y: p.y, z: p.z, time: 0 };
      } else if (kind === 'drop-water') {
        for (let i = 0; i < 26; i += 1) water.emit(p.x + (random() - 0.5) * 3, p.y - 1, p.z + (random() - 0.5) * 3, velocity.x * 0.85 + (random() - 0.5) * 3, velocity.y - random() * 3, velocity.z * 0.85 + (random() - 0.5) * 3, { life: 3.2, size: 2.2, grow: 5.5, alpha: 0.75, color: [0.86, 0.94, 1], drag: 0.7, lift: -9.8 });
      } else if (kind === 'crate-impact') {
        for (let i = 0; i < 20; i += 1) smoke.emit(p.x, p.y + 0.5, p.z, (random() - 0.5) * 6, random() * 3, (random() - 0.5) * 6, { life: 2, size: 2, grow: 3, alpha: 0.5, color: [0.8, 0.75, 0.65], drag: 2 });
      } else if (kind === 'bird') {
        for (let i = 0; i < 18; i += 1) smoke.emit(p.x, p.y, p.z, velocity.x * 0.6 + (random() - 0.5) * 6, (random() - 0.5) * 6, velocity.z * 0.6 + (random() - 0.5) * 6, { life: 1.2, size: 0.6, grow: 1, alpha: 0.9, color: [0.95, 0.95, 0.92], drag: 3 });
      }
    },
    /** A forest fire of `radius` m at (x, y, z); intensity 0..1 can be lowered by drops. */
    addFire(x, y, z, radius) {
      const f = { x, y, z, radius, intensity: 1 };
      fires.push(f);
      return f;
    },
    /** A rescue flare: red smoke column at (x, y, z). */
    addFlare(x, y, z) {
      const f = { x, y, z };
      flares.push(f);
      return f;
    },
    clearMissionEffects() {
      fires.length = 0;
      flares.length = 0;
      crashFire = null;
    },
    setRain(amount) {
      rain = amount;
    },
    update(dt, viewScale, wind, body, camera, smokeOn) {
      accumulator += dt;
      for (const e of worldEmitters) {
        if (e.kind === 'volcano-smoke' && random() < dt * 9) {
          smoke.emit(e.x + (random() - 0.5) * 60, e.y, e.z + (random() - 0.5) * 60, 0, 6 + random() * 4, 0, { life: 26, size: 60, grow: 9, alpha: 0.42, color: [0.55, 0.52, 0.5], drag: 0.15, lift: 0.3 });
        }
        if (e.kind === 'waterfall-mist' && random() < dt * 6) {
          water.emit(e.x + (random() - 0.5) * 12, e.y + 2, e.z + (random() - 0.5) * 12, (random() - 0.5) * 2, 1 + random(), (random() - 0.5) * 2, { life: 4, size: 6, grow: 4, alpha: 0.35, color: [0.95, 0.98, 1], drag: 0.8, lift: 0.3 });
        }
      }
      for (const f of fires) {
        if (f.intensity <= 0.02) continue;
        const n = dt * 75 * f.intensity;
        for (let i = 0; i < n; i += 1) {
          const a = random() * Math.PI * 2;
          const r = Math.sqrt(random()) * f.radius;
          const hot = random();
          fire.emit(f.x + Math.cos(a) * r, f.y + 2.5, f.z + Math.sin(a) * r, 0, 3.5 + random() * 6, 0, { life: 0.8 + random() * 0.9, size: 4 + random() * 6, grow: 2.5, alpha: 0.55 + hot * 0.25, color: [1, 0.3 + hot * 0.3, 0.05 + hot * 0.06], drag: 0.6, lift: 2.5 });
        }
        if (random() < dt * 12 * f.intensity) {
          smoke.emit(f.x + (random() - 0.5) * f.radius, f.y + 10, f.z + (random() - 0.5) * f.radius, 0, 8 + random() * 4, 0, { life: 18, size: 12, grow: 8, alpha: 0.3, color: [0.46, 0.42, 0.38], drag: 0.25, lift: 0.4 });
        }
      }
      for (const f of flares) {
        if (random() < dt * 16) smoke.emit(f.x, f.y + 1, f.z, 0, 4, 0, { life: 9, size: 3, grow: 4, alpha: 0.8, color: [1, 0.28, 0.2], drag: 0.4, lift: 0.5 });
        if (random() < dt * 20) fire.emit(f.x, f.y + 0.5, f.z, 0, 1, 0, { life: 0.3, size: 3, grow: 0, alpha: 1, color: [1, 0.4, 0.3], drag: 1 });
      }
      if (crashFire) {
        crashFire.time += dt;
        if (crashFire.time < 30) {
          if (random() < dt * 30) fire.emit(crashFire.x + (random() - 0.5) * 4, crashFire.y + 0.5, crashFire.z + (random() - 0.5) * 4, 0, 3 + random() * 3, 0, { life: 0.9, size: 3, grow: 2, alpha: 0.8, color: [1, 0.5, 0.15], drag: 1, lift: 2 });
          if (random() < dt * 10) smoke.emit(crashFire.x, crashFire.y + 3, crashFire.z, 0, 5, 0, { life: 12, size: 7, grow: 5, alpha: 0.55, color: [0.15, 0.14, 0.14], drag: 0.4, lift: 0.6 });
        }
      }
      if (rain > 0 && camera) {
        const n = dt * 900 * rain;
        for (let i = 0; i < n; i += 1) {
          water.emit(camera.position.x + (random() - 0.5) * 120, camera.position.y + 20 + random() * 25, camera.position.z + (random() - 0.5) * 120, wind.x, -30, wind.z, { life: 1.6, size: 0.45, grow: 0, alpha: 0.55, color: [0.78, 0.82, 0.9], drag: 0 });
        }
      }
      updateAircraft(body, dt, smokeOn);
      smoke.update(dt, viewScale, wind);
      fire.update(dt, viewScale, wind);
      water.update(dt, viewScale, wind);
    },
  };
}
