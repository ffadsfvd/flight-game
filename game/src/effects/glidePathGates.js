// The 3D approach guide: a row of translucent frames down the 3° glide path to the runway
// threshold, so the pilot flies through them on final. Frames ahead glow, the near ones fade.
import * as THREE from 'three';
import { airfieldById, fromRunwayFrame, landingDirection } from '../world/airfieldDirectory.js';
import { GLIDE_SLOPE_DEG, THRESHOLD_CROSSING_M } from '../world/approachGeometry.js';

const GATE_SPACING = 260;
const GATE_COUNT = 11;

function frameGeometry(width, height, bar) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-width / 2 + bar, -height / 2 + bar);
  hole.lineTo(-width / 2 + bar, height / 2 - bar);
  hole.lineTo(width / 2 - bar, height / 2 - bar);
  hole.lineTo(width / 2 - bar, -height / 2 + bar);
  hole.closePath();
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape);
}

/** Creates the gate row (hidden until set to a runway end). */
export function createGlidePathGates(scene) {
  const group = new THREE.Group();
  group.name = 'glide-path-gates';
  group.visible = false;
  const geometry = frameGeometry(46, 30, 2.2);
  const gates = [];
  for (let i = 0; i < GATE_COUNT; i += 1) {
    const material = new THREE.MeshBasicMaterial({ color: '#7dffb0', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: true });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    gates.push({ mesh, material, distance: 0 });
  }
  scene.add(group);
  let current = null;
  return {
    /** Shows gates for runway `fieldId` end `end` (or hides them with null). */
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
        const y = elevation + THRESHOLD_CROSSING_M + Math.tan(THREE.MathUtils.degToRad(GLIDE_SLOPE_DEG)) * distance + 6;
        gate.mesh.position.set(p.x, y, p.z);
        gate.mesh.rotation.set(0, yaw, 0);
        gate.distance = distance;
      });
    },
    /** Fades gates by the aircraft's distance to the threshold. */
    update(distanceToThreshold, time) {
      if (!group.visible) return;
      for (const gate of gates) {
        const ahead = distanceToThreshold - gate.distance;
        const visible = ahead > 30 && ahead < 2600;
        gate.mesh.visible = visible;
        gate.material.opacity = visible ? Math.min(0.55, ahead / 300) * (0.75 + 0.25 * Math.sin(time * 3 - gate.distance * 0.01)) : 0;
      }
    },
  };
}
