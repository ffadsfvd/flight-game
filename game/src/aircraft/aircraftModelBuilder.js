// Builds an aircraft's 3D model from its design data: painted fuselage, canopy and pilot, wings
// split into fixed panels, flaps and ailerons, tailplane with elevators, one or two fins with
// rudders, propeller or jet nozzle, gear legs (fixed with wheel pants, folding, or retracting into
// floats), floats with struts, and lights. Returns the rig the animator moves.
import * as THREE from 'three';
import { AIRCRAFT_DESIGNS } from './aircraftDesigns.js';
import { aircraftById } from './aircraftCatalog.js';
import { aircraftLights, canopy, hingedSurface, liveryTexture, loftFuselage, panelLineTexture, pilot, propeller, strut, wheel, wingPanel } from './aircraftParts.js';

function lerpStation(root, tip, x) {
  const t = (x - root.x) / (tip.x - root.x);
  return {
    x,
    le: root.le + (tip.le - root.le) * t,
    chord: root.chord + (tip.chord - root.chord) * t,
    y: root.y + (tip.y - root.y) * t,
    t: root.t + (tip.t - root.t) * t,
  };
}

/** One side of a lifting surface split at control-surface spans; returns { group, surfaces }. */
function buildSurfaceSide(root, tip, cuts, materials, tipMaterial) {
  const group = new THREE.Group();
  const surfaces = {};
  const breaks = new Set([root.x, tip.x]);
  for (const cut of Object.values(cuts)) {
    if (!cut) continue;
    breaks.add(cut[0]);
    breaks.add(cut[1]);
  }
  const xs = [...breaks].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i += 1) {
    const a = lerpStation(root, tip, xs[i]);
    const b = lerpStation(root, tip, xs[i + 1]);
    const isTip = i === xs.length - 2;
    let cutName = null;
    for (const [name, cut] of Object.entries(cuts)) {
      if (cut && xs[i] >= cut[0] - 1e-6 && xs[i + 1] <= cut[1] + 1e-6) cutName = name;
    }
    const material = isTip && tipMaterial ? tipMaterial : materials.skin;
    if (!cutName) {
      const mesh = new THREE.Mesh(wingPanel(a, b, { capTip: isTip }), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      continue;
    }
    const fraction = cuts[cutName][2];
    const mainA = { ...a, chord: a.chord * (1 - fraction), t: Math.min(0.2, a.t / (1 - fraction) * 0.85) };
    const mainB = { ...b, chord: b.chord * (1 - fraction), t: Math.min(0.2, b.t / (1 - fraction) * 0.85) };
    const main = new THREE.Mesh(wingPanel(mainA, mainB, { capTip: isTip }), material);
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);
    const surfA = { ...a, le: a.le + a.chord * (1 - fraction) + 0.02, chord: a.chord * fraction, t: 0.11 };
    const surfB = { ...b, le: b.le + b.chord * (1 - fraction) + 0.02, chord: b.chord * fraction, t: 0.11 };
    const hinged = hingedSurface(surfA, surfB, materials.surface);
    group.add(hinged.pivot);
    const align = hinged.holder.quaternion.clone();
    surfaces[cutName] = { holder: hinged.holder, align };
  }
  return { group, surfaces };
}

/** Rotates a hinged surface about its hinge line by `angle` radians. */
export function deflect(surface, angle) {
  if (!surface) return;
  surface.holder.quaternion.copy(surface.align).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle));
}

/** Builds the model for an aircraft id. */
export function buildAircraftModel(id) {
  const design = AIRCRAFT_DESIGNS[id];
  const spec = aircraftById(id);
  const livery = design.livery;
  const root = new THREE.Group();
  root.name = `aircraft-${id}`;
  const exterior = new THREE.Group();
  root.add(exterior);

  const skin = new THREE.MeshPhongMaterial({ map: panelLineTexture(livery.wing), shininess: 45, specular: '#555555' });
  const surface = new THREE.MeshPhongMaterial({ map: panelLineTexture(livery.wing), shininess: 35, specular: '#444444' });
  const tipMaterial = new THREE.MeshPhongMaterial({ map: panelLineTexture(livery.tip), shininess: 45, specular: '#555555' });
  const tailSkin = new THREE.MeshPhongMaterial({ map: panelLineTexture(livery.tail), shininess: 45, specular: '#555555' });
  const metal = new THREE.MeshPhongMaterial({ color: '#b9bec4', shininess: 70 });
  const dark = new THREE.MeshLambertMaterial({ color: '#2a2d31' });

  const fuselageMaterial = new THREE.MeshPhongMaterial({
    map: liveryTexture({ base: livery.base, stripe: livery.stripe, accent: livery.accent, registration: spec.registration, noseColor: livery.nose ?? null, textAt: livery.textAt }),
    shininess: 55,
    specular: '#666666',
  });
  const fuselage = new THREE.Mesh(loftFuselage(design.fuselage.sections, { squareness: design.fuselage.squareness }), fuselageMaterial);
  fuselage.castShadow = true;
  fuselage.receiveShadow = true;
  root.add(fuselage);

  const glass = canopy(design.canopy);
  exterior.add(glass);
  const seated = pilot(design.pilot.y, design.pilot.z);
  exterior.add(seated);

  // Wings.
  const surfaces = { aileronL: null, aileronR: null, flapL: null, flapR: null, elevators: [], rudders: [] };
  const w = design.wing;
  for (const side of [1, -1]) {
    const built = buildSurfaceSide(w.root, w.tip, { flap: w.flap, aileron: w.aileron }, { skin, surface }, tipMaterial);
    if (side < 0) built.group.scale.x = -1;
    root.add(built.group);
    if (side > 0) {
      surfaces.aileronR = built.surfaces.aileron;
      surfaces.flapR = built.surfaces.flap;
    } else {
      surfaces.aileronL = built.surfaces.aileron;
      surfaces.flapL = built.surfaces.flap;
    }
    if (w.struts) root.add(strut([w.struts[0][0] * side, w.struts[0][1], w.struts[0][2]], [w.struts[1][0] * side, w.struts[1][1], w.struts[1][2]], 0.05, metal));
    if (w.tipPods) {
      const pod = new THREE.Mesh(loftFuselage([
        { z: w.tip.le - 0.5, w: 0.02, h: 0.02, y: w.tip.y }, { z: w.tip.le - 0.2, w: 0.14, h: 0.14, y: w.tip.y }, { z: w.tip.le + 0.6, w: 0.17, h: 0.17, y: w.tip.y },
        { z: w.tip.le + 1.3, w: 0.12, h: 0.12, y: w.tip.y }, { z: w.tip.le + 1.5, w: 0.02, h: 0.02, y: w.tip.y },
      ], { radial: 12 }), tipMaterial);
      pod.position.x = (w.tip.x + 0.1) * side;
      pod.castShadow = true;
      root.add(pod);
    }
  }

  // Upper wing of a biplane: two fixed halves meeting over the fuselage, with cabane and
  // interplane struts down to the fuselage and the lower wing.
  if (design.upperWing) {
    const u = design.upperWing;
    for (const side of [1, -1]) {
      const built = buildSurfaceSide(u.root, u.tip, {}, { skin, surface }, tipMaterial);
      if (side < 0) built.group.scale.x = -1;
      root.add(built.group);
      for (const [a, b] of u.struts ?? []) root.add(strut([a[0] * side, a[1], a[2]], [b[0] * side, b[1], b[2]], 0.035, metal));
    }
  }

  // Tailplane.
  const st = design.stabilizer;
  for (const side of [1, -1]) {
    const built = buildSurfaceSide(st.root, st.tip, { elevator: [st.root.x, st.tip.x, st.elevator] }, { skin: tailSkin, surface }, null);
    if (side < 0) built.group.scale.x = -1;
    root.add(built.group);
    surfaces.elevators.push(built.surfaces.elevator);
  }

  // Fins: built with span along +x, then stood up (and canted for twin tails).
  for (const fin of design.fins) {
    const holder = new THREE.Group();
    holder.position.set(fin.x, 0, 0);
    holder.rotation.z = Math.PI / 2 + fin.cant;
    const built = buildSurfaceSide({ ...fin.root, x: fin.root.x }, fin.tip, { rudder: [fin.root.x, fin.tip.x, fin.rudder] }, { skin: tailSkin, surface: tailSkin }, null);
    holder.add(built.group);
    root.add(holder);
    surfaces.rudders.push(built.surfaces.rudder);
  }

  // Propeller or jet.
  let prop = null;
  let jet = null;
  if (design.propeller) {
    const p = design.propeller;
    prop = propeller({ radius: p.radius, blades: p.blades, spinner: p.spinner, spinnerLength: p.spinnerLength, spinnerColor: livery.accent === '#1e3a5f' ? '#e8641e' : livery.stripe });
    prop.group.position.set(0, p.y, p.z);
    root.add(prop.group);
  }
  if (design.jet) {
    const j = design.jet;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(j.radius, j.radius * 1.08, 0.5, 18, 1, true), new THREE.MeshPhongMaterial({ color: '#3b3d42', shininess: 90, side: THREE.DoubleSide }));
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, j.y, j.z + 0.2);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.6 });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(j.radius * 0.85, 18), glowMaterial);
    glow.position.set(0, j.y, j.z + 0.05);
    const plumeMaterial = new THREE.MeshBasicMaterial({ color: '#ffb36a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const plumeGeometry = new THREE.ConeGeometry(j.radius * 0.8, 3.2, 16, 1, true);
    plumeGeometry.rotateX(-Math.PI / 2);
    plumeGeometry.translate(0, 0, 1.6);
    const plume = new THREE.Mesh(plumeGeometry, plumeMaterial);
    plume.position.set(0, j.y, j.z + 0.3);
    root.add(nozzle, glow, plume);
    jet = { glowMaterial, plumeMaterial, plume };
  }
  if (design.intakes) {
    for (const [x, y, z] of design.intakes) {
      const intake = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 1.6), skin);
      intake.position.set(x, y, z);
      intake.castShadow = true;
      const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), dark);
      mouth.position.set(x, y, z - 0.81);
      mouth.rotation.y = Math.PI;
      root.add(intake, mouth);
    }
  }

  // Floats.
  if (design.floats) {
    const fl = design.floats;
    const floatMaterial = new THREE.MeshPhongMaterial({ color: fl.color, shininess: 40 });
    for (const side of [-1, 1]) {
      const pontoon = new THREE.Mesh(loftFuselage(fl.sections, { squareness: 2.6, radial: 16 }), floatMaterial);
      pontoon.position.x = fl.x * side;
      pontoon.castShadow = true;
      root.add(pontoon);
      for (const [a, b] of fl.struts) root.add(strut([a[0] * side, a[1], a[2]], [b[0] * side, b[1], b[2]], 0.05, metal));
    }
  }

  // Landing gear.
  const gearLegs = [];
  for (const leg of design.gear.legs) {
    const group = new THREE.Group();
    group.position.set(...leg.attach);
    const offset = new THREE.Vector3(leg.wheel[0] - leg.attach[0], leg.wheel[1] - leg.attach[1], leg.wheel[2] - leg.attach[2]);
    const wheelMesh = wheel(spec.wheelRadius, leg.pant ? 0.14 : 0.18);
    wheelMesh.position.copy(offset);
    group.add(strut([0, 0, 0], [offset.x, offset.y + spec.wheelRadius * 0.3, offset.z], 0.045, metal));
    group.add(wheelMesh);
    if (leg.pant) {
      const pant = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshPhongMaterial({ color: livery.stripe, shininess: 50 }));
      pant.scale.set(0.15, spec.wheelRadius * 1.15, spec.wheelRadius * 2.1);
      pant.position.copy(offset).add(new THREE.Vector3(0, 0.05, 0));
      pant.castShadow = true;
      group.add(pant);
    }
    root.add(group);
    gearLegs.push({ group, wheel: wheelMesh, fold: leg.fold ?? (design.gear.retracts ? 'stow' : 'fixed'), attach: leg.attach, wheelY: leg.wheel[1], stowedY: design.gear.stowedY ?? leg.attach[1] });
  }

  const lights = aircraftLights({ leftTip: design.lights.left, rightTip: design.lights.right, tail: design.lights.tail, landing: design.lights.landing });
  root.add(lights.group);

  const cockpitAnchor = new THREE.Object3D();
  cockpitAnchor.position.set(0, design.panel.y, design.panel.z);
  root.add(cockpitAnchor);

  root.traverse((o) => {
    if (o.isMesh && o.material && !o.material.transparent) o.castShadow = true;
  });

  return { id, root, exterior, surfaces, prop, jet, gearLegs, lights, cockpitAnchor, design, spec };
}
