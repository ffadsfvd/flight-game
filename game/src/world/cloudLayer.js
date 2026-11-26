// Fair-weather cumulus over the islands: clusters of soft billboard puffs painted on a canvas,
// warm on the sun side at golden hour, greyer in a storm.
import * as THREE from 'three';
import { createSeededRandom } from '../core/seededRandom.js';

/** Paints one soft cloud puff texture (several overlapping radial blobs). */
function createPuffTexture(seed) {
  const random = createSeededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 22; i += 1) {
    const angle = random() * Math.PI * 2;
    const dist = Math.sqrt(random()) * 70;
    const x = 128 + Math.cos(angle) * dist;
    const y = 138 + Math.sin(angle) * dist * 0.55;
    const r = 34 + random() * 46;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const shade = 225 + Math.floor((y < 128 ? 30 : 0) * random());
    g.addColorStop(0, `rgba(${shade},${shade},${shade},0.55)`);
    g.addColorStop(0.6, `rgba(${shade},${shade},${shade},0.22)`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Creates the cloud field; setLighting() tints it for the hour. */
export function createCloudLayer(seed = 11) {
  const random = createSeededRandom(seed);
  const group = new THREE.Group();
  group.name = 'clouds';
  const textures = [createPuffTexture(1), createPuffTexture(2), createPuffTexture(3)];
  const materials = [];
  for (let c = 0; c < 64; c += 1) {
    const cx = (random() - 0.5) * 18000;
    const cz = (random() - 0.5) * 18000;
    const base = 1250 + random() * 900;
    const puffs = 3 + Math.floor(random() * 5);
    const warmth = random();
    for (let p = 0; p < puffs; p += 1) {
      const material = new THREE.SpriteMaterial({ map: textures[(c + p) % 3], transparent: true, depthWrite: false, fog: true, opacity: 0.92 });
      material.userData.warmth = warmth;
      material.userData.lift = p / puffs;
      materials.push(material);
      const sprite = new THREE.Sprite(material);
      const size = 260 + random() * 380;
      sprite.scale.set(size * 1.6, size, 1);
      sprite.position.set(cx + (random() - 0.5) * 700, base + random() * 160 + p * 30, cz + (random() - 0.5) * 500);
      group.add(sprite);
    }
  }
  return {
    group,
    setLighting(light) {
      const lit = light.sunColor.clone().lerp(new THREE.Color('#ffffff'), 0.45);
      const shade = light.hemiSky.clone().lerp(light.fogColor, 0.5);
      for (const material of materials) {
        const mix = 0.35 + material.userData.warmth * 0.45 + material.userData.lift * 0.2;
        material.color.copy(shade).lerp(lit, mix * (1 - light.storm * 0.7));
        material.opacity = light.storm ? 0.97 : 0.9;
      }
      group.visible = light.night < 0.9;
    },
  };
}
