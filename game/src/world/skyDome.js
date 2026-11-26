// The sky: a dome that follows the camera, shading from a warm horizon to a deep zenith, with the
// low sun's disc and glow. Its colours come from the time-of-day preset.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.99999;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uHaze;
uniform float uSunSize;
uniform float uNight;
uniform float uWarm;
varying vec3 vDir;
#include <common>
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 dir = normalize(vDir);
  float y = dir.y;
  vec3 cream = mix(uHorizon, vec3(1.0, 0.93, 0.8), 0.55 * uWarm);
  vec3 col = mix(uHorizon, cream, smoothstep(-0.02, 0.1, y));
  col = mix(col, uZenith, smoothstep(0.06, 0.55, y));
  col = mix(col, uHaze, smoothstep(0.02, -0.12, y));
  float sd = max(dot(dir, uSunDir), 0.0);
  float horizonBand = exp(-abs(y) * 9.0);
  col += uSunColor * (pow(sd, 5.0) * 0.32 + pow(sd, 48.0) * 0.55) * (0.6 + horizonBand);
  col += uSunColor * smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, sd) * 7.0;
  if (uNight > 0.0) {
    vec3 cell = floor(dir * 220.0);
    float star = step(0.9965, hash(cell)) * smoothstep(0.05, 0.3, y);
    col += vec3(star) * uNight * 1.4;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Creates the sky dome mesh; follow(camera) keeps it centred, setLighting() recolours it. */
export function createSkyDome() {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color('#ffb070') },
    uZenith: { value: new THREE.Color('#3f6fb3') },
    uHorizon: { value: new THREE.Color('#ffc58f') },
    uHaze: { value: new THREE.Color('#e9b98f') },
    uSunSize: { value: 0.00022 },
    uNight: { value: 0 },
    uWarm: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, side: THREE.BackSide, depthWrite: false, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = 'sky';
  mesh.userData.farRangeOnly = true;
  return {
    mesh,
    follow(camera) {
      mesh.position.copy(camera.position);
    },
    setLighting(light) {
      uniforms.uSunDir.value.copy(light.sunDirection);
      uniforms.uSunColor.value.copy(light.sunColor).multiplyScalar(light.skySunGlow);
      uniforms.uZenith.value.copy(light.skyZenith);
      uniforms.uHorizon.value.copy(light.skyHorizon);
      uniforms.uHaze.value.copy(light.fogColor);
      uniforms.uNight.value = light.night;
      uniforms.uWarm.value = (1 - light.night) * (1 - light.storm * 0.9) * (light.name === 'midday' ? 0.3 : 1);
    },
  };
}
