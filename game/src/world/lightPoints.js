// Glowing point lights (runway edges, approach bars, PAPI, beacons, town windows): one shader that
// keeps a light a few pixels wide however far away it is and fades it into the fog.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
attribute vec3 color;
attribute float size;
uniform float uScale;
uniform float uFogDensity;
varying vec3 vColor;
varying float vFade;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  gl_PointSize = clamp(size * uScale / max(dist, 1.0), 2.2, 64.0);
  float f = uFogDensity * dist;
  vFade = exp(-f * f * 0.6);
  vColor = color;
}
`;

const FRAGMENT = /* glsl */ `
uniform float uIntensity;
varying vec3 vColor;
varying float vFade;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float core = smoothstep(0.45, 0.0, d);
  float glow = pow(1.0 - d, 2.2);
  gl_FragColor = vec4(vColor * (core * 1.6 + glow * 0.9) * uIntensity * vFade, 1.0);
}
`;

const materials = new Set();

/** Builds a Points object from parallel arrays of positions (xyz), colours (rgb 0..1) and sizes (m). */
export function createLightPoints(positions, colors, sizes) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 600 }, uIntensity: { value: 1 }, uFogDensity: { value: 0.00006 } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materials.add(material);
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/** Updates every light material for the screen height, field of view, fog and light level. */
export function updateLightPoints(viewHeight, fovDegrees, fogDensity, intensity) {
  const scale = viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2));
  for (const material of materials) {
    material.uniforms.uScale.value = scale;
    material.uniforms.uFogDensity.value = fogDensity;
    material.uniforms.uIntensity.value = material.userData.fixed ?? intensity;
  }
}

/** A small helper that collects lights before building them. */
export function createLightBatch() {
  const positions = [];
  const colors = [];
  const sizes = [];
  return {
    add(x, y, z, color, size) {
      positions.push(x, y, z);
      colors.push(color.r, color.g, color.b);
      sizes.push(size);
    },
    get count() {
      return sizes.length;
    },
    build() {
      return createLightPoints(positions, colors, sizes);
    },
  };
}
