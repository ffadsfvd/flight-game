// Objective: photograph landmarks for the Gazette. Press Space with the landmark near the middle
// of the view and within range; framing and distance make the shot's score.
import * as THREE from 'three';
import { LANDMARKS } from '../../world/archipelagoMap.js';

export function createPhotoObjective(stage) {
  const targets = stage.targets.map((id) => ({ ...LANDMARKS.find((l) => l.id === id), done: false, score: 0 }));
  const [near, far] = stage.range ?? [180, 1600];
  const forward = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const objective = {
    kind: 'photo',
    score: 0,
    rows: [],
    begin(ctx) {
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    onAction(action, ctx) {
      if (action !== 'action') return;
      const camera = ctx.camera;
      camera.getWorldDirection(forward);
      ctx.flash();
      ctx.sound('shutter');
      let best = null;
      for (const t of targets) {
        if (t.done) continue;
        // A landmark counts from its waterline to its top, so centring the lighthouse's lamp, the
        // volcano's summit or the mast on its mountain all frame it: sample points up the column.
        const ground = ctx.world ? Math.max(0, ctx.world.terrain.heightAt(t.x, t.z)) : 0;
        const top = ground + (t.height ?? 40);
        let angle = Infinity;
        let d = 0;
        for (let k = 0; k <= 12; k += 1) {
          toTarget.set(t.x, (top * k) / 12, t.z).sub(camera.position);
          const dk = toTarget.length();
          const ak = THREE.MathUtils.radToDeg(forward.angleTo(toTarget.normalize()));
          if (ak < angle) {
            angle = ak;
            d = dk;
          }
        }
        if (d >= near && d <= far && angle < 18 && (!best || angle < best.angle)) best = { t, d, angle };
      }
      if (!best) {
        ctx.toast('NOTHING IN FRAME', 'bad');
        return;
      }
      const framing = 1 - best.angle / 18;
      const ideal = 1 - Math.min(1, Math.abs(best.d - 600) / 900);
      best.t.done = true;
      best.t.score = Math.round(40 + 40 * framing + 20 * ideal);
      ctx.toast(`PHOTO: ${best.t.name.toUpperCase()}  ${best.t.score}%`, 'good');
    },
    update() {
      if (targets.every((t) => t.done)) {
        objective.score = Math.round(targets.reduce((s, t) => s + t.score, 0) / targets.length);
        for (const t of targets) objective.rows.push([`Photo: ${t.name}`, `${t.score}%`]);
        return 'done';
      }
      return 'active';
    },
    info(ctx) {
      const pending = targets.filter((t) => !t.done);
      const t = pending[0];
      const d = t ? Math.hypot(t.x - ctx.body.position.x, t.z - ctx.body.position.z) : 0;
      return {
        objective: t ? `Photograph ${t.name}` : 'Photos done',
        next: d > far ? 'Fly closer, then point the nose at it' : `Centre it in view and press Space (${near}-${far} m)`,
        stats: [['PHOTOS', `${targets.length - pending.length} / ${targets.length}`], ['DIST', d > 900 ? `${(d / 1852).toFixed(1)} NM` : `${Math.round(d)} m`], ['RANGE', d >= near && d <= far ? 'IN' : 'OUT']],
        progress: (targets.length - pending.length) / targets.length,
      };
    },
    markers: () => targets.map((t) => ({ x: t.x, z: t.z, kind: 'target', active: !t.done, label: t.done ? null : 'PHOTO', color: t.done ? '#6be38a' : '#ff4fd8' })),
    guidance: () => null,
    bearing(ctx) {
      const t = targets.find((x) => !x.done);
      if (!t) return null;
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(t.x - p.x, -(t.z - p.z))) + 360) % 360;
    },
  };
  return objective;
}
