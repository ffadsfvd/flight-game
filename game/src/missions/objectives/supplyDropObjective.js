// Objective: find the rescue flare and drop a supply crate (Space) as close to it as possible.
// Crates fall under a parachute and drift with the wind; the best drop counts.
import * as THREE from 'three';

const CRATE_MASS = 60;

function crateMesh() {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), new THREE.MeshLambertMaterial({ color: '#c8873a' }));
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.2, 1.25), new THREE.MeshLambertMaterial({ color: '#e8e2d4' }));
  const chute = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#ff5a2a', side: THREE.DoubleSide }));
  chute.position.y = 6;
  chute.visible = false;
  group.add(box, band, chute);
  return { group, chute };
}

export function createSupplyDropObjective(stage) {
  const crates = [];
  let left = stage.crates ?? 3;
  let best = null;
  let flareY = 0;
  const objective = {
    kind: 'supply-drop',
    score: 0,
    rows: [],
    begin(ctx) {
      flareY = Math.max(0, ctx.world.terrain.heightAt(stage.x, stage.z));
      ctx.effects.addFlare(stage.x, flareY, stage.z);
      ctx.body.payload += CRATE_MASS * left;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
      ctx.cleanup(() => {
        for (const c of crates) ctx.scene.remove(c.mesh.group);
      });
    },
    onAction(action, ctx) {
      if (action !== 'action' || left <= 0 || ctx.body.onGround) return;
      left -= 1;
      ctx.body.payload = Math.max(0, ctx.body.payload - CRATE_MASS);
      const mesh = crateMesh();
      const p = ctx.body.position.clone().add(new THREE.Vector3(0, -2, 0));
      mesh.group.position.copy(p);
      ctx.scene.add(mesh.group);
      crates.push({ mesh, p, v: ctx.body.velocity.clone(), age: 0, landed: false });
      ctx.sound('release');
      ctx.toast('CRATE AWAY', 'good');
    },
    update(dt, ctx) {
      const wind = ctx.windVector();
      for (const c of crates) {
        if (c.landed) continue;
        c.age += dt;
        const open = c.age > 1.2;
        c.mesh.chute.visible = open;
        const drag = open ? 1.6 : 0.08;
        c.v.x += (wind.x - c.v.x) * Math.min(1, drag * dt);
        c.v.z += (wind.z - c.v.z) * Math.min(1, drag * dt);
        c.v.y -= 9.81 * dt;
        if (open) c.v.y += (-6.5 - c.v.y) * Math.min(1, dt * 2.5);
        c.p.addScaledVector(c.v, dt);
        const ground = Math.max(0, ctx.world.terrain.heightAt(c.p.x, c.p.z));
        if (c.p.y <= ground + 0.5) {
          c.p.y = ground + 0.5;
          c.landed = true;
          c.mesh.chute.visible = false;
          const d = Math.hypot(c.p.x - stage.x, c.p.z - stage.z);
          ctx.effects.burst(ground <= 0.1 ? 'splash' : 'crate-impact', c.p);
          ctx.toast(`CRATE DOWN ${Math.round(d)} m FROM THE FLARE`, d < (stage.radius ?? 60) ? 'good' : 'bad');
          if (best === null || d < best) best = d;
        }
        c.mesh.group.position.copy(c.p);
      }
      const allLanded = crates.length > 0 && crates.every((c) => c.landed);
      if (best !== null && best < (stage.radius ?? 60) * 0.5 && allLanded) return finish();
      if (left === 0 && allLanded) return finish();
      return 'active';
    },
    info(ctx) {
      const p = ctx.body.position;
      const d = Math.hypot(stage.x - p.x, stage.z - p.z);
      return {
        objective: stage.label ?? 'Drop a supply crate on the red flare (Space)',
        next: d > 1500 ? 'Follow the magenta bug to the smoke' : 'Low and slow: 300 ft, 70 kt, release just before the flare',
        stats: [['DIST', d > 900 ? `${(d / 1852).toFixed(1)} NM` : `${Math.round(d)} m`], ['CRATES', String(left)], ['BEST', best === null ? '—' : `${Math.round(best)} m`]],
        progress: best === null ? Math.max(0, Math.min(0.6, 1 - d / 6000)) : Math.max(0.6, 1 - best / 200),
      };
    },
    markers: () => [{ x: stage.x, z: stage.z, kind: 'target', active: true, label: 'FLARE', color: '#ff4d3d' }],
    guidance: () => null,
    bearing(ctx) {
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(stage.x - p.x, -(stage.z - p.z))) + 360) % 360;
    },
  };
  function finish() {
    const radius = stage.radius ?? 60;
    objective.score = best === null ? 0 : Math.round(Math.max(0, 100 - (best / radius) * 60));
    objective.rows.push(['Closest crate', best === null ? 'none' : `${Math.round(best)} m from the flare`], ['Crates used', `${(stage.crates ?? 3) - left}`]);
    return best !== null && best < radius * 2.5 ? 'done' : 'failed';
  }
  return objective;
}
