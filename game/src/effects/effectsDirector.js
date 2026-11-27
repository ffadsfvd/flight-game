// Runs the world's moving effects: the volcano's plume and the waterfall's mist, the aircraft's
// exhaust (dark and thick when the engine is hurt), display smoke, wingtip vapour in hard pulls,
// touchdown dust and spray, water drops and scooping spray, forest fires and rescue flares, rain in
// storms, and the fireball and smoke of a crash.
import * as THREE from 'three';
import { createParticleSystem } from './particleSystem.js';
import { createBurningFire } from './burningPatches.js';
import { buildWildfireScenery, flameTexture } from './wildfireScenery.js';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

/** Creates the effects director for a scene and the world's emitters. */
export function createEffectsDirector(scene, worldEmitters) {
  const smoke = createParticleSystem(scene, { max: 3200, name: 'smoke' });
  const fire = createParticleSystem(scene, { max: 1600, name: 'fire' });
  // Flames draw before the water so a curtain falling in front of them hides them.
  const flames = createParticleSystem(scene, { max: 2600, additive: true, name: 'flames', texture: flameTexture(), renderOrder: 4 });
  const sparks = createParticleSystem(scene, { max: 900, additive: true, name: 'sparks' });
  const water = createParticleSystem(scene, { max: 1800, name: 'water' });
  const fires = [];
  const flares = [];
  let crashFire = null;
  let rain = 0;
  let accumulator = 0;
  let fireTerrain = null;
  let scenery = null;
  let sceneryDirty = false;
  let clock = 0;
  const random = Math.random;

  function updateAircraft(body, dt, smokeOn) {
    if (!body) return;
    const spec = body.spec;
    const back = tmp.set(0, 0, spec.engine === 'jet' ? 4.6 : 1.5).applyQuaternion(body.quaternion).add(body.position);
    const hurt = 1 - body.engine.health;
    // A hurt engine trails smoke from the moment it is damaged: a thin grey wisp at first, darker
    // and thicker as the engine gets worse (or runs too hot). The puffs stay small and thin out
    // within a few seconds, so the trail reads behind the aircraft without veiling it.
    if (body.engine.running && (hurt > 0.04 || body.engine.temperature > 215)) {
      if (random() < dt * (30 + hurt * 40)) smoke.emit(back.x, back.y, back.z, body.velocity.x * 0.2, 0.4, body.velocity.z * 0.2, { life: 2.6, size: 0.55 + hurt * 1.2, grow: 1.6 + hurt * 1.2, alpha: 0.26 + hurt * 0.4, color: [0.3 - hurt * 0.12, 0.29 - hurt * 0.12, 0.29 - hurt * 0.12], drag: 1.2, lift: 0.8 });
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
      // Debris: dark and painted fragments thrown out along the impact and falling back.
      for (let i = 0; i < 70; i += 1) {
        const painted = random() < 0.45;
        const shade = painted ? 0.75 + random() * 0.2 : 0.1 + random() * 0.12;
        smoke.emit(p.x + (random() - 0.5) * 3, p.y + 1, p.z + (random() - 0.5) * 3, velocity.x * 0.35 + (random() - 0.5) * 18, 4 + random() * 12, velocity.z * 0.35 + (random() - 0.5) * 18, { life: 1.6 + random() * 1.4, size: 0.5 + random() * 0.9, grow: 0, alpha: 1, color: [shade, shade * 0.97, shade * 0.93], drag: 0.35, lift: -9.8 });
      }
        crashFire = { x: p.x, y: p.y, z: p.z, time: 0 };
      } else if (kind === 'drop-water') {
        for (let i = 0; i < 26; i += 1) water.emit(p.x + (random() - 0.5) * 3, p.y - 1, p.z + (random() - 0.5) * 3, velocity.x * 0.85 + (random() - 0.5) * 3, velocity.y - random() * 3, velocity.z * 0.85 + (random() - 0.5) * 3, { life: 3.2, size: 2.2, grow: 5.5, alpha: 0.75, color: [0.86, 0.94, 1], drag: 0.7, lift: -9.8 });
      } else if (kind === 'crate-impact') {
        for (let i = 0; i < 20; i += 1) smoke.emit(p.x, p.y + 0.5, p.z, (random() - 0.5) * 6, random() * 3, (random() - 0.5) * 6, { life: 2, size: 2, grow: 3, alpha: 0.5, color: [0.8, 0.75, 0.65], drag: 2 });
      } else if (kind === 'bird') {
        for (let i = 0; i < 18; i += 1) smoke.emit(p.x, p.y, p.z, velocity.x * 0.6 + (random() - 0.5) * 6, (random() - 0.5) * 6, velocity.z * 0.6 + (random() - 0.5) * 6, { life: 1.2, size: 0.6, grow: 1, alpha: 0.9, color: [0.95, 0.95, 0.92], drag: 3 });
      }
    },
    /** A forest fire of `radius` m at (x, y, z) on `terrain`, as burning patches that water puts out (burningPatches.js). */
    addFire(x, y, z, radius, terrain = null) {
      const f = createBurningFire(x, y, z, radius);
      fires.push(f);
      if (terrain) fireTerrain = terrain;
      sceneryDirty = true;
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
      sceneryDirty = true;
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
      if (sceneryDirty) {
        scenery?.dispose();
        scenery = fireTerrain && fires.length ? buildWildfireScenery(scene, fireTerrain, fires) : null;
        sceneryDirty = false;
      }
      clock += dt;
      scenery?.update(clock);
      const groundAt = (x, z, fallback) => (fireTerrain ? Math.max(0, fireTerrain.heightAt(x, z)) : fallback);
      for (const f of fires) {
        // Flame tongues on each patch still burning, on the slope itself: a patch the water put
        // out has none, so a good drop leaves a dark gap in the fire where it landed.
        for (const patch of f.patches) {
          if (patch.heat > 0.02) {
            const rate = dt * (150 / f.patches.length) * Math.min(1, patch.heat * 1.15);
            const n = Math.floor(rate) + (random() < rate - Math.floor(rate) ? 1 : 0);
            for (let i = 0; i < n; i += 1) {
              const a = random() * Math.PI * 2;
              const r = f.patchRadius * Math.sqrt(random());
              const x = patch.x + Math.cos(a) * r;
              const z = patch.z + Math.sin(a) * r;
              const size = (6 + random() * 8) * (0.55 + 0.45 * patch.heat);
              const y = groundAt(x, z, f.y) + size * 0.3;
              const hot = random();
              flames.emit(x, y, z, wind.x * 0.25, 2.5 + random() * 3, wind.z * 0.25, { life: 0.45 + random() * 0.5, size, grow: -size * 0.6, alpha: 0.95, color: [1, 0.82 + hot * 0.18, 0.62 + hot * 0.3], drag: 1.4, lift: 3 });
              if (random() < 0.35) flames.emit(x, y + size * 0.4, z, wind.x * 0.3, 4 + random() * 3, wind.z * 0.3, { life: 0.35 + random() * 0.3, size: size * 0.6, grow: -size, alpha: 0.85, color: [1, 0.86, 0.55], drag: 1.2, lift: 3 });
              // Embers that climb with the heat and drift off with the wind.
              if (random() < 0.12) sparks.emit(x, y + 2, z, (random() - 0.5) * 4, 5 + random() * 7, (random() - 0.5) * 4, { life: 2.4 + random() * 2.2, size: 0.5 + random() * 0.4, grow: -0.08, alpha: 1, color: [1, 0.55 + random() * 0.25, 0.18], drag: 0.7, lift: 0.6 });
            }
            // Dark smoke rising off the flames and leaning away downwind.
            if (random() < dt * (16 / f.patches.length) * patch.heat * 1.3) {
              const x = patch.x + (random() - 0.5) * f.patchRadius;
              const z = patch.z + (random() - 0.5) * f.patchRadius;
              const shade = 0.1 + random() * 0.1;
              smoke.emit(x, groundAt(x, z, f.y) + 9, z, wind.x * 0.5, 7 + random() * 4, wind.z * 0.5, { life: 15, size: 9, grow: 5.5, alpha: 0.55, color: [shade, shade * 0.95, shade * 0.92], drag: 0.3, lift: 0.3 });
            }
          }
          // White steam off a patch the water just hit, thinning as it cools.
          if (patch.steam > 0 && random() < dt * 4.5 * Math.min(1, patch.steam / 3)) {
            const x = patch.x + (random() - 0.5) * f.patchRadius;
            const z = patch.z + (random() - 0.5) * f.patchRadius;
            const white = 0.82 + random() * 0.12;
            smoke.emit(x, groundAt(x, z, f.y) + 3, z, wind.x * 0.4, 4 + random() * 3, wind.z * 0.4, { life: 8, size: 6, grow: 4.5, alpha: 0.5, color: [white, white, white * 0.98], drag: 0.4, lift: 0.4 });
          }
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
      flames.update(dt, viewScale, wind);
      sparks.update(dt, viewScale, wind);
      water.update(dt, viewScale, wind);
    },
  };
}
