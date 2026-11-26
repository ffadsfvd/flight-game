// The advertising banner towed on banner missions: a tow line from the tail and a long cloth
// banner with painted letters trailing behind the aircraft, rippling as it flies.
import * as THREE from 'three';

const LENGTH = 26;
const HEIGHT = 4.2;

function bannerTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e8641e';
  ctx.fillRect(0, 0, canvas.width, 12);
  ctx.fillRect(0, canvas.height - 12, canvas.width, 12);
  ctx.fillStyle = '#c8321f';
  ctx.font = '800 92px Bahnschrift, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4, canvas.width - 40);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Creates the banner rig for `text`; attach it to the aircraft root and call update(time). */
export function createTowBanner(text) {
  const group = new THREE.Group();
  group.name = 'tow-banner';
  const tail = new THREE.Vector3(0, 0.3, 4.8);
  const start = new THREE.Vector3(0, -2.5, tail.z + 22);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([tail, start]), new THREE.LineBasicMaterial({ color: '#3a3a3a' }));
  const geometry = new THREE.PlaneGeometry(LENGTH, HEIGHT, 24, 1);
  geometry.rotateY(Math.PI / 2);
  geometry.translate(0, 0, LENGTH / 2);
  const rest = geometry.getAttribute('position').array.slice();
  const banner = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: bannerTexture(text), side: THREE.DoubleSide }));
  banner.position.copy(start);
  banner.castShadow = true;
  group.add(line, banner);
  return {
    group,
    update(time) {
      const pos = geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i += 1) {
        const z = rest[i * 3 + 2];
        pos.setX(i, rest[i * 3] + Math.sin(time * 7 - z * 0.45) * 0.35 * (z / LENGTH));
      }
      pos.needsUpdate = true;
    },
    dispose() {
      group.removeFromParent();
      geometry.dispose();
      banner.material.map.dispose();
      banner.material.dispose();
    },
  };
}
