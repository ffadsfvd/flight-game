// Target rings for courses and races: glowing gates facing along the course, the next one bright
// gold with a pulsing halo and a beacon line, later ones cyan, passed ones fading out.
import * as THREE from 'three';

const NEXT = new THREE.Color('#ffd34d');
const LATER = new THREE.Color('#5fe3d0');
const DONE = new THREE.Color('#6be38a');

/** Builds rings for [{ position: Vector3, normal: Vector3, radius }] into `scene`. */
export function createRingMarkers(scene, rings) {
  const group = new THREE.Group();
  group.name = 'mission-rings';
  const items = rings.map((ring, index) => {
    const holder = new THREE.Group();
    holder.position.copy(ring.position);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ring.normal);
    const material = new THREE.MeshBasicMaterial({ color: LATER, transparent: true, opacity: 0.85, depthWrite: false, fog: true });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(ring.radius, ring.radius * 0.07, 10, 48), material);
    const haloMaterial = new THREE.MeshBasicMaterial({ color: NEXT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(new THREE.RingGeometry(ring.radius * 0.93, ring.radius * 1.25, 48), haloMaterial);
    const fillMaterial = new THREE.MeshBasicMaterial({ color: NEXT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const fill = new THREE.Mesh(new THREE.CircleGeometry(ring.radius * 0.93, 40), fillMaterial);
    const arrows = new THREE.Group();
    for (let i = 0; i < 4; i += 1) {
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(ring.radius * 0.09, ring.radius * 0.2, 3), material);
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      chevron.position.set(Math.cos(a) * ring.radius * 1.14, Math.sin(a) * ring.radius * 1.14, 0);
      chevron.rotation.z = a + Math.PI / 2;
      arrows.add(chevron);
    }
    holder.add(torus, halo, fill, arrows);
    group.add(holder);
    const label = index + 1;
    return { holder, material, haloMaterial, fillMaterial, arrows, label, passed: false, fade: 1 };
  });
  scene.add(group);
  return {
    group,
    /** Highlights ring `nextIndex`; rings before it are passed. */
    update(nextIndex, time, dt) {
      items.forEach((item, i) => {
        if (i < nextIndex) {
          item.fade = Math.max(0, item.fade - dt * 1.5);
          item.material.color.copy(DONE);
          item.material.opacity = 0.7 * item.fade;
          item.haloMaterial.opacity = 0;
          item.fillMaterial.opacity = 0;
          item.holder.visible = item.fade > 0.01;
        } else if (i === nextIndex) {
          item.material.color.copy(NEXT);
          item.material.opacity = 0.95;
          item.haloMaterial.opacity = 0.25 + 0.2 * Math.sin(time * 5);
          item.fillMaterial.opacity = 0.07;
          item.arrows.rotation.z = time * 1.2;
          item.holder.visible = true;
        } else {
          item.material.color.copy(LATER);
          item.material.opacity = i < nextIndex + 4 ? 0.7 : 0.35;
          item.haloMaterial.opacity = 0;
          item.fillMaterial.opacity = 0;
          item.holder.visible = true;
        }
      });
    },
    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
    },
  };
}

/** Did the segment p0 -> p1 pass through `ring` in its direction? Returns 'hit', 'miss' or null. */
export function ringCrossing(ring, p0, p1) {
  const s0 = new THREE.Vector3().subVectors(p0, ring.position).dot(ring.normal);
  const s1 = new THREE.Vector3().subVectors(p1, ring.position).dot(ring.normal);
  if (!(s0 < 0 && s1 >= 0)) return null;
  const t = s0 / (s0 - s1);
  const q = new THREE.Vector3().copy(p0).lerp(p1, t);
  const off = q.distanceTo(ring.position);
  if (off <= ring.radius) return 'hit';
  if (off <= ring.radius * 4) return 'miss';
  return null;
}
