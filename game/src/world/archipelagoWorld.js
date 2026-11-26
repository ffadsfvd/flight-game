// Assembles the whole archipelago scene (terrain, sea, sky, clouds, airfields, towns, forests and
// landmarks under one light) and answers the questions physics and missions ask about it: how high
// is the ground here, is it water or runway, and did the aircraft just hit something.
import * as THREE from 'three';
import { createIslandTerrain } from './islandTerrain.js';
import { createTerrainMesh } from './terrainMesh.js';
import { createSeaSurface } from './seaSurface.js';
import { createSkyDome } from './skyDome.js';
import { createCloudLayer } from './cloudLayer.js';
import { createSceneLighting } from './timeOfDay.js';
import { buildAirfields } from './airfieldBuilder.js';
import { buildTowns } from './townBuilder.js';
import { plantForests } from './forestPlanter.js';
import { buildLandmarks } from './landmarkBuilder.js';
import { buildRivers } from './riverBuilder.js';
import { AIRFIELDS, isOnRunway } from './airfieldDirectory.js';
import { canopyHeight, forestDensity } from './vegetationMap.js';
import { updateLightPoints } from './lightPoints.js';

/** Builds the world into `scene`. */
export function createArchipelagoWorld(scene) {
  const terrain = createIslandTerrain();
  const lighting = createSceneLighting(scene);
  const terrainMesh = createTerrainMesh(terrain);
  const sea = createSeaSurface(terrain);
  const sky = createSkyDome();
  const clouds = createCloudLayer();
  const airfields = buildAirfields(terrain);
  const towns = buildTowns(terrain);
  const forests = plantForests(terrain);
  const landmarks = buildLandmarks(terrain);
  const rivers = buildRivers(terrain);
  scene.add(sky.mesh, terrainMesh, sea.mesh, clouds.group, airfields.group, towns.group, forests.group, landmarks.group, rivers);
  const colliders = [...airfields.colliders, ...landmarks.colliders];
  const local = new THREE.Vector3();

  /** What lies under (x, z): ground height, water or not, and the runway if on one. */
  function surfaceAt(x, z) {
    const ground = terrain.heightAt(x, z);
    if (ground < 0) return { height: 0, water: true, runway: null, kind: 'water' };
    for (const field of AIRFIELDS) {
      if (field.kind !== 'water' && isOnRunway(field, x, z)) return { height: ground + 0.12, water: false, runway: field, kind: field.kind === 'grass' ? 'grass' : 'asphalt' };
    }
    return { height: ground, water: false, runway: null, kind: ground < 4 ? 'sand' : 'grass' };
  }

  /** The first obstacle containing point p (buildings, towers, arch, trees), or null. */
  function obstacleAt(p) {
    for (const c of colliders) {
      if (c.kind === 'cylinder') {
        if (p.y < c.top && Math.hypot(p.x - c.x, p.z - c.z) < c.radius) return c.name;
      } else if (c.kind === 'box') {
        const h = THREE.MathUtils.degToRad(c.heading);
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const along = dx * Math.sin(h) - dz * Math.cos(h);
        const across = dx * Math.cos(h) + dz * Math.sin(h);
        if (p.y < c.top && Math.abs(along) < c.halfLength && Math.abs(across) < c.halfWidth) return c.name;
      } else if (c.kind === 'arch') {
        local.set(p.x - c.x, p.y - c.y, p.z - c.z).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -c.yaw);
        if (local.y < -2) continue;
        const ring = Math.hypot(local.x, local.y) - c.radius;
        if (Math.hypot(ring, local.z / 1.25) < c.tube) return c.name;
      }
    }
    const building = towns.buildingAt(p.x, p.y, p.z);
    if (building) return building.town === 'the Porto Celeste bell tower' ? building.town : `a house in ${building.town}`;
    const ground = terrain.heightAt(p.x, p.z);
    if (p.y - ground < 18) {
      const density = forestDensity(terrain, p.x, p.z, ground);
      if (density > 0.35 && p.y - ground < canopyHeight(density) * 0.8) return 'the treetops';
    }
    return null;
  }

  return {
    terrain,
    lighting,
    sea,
    sky,
    clouds,
    airfields,
    towns,
    forests,
    landmarks,
    surfaceAt,
    obstacleAt,
    /** Sets the hour/weather preset for sun, sky, sea, clouds and fog. */
    setTimeOfDay(name, renderer) {
      const light = lighting.apply(name, renderer);
      sea.setLighting(light);
      sky.setLighting(light);
      clouds.setLighting(light);
      return light;
    },
    /** Per frame: animate the sea and landmarks, aim the shadows, update light sprites. */
    update(time, wind, focus, camera, viewHeight) {
      sea.update(time);
      sky.follow(camera);
      lighting.follow(focus);
      airfields.update(time, wind, focus);
      landmarks.update(time, lighting.current.lightsOn);
      updateLightPoints(viewHeight, camera.fov, scene.fog.density, 0.35 + lighting.current.lightsOn * 0.9);
      towns.windows.material.uniforms.uIntensity.value = lighting.current.lightsOn * 0.9;
      towns.windows.material.userData.fixed = lighting.current.lightsOn * 0.9;
    },
  };
}
