// Plants the islands' woods: umbrella pines and round oaks where the vegetation map says forest,
// and palms along the warm beaches. Each kind is one instanced mesh.
import * as THREE from 'three';
import { mergeColoredParts } from '../core/geometryMerge.js';
import { hash2 } from '../core/seededRandom.js';
import { forestDensity } from './vegetationMap.js';

function pineGeometry() {
  const trunk = new THREE.CylinderGeometry(0.35, 0.5, 5, 5);
  trunk.translate(0, 2.5, 0);
  const crown = new THREE.ConeGeometry(3.2, 8.5, 7);
  crown.translate(0, 8.5, 0);
  const top = new THREE.ConeGeometry(2.1, 4.5, 7);
  top.translate(0, 12.2, 0);
  return mergeColoredParts([
    { geometry: trunk, color: '#5b4330' },
    { geometry: crown, color: '#3f6a2e' },
    { geometry: top, color: '#4b7a33' },
  ]);
}

function oakGeometry() {
  const trunk = new THREE.CylinderGeometry(0.4, 0.6, 4, 5);
  trunk.translate(0, 2, 0);
  const crown = new THREE.IcosahedronGeometry(4.2, 0);
  crown.scale(1, 0.8, 1);
  crown.translate(0, 7, 0);
  return mergeColoredParts([
    { geometry: trunk, color: '#5e4632' },
    { geometry: crown, color: '#5b8a3a' },
  ]);
}

function palmGeometry() {
  const parts = [];
  for (let i = 0; i < 4; i += 1) {
    const seg = new THREE.CylinderGeometry(0.28, 0.36, 2.6, 5);
    seg.translate(i * 0.35, 1.3 + i * 2.5, 0);
    parts.push({ geometry: seg, color: '#8b6a45' });
  }
  for (let f = 0; f < 7; f += 1) {
    const frond = new THREE.ConeGeometry(0.9, 5.5, 4);
    frond.rotateZ(Math.PI / 2 + 0.45);
    frond.translate(2.4, 0, 0);
    frond.rotateY((f / 7) * Math.PI * 2);
    frond.translate(1.4, 10.4, 0);
    parts.push({ geometry: frond, color: '#4f8a35' });
  }
  return mergeColoredParts(parts);
}

/** Plants trees over the terrain; returns the group and a list used for tree-strike checks. */
export function plantForests(terrain, { maxTrees = 11000, maxPalms = 900 } = {}) {
  const group = new THREE.Group();
  group.name = 'forests';
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const pines = [];
  const oaks = [];
  const palms = [];
  const spacing = 30;
  const half = terrain.half - 200;
  for (let z = -half; z < half; z += spacing) {
    for (let x = -half; x < half; x += spacing) {
      const ix = Math.round(x / spacing);
      const iz = Math.round(z / spacing);
      const r = hash2(ix, iz, 3);
      const px = x + (hash2(ix, iz, 5) - 0.5) * spacing * 0.9;
      const pz = z + (hash2(ix, iz, 7) - 0.5) * spacing * 0.9;
      const h = terrain.heightAt(px, pz);
      if (h < 1.5) continue;
      if (h < 11 && palms.length < maxPalms) {
        if (r < 0.1 && terrain.normalAt(px, pz, { x: 0, y: 0, z: 0 }).y > 0.93) palms.push([px, h, pz, r]);
        continue;
      }
      const density = forestDensity(terrain, px, pz, h);
      if (density <= 0 || r > density * 0.95) continue;
      if (pines.length + oaks.length >= maxTrees) continue;
      (hash2(ix, iz, 11) < 0.55 + (h > 200 ? 0.3 : 0) ? pines : oaks).push([px, h, pz, r]);
    }
  }
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  function build(list, geometry, tintRange) {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach(([x, y, z, r], i) => {
      const scale = 0.75 + r * 0.6 + hash2(Math.round(x), Math.round(z), 13) * 0.4;
      q.setFromAxisAngle(up, r * 40);
      s.set(scale, scale * (0.9 + r * 0.3), scale);
      p.set(x, y - 0.4, z);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      tint.setRGB(1, 1, 1).offsetHSL((r - 0.5) * tintRange, 0, (hash2(Math.round(z), Math.round(x), 17) - 0.5) * 0.12);
      mesh.setColorAt(i, tint);
    });
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  build(pines, pineGeometry(), 0.04);
  build(oaks, oakGeometry(), 0.07);
  build(palms, palmGeometry(), 0.05);
  return { group, counts: { pines: pines.length, oaks: oaks.length, palms: palms.length } };
}
