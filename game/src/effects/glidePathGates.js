// The 3D approach guide: a row of target rings down the 3° glide path to the runway threshold, so
// the pilot flies through them on final and sees the runway through the next one. The next ring
// ahead burns bright (with a soft halo) until the aircraft is through it; the later ones glow
// dimmer, and each fades out just before it is passed.
import * as THREE from 'three';
import { airfieldById, fromRunwayFrame, landingDirection } from '../world/airfieldDirectory.js';
import { GLIDE_SLOPE_DEG, crossingHeight } from '../world/approachGeometry.js';

const GATE_SPACING = 260;
const GATE_COUNT = 11;
const RING_RADIUS = 21;
const RING_WIDTH = 2.6;
const NEXT_COLOR = new THREE.Color('#9dffc4');
const LATER_COLOR = new THREE.Color('#5fe3a8');

/** Creates the ring row (hidden until set to a runway end). */
export function createGlidePathGates(scene) {
  const group = new THREE.Group();
  group.name = 'glide-path-gates';
  group.visible = false;
  const ring = new THREE.RingGeometry(RING_RADIUS - RING_WIDTH, RING_RADIUS, 72);
  const halo = new THREE.RingGeometry(RING_RADIUS - RING_WIDTH * 2.4, RING_RADIUS + RING_WIDTH * 1.4, 72);
  const gates = [];
  for (let i = 0; i < GATE_COUNT; i += 1) {
    const material = new THREE.MeshBasicMaterial({ color: LATER_COLOR.clone(), transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    const glowMaterial = new THREE.MeshBasicMaterial({ color: NEXT_COLOR, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    const mesh = new THREE.Mesh(ring, material);
    const glow = new THREE.Mesh(halo, glowMaterial);
    mesh.add(glow);
    group.add(mesh);
    gates.push({ mesh, material, glowMaterial, distance: 0 });
  }
  scene.add(group);
  let current = null;
  return {
    /** Shows rings for runway `fieldId` end `end` (or hides them with null). */
    set(fieldId, end) {
      const key = fieldId ? `${fieldId}:${end}` : null;
      if (key === current) return;
      current = key;
      group.visible = Boolean(fieldId);
      if (!fieldId) return;
      const field = airfieldById(fieldId);
      const dir = landingDirection(field, end);
      const elevation = field.kind === 'water' ? 0 : field.elevationResolved;
      const yaw = -THREE.MathUtils.degToRad(dir.heading);
      gates.forEach((gate, i) => {
        const distance = 180 + i * GATE_SPACING;
        const p = fromRunwayFrame(field, -dir.sign * (field.length / 2 + distance), 0);
        const y = elevation + crossingHeight(field) + Math.tan(THREE.MathUtils.degToRad(GLIDE_SLOPE_DEG)) * distance + 5;
        gate.mesh.position.set(p.x, y, p.z);
        gate.mesh.rotation.set(0, yaw, 0);
        gate.distance = distance;
      });
    },
    /** Brightens the next ring ahead and fades each ring as the aircraft reaches it. */
    update(distanceToThreshold, time) {
      if (!group.visible) return;
      let next = null;
      for (const gate of gates) {
        const ahead = distanceToThreshold - gate.distance;
        if (ahead > 25 && (!next || gate.distance > next.distance)) next = gate;
      }
      for (const gate of gates) {
        const ahead = distanceToThreshold - gate.distance;
        const visible = ahead > 25 && ahead < 2600;
        gate.mesh.visible = visible;
        if (!visible) continue;
        const pulse = 0.85 + 0.15 * Math.sin(time * 3.2 - gate.distance * 0.01);
        const isNext = gate === next;
        gate.material.color.copy(isNext ? NEXT_COLOR : LATER_COLOR);
        gate.material.opacity = (isNext ? 0.95 : Math.min(0.42, ahead / 700)) * Math.min(1, (ahead - 25) / 45) * pulse;
        gate.glowMaterial.opacity = isNext ? 0.22 * Math.min(1, (ahead - 25) / 45) * pulse : 0;
      }
    },
  };
}
