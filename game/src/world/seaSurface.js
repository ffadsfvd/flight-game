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

// Smooth value noise for the slow, large-scale variation that keeps the wave sum from tiling.
float seaHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float seaNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(seaHash(i), seaHash(i + vec2(1.0, 0.0)), u.x), mix(seaHash(i + vec2(0.0, 1.0)), seaHash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Slope of one drifting octave of value-noise chop (rotated so the noise grid never lines up):
// short-crested water with no repeat, unlike a sum of a few plane waves.
vec2 chopSlope(vec2 p, float t, float wavelength, float amplitude, float angle, vec2 drift) {
  float c = cos(angle);
  float s = sin(angle);
  float scale = 1.0 / wavelength;
  vec2 rp = vec2(c * p.x - s * p.y, s * p.x + c * p.y) * scale + drift * t * scale;
  vec2 i = floor(rp);
  vec2 f = fract(rp);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = seaHash(i);
  float b = seaHash(i + vec2(1.0, 0.0));
  float cc = seaHash(i + vec2(0.0, 1.0));
  float d = seaHash(i + vec2(1.0, 1.0));
  vec2 dn = du * vec2(b - a + (a - b - cc + d) * u.y, cc - a + (a - b - cc + d) * u.x) * scale * amplitude;
  return vec2(c * dn.x + s * dn.y, -s * dn.x + c * dn.y);
}

vec3 seaNormal(vec2 p, float t, float dist) {
  float px = max(0.05, length(fwidth(p)));
  float storm = 1.0 + uStorm * 1.8;
  // Bend the wave fronts and vary the roughness in patches a few hundred metres across, so the
  // sea reads as wind-driven water rather than a repeating pattern from altitude.
  vec2 warp = vec2(seaNoise(p * 0.0042), seaNoise(p * 0.0042 + 17.3)) * 2.0 - 1.0;
  vec2 q = p + warp * 21.0;
  float swell = 0.5 + 1.0 * seaNoise(p * 0.0021 + 5.1);
  float chop = 0.45 + 1.1 * seaNoise(p * 0.0057 - 3.7);
  vec2 g = vec2(0.0);
  // Long swell as bent plane waves, then four octaves of drifting chop on top.
  g += waveSlope(q, t, normalize(vec2(1.0, 0.35)), 46.0, 0.24 * storm * swell) * clamp(1.0 - px * 2.5 / 46.0, 0.0, 1.0);
  g += waveSlope(q, t, normalize(vec2(0.62, 0.9)), 31.0, 0.14 * storm * swell) * clamp(1.0 - px * 2.5 / 31.0, 0.0, 1.0);
  g += chopSlope(p, t, 17.0, 0.62 * storm * chop, 0.4, vec2(3.1, 1.6)) * clamp(1.0 - px * 2.5 / 17.0, 0.0, 1.0);
  g += chopSlope(p, t, 7.5, 0.3 * storm * chop, 1.3, vec2(-1.2, 2.4)) * clamp(1.0 - px * 2.5 / 7.5, 0.0, 1.0);
  g += chopSlope(p, t, 3.3, 0.13 * storm * swell, 2.2, vec2(1.9, -0.8)) * clamp(1.0 - px * 2.5 / 3.3, 0.0, 1.0);
  g += chopSlope(p, t, 1.5, 0.055 * storm, 2.9, vec2(-0.9, -1.4)) * clamp(1.0 - px * 2.5 / 1.5, 0.0, 1.0);
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

/**
 * The sea's flat grid, centred on the camera: 40 m cells out to 400 m, then each ring of cells 22%
 * longer, out past 45 km. The sea used to be one 90 km quad, and the GPU sets up a triangle's depth
 * and world position from its corners in 32-bit floats, so with corners 45 km away the sea's depth
 * came out decimetres to metres off near the camera, nearer or farther as the view moved: the
 * waterline jumped, the water painted over the beach and, flying low, up over the wing. With small
 * triangles round the camera the error is gone.
 */
function createSeaGrid() {
  const offsets = [0];
  let cell = 40;
  while (offsets[offsets.length - 1] < 46000) {
    offsets.push(offsets[offsets.length - 1] + cell);
    if (offsets[offsets.length - 1] >= 400) cell *= 1.22;
  }
  const lines = [...offsets.slice(1).reverse().map((v) => -v), ...offsets];
  const n = lines.length;
  const positions = new Float32Array(n * n * 3);
  for (let iz = 0; iz < n; iz += 1) {
    for (let ix = 0; ix < n; ix += 1) {
      const i = (iz * n + ix) * 3;
      positions[i] = lines[ix];
      positions[i + 2] = lines[iz];
    }
  }
  const index = [];
  for (let iz = 0; iz < n - 1; iz += 1) {
    for (let ix = 0; ix < n - 1; ix += 1) {
      const a = iz * n + ix;
      index.push(a, a + n, a + 1, a + 1, a + n, a + n + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Creates the sea mesh; call update(time, camera) each frame and setLighting() when the hour changes. */
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
  const mesh = new THREE.Mesh(createSeaGrid(), material);
  mesh.name = 'sea';
  mesh.receiveShadow = false;

  return {
    mesh,
    /** Animates the waves and keeps the grid's fine centre under the camera (the sea stays flat, so moving it changes nothing but precision). */
    update(time, camera) {
      uniforms.uTime.value = time;
      if (camera) mesh.position.set(camera.position.x, 0, camera.position.z);
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
