// AI aircraft that fly a smooth path at a set speed, banking into the turns: race rivals and the
// formation leader, each painted in its own colour. Their position along the path is their race
// progress.
import * as THREE from 'three';
import { buildAircraftModel } from './aircraftModelBuilder.js';
import { liveryFromColor } from './trafficLiveries.js';

const UP = new THREE.Vector3(0, 1, 0);

export function createAiFlyer(scene, { aircraft = 'swiftlet', path, speed = 60, startDelay = 0, lateral = 0, start, name = 'Rival', color = '#ff6a4a', seed = Math.random() * 10, registration }) {
  const tail = registration ?? `SV-${700 + Math.floor(seed * 29) % 290}`;
  const rig = buildAircraftModel(aircraft, { livery: liveryFromColor(color), registration: tail });
  rig.root.traverse((o) => {
    if (o.isLight) o.visible = false;
  });
  scene.add(rig.root);
  const points = start ? [start.clone(), ...path] : path;
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const length = curve.getLength();
  let distance = 0;
  let lastHeading = null;
  let bank = 0;
  const position = new THREE.Vector3().copy(points[0]);
  const velocity = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const right = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const roll = new THREE.Quaternion();
  const flyer = {
    name,
    color,
    rig,
    position,
    velocity,
    quaternion,
    finished: false,
    progress: 0,
    speed,
    update(dt, t) {
      if (t > startDelay) distance += speed * dt * (1 + 0.06 * Math.sin(t * 0.37 + seed));
      const u = Math.min(1, distance / length);
      flyer.progress = u;
      if (u >= 1) flyer.finished = true;
      curve.getPointAt(u, position);
      curve.getTangentAt(u, tangent);
      velocity.copy(tangent).multiplyScalar(speed);
      if (u >= 1) position.addScaledVector(tangent, distance - length);
      right.crossVectors(tangent, UP).normalize();
      position.addScaledVector(right, lateral);
      const heading = Math.atan2(tangent.x, -tangent.z);
      if (lastHeading !== null && dt > 0) {
        let diff = heading - lastHeading;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        const rate = diff / dt;
        const target = THREE.MathUtils.clamp(Math.atan((speed * rate) / 9.81), -1.2, 1.2);
        bank += (target - bank) * Math.min(1, dt * 3);
      }
      lastHeading = heading;
      matrix.lookAt(new THREE.Vector3(), tangent, UP);
      quaternion.setFromRotationMatrix(matrix);
      roll.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -bank);
      quaternion.multiply(roll);
      rig.root.position.copy(position);
      rig.root.quaternion.copy(quaternion);
      if (rig.prop) {
        rig.prop.spin.rotation.z += dt * 80;
        rig.prop.disc.material.opacity = 0.8;
        for (const b of rig.prop.blades) b.visible = false;
      }
      if (rig.jet) rig.jet.glowMaterial.opacity = 0.9;
      for (const leg of rig.gearLegs) if (leg.fold !== 'fixed') leg.group.visible = false;
      rig.lights.update(t, false, 0.5);
    },
    dispose() {
      scene.remove(rig.root);
    },
  };
  return flyer;
}
