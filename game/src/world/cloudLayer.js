// Fair-weather cumulus over the islands: clusters of soft billboard puffs painted on a canvas with
// sunlit tops and shaded bases, warm on the sun side at golden hour, greyer in a storm.
import * as THREE from 'three';
import { createSeededRandom } from '../core/seededRandom.js';

/** Paints one cloud puff texture: overlapping blobs lit from above, flat shaded base. */
function createPuffTexture(seed) {
  const random = createSeededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const blobs = [];
  for (let i = 0; i < 26; i += 1) {
    const angle = random() * Math.PI * 2;
    const dist = Math.sqrt(random()) * 72;
    const x = 128 + Math.cos(angle) * dist;
    const y = 150 + Math.sin(angle) * dist * 0.45 - (1 - Math.abs(Math.cos(angle))) * 24 * random();
    blobs.push({ x, y: Math.min(y, 175), r: 26 + random() * 40 });
  }
  blobs.sort((a, b) => b.y - a.y);
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x - b.r * 0.2, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.55, 'rgba(236,236,240,0.75)');
    g.addColorStop(0.85, 'rgba(196,198,210,0.35)');
    g.addColorStop(1, 'rgba(190,192,205,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Flatten and shade the base.
  const base = ctx.createLinearGradient(0, 150, 0, 200);
  base.addColorStop(0, 'rgba(150,152,170,0)');
  base.addColorStop(1, 'rgba(150,152,170,0.5)');
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = base;
  ctx.fillRect(0, 150, 256, 60);
  ctx.globalCompositeOperation = 'destination-out';
  const cut = ctx.createLinearGradient(0, 180, 0, 206);
  cut.addColorStop(0, 'rgba(0,0,0,0)');
  cut.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = cut;
  ctx.fillRect(0, 180, 256, 76);
  ctx.globalCompositeOperation = 'source-over';
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Creates the cloud field; setLighting() tints it for the hour. */
export function createCloudLayer(seed = 11) {
  const random = createSeededRandom(seed);
  const group = new THREE.Group();
  group.name = 'clouds';
  const textures = [createPuffTexture(1), createPuffTexture(2), createPuffTexture(3), createPuffTexture(4)];
  const materials = [];
  for (let c = 0; c < 70; c += 1) {
    const cx = (random() - 0.5) * 19000;
    const cz = (random() - 0.5) * 19000;
    const base = 1300 + random() * 900;
    const puffs = 3 + Math.floor(random() * 5);
    const warmth = random();
    for (let p = 0; p < puffs; p += 1) {
      const material = new THREE.SpriteMaterial({ map: textures[(c + p) % textures.length], transparent: true, depthWrite: false, fog: true, opacity: 0.95 });
      material.userData.warmth = warmth;
      material.userData.lift = p / puffs;
      materials.push(material);
      const sprite = new THREE.Sprite(material);
      const size = 300 + random() * 420;
      sprite.scale.set(size * 1.7, size, 1);
      sprite.position.set(cx + (random() - 0.5) * 800, base + random() * 120 + p * 36, cz + (random() - 0.5) * 560);
      group.add(sprite);
    }
  }
  return {
    group,
    setLighting(light) {
      const lit = light.sunColor.clone().lerp(new THREE.Color('#ffffff'), 0.5);
      const shade = light.hemiSky.clone().lerp(light.fogColor, 0.45);
      for (const material of materials) {
        const mix = 0.45 + material.userData.warmth * 0.35 + material.userData.lift * 0.2;
        material.color.copy(shade).lerp(lit, mix * (1 - light.storm * 0.7));
        if (light.storm) material.color.multiplyScalar(0.55);
        material.opacity = light.storm ? 0.98 : 0.95;
      }
      group.visible = light.night < 0.9;
    },
  };
}
