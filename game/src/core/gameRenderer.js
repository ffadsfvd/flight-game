// The WebGL renderer, scene and camera, set up for warm filmic light (ACES tone mapping, sRGB
// output, soft shadows) and kept sized to the window, with the HUD scale set from the same size.
//
// Each frame is drawn in two depth ranges: the far scenery first (700 m to the horizon), then,
// on a cleared depth buffer, everything near the camera (30 cm to 700 m). One range from 30 cm to
// 42 km left a 24-bit depth buffer only metres of resolution a few kilometres out, so beaches a
// metre above the sea flickered through the water along every coast. Split in two, the depth
// steps stay under 2 cm at 700 m and under 30 cm at the horizon. Objects marked
// userData.farRangeOnly (the sky dome, drawn at the far plane) are left out of the near range.
import * as THREE from 'three';

const SPLIT_DISTANCE = 700;
const RANGE_OVERLAP = 1.5;

/** Creates renderer, scene and camera on the canvas. */
export function createGameRenderer(canvas, { preserveDrawingBuffer = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.3, 42000);
  scene.add(camera);
  const hiddenForNearRange = [];

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const ui = Math.max(0.6, Math.min(width / 1280, height / 800));
    document.documentElement.style.setProperty('--ui', ui.toFixed(3));
  }
  window.addEventListener('resize', resize);
  resize();

  function setDepthRange(near, far) {
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }

  /** Far range, then near range over it; the shadow map is drawn once for both. */
  function render() {
    const near = camera.near;
    const far = camera.far;
    renderer.clear(true, true, true);
    renderer.shadowMap.needsUpdate = true;
    if (far <= SPLIT_DISTANCE * 2) {
      renderer.render(scene, camera);
      return;
    }
    setDepthRange(SPLIT_DISTANCE, far);
    renderer.render(scene, camera);
    renderer.clearDepth();
    hiddenForNearRange.length = 0;
    for (const child of scene.children) {
      if (child.userData.farRangeOnly && child.visible) {
        child.visible = false;
        hiddenForNearRange.push(child);
      }
    }
    setDepthRange(near, SPLIT_DISTANCE + RANGE_OVERLAP);
    scene.matrixWorldAutoUpdate = false;
    renderer.render(scene, camera);
    scene.matrixWorldAutoUpdate = true;
    for (const child of hiddenForNearRange) child.visible = true;
    setDepthRange(near, far);
  }

  return {
    renderer,
    scene,
    camera,
    resize,
    get viewHeight() {
      return renderer.domElement.height;
    },
    render,
  };
}
