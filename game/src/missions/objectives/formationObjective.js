// Objective: fly in formation off the leader's wing along a scenic route. Time spent inside the
// slot (a box behind and to the right of the leader) is the score; falling far behind fails it.
import * as THREE from 'three';
import { createAiFlyer } from '../../aircraft/aiFlyer.js';

export function createFormationObjective(stage) {
  let leader = null;
  let inSlot = 0;
  let held = 0;
  let total = 0;
  let lostTime = 0;
  let start = 0;
  let slotDistance = 0;
  const slot = new THREE.Vector3();
  const offset = new THREE.Vector3(...(stage.slot ?? [22, 0, 26]));
  const objective = {
    kind: 'formation',
    score: 0,
    rows: [],
    begin(ctx) {
      const path = stage.path.map(([x, z, alt]) => new THREE.Vector3(x, alt, z));
      const ahead = new THREE.Vector3(0, 0, -60).applyQuaternion(ctx.body.quaternion).add(ctx.body.position);
      leader = createAiFlyer(ctx.scene, { aircraft: stage.aircraft ?? 'wren', path, speed: stage.speed ?? 48, start: ahead, name: 'Lead', color: '#ffd34d' });
      start = ctx.time;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
      ctx.cleanup(() => leader.dispose());
    },
    update(dt, ctx) {
      leader.update(dt, ctx.time - start);
      slot.copy(offset).applyQuaternion(leader.quaternion).add(leader.position);
      slotDistance = slot.distanceTo(ctx.body.position);
      total += dt;
      if (slotDistance < (stage.tolerance ?? 24)) {
        inSlot += dt;
        held += dt;
        if (held >= 15) {
          held = 0;
          ctx.report({ kind: 'slot-hold' });
        }
      } else held = 0;
      if (slotDistance > 700) lostTime += dt;
      else lostTime = 0;
      if (lostTime > 12) {
        objective.failedReason = 'Lost the formation';
        return 'failed';
      }
      if (leader.finished) {
        objective.score = Math.round(Math.min(100, (inSlot / Math.max(1, total)) * 125));
        objective.rows.push(['Time in position', `${Math.round((inSlot / Math.max(1, total)) * 100)}%`], ['Formation time', `${Math.round(total)} s`]);
        ctx.report({ kind: 'formation-done', pct: Math.round((inSlot / Math.max(1, total)) * 100) });
        return 'done';
      }
      return 'active';
    },
    info() {
      const pct = Math.round((inSlot / Math.max(1, total)) * 100);
      return {
        objective: stage.label ?? 'Hold position off the leader\'s right wing',
        next: slotDistance > 120 ? 'Close up: more power, cut inside the turns' : slotDistance > 24 ? 'Ease into the gold slot marker' : 'In position - match the leader\'s bank',
        stats: [['IN SLOT', `${pct}%`], ['GAP', `${Math.round(slotDistance)} m`], ['ROUTE', `${Math.round((leader?.progress ?? 0) * 100)}%`]],
        progress: leader?.progress ?? 0,
      };
    },
    markers: () => (leader ? [{ x: slot.x, z: slot.z, kind: 'target', active: true, label: 'SLOT' }] : []),
    others: () => (leader ? [{ x: leader.position.x, z: leader.position.z, color: '#ffd34d' }] : []),
    guidance: () => null,
    /** The slot's pose (for the logic smoke test). */
    __slot() {
      return leader ? { position: slot.clone(), velocity: leader.velocity.clone(), quaternion: leader.quaternion.clone() } : null;
    },
    bearing(ctx) {
      const p = ctx.body.position;
      return (THREE.MathUtils.radToDeg(Math.atan2(slot.x - p.x, -(slot.z - p.z))) + 360) % 360;
    },
  };
  return objective;
}
