// Building blocks for the aircraft models: a fuselage lofted through cross-sections, tapered
// wings with a real airfoil section, hinged control surfaces, propellers with a blur disc, wheels
// and struts, a glass canopy, a pilot, and the navigation, strobe and landing lights.
// Model space: nose toward -z, up +y, right wing +x, origin at the centre of gravity.
import * as THREE from 'three';

/** Lofts a fuselage through sections [{ z, w, h, y }] (half width, half height, centre height). */
export function loftFuselage(sections, { radial = 22, squareness = 2 } = {}) {
  const ring = radial + 1;
  const positions = [];
  const uvs = [];
  const indices = [];
  const e = 2 / squareness;
  const totalLength = sections[sections.length - 1].z - sections[0].z;
  sections.forEach((s, i) => {
    for (let j = 0; j <= radial; j += 1) {
      const theta = (j / radial) * Math.PI * 2;
      const sn = Math.sin(theta);
      const cs = Math.cos(theta);
      const x = s.w * Math.sign(sn) * Math.pow(Math.abs(sn), e);
      const y = s.y + s.h * Math.sign(cs) * Math.pow(Math.abs(cs), e);
      positions.push(x, y, s.z);
      uvs.push(j / radial, (s.z - sections[0].z) / totalLength);
    }
    if (i < sections.length - 1) {
      for (let j = 0; j < radial; j += 1) {
        const a = i * ring + j;
        const b = (i + 1) * ring + j;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Airfoil outline (x along chord 0 = leading edge .. 1 = trailing edge, y thickness) for a thickness ratio. */
function airfoilPoints(thickness, camber = 0.02, count = 9) {
  const upper = [];
  const lower = [];
  for (let i = 0; i <= count; i += 1) {
    const x = (1 - Math.cos((i / count) * Math.PI)) / 2;
    const t = 5 * thickness * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const c = camber * 4 * x * (1 - x);
    upper.push([x, c + t]);
    lower.push([x, c - t]);
  }
  // Loop: trailing edge upper -> leading edge -> trailing edge lower.
  return [...upper.reverse(), ...lower.slice(1)];
}

/**
 * A wing panel between two spanwise stations: { x, le, chord, y, t } at root and tip (x outward
 * along +x, le = leading-edge z, y = height, t = thickness ratio). Closed at the tip.
 */
export function wingPanel(root, tip, { camber = 0.02, capTip = true } = {}) {
  const profile = airfoilPoints(1, camber);
  const n = profile.length;
  const positions = [];
  const indices = [];
  for (const st of [root, tip]) {
    for (const [px, py] of profile) {
      positions.push(st.x, st.y + py * st.t * st.chord, st.le + px * st.chord);
    }
  }
  for (let j = 0; j < n - 1; j += 1) {
    const a = j;
    const b = n + j;
    indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  if (capTip) {
    const centre = positions.length / 3;
    positions.push(tip.x, tip.y, tip.le + tip.chord * 0.4);
    for (let j = 0; j < n - 1; j += 1) indices.push(centre, n + j, n + j + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A control surface hinged along its leading edge: returns { pivot, mesh }. The pivot sits on
 * the hinge line; rotate pivot.rotation.x (for horizontal surfaces) to deflect it.
 */
export function hingedSurface(root, tip, material) {
  const hingeRoot = new THREE.Vector3(root.x, root.y, root.le);
  const hingeTip = new THREE.Vector3(tip.x, tip.y, tip.le);
  const geometry = wingPanel(root, tip, { camber: 0, capTip: true });
  geometry.translate(-hingeRoot.x, -hingeRoot.y, -hingeRoot.z);
  const pivot = new THREE.Group();
  pivot.position.copy(hingeRoot);
  const axis = hingeTip.clone().sub(hingeRoot).normalize();
  // Orient the pivot so its local x runs along the hinge: then rotation.x deflects the surface.
  const align = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), axis);
  const holder = new THREE.Group();
  holder.quaternion.copy(align);
  pivot.add(holder);
  const inverse = align.clone().invert();
  geometry.applyQuaternion(inverse);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  holder.add(mesh);
  return { pivot, holder, mesh };
}

/** A propeller (spinner, blades, blur disc) spinning about z. */
export function propeller({ radius, blades = 2, spinner = 0.2, spinnerLength = 0.45, bladeColor = '#2b2b2e', tipColor = '#f2c12e', spinnerColor = '#e8e4dc' }) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  const spinnerGeometry = new THREE.ConeGeometry(spinner, spinnerLength, 16);
  spinnerGeometry.rotateX(-Math.PI / 2);
  spinnerGeometry.translate(0, 0, -spinnerLength / 2);
  const cap = new THREE.Mesh(spinnerGeometry, new THREE.MeshPhongMaterial({ color: spinnerColor, shininess: 80 }));
  cap.castShadow = true;
  spin.add(cap);
  const bladeMaterial = new THREE.MeshLambertMaterial({ color: bladeColor });
  const tipMaterial = new THREE.MeshLambertMaterial({ color: tipColor });
  for (let i = 0; i < blades; i += 1) {
    const blade = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.13, radius * 0.86, 0.035), bladeMaterial);
    body.position.y = radius * 0.43 + spinner * 0.5;
    body.rotation.y = 0.35;
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.12, radius * 0.12, 0.036), tipMaterial);
    tip.position.y = radius * 0.92 + spinner * 0.2;
    tip.rotation.y = 0.35;
    blade.add(body, tip);
    blade.rotation.z = (i / blades) * Math.PI * 2;
    blade.traverse((o) => {
      o.castShadow = true;
    });
    spin.add(blade);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, 'rgba(40,40,44,0.0)');
  g.addColorStop(0.5, 'rgba(40,40,44,0.35)');
  g.addColorStop(0.86, 'rgba(60,60,64,0.45)');
  g.addColorStop(0.9, 'rgba(242,193,46,0.55)');
  g.addColorStop(1, 'rgba(242,193,46,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const discTexture = new THREE.CanvasTexture(canvas);
  discTexture.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.02, 32), new THREE.MeshBasicMaterial({ map: discTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.8 }));
  group.add(disc);
  return { group, spin, disc, blades: spin.children.slice(1) };
}

/** A wheel (tyre and hub) with its axle along x. */
export function wheel(radius, width = 0.16) {
  const group = new THREE.Group();
  const tyreGeometry = new THREE.CylinderGeometry(radius, radius, width, 18);
  tyreGeometry.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh(tyreGeometry, new THREE.MeshLambertMaterial({ color: '#1d1d1f' }));
  const hubGeometry = new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, width * 1.08, 12);
  hubGeometry.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeometry, new THREE.MeshPhongMaterial({ color: '#c9ccd1', shininess: 60 }));
  group.add(tyre, hub);
  group.traverse((o) => {
    o.castShadow = true;
  });
  return group;
}

/** A strut (cylinder) between two points. */
export function strut(from, to, radius, material) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const length = a.distanceTo(b);
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  mesh.castShadow = true;
  return mesh;
}

/** A tinted glass canopy: the upper half of an ellipsoid. */
export function canopy({ w, h, length, y, z, color = '#1f3346' }) {
  const geometry = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  geometry.scale(w, h, length);
  const material = new THREE.MeshPhongMaterial({ color, specular: '#ffffff', shininess: 110, transparent: true, opacity: 0.62, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, y, z);
  mesh.renderOrder = 2;
  return mesh;
}

/** A seated pilot: helmet and shoulders, seen through the canopy. */
export function pilot(y, z, helmet = '#f4f1ea') {
  const group = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshLambertMaterial({ color: helmet }));
  head.position.set(0, y + 0.34, z);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.152, 12, 8, -0.9, 1.8, 1.1, 0.7), new THREE.MeshPhongMaterial({ color: '#202833', shininess: 100 }));
  visor.position.copy(head.position);
  visor.rotation.y = Math.PI;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.38, 0.26), new THREE.MeshLambertMaterial({ color: '#3a5a7a' }));
  body.position.set(0, y + 0.06, z + 0.05);
  group.add(head, visor, body);
  return group;
}

/** Navigation lights (red left, green right, white tail), strobes and a landing light. */
export function aircraftLights({ leftTip, rightTip, tail, landing, landingDirection = [0, -0.12, -1] }) {
  const group = new THREE.Group();
  const bulb = (color, position, size = 0.07) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6), new THREE.MeshBasicMaterial({ color }));
    m.position.set(...position);
    group.add(m);
    return m;
  };
  const red = bulb('#ff2a1a', leftTip);
  const green = bulb('#25ff5a', rightTip);
  const white = bulb('#ffffff', tail);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 64;
  glowCanvas.height = 64;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glow = (color, position, scale) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sprite.position.set(...position);
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
    return sprite;
  };
  const redGlow = glow('#ff3a2a', leftTip, 1.1);
  const greenGlow = glow('#3aff6a', rightTip, 1.1);
  const strobeLeft = glow('#ffffff', leftTip, 2.6);
  const strobeRight = glow('#ffffff', rightTip, 2.6);
  const landingGlow = glow('#fff4d8', landing, 1.4);
  const spot = new THREE.SpotLight('#fff1d6', 0, 420, 0.32, 0.45, 1.3);
  spot.position.set(...landing);
  const target = new THREE.Object3D();
  target.position.set(landing[0] + landingDirection[0] * 50, landing[1] + landingDirection[1] * 50, landing[2] + landingDirection[2] * 50);
  spot.target = target;
  group.add(spot, target);
  const beamCanvas = document.createElement('canvas');
  beamCanvas.width = 4;
  beamCanvas.height = 64;
  const bctx = beamCanvas.getContext('2d');
  const beamGradient = bctx.createLinearGradient(0, 0, 0, 64);
  beamGradient.addColorStop(0, 'rgba(255,244,214,1)');
  beamGradient.addColorStop(0.35, 'rgba(255,244,214,0.35)');
  beamGradient.addColorStop(1, 'rgba(255,244,214,0)');
  bctx.fillStyle = beamGradient;
  bctx.fillRect(0, 0, 4, 64);
  const beamGeometry = new THREE.ConeGeometry(6, 55, 18, 1, true);
  beamGeometry.rotateX(Math.PI / 2);
  beamGeometry.translate(0, 0, -27.5);
  beamGeometry.rotateX(-0.1);
  const beamMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(beamCanvas), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.set(...landing);
  beam.renderOrder = 3;
  group.add(beam);
  return {
    group,
    beam,
    update(time, landingOn, lightLevel) {
      const strobe = time % 1.2 < 0.06 ? 1 : 0;
      strobeLeft.visible = strobe > 0;
      strobeRight.visible = strobe > 0;
      redGlow.material.opacity = 0.6 + lightLevel * 0.4;
      greenGlow.material.opacity = 0.6 + lightLevel * 0.4;
      landingGlow.visible = landingOn;
      landingGlow.scale.setScalar(1.1 + lightLevel * 1.6);
      beam.visible = landingOn;
      beamMaterial.opacity = 0.07 + lightLevel * 0.13;
      spot.intensity = landingOn ? 40 + lightLevel * 260 : 0;
      red.visible = green.visible = white.visible = true;
    },
  };
}

/** Canvas livery texture for a lofted fuselage (u around from the top, v nose to tail). */
export function liveryTexture({ base, stripe, accent, registration, stripeBand = [0.03, 0.09], noseColor = null, tailBand = null, textAt = 0.62, textScale = 0.3 }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);
  // Canvas x = around (u), canvas y = along (1 - v): the texture is flipped vertically on upload.
  const band = (u0, u1, v0, v1, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(u0 * 1024, (1 - v1) * 512, (u1 - u0) * 1024, (v1 - v0) * 512);
  };
  const [b0, b1] = stripeBand;
  band(0.25 - b1, 0.25 - b0, 0.1, 1, stripe);
  band(0.75 + b0, 0.75 + b1, 0.1, 1, stripe);
  band(0.25 - b0 + 0.004, 0.25 - b0 + 0.018, 0.1, 1, accent);
  band(0.75 + b0 - 0.018, 0.75 + b0 - 0.004, 0.1, 1, accent);
  if (noseColor) band(0, 1, 0, 0.1, noseColor);
  if (tailBand) band(0, 1, tailBand[0], tailBand[1], tailBand[2]);
  ctx.fillStyle = '#18222e';
  ctx.font = '700 64px Bahnschrift, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = (1 - textAt) * 512;
  // Each side's surface maps the canvas transposed (and stretched along the body); these
  // transforms make the letters read upright with a sensible shape.
  ctx.setTransform(0, textScale, 1, 0, (0.25 + 0.04) * 1024, y);
  ctx.fillText(registration, 0, 0);
  ctx.setTransform(0, -textScale, -1, 0, (0.75 - 0.04) * 1024, y);
  ctx.fillText(registration, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
