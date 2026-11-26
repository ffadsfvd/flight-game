// The river in Corvo Canyon: a ribbon of water down the canyon floor from the southern hills to
// the north coast, with pale gravel banks either side.
import * as THREE from 'three';
import { CANYONS } from './archipelagoMap.js';

function ribbon(points, terrain, halfWidth, lift, material) {
  const positions = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    const nx = (-(bz - az) / len) * halfWidth;
    const nz = ((bx - ax) / len) * halfWidth;
    const ha = terrain.heightAt(ax, az) + lift;
    const hb = terrain.heightAt(bx, bz) + lift;
    positions.push(ax - nx, ha, az - nz, ax + nx, ha, az + nz, bx + nx, hb, bz + nz);
    positions.push(ax - nx, ha, az - nz, bx + nx, hb, bz + nz, bx - nx, hb, bz - nz);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** Builds the canyon rivers; returns the group. */
export function buildRivers(terrain) {
  const group = new THREE.Group();
  group.name = 'rivers';
  const water = new THREE.MeshLambertMaterial({ color: '#3f9fb0', emissive: '#0f3a44', polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const gravel = new THREE.MeshLambertMaterial({ color: '#cbb995', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const canyon of CANYONS) {
    const points = [];
    for (let i = 0; i < canyon.points.length - 1; i += 1) {
      const [ax, az] = canyon.points[i];
      const [bx, bz] = canyon.points[i + 1];
      const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 20);
      for (let s = 0; s < steps; s += 1) {
        const t = s / steps;
        const wiggle = Math.sin((i + t) * 5.3) * 14;
        const len = Math.hypot(bx - ax, bz - az);
        points.push([ax + (bx - ax) * t + (-(bz - az) / len) * wiggle, az + (bz - az) * t + ((bx - ax) / len) * wiggle]);
      }
    }
    points.push(canyon.points.at(-1).slice(0, 2));
    group.add(ribbon(points, terrain, 22, 0.25, gravel));
    group.add(ribbon(points, terrain, 11, 0.45, water));
  }
  return group;
}
