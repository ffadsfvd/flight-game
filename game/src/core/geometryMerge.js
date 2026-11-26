// Joins simple geometries into one, painting each part a flat vertex colour, so a tree, a house or
// an aircraft part made of several primitives is a single draw.
import * as THREE from 'three';

/** Merges [{ geometry, color }] into one non-indexed BufferGeometry with position, normal and color. */
export function mergeColoredParts(parts) {
  const positions = [];
  const normals = [];
  const colors = [];
  const color = new THREE.Color();
  for (const part of parts) {
    const g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    g.computeVertexNormals();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    color.set(part.color);
    for (let i = 0; i < pos.count; i += 1) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      colors.push(color.r, color.g, color.b);
    }
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  merged.computeBoundingSphere();
  return merged;
}
