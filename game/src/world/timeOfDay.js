// Times of day and weather as lighting presets: golden hour (the default), midday, dusk, night,
// storm and a grey cold front. One preset drives the sun, the sky, the sea, the fog and the
// exposure together, so terrain and sky always share one light.
import * as THREE from 'three';

const PRESETS = {
  golden: {
    label: 'Golden hour', clock: '18:42', sunAzimuth: 236, sunElevation: 13.5, sunColor: '#ffae68', sunIntensity: 3.8,
    hemiSky: '#a9c3e6', hemiGround: '#7d6142', hemiIntensity: 1.05, fogColor: '#e9b48c', fogDensity: 0.00006,
    skyZenith: '#3d6db4', skyHorizon: '#ffc48c', skySunGlow: 1.0, seaDeep: '#0f4a70', seaShallow: '#3cc6bd',
    exposure: 1.0, night: 0, storm: 0, lightsOn: 0.6,
  },
  midday: {
    label: 'Midday', clock: '12:30', sunAzimuth: 170, sunElevation: 62, sunColor: '#fff4e0', sunIntensity: 3.0,
    hemiSky: '#bcd6f5', hemiGround: '#8a7a5c', hemiIntensity: 1.2, fogColor: '#c6daef', fogDensity: 0.000055,
    skyZenith: '#2f6ac4', skyHorizon: '#cfe3f7', skySunGlow: 0.6, seaDeep: '#0b4f7d', seaShallow: '#41d3c9',
    exposure: 0.95, night: 0, storm: 0, lightsOn: 0,
  },
  dusk: {
    label: 'Dusk', clock: '19:35', sunAzimuth: 248, sunElevation: 2.5, sunColor: '#ff7a45', sunIntensity: 2.0,
    hemiSky: '#6c7fb4', hemiGround: '#4a3a3a', hemiIntensity: 1.0, fogColor: '#c98a7a', fogDensity: 0.00007,
    skyZenith: '#283e7a', skyHorizon: '#ff9a6a', skySunGlow: 1.2, seaDeep: '#0d3252', seaShallow: '#2b8f93',
    exposure: 1.1, night: 0.15, storm: 0, lightsOn: 1,
  },
  night: {
    label: 'Night', clock: '23:10', sunAzimuth: 120, sunElevation: 38, sunColor: '#9fb4ff', sunIntensity: 0.45,
    hemiSky: '#33456e', hemiGround: '#141820', hemiIntensity: 0.6, fogColor: '#121a2c', fogDensity: 0.00008,
    skyZenith: '#050b1c', skyHorizon: '#1d2a48', skySunGlow: 0.25, seaDeep: '#04101e', seaShallow: '#0f3640',
    exposure: 1.25, night: 1, storm: 0, lightsOn: 1,
  },
  storm: {
    label: 'Storm front', clock: '17:05', sunAzimuth: 220, sunElevation: 25, sunColor: '#c9cfd8', sunIntensity: 0.9,
    hemiSky: '#8a96a8', hemiGround: '#4a4a45', hemiIntensity: 1.1, fogColor: '#7d8794', fogDensity: 0.00024,
    skyZenith: '#4d5a6c', skyHorizon: '#8b95a3', skySunGlow: 0.15, seaDeep: '#1c3442', seaShallow: '#3d6c70',
    exposure: 1.05, night: 0.2, storm: 1, lightsOn: 1,
  },
  cold: {
    label: 'Cold front', clock: '15:20', sunAzimuth: 205, sunElevation: 19, sunColor: '#e4e9f0', sunIntensity: 1.9,
    hemiSky: '#a3b4c9', hemiGround: '#5a5850', hemiIntensity: 1.15, fogColor: '#aab6c4', fogDensity: 0.00011,
    skyZenith: '#566d8c', skyHorizon: '#bfc9d4', skySunGlow: 0.35, seaDeep: '#173a52', seaShallow: '#3f8088',
    exposure: 1.0, night: 0.05, storm: 0, lightsOn: 0.5, warmth: 0.2,
  },
};

/** Names of the presets, for the settings screen and the mission data. */
export const TIME_OF_DAY_NAMES = Object.keys(PRESETS);

/** Unit vector toward the sun for an azimuth (deg from north, clockwise) and elevation (deg). */
export function sunDirectionFrom(azimuth, elevation) {
  const az = THREE.MathUtils.degToRad(azimuth);
  const el = THREE.MathUtils.degToRad(elevation);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

/** Resolves a preset name into colours and vectors ready for the scene. */
export function lightingFor(name) {
  const p = PRESETS[name] ?? PRESETS.golden;
  return {
    name: PRESETS[name] ? name : 'golden',
    label: p.label,
    clock: p.clock,
    sunDirection: sunDirectionFrom(p.sunAzimuth, p.sunElevation),
    sunColor: new THREE.Color(p.sunColor),
    sunIntensity: p.sunIntensity,
    hemiSky: new THREE.Color(p.hemiSky),
    hemiGround: new THREE.Color(p.hemiGround),
    hemiIntensity: p.hemiIntensity,
    fogColor: new THREE.Color(p.fogColor),
    fogDensity: p.fogDensity,
    skyZenith: new THREE.Color(p.skyZenith),
    skyHorizon: new THREE.Color(p.skyHorizon),
    skySunGlow: p.skySunGlow,
    seaDeep: new THREE.Color(p.seaDeep),
    seaShallow: new THREE.Color(p.seaShallow),
    exposure: p.exposure,
    night: p.night,
    storm: p.storm,
    lightsOn: p.lightsOn,
    warmth: p.warmth ?? (name === 'midday' ? 0.3 : 1),
  };
}

/** The sun, sky light and fog of the scene, re-aimed each frame so shadows follow the aircraft. */
export function createSceneLighting(scene) {
  const sun = new THREE.DirectionalLight('#ffffff', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -90;
  cam.right = 90;
  cam.top = 90;
  cam.bottom = -90;
  cam.near = 10;
  cam.far = 1600;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  const hemi = new THREE.HemisphereLight('#a9c3e6', '#7d6142', 1.2);
  scene.add(sun, sun.target, hemi);
  scene.fog = new THREE.FogExp2('#e8b58f', 0.00006);
  let current = lightingFor('golden');

  return {
    sun,
    hemi,
    get current() {
      return current;
    },
    apply(name, renderer) {
      current = lightingFor(name);
      sun.color.copy(current.sunColor);
      sun.intensity = current.sunIntensity;
      hemi.color.copy(current.hemiSky);
      hemi.groundColor.copy(current.hemiGround);
      hemi.intensity = current.hemiIntensity;
      scene.fog.color.copy(current.fogColor);
      scene.fog.density = current.fogDensity;
      if (renderer) renderer.toneMappingExposure = current.exposure;
      return current;
    },
    /** Keeps the shadow box centred on `focus` (the aircraft). */
    follow(focus) {
      sun.target.position.copy(focus);
      sun.position.copy(focus).addScaledVector(current.sunDirection, 800);
      sun.target.updateMatrixWorld();
    },
  };
}
