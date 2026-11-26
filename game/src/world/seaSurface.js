// The sea: one large plane with a shader that rolls swell and ripples across it, glitters in the
// low sun, turns turquoise over the shallows (read from the terrain's height texture) and breaks
// into foam along the beaches.
import * as THREE from 'three';

const VERTEX = /* glsl */ `
varying vec3 vWorld;
#include <fog_pars_vertex>
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uStorm;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform sampler2D uHeightTex;
uniform float uWorldHalf;
uniform float uGridStep;
uniform float uGridN;
varying vec3 vWorld;
#include <common>
#include <fog_pars_fragment>

vec2 waveSlope(vec2 p, float t, vec2 d, float wavelength, float amplitude) {
  float k = 6.2831853 / wavelength;
  float phase = dot(d, p) * k + t * sqrt(9.81 * k);
  return d * (amplitude * k * cos(phase));
}

vec3 seaNormal(vec2 p, float t, float dist) {
  float px = max(0.05, length(fwidth(p)));
  float storm = 1.0 + uStorm * 1.8;
  vec2 g = vec2(0.0);
  g += waveSlope(p, t, normalize(vec2(1.0, 0.35)), 46.0, 0.24 * storm) * clamp(1.0 - px * 2.5 / 46.0, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(0.62, 0.9)), 31.0, 0.16 * storm) * clamp(1.0 - px * 2.5 / 31.0, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(-0.45, 1.0)), 23.0, 0.15 * storm) * clamp(1.0 - px * 2.5 / 23.0, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(0.96, -0.3)), 14.0, 0.08 * storm) * clamp(1.0 - px * 2.5 / 14.0, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(0.7, -0.75)), 9.5, 0.06 * storm) * clamp(1.0 - px * 2.5 / 9.5, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(-0.95, -0.25)), 4.1, 0.03 * storm) * clamp(1.0 - px * 2.5 / 4.1, 0.0, 1.0);
  g += waveSlope(p, t, normalize(vec2(0.15, 0.98)), 1.9, 0.012 * storm) * clamp(1.0 - px * 2.5 / 1.9, 0.0, 1.0);
  return normalize(vec3(-g.x, 1.0, -g.y));
}

void main() {
  vec2 p = vWorld.xz;
  float dist = length(cameraPosition - vWorld);
  vec3 n = seaNormal(p, uTime, dist);
  vec3 viewDir = normalize(cameraPosition - vWorld);
  // Texel centres sit on the terrain's grid vertices; red holds -64..64 m, green -8..8 m finely.
  vec2 uv = ((p + uWorldHalf) / uGridStep + 0.5) / uGridN;
  float ground = -60.0;
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    vec4 heights = texture2D(uHeightTex, uv);
    float coarse = heights.r * 128.0 - 64.0;
    ground = abs(coarse) < 7.0 ? heights.g * 16.0 - 8.0 : coarse;
  }
  float depth = max(0.0, -ground);
  vec3 water = mix(uShallow, uDeep, smoothstep(0.6, 26.0, depth));
  // The sand shows through the first metre or two of water.
  water = mix(water, mix(uShallow, vec3(0.78, 0.74, 0.55), 0.55), smoothstep(2.2, 0.2, depth) * 0.5);
  water = mix(water, uDeep * 0.6, uStorm * 0.5);
  float facing = max(dot(n, viewDir), 0.0);
  float fresnel = 0.03 + 0.97 * pow(1.0 - facing, 5.0);
  vec3 r = reflect(-viewDir, n);
  vec3 sky = mix(uHorizon, uSky, clamp(r.y * 1.6, 0.0, 1.0));
  vec3 col = mix(water, sky, clamp(fresnel * 0.9 + 0.06, 0.0, 1.0));
  vec3 halfway = normalize(uSunDir + viewDir);
  float glitter = pow(max(dot(n, halfway), 0.0), 320.0) * 4.0 + pow(max(dot(n, halfway), 0.0), 40.0) * 0.18;
  col += uSunColor * glitter * (1.0 - uStorm * 0.8);
  // Foam: a steady white wash where the sea meets the sand (seen from any height) and rolling
  // surf lines over the shallows close up.
  float ripple = sin(p.x * 0.33 + uTime * 1.4) * sin(p.y * 0.29 - uTime * 1.15) * 0.5 + 0.5;
  float lap = 0.5 + 0.5 * sin(depth * 2.6 - uTime * 1.6 + ripple * 1.5);
  float waterline = smoothstep(0.8, 0.05, depth) * (0.62 + 0.3 * ripple);
  float surf = smoothstep(2.6, 0.5, depth) * smoothstep(0.62, 1.0, lap) * 0.55 * (1.0 - smoothstep(900.0, 3500.0, dist));
  float foamLight = clamp(dot(uSky, vec3(0.3, 0.5, 0.2)) * 5.0, 0.2, 1.0);
  col = mix(col, vec3(0.93, 0.95, 0.94) * foamLight, max(waterline, surf) * step(ground, 1.5));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** Packs the terrain heights into a texture the sea shader can read: red spans -64..64 m for
 * the water colour by depth, green -8..8 m in 6 cm steps for the shoreline foam. */
function createHeightTexture(terrain) {
  const { n, heights } = terrain;
  const data = new Uint8Array(n * n * 4);
  const pack = (h, low, span) => Math.max(0, Math.min(255, Math.round(((h - low) / span) * 255)));
  for (let i = 0; i < n * n; i += 1) {
    data[i * 4] = pack(heights[i], -64, 128);
    data[i * 4 + 1] = pack(heights[i], -8, 16);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/** Creates the sea mesh; call update(time) each frame and setLighting() when the hour changes. */
export function createSeaSurface(terrain) {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uStorm: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color('#ffd0a0') },
      uDeep: { value: new THREE.Color('#0e4a6e') },
      uShallow: { value: new THREE.Color('#38c9c0') },
      uSky: { value: new THREE.Color('#5a86c4') },
      uHorizon: { value: new THREE.Color('#ffd2a6') },
      uHeightTex: { value: null },
      uWorldHalf: { value: terrain.half },
      uGridStep: { value: terrain.step },
      uGridN: { value: terrain.n },
    },
  ]);
  uniforms.uHeightTex.value = createHeightTexture(terrain);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, fog: true });
  const geometry = new THREE.PlaneGeometry(90000, 90000, 1, 1);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'sea';
  mesh.receiveShadow = false;

  return {
    mesh,
    update(time) {
      uniforms.uTime.value = time;
    },
    setLighting(light) {
      uniforms.uSunDir.value.copy(light.sunDirection);
      uniforms.uSunColor.value.copy(light.sunColor).multiplyScalar(light.sunIntensity * 0.45);
      uniforms.uDeep.value.copy(light.seaDeep);
      uniforms.uShallow.value.copy(light.seaShallow);
      uniforms.uSky.value.copy(light.skyZenith);
      uniforms.uHorizon.value.copy(light.skyHorizon);
      uniforms.uStorm.value = light.storm;
    },
  };
}
