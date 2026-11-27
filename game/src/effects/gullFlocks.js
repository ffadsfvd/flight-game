// Gulls you can see: the colonies a mission briefs (circling over their cliffs below their top)
// and, for a chance strike, a flock that rises ahead on the aircraft's path a few seconds before
// it is reached. Each gull is a flapping V of two wings, instanced; a struck flock scatters.
import * as THREE from 'three';

const PER_COLONY = 42;
const PER_FLOCK = 16;
const MAX = PER_COLONY * 3 + PER_FLOCK;

function gullGeometry() {
  // Two swept wings meeting at the body, 1.5 m span (drawn about twice life size so a flock reads from a cockpit at a few hundred metres).
  const v = [0, 0, -0.15, -0.78, 0.12, 0.12, -0.18, 0.02, 0.2, 0, 0, -0.15, 0.18, 0.02, 0.2, 0.78, 0.12, 0.12, 0, 0, -0.15, 0, 0, 0.35, -0.18, 0.02, 0.2, 0, 0, -0.15, 0.18, 0.02, 0.2, 0, 0, 0.35];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Creates the gull renderer; call update() each frame with the flight's damage tracker. */
export function createGullFlocks(scene, terrain) {
  const material = new THREE.MeshLambertMaterial({ color: '#f4f2ec', emissive: '#b9b4a6', side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(gullGeometry(), material, MAX);
  mesh.name = 'gulls';
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const birds = Array.from({ length: MAX }, (_, i) => ({ phase: (i * 2.399) % (Math.PI * 2), seed: ((i * 7919) % 1000) / 1000 }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  let scatter = 0;
  let lastFlock = null;

  function place(index, x, y, z, heading, flap, size) {
    e.set(0, heading, Math.sin(flap) * 0.15);
    q.setFromEuler(e);
    s.set(size, size * (0.35 + 0.65 * Math.sin(flap)), size);
    p.set(x, y, z);
    m.compose(p, q, s);
    mesh.setMatrixAt(index, m);
  }

  return {
    /** Draws the colonies of `tracker.flocks` and its pending chance flock, if any. */
    update(dt, time, tracker) {
      if (!tracker) {
        mesh.count = 0;
        return;
      }
      let n = 0;
      for (const colony of (tracker.flocks ?? []).slice(0, 3)) {
        const top = colony.topFt / 3.281;
        const ground = Math.max(0, terrain.heightAt(colony.x, colony.z));
        for (let i = 0; i < PER_COLONY; i += 1) {
          const b = birds[n];
          // Each gull rides its own slow circle over the colony, bobbing in the cliff updraft.
          const r = colony.radius * (0.25 + 0.7 * b.seed);
          const a = time * (0.12 + 0.1 * b.seed) * (i % 2 ? 1 : -1) + b.phase;
          const y = ground + 12 + (top - 18) * ((b.seed * 1.7 + i * 0.13) % 1) + Math.sin(time * 0.7 + b.phase) * 4;
          place(n, colony.x + Math.cos(a) * r, y, colony.z + Math.sin(a) * r, -a + (i % 2 ? Math.PI : 0), time * 7 + b.phase, 3.2);
          n += 1;
        }
      }
      const flock = tracker.pendingFlock ?? tracker.lastFlock ?? null;
      if (flock !== lastFlock) {
        lastFlock = flock;
        scatter = 0;
      }
      if (flock) {
        if (flock.struck || flock.passed) scatter += dt;
        for (let i = 0; i < PER_FLOCK && scatter < 6; i += 1) {
          const b = birds[n];
          const a = b.phase + time * 0.4;
          const spread = 6 + scatter * 9;
          place(n, flock.x + Math.cos(a) * spread * b.seed + Math.cos(i) * 3, flock.y + Math.sin(i * 1.7) * 3 + scatter * (2 + b.seed * 3), flock.z + Math.sin(a) * spread * b.seed + Math.sin(i) * 3, a, time * 9 + b.phase, 3.2);
          n += 1;
        }
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
