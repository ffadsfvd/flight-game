// The archipelago's landmarks: the striped Faro Lumeno lighthouse with its turning beam, the lava
// glow in Mount Ignara's crater, the sea arch Arco Solare, the Velo Falls waterfall, the radio
// mast on Monte Aurio, the Lumeno wind farm and the Rocca Celeste castle ruins. Each one also
// gives a collider and, where it smokes or sprays, an emitter for the effects system.
import * as THREE from 'three';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { LANDMARKS } from './archipelagoMap.js';
import { createLightBatch } from './lightPoints.js';

function stripedTexture(colors, bands) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < bands; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(0, (i * 256) / bands, 16, 256 / bands + 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function waterfallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(200,230,240,0.55)';
  ctx.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * 64, Math.random() * 256, 1 + Math.random() * 3, 10 + Math.random() * 40);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildLighthouse(group, colliders, lights, x, z, ground) {
  const tower = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 30, 16), new THREE.MeshLambertMaterial({ map: stripedTexture(['#f6f2ea', '#c8321f'], 6) }));
  body.position.y = 15;
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.6, 16), new THREE.MeshLambertMaterial({ color: '#2e2e30' }));
  gallery.position.y = 30.3;
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 3, 12), new THREE.MeshLambertMaterial({ color: '#fff2b0', emissive: '#ffcc55', emissiveIntensity: 1.4 }));
  lantern.position.y = 32.1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 12), new THREE.MeshLambertMaterial({ color: '#b02a1a' }));
  cap.position.y = 34.9;
  const keeper = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 7), new THREE.MeshLambertMaterial({ color: '#f1e9da' }));
  keeper.position.set(6.5, 2.5, 0);
  tower.add(body, gallery, lantern, cap, keeper);
  tower.traverse((o) => {
    o.castShadow = true;
  });
  tower.position.set(x, ground - 0.5, z);
  group.add(tower);
  const beamGeometry = new THREE.ConeGeometry(14, 420, 16, 1, true);
  beamGeometry.translate(0, -210, 0);
  beamGeometry.rotateZ(Math.PI / 2);
  const beamMaterial = new THREE.MeshBasicMaterial({ color: '#fff0b8', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.set(x, ground + 32.1, z);
  group.add(beam);
  lights.add(x, ground + 32.1, z, new THREE.Color('#ffe08a'), 6);
  colliders.push({ kind: 'cylinder', x, z, radius: 4.5, top: ground + 36, name: 'the Faro Lumeno lighthouse' });
  return { beam, beamMaterial };
}

function buildArch(group, colliders, landmark) {
  const radius = 62;
  const tube = 15;
  const geometry = new THREE.TorusGeometry(radius, tube, 10, 36, Math.PI);
  const pos = geometry.getAttribute('position');
  for (let i = 0; i < pos.count; i += 1) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const n = Math.sin(vx * 0.21 + vz * 0.3) * Math.cos(vy * 0.17) * 3.2 + Math.sin(vy * 0.5 + vx * 0.07) * 1.6;
    pos.setXYZ(i, vx + n * 0.5, vy + n * 0.3, vz * 1.25 + n);
  }
  geometry.computeVertexNormals();
  const arch = new THREE.Mesh(mergeColoredParts([{ geometry, color: '#c99a6b' }]), new THREE.MeshLambertMaterial({ vertexColors: true }));
  const yaw = THREE.MathUtils.degToRad(landmark.heading);
  arch.position.set(landmark.x, -6, landmark.z);
  arch.rotation.y = -yaw;
  arch.castShadow = true;
  arch.receiveShadow = true;
  group.add(arch);
  for (const side of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(24, 0), new THREE.MeshLambertMaterial({ color: '#b98c60' }));
    const ax = Math.cos(yaw);
    const az = Math.sin(yaw);
    foot.position.set(landmark.x + ax * radius * side, -4, landmark.z + az * radius * side);
    foot.scale.set(1, 0.8, 1.1);
    foot.castShadow = true;
    group.add(foot);
  }
  colliders.push({ kind: 'arch', x: landmark.x, z: landmark.z, y: -6, radius, tube: tube * 1.1, yaw: -yaw, name: 'the Arco Solare sea arch' });
}

function buildVolcanoCrater(group, terrain, landmark) {
  const floor = terrain.heightAt(landmark.x, landmark.z);
  const lava = new THREE.Mesh(new THREE.CircleGeometry(70, 24), new THREE.MeshBasicMaterial({ color: '#ff5a14', fog: true }));
  lava.rotation.x = -Math.PI / 2;
  lava.position.set(landmark.x, floor + 3, landmark.z);
  group.add(lava);
  return { x: landmark.x, y: floor + 6, z: landmark.z };
}

function buildWaterfall(group, terrain, landmark) {
  const g = { x: 0, y: 1, z: 0 };
  terrain.normalAt(landmark.x, landmark.z, g);
  const len = Math.hypot(g.x, g.z) || 1;
  const dx = g.x / len;
  const dz = g.z / len;
  const top = new THREE.Vector3(landmark.x, terrain.heightAt(landmark.x, landmark.z) + 2, landmark.z);
  const bx = landmark.x + dx * 85;
  const bz = landmark.z + dz * 85;
  const bottom = new THREE.Vector3(bx, terrain.heightAt(bx, bz) + 1, bz);
  const texture = waterfallTexture();
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true });
  const width = 16;
  const geometry = new THREE.BufferGeometry();
  const px = -dz * width * 0.5;
  const pz = dx * width * 0.5;
  const v = [
    top.x - px, top.y, top.z - pz, top.x + px, top.y, top.z + pz, bottom.x + px, bottom.y, bottom.z + pz,
    top.x - px, top.y, top.z - pz, bottom.x + px, bottom.y, bottom.z + pz, bottom.x - px, bottom.y, bottom.z - pz,
  ];
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2));
  const fall = new THREE.Mesh(geometry, material);
  group.add(fall);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(18, 16), new THREE.MeshLambertMaterial({ color: '#3aa8b8', emissive: '#0d3a44' }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.copy(bottom).add(new THREE.Vector3(dx * 6, 0.4, dz * 6));
  group.add(pool);
  return { texture, mist: bottom.clone() };
}

/** A guyed radio mast in red and white bands with a blinking red light at the top. */
function buildRadioMast(group, colliders, lights, landmark, ground) {
  const height = landmark.height;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.4, height, 6), new THREE.MeshLambertMaterial({ map: stripedTexture(['#e8e6e1', '#c42d1f'], 9) }));
  mast.position.set(landmark.x, ground + height / 2, landmark.z);
  mast.castShadow = true;
  const hut = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 6), new THREE.MeshLambertMaterial({ color: '#d9d2c3' }));
  hut.position.set(landmark.x + 9, ground + 1.7, landmark.z + 4);
  group.add(mast, hut);
  const wire = new THREE.LineBasicMaterial({ color: '#59544e', transparent: true, opacity: 0.6 });
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2;
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(landmark.x, ground + height * 0.8, landmark.z), new THREE.Vector3(landmark.x + Math.cos(a) * 45, ground, landmark.z + Math.sin(a) * 45)]);
    group.add(new THREE.Line(geometry, wire));
  }
  lights.add(landmark.x, ground + height + 0.8, landmark.z, new THREE.Color('#ff3020'), 3.5);
  colliders.push({ kind: 'cylinder', x: landmark.x, z: landmark.z, radius: 2.5, top: ground + height + 1, name: 'the Monte Aurio radio mast' });
}

/** A row of three-bladed wind turbines on a ridge; the rotors turn with the wind. */
function buildWindFarm(group, colliders, terrain, landmark) {
  const rotors = [];
  const white = new THREE.MeshLambertMaterial({ color: '#f1f1ee' });
  const yaw = THREE.MathUtils.degToRad(landmark.heading);
  const blade = new THREE.BoxGeometry(1.6, 26, 0.5);
  blade.translate(0, 13, 0);
  for (let i = 0; i < landmark.count; i += 1) {
    const offset = (i - (landmark.count - 1) / 2) * landmark.spacing;
    const x = landmark.x + Math.sin(yaw) * offset;
    const z = landmark.z - Math.cos(yaw) * offset;
    const ground = Math.max(0, terrain.heightAt(x, z));
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2, 60, 10), white);
    tower.position.set(x, ground + 30, z);
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 7), white);
    nacelle.position.set(x, ground + 61, z);
    const rotor = new THREE.Group();
    rotor.position.set(x, ground + 61, z - 0.2);
    for (let b = 0; b < 3; b += 1) {
      const m = new THREE.Mesh(blade, white);
      m.rotation.z = (b / 3) * Math.PI * 2;
      rotor.add(m);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), white);
    rotor.add(hub);
    tower.castShadow = true;
    nacelle.castShadow = true;
    group.add(tower, nacelle, rotor);
    rotor.rotation.y = 0.9;
    nacelle.rotation.y = 0.9;
    rotors.push(rotor);
    colliders.push({ kind: 'cylinder', x, z, radius: 3, top: ground + 64, name: 'a Lumeno wind turbine' });
  }
  return rotors;
}

/** Castle ruins on a hilltop: a broken curtain wall, two round towers and a square keep. */
function buildCastle(group, colliders, landmark, ground) {
  const stone = '#b8a68a';
  const dark = '#9a8a72';
  const parts = [];
  const wall = (x, z, length, angle, height) => {
    const g = new THREE.BoxGeometry(length, height, 2.4);
    g.rotateY(angle);
    g.translate(x, height / 2 - 1, z);
    parts.push({ geometry: g, color: stone });
  };
  wall(0, -22, 38, 0, 9);
  wall(-20, 0, 30, Math.PI / 2, 7);
  wall(20, 4, 22, Math.PI / 2, 8);
  wall(-6, 22, 20, 0, 5);
  for (const [x, z, r, h] of [[-20, -22, 5, 16], [20, -22, 4.5, 13], [-20, 18, 4, 9]]) {
    const tower = new THREE.CylinderGeometry(r, r * 1.1, h, 12);
    tower.translate(x, h / 2 - 1, z);
    parts.push({ geometry: tower, color: dark });
  }
  const keep = new THREE.BoxGeometry(12, 20, 12);
  keep.translate(4, 9, -2);
  parts.push({ geometry: keep, color: stone });
  const mesh = new THREE.Mesh(mergeColoredParts(parts), new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.position.set(landmark.x, ground, landmark.z);
  mesh.rotation.y = 0.4;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  colliders.push({ kind: 'cylinder', x: landmark.x, z: landmark.z, radius: 30, top: ground + 20, name: 'the Rocca Celeste ruins' });
}

/** Builds every landmark; returns the group, colliders, smoke/mist emitters and an animator. */
export function buildLandmarks(terrain) {
  const group = new THREE.Group();
  group.name = 'landmarks';
  const colliders = [];
  const emitters = [];
  const lights = createLightBatch();
  let lighthouse = null;
  let waterfall = null;
  let rotors = [];
  for (const landmark of LANDMARKS) {
    const ground = Math.max(0, terrain.heightAt(landmark.x, landmark.z));
    landmark.y = ground;
    if (landmark.kind === 'lighthouse') {
      lighthouse = buildLighthouse(group, colliders, lights, landmark.x, landmark.z, ground);
      landmark.y = ground + 20;
    } else if (landmark.kind === 'mast') {
      buildRadioMast(group, colliders, lights, landmark, ground);
      landmark.y = ground + 60;
    } else if (landmark.kind === 'turbines') {
      rotors = buildWindFarm(group, colliders, terrain, landmark);
      landmark.y = ground + 50;
    } else if (landmark.kind === 'castle') {
      buildCastle(group, colliders, landmark, ground);
      landmark.y = ground + 12;
    } else if (landmark.kind === 'arch') {
      buildArch(group, colliders, landmark);
      landmark.y = 30;
    } else if (landmark.kind === 'volcano') {
      const crater = buildVolcanoCrater(group, terrain, landmark);
      emitters.push({ kind: 'volcano-smoke', ...crater });
      landmark.y = crater.y + 120;
    } else if (landmark.kind === 'waterfall') {
      waterfall = buildWaterfall(group, terrain, landmark);
      emitters.push({ kind: 'waterfall-mist', x: waterfall.mist.x, y: waterfall.mist.y, z: waterfall.mist.z });
      landmark.y = ground - 20;
    }
  }
  const lightPoints = lights.build();
  lightPoints.material.userData.fixed = 1.5;
  group.add(lightPoints);
  return {
    group,
    colliders,
    emitters,
    update(time, lightLevel) {
      if (lighthouse) {
        lighthouse.beam.rotation.y = time * 0.9;
        lighthouse.beamMaterial.opacity = 0.05 + 0.16 * lightLevel;
      }
      if (waterfall) waterfall.texture.offset.y = (time * 0.9) % 1;
      for (const [i, rotor] of rotors.entries()) rotor.children.forEach((blade, b) => {
        blade.rotation.z = time * 1.4 + i * 0.7 + (b / 3) * Math.PI * 2;
      });
    },
  };
}
