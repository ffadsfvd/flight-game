// The replay camera for crashes and landings: plays the flight recorder's last seconds back on
// the aircraft model, filmed from a spot beside the end of the flight like a crew at the runway
// edge, panning to follow. Loops until the pilot leaves the results screen.
import * as THREE from 'three';

/** Creates the replay player. */
export function createReplayCamera() {
  let frames = [];
  let time = 0;
  let duration = 0;
  const station = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
  return {
    get active() {
      return frames.length > 1;
    },
    /** Starts a replay of recorder frames; the camera stands to the side of the final position. */
    start(recorded, world) {
      frames = recorded.slice(-Math.min(recorded.length, 300));
      time = 0;
      duration = frames.length > 1 ? frames.at(-1).t - frames[0].t : 0;
      if (frames.length < 2) return;
      const end = frames.at(-1).p;
      const mid = frames[Math.floor(frames.length * 0.6)].p;
      const dir = end.clone().sub(mid).setY(0);
      if (dir.lengthSq() < 1) dir.set(1, 0, 0);
      dir.normalize();
      station.set(end.x - dir.z * 55 - dir.x * 25, 0, end.z + dir.x * 55 - dir.z * 25);
      station.y = Math.max(0, world.terrain.heightAt(station.x, station.z)) + 9;
      lookAt.copy(frames[0].p);
    },
    stop() {
      frames = [];
    },
    /** Advances the replay; writes the aircraft pose into `pose` and aims the camera. */
    update(camera, dt) {
      if (frames.length < 2) return null;
      time += dt;
      if (time > duration + 1.5) time = 0;
      const t = frames[0].t + Math.min(time, duration);
      let i = 0;
      while (i < frames.length - 2 && frames[i + 1].t < t) i += 1;
      const a = frames[i];
      const b = frames[i + 1];
      const f = THREE.MathUtils.clamp((t - a.t) / Math.max(1e-4, b.t - a.t), 0, 1);
      pose.position.copy(a.p).lerp(b.p, f);
      pose.quaternion.copy(a.q).slerp(b.q, f);
      const distance = station.distanceTo(pose.position);
      camera.fov = THREE.MathUtils.clamp(2 * THREE.MathUtils.radToDeg(Math.atan(14 / Math.max(1, distance))), 8, 55);
      camera.updateProjectionMatrix();
      camera.position.copy(station);
      lookAt.lerp(pose.position, 1 - Math.exp(-dt * 6));
      camera.up.set(0, 1, 0);
      camera.lookAt(lookAt);
      return pose;
    },
  };
}
