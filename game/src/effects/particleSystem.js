// A pooled particle system drawn as soft points: used for smoke plumes, fire, water spray and
// drops, dust, exhaust, smoke trails, rain and the crash explosion. Each particle has a life, a
// velocity with drag and buoyancy, and grows and fades over its life.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
attribute float size;
attribute float alpha;
attribute vec3 tint;
uniform float uScale;
varying float vAlpha;
varying vec3 vTint;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(size * uScale / max(-mvPosition.z, 1.0), 1.0, 380.0);
  vAlpha = alpha;
  vTint = tint;
  #include <fog_vertex>
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
varying float vAlpha;
varying vec3 vTint;
#include <fog_pars_fragment>
void main() {
  vec4 tex = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vTint * tex.rgb, tex.a * vAlpha);
  #include <fog_fragment>
}
`;

function puffTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

const sharedTexture = { value: null };

/** Creates a particle pool of `max` particles; `additive` for fire and sparks. */
export function createParticleSystem(scene, { max = 2000, additive = false, name = 'particles' } = {}) {
  if (!sharedTexture.value) sharedTexture.value = puffTexture();
  const positions = new Float32Array(max * 3);
  const sizes = new Float32Array(max);
  const alphas = new Float32Array(max);
  const tints = new Float32Array(max * 3);
  const velocity = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const age = new Float32Array(max);
  const grow = new Float32Array(max);
  const startSize = new Float32Array(max);
  const startAlpha = new Float32Array(max);
  const drag = new Float32Array(max);
  const lift = new Float32Array(max);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('tint', new THREE.BufferAttribute(tints, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uScale: { value: 600 }, uMap: { value: null } }]),
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    fog: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  material.uniforms.uMap.value = sharedTexture.value;
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.name = name;
  points.renderOrder = additive ? 6 : 5;
  scene.add(points);
  let cursor = 0;
  let alive = 0;
  for (let i = 0; i < max; i += 1) life[i] = 0;

  return {
    points,
    get alive() {
      return alive;
    },
    /** Emits one particle. */
    emit(x, y, z, vx, vy, vz, { life: l = 2, size = 4, grow: g = 2, alpha = 0.8, color = [1, 1, 1], drag: dr = 0.5, lift: li = 0 } = {}) {
      const i = cursor;
      cursor = (cursor + 1) % max;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocity[i * 3] = vx;
      velocity[i * 3 + 1] = vy;
      velocity[i * 3 + 2] = vz;
      life[i] = l;
      age[i] = 0;
      startSize[i] = size;
      grow[i] = g;
      startAlpha[i] = alpha;
      drag[i] = dr;
      lift[i] = li;
      tints[i * 3] = color[0];
      tints[i * 3 + 1] = color[1];
      tints[i * 3 + 2] = color[2];
    },
    /** Advances all particles; `wind` drifts them. */
    update(dt, viewScale, wind) {
      material.uniforms.uScale.value = viewScale;
      alive = 0;
      for (let i = 0; i < max; i += 1) {
        if (life[i] <= 0) {
          alphas[i] = 0;
          sizes[i] = 0;
          continue;
        }
        age[i] += dt;
        const t = age[i] / life[i];
        if (t >= 1) {
          life[i] = 0;
          alphas[i] = 0;
          sizes[i] = 0;
          continue;
        }
        alive += 1;
        const k = Math.exp(-drag[i] * dt);
        velocity[i * 3] = (velocity[i * 3] - wind.x) * k + wind.x;
        velocity[i * 3 + 1] = velocity[i * 3 + 1] * k + lift[i] * dt;
        velocity[i * 3 + 2] = (velocity[i * 3 + 2] - wind.z) * k + wind.z;
        positions[i * 3] += velocity[i * 3] * dt;
        positions[i * 3 + 1] += velocity[i * 3 + 1] * dt;
        positions[i * 3 + 2] += velocity[i * 3 + 2] * dt;
        sizes[i] = startSize[i] + grow[i] * age[i];
        alphas[i] = startAlpha[i] * (t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9);
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      geometry.attributes.tint.needsUpdate = true;
    },
    clear() {
      for (let i = 0; i < max; i += 1) life[i] = 0;
    },
  };
}
