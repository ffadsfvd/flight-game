// Objective: fly to a place (an island, a landmark, a rendezvous) within a radius, optionally
// inside a height band.
import * as THREE from 'three';

const FT = 3.28084;

export function createReachObjective(stage) {
  let arrived = false;
  return {
    kind: 'reach',
    score: 100,
    begin(ctx) {
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    update(dt, ctx) {
      const p = ctx.body.position;
      const d = Math.hypot(stage.x - p.x, stage.z - p.z);
      const agl = ctx.body.agl * FT;
      const inBand = (stage.minFt === undefined || agl >= stage.minFt) && (stage.maxFt === undefined || agl <= stage.maxFt);
      if (d < (stage.radius ?? 600) && inBand) arrived = true;
      return arrived ? 'done' : 'active';
    },
    info(ctx) {
      const p = ctx.body.position;
      const d = Math.hypot(stage.x - p.x, stage.z - p.z);
      const band = stage.maxFt !== undefined ? `below ${stage.maxFt} ft` : stage.minFt !== undefined ? `above ${stage.minFt} ft` : '';
      return {
        objective: stage.label ?? `Fly to ${stage.name}`,
        next: stage.hint ?? (band ? `Arrive ${band} above the ground` : 'Follow the magenta bug on the heading tape'),
        stats: [['DIST', d > 900 ? `${(d / 1852).toFixed(1)} NM` : `${Math.round(d)} m`], ['BEARING', `${String(Math.round(this.bearing(ctx))).padStart(3, '0')}°`], ['AGL FT', Math.round(ctx.body.agl * FT)]],
        progress: Math.max(0, Math.min(1, 1 - d / (stage.startDistance ?? 6000))),
      };
    },
    markers() {
      return [{ x: stage.x, z: stage.z, kind: 'area', radius: stage.radius ?? 600, active: true, label: stage.name, color: '#ffd34d' }];
    },
    guidance: () => null,
    bearing(ctx) {
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(stage.x - p.x, -(stage.z - p.z))) + 360) % 360;
    },
  };
}
