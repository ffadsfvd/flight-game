// The WebGL renderer, scene and camera, set up for warm filmic light (ACES tone mapping, sRGB
// output, soft shadows) and kept sized to the window, with the HUD scale set from the same size.
import * as THREE from 'three';

/** Creates renderer, scene and camera on the canvas. */
export function createGameRenderer(canvas, { preserveDrawingBuffer = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.3, 42000);
  scene.add(camera);

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

  return {
    renderer,
    scene,
    camera,
    resize,
    get viewHeight() {
      return renderer.domElement.height;
    },
    render() {
      renderer.render(scene, camera);
    },
  };
}
