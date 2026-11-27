// Objective: find a boat running without lights in a search area at night and hold it in the
// landing light (L) long enough for the patrol boat to close in. The boat wanders inside the area;
// it shows up white and wakes glowing only while the light is on it, low and close.
import * as THREE from 'three';
import { mergeColoredParts } from '../../core/geometryMerge.js';

const FT = 3.28084;

function speedboatGeometry() {
  const hull = new THREE.BoxGeometry(2.8, 1.1, 10);
  hull.translate(0, 0.35, 0);
  const bow = new THREE.ConeGeometry(1.4, 3, 4);
  bow.rotateX(-Math.PI / 2);
  bow.rotateZ(Math.PI / 4);
  bow.scale(1, 0.55, 1);
  bow.translate(0, 0.35, -6.4);
  const cabin = new THREE.BoxGeometry(2.0, 1.2, 3.2);
  cabin.translate(0, 1.4, 0.8);
  const crates = new THREE.BoxGeometry(2.2, 0.7, 2.4);
  crates.translate(0, 1.1, 3.4);
  return mergeColoredParts([
    { geometry: hull, color: '#2e3338' },
    { geometry: bow, color: '#2e3338' },
    { geometry: cabin, color: '#4a5058' },
    { geometry: crates, color: '#6a5a3e' },
  ]);
}

export function createSearchObjective(stage) {
  const area = stage.area;
  const boat = { position: new THREE.Vector3(stage.target.x, 0, stage.target.z), heading: THREE.MathUtils.degToRad(stage.target.heading ?? 0), speed: stage.target.speed ?? 4 };
  let mesh = null;
  let material = null;
  let wake = null;
  let lit = 0;
  let spotted = false;
  let start = 0;
  const toBoat = new THREE.Vector3();
  const beam = new THREE.Vector3();
  const objective = {
    kind: 'search',
    score: 0,
    rows: [],
    begin(ctx) {
      material = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#000000' });
      mesh = new THREE.Mesh(speedboatGeometry(), material);
      wake = new THREE.Mesh(new THREE.PlaneGeometry(4, 36), new THREE.MeshBasicMaterial({ color: '#dfeaf0', transparent: true, opacity: 0.08, depthWrite: false }));
      wake.rotation.x = -Math.PI / 2;
      wake.position.set(0, 0.15, 22);
      mesh.add(wake);
      ctx.scene.add(mesh);
      start = ctx.time;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
      ctx.cleanup(() => objective.end());
    },
    end() {
      mesh?.removeFromParent();
      mesh = null;
    },
    update(dt, ctx) {
      // The boat zig-zags slowly and turns back at the edge of the area.
      boat.heading += Math.sin(ctx.time * 0.11) * 0.08 * dt;
      boat.position.x += Math.sin(boat.heading) * boat.speed * dt;
      boat.position.z -= Math.cos(boat.heading) * boat.speed * dt;
      if (Math.hypot(boat.position.x - area.x, boat.position.z - area.z) > area.radius * 0.85) {
        boat.heading = Math.atan2(area.x - boat.position.x, -(area.z - boat.position.z));
      }
      mesh.position.set(boat.position.x, Math.sin(ctx.time * 1.3) * 0.15, boat.position.z);
      mesh.rotation.set(Math.sin(ctx.time * 0.9) * 0.03, -boat.heading, Math.sin(ctx.time * 1.1) * 0.04);
      // Is the boat in the landing light: on, low, close and within the beam's cone?
      const b = ctx.body;
      toBoat.copy(boat.position).sub(b.position);
      const distance = toBoat.length();
      beam.set(0, -Math.sin(0.17), -Math.cos(0.17)).applyQuaternion(b.quaternion);
      const inCone = toBoat.normalize().dot(beam) > Math.cos(THREE.MathUtils.degToRad(stage.cone ?? 22));
      const inLight = b.landingLights && inCone && distance < (stage.reach ?? 900) && b.agl * FT < (stage.maxHeightFt ?? 700);
      if (inLight) {
        lit += dt;
        if (!spotted) {
          spotted = true;
          ctx.sound('stage');
          ctx.toast('CONTACT · HOLD THE LIGHT ON IT', 'good');
          ctx.report({ kind: 'contact' });
          if (stage.found) ctx.radio(stage.found[0], stage.found[1], { priority: true });
        }
      } else {
        lit = Math.max(0, lit - dt * 0.35);
      }
      const glow = inLight ? 1 : 0;
      material.emissive.setRGB(0.55 * glow, 0.55 * glow, 0.5 * glow);
      wake.material.opacity = 0.08 + 0.5 * glow;
      if (lit >= stage.illuminate) {
        const minutes = (ctx.time - start) / 60;
        objective.score = Math.round(Math.max(45, Math.min(100, 100 - Math.max(0, minutes - (stage.parMinutes ?? 3)) * 12)));
        objective.rows.push(['Search time', `${Math.floor(minutes)}:${String(Math.round((minutes % 1) * 60)).padStart(2, '0')}`], ['Boat held in the light', `${stage.illuminate} s`]);
        ctx.report({ kind: 'search-done', minutes });
        return 'done';
      }
      return 'active';
    },
    info(ctx) {
      const b = ctx.body;
      const centre = Math.hypot(area.x - b.position.x, area.z - b.position.z);
      let next;
      if (!b.landingLights) next = 'Landing light ON (L): it is your searchlight';
      else if (centre > area.radius) next = 'Fly to the search area, then sweep it low and slow';
      else if (!spotted) next = `Sweep below ${stage.maxHeightFt ?? 700} ft, look for a dark hull and its wake`;
      else next = 'Keep the boat in the beam: circle it with the nose on it';
      return {
        objective: stage.label ?? 'Find the boat and hold it in your light',
        next,
        stats: [['LIT', `${Math.min(stage.illuminate, lit).toFixed(1)} / ${stage.illuminate} s`], ['AREA', centre > area.radius ? `${(centre / 1852).toFixed(1)} NM` : 'IN'], ['AGL FT', Math.round(b.agl * FT)]],
        progress: Math.min(1, lit / stage.illuminate),
      };
    },
    markers: () => [{ x: area.x, z: area.z, kind: 'area', radius: area.radius, active: true, label: 'SEARCH', color: '#ffd34d' }, ...(spotted ? [{ x: boat.position.x, z: boat.position.z, kind: 'area', radius: 40, active: true, label: 'BOAT', color: '#ff6a4a' }] : [])],
    guidance: () => null,
    bearing(ctx) {
      const p = ctx.body.position;
      const t = spotted ? boat.position : area;
      return (THREE.MathUtils.radToDeg(Math.atan2(t.x - p.x, -(t.z - p.z))) + 360) % 360;
    },
    /** The boat's position (for the logic smoke test). */
    __target: () => boat.position.clone(),
  };
  return objective;
}
