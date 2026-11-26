// The living backdrop behind the menus: the camera drifts round the archipelago at golden hour
// while an aircraft circles over Marenza's coast, banked in a gentle turn.
import * as THREE from 'three';

const CENTRE = new THREE.Vector3(-1500, 0, 2900);

/** Creates the backdrop driver for the session and camera director. */
export function createTitleBackdrop(session, director) {
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const position = new THREE.Vector3();
  let angle = 0.6;
  return {
    enter(aircraftId = 'wren') {
      director.view = 'orbit';
      director.orbit.centre.set(-1700, 0, 3000);
      director.orbit.radius = 1150;
      director.orbit.height = 330;
      director.orbit.lookHeight = 190;
      director.orbit.speed = 0.02;
      session.showModel(aircraftId, CENTRE, q);
    },
    update(dt, time, aircraftId) {
      angle += dt * 0.075;
      const radius = 420;
      position.set(CENTRE.x + Math.cos(angle) * radius, 240 + Math.sin(time * 0.3) * 6, CENTRE.z + Math.sin(angle) * radius);
      const heading = -angle + Math.PI;
      euler.set(0.02, heading, -0.42);
      q.setFromEuler(euler);
      const rig = session.showModel(aircraftId, position, q);
      if (rig.prop) {
        rig.prop.spin.rotation.z += dt * 70;
        rig.prop.disc.material.opacity = 0.8;
        for (const b of rig.prop.blades) b.visible = false;
      }
      for (const leg of rig.gearLegs) if (leg.fold !== 'fixed') leg.group.visible = false;
      rig.lights.update(time, true, 0.6);
      rig.exterior.visible = true;
      return position;
    },
  };
}
