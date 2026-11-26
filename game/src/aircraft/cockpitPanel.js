// The 3D cockpit for the pilot's view. The instrument panel is a painted texture: a grained,
// screwed metal panel with six bezelled gauges, glass glare, a lit annunciator row and a switch
// row, repainted live from the flight state. Round it: a padded glare shield with a rounded lip,
// windscreen posts and bow, cabin walls with padded sills and window frames, a throttle quadrant
// and a stick or yoke that move with the controls, and the pilot's sleeves and gloves on both.
// Shown only in cockpit view.
import * as THREE from 'three';
import { drawInstrumentRow } from '../hud/instrumentStrip.js';
import { INSTRUMENT_FONT } from '../hud/instruments/gaugeKit.js';

const TEX_W = 1024;
const TEX_H = 440;
const GAUGE_X = 92;
const GAUGE_Y = 128;
const GAUGE_R = 72;
const GAUGE_GAP = 168;
const SWITCHES = ['BAT', 'ALT', 'FUEL P', 'NAV', 'STROBE', 'LAND', 'PITOT', 'AVION'];

function screw(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#c9ccd1');
  g.addColorStop(1, '#4a4e55');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,22,26,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y + r * 0.2);
  ctx.lineTo(x + r * 0.7, y - r * 0.2);
  ctx.stroke();
}

/** The static layer: grained panel paint, sunlight wash, bezel rings with screws, placards. */
function paintPanelBase() {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const paint = ctx.createLinearGradient(0, 0, 0, TEX_H);
  paint.addColorStop(0, '#41464e');
  paint.addColorStop(1, '#2a2e34');
  ctx.fillStyle = paint;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Fine grain and a few scuffs, seeded so every flight paints the same panel.
  let seed = 97;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const grain = ctx.getImageData(0, 0, TEX_W, TEX_H);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);
  // Late sun falling across the panel from the left window.
  const sun = ctx.createLinearGradient(0, 0, TEX_W * 0.8, TEX_H);
  sun.addColorStop(0, 'rgba(255,200,130,0.16)');
  sun.addColorStop(0.45, 'rgba(255,200,130,0.05)');
  sun.addColorStop(1, 'rgba(255,200,130,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // Panel edge and the seam between the gauge panel and the lower switch panel.
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, TEX_W - 6, TEX_H - 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 238);
  ctx.lineTo(TEX_W - 10, 238);
  ctx.stroke();
  for (const [x, y] of [[16, 16], [TEX_W - 16, 16], [16, TEX_H - 16], [TEX_W - 16, TEX_H - 16], [TEX_W / 2, 16], [16, 238], [TEX_W - 16, 238]]) screw(ctx, x, y, 6);
  // Bezel rings: a dark recess, a machined ring and four screws at the diagonals.
  for (let i = 0; i < 6; i += 1) {
    const x = GAUGE_X + i * GAUGE_GAP;
    const y = GAUGE_Y;
    const recess = ctx.createRadialGradient(x, y, GAUGE_R, x, y, GAUGE_R + 16);
    recess.addColorStop(0, 'rgba(0,0,0,0.8)');
    recess.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = recess;
    ctx.beginPath();
    ctx.arc(x, y + 3, GAUGE_R + 16, 0, Math.PI * 2);
    ctx.fill();
    const ring = ctx.createLinearGradient(x - GAUGE_R, y - GAUGE_R, x + GAUGE_R, y + GAUGE_R);
    ring.addColorStop(0, '#b9bdc4');
    ring.addColorStop(0.45, '#3b3f46');
    ring.addColorStop(1, '#8e939b');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(x, y, GAUGE_R + 7, 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 4; k += 1) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      screw(ctx, x + Math.cos(a) * (GAUGE_R + 3), y + Math.sin(a) * (GAUGE_R + 3), 4.2);
    }
  }
  // Placards under the gauges.
  ctx.fillStyle = 'rgba(240,232,214,0.72)';
  ctx.font = `600 15px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ['AIRSPEED', 'ATTITUDE', 'ALTITUDE', 'HEADING', 'VERT SPEED', 'ENGINE'].forEach((label, i) => ctx.fillText(label, GAUGE_X + i * GAUGE_GAP, GAUGE_Y + GAUGE_R + 26));
  return canvas;
}

/** Glass over each gauge: a bright arc of window light and a soft sheen. */
function paintGlassOverlay() {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 6; i += 1) {
    const x = GAUGE_X + i * GAUGE_GAP;
    const y = GAUGE_Y;
    const r = GAUGE_R * 0.9;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    const sheen = ctx.createLinearGradient(x - r, y - r, x + r * 0.4, y + r * 0.4);
    sheen.addColorStop(0, 'rgba(255,250,240,0.2)');
    sheen.addColorStop(0.55, 'rgba(255,250,240,0.03)');
    sheen.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(255,248,232,0.42)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, Math.PI * 1.08, Math.PI * 1.42);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,248,232,0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.66, Math.PI * 1.12, Math.PI * 1.3);
    ctx.stroke();
    ctx.restore();
  }
  return canvas;
}

function drawAnnunciators(ctx, d) {
  const items = [
    ['FUEL', `${Math.round(d.fuelKg)} KG`, d.fuelFrac < 0.15 ? '#ff4d3d' : '#6be38a'],
    ['TEMP', `${Math.round(d.temp)}°C`, d.temp > d.tempRed ? '#ff4d3d' : d.temp > d.tempRed - 20 ? '#ffb02e' : '#6be38a'],
    ['THR', `${Math.round(d.throttle * 100)}%`, '#ffc46a'],
    ['FLAPS', ['UP', '15°', '35°'][d.flapSetting] ?? '', d.flapSetting ? '#ffc46a' : '#8a94a3'],
    ['GEAR', !d.gearRetracts ? 'FIXED' : d.gear > 0.98 ? 'DOWN' : d.gear < 0.02 ? 'UP' : 'TRANSIT', d.gear > 0.98 ? '#6be38a' : d.gear < 0.02 ? '#8a94a3' : '#ffb02e'],
    ['G', d.gForce.toFixed(1), Math.abs(d.gForce) > 4 ? '#ffb02e' : '#6be38a'],
  ];
  ctx.textAlign = 'center';
  items.forEach(([label, value, color], i) => {
    const x = 26 + i * 128;
    const y = 256;
    ctx.fillStyle = '#05070a';
    ctx.strokeStyle = 'rgba(190,196,206,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, 116, 56, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,244,220,0.62)';
    ctx.font = `600 15px ${INSTRUMENT_FONT}`;
    ctx.fillText(label, x + 58, y + 19);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.font = `700 23px ${INSTRUMENT_FONT}`;
    ctx.fillText(value, x + 58, y + 45);
    ctx.shadowBlur = 0;
  });
  const warn = d.stall > 0.25 ? 'STALL' : !d.engineRunning ? 'ENGINE OUT' : d.fuelFrac < 0.1 ? 'LOW FUEL' : '';
  ctx.fillStyle = warn ? '#ff3b2f' : '#2a0f0d';
  ctx.beginPath();
  ctx.roundRect(800, 256, 196, 56, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,196,206,0.55)';
  ctx.stroke();
  ctx.fillStyle = warn ? '#ffffff' : '#6a302a';
  ctx.font = `800 22px ${INSTRUMENT_FONT}`;
  ctx.fillText(warn || 'MASTER WARN', 898, 292);
}

/** A row of toggle switches with placards; lit ones are on. */
function drawSwitchRow(ctx, on) {
  ctx.textAlign = 'center';
  SWITCHES.forEach((label, i) => {
    const x = 70 + i * 92;
    const y = 360;
    const lit = on[label] !== false;
    ctx.fillStyle = '#15171b';
    ctx.beginPath();
    ctx.roundRect(x - 17, y - 26, 34, 52, 6);
    ctx.fill();
    screw(ctx, x, y - 34, 3);
    const lever = ctx.createLinearGradient(x - 6, 0, x + 6, 0);
    lever.addColorStop(0, '#9da2a9');
    lever.addColorStop(0.5, '#f1f2f4');
    lever.addColorStop(1, '#8a8f96');
    ctx.fillStyle = lever;
    ctx.beginPath();
    ctx.roundRect(x - 6, lit ? y - 22 : y, 12, 22, 5);
    ctx.fill();
    ctx.fillStyle = lit ? '#8dffb0' : '#3a4a40';
    ctx.shadowColor = '#8dffb0';
    ctx.shadowBlur = lit ? 8 : 0;
    ctx.beginPath();
    ctx.arc(x + 24, y - 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(240,232,214,0.75)';
    ctx.font = `600 14px ${INSTRUMENT_FONT}`;
    ctx.fillText(label, x, y + 46);
  });
  // A small clock and the aircraft's registration placard at the right.
  ctx.fillStyle = '#101216';
  ctx.beginPath();
  ctx.roundRect(830, 330, 166, 70, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,232,214,0.8)';
  ctx.font = `700 16px ${INSTRUMENT_FONT}`;
  ctx.fillText(on.registration ?? '', 913, 356);
  ctx.fillStyle = '#ffc46a';
  ctx.font = `700 22px ${INSTRUMENT_FONT}`;
  ctx.fillText(on.clock ?? '', 913, 388);
}

/** A padded glare shield: a flat top running to the windscreen and a rounded lip over the panel. */
function glareShieldGeometry(width) {
  const profile = new THREE.Shape();
  profile.moveTo(-0.16, -0.004);
  profile.lineTo(0.01, -0.004);
  profile.quadraticCurveTo(0.065, -0.006, 0.068, 0.022);
  profile.quadraticCurveTo(0.068, 0.046, 0.035, 0.048);
  profile.quadraticCurveTo(-0.08, 0.05, -0.16, 0.012);
  profile.lineTo(-0.16, -0.004);
  const geometry = new THREE.ExtrudeGeometry(profile, { depth: width, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 10 });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(width / 2, 0, 0);
  return geometry;
}

/** A tube between two points. */
function rod(a, b, radius, material, radialSegments = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), radialSegments), material);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/** A forearm in a flight-suit sleeve ending in a gloved hand closed round a grip at `hand`. */
function pilotArm(elbow, hand, materials) {
  const group = new THREE.Group();
  const toElbow = new THREE.Vector3().subVectors(elbow, hand).normalize();
  const wrist = hand.clone().addScaledVector(toElbow, 0.075);
  group.add(rod(elbow, wrist, 0.036, materials.sleeve, 12));
  group.add(rod(wrist.clone().addScaledVector(toElbow, 0.05), wrist.clone().addScaledVector(toElbow, -0.012), 0.04, materials.cuff, 12));
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), materials.glove);
  back.scale.set(1.05, 0.7, 1.2);
  back.position.copy(hand).addScaledVector(toElbow, 0.03);
  back.lookAt(elbow);
  const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.05, 4, 8), materials.glove);
  fingers.position.copy(hand).add(new THREE.Vector3(0, -0.004, 0)).addScaledVector(toElbow, -0.006);
  fingers.rotation.z = Math.PI / 2;
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.034, 4, 8), materials.glove);
  thumb.position.copy(hand).add(new THREE.Vector3(0, 0.028, 0));
  thumb.rotation.x = 0.7;
  group.add(back, fingers, thumb);
  return group;
}

/** Builds the cockpit for a rig and attaches it to the rig's cockpit anchor. */
export function createCockpitPanel(rig) {
  const design = rig.design.panel;
  const eyeWorld = rig.spec?.eye ?? [0, design.y + 0.45, design.z + 0.77];
  const eye = new THREE.Vector3(eyeWorld[0], eyeWorld[1] - design.y, eyeWorld[2] - design.z);
  const usesYoke = design.yoke === true;
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const base = paintPanelBase();
  const glass = paintGlassOverlay();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const group = new THREE.Group();
  group.visible = false;
  const width = design.width;
  const height = (width * TEX_H) / TEX_W;
  const tilt = design.tilt;

  const materials = {
    face: new THREE.MeshLambertMaterial({ map: texture, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.55 }),
    shield: new THREE.MeshLambertMaterial({ color: '#3a3c41' }),
    fascia: new THREE.MeshLambertMaterial({ color: '#3c4148' }),
    wall: new THREE.MeshLambertMaterial({ color: '#5d6772' }),
    pad: new THREE.MeshLambertMaterial({ color: '#8f7b63' }),
    frame: new THREE.MeshLambertMaterial({ color: '#4a525c' }),
    metal: new THREE.MeshLambertMaterial({ color: '#9aa1aa' }),
    black: new THREE.MeshLambertMaterial({ color: '#141518' }),
    knob: new THREE.MeshLambertMaterial({ color: '#1b1c1f' }),
    red: new THREE.MeshLambertMaterial({ color: '#b3261e' }),
    sleeve: new THREE.MeshLambertMaterial({ color: '#5d6b4c' }),
    cuff: new THREE.MeshLambertMaterial({ color: '#3f4a33' }),
    glove: new THREE.MeshLambertMaterial({ color: '#6e4b2f' }),
  };

  // Panel face (the live texture) in a fascia with depth, tilted back at the top.
  const panel = new THREE.Group();
  panel.rotation.x = -tilt;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), materials.face);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(width * 1.12, height * 1.12, 0.06), materials.fascia);
  fascia.position.z = -0.035;
  panel.add(fascia, face);
  group.add(panel);

  // Glare shield along the panel's top edge.
  const top = new THREE.Vector3(0, (height / 2) * Math.cos(tilt), -(height / 2) * Math.sin(tilt));
  const shield = new THREE.Mesh(glareShieldGeometry(width * 1.16), materials.shield);
  shield.position.set(0, top.y + 0.004, top.z + 0.01);
  group.add(shield);

  // Cabin walls with padded sills, window frames, windscreen posts and the bow above.
  const halfCabin = width * 0.6;
  const cabinLength = eye.z + 0.15;
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, cabinLength), materials.wall);
    wall.position.set(side * (halfCabin + 0.02), -0.18, cabinLength / 2 - 0.3);
    const sill = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, cabinLength - 0.1, 4, 10), materials.pad);
    sill.rotation.x = Math.PI / 2;
    sill.position.set(side * (halfCabin - 0.005), 0.13, cabinLength / 2 - 0.3);
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, cabinLength), materials.frame);
    windowFrame.position.set(side * (halfCabin + 0.005), 0.175, cabinLength / 2 - 0.3);
    group.add(wall, sill, windowFrame);
    const rear = new THREE.Vector3(side * (halfCabin + 0.01), 0.2, eye.z + 0.2);
    group.add(rod(rear, new THREE.Vector3(side * halfCabin * 0.8, eye.y + 0.5, eye.z + 0.1), 0.018, materials.frame));
  }
  // Windscreen frame: two posts from the glare shield's corners and a bow arching between them.
  const cornerLow = (side) => new THREE.Vector3(side * (halfCabin - 0.03), top.y + 0.03, top.z - 0.3);
  const cornerHigh = (side) => new THREE.Vector3(side * halfCabin * 0.8, eye.y + 0.3, eye.z - 0.62);
  for (const side of [-1, 1]) {
    group.add(rod(cornerLow(side), cornerHigh(side), 0.018, materials.frame));
    group.add(rod(cornerHigh(side), new THREE.Vector3(side * (halfCabin + 0.01), 0.18, eye.z + 0.1), 0.015, materials.frame));
  }
  const bowCurve = new THREE.QuadraticBezierCurve3(cornerHigh(-1), new THREE.Vector3(0, eye.y + 0.42, eye.z - 0.66), cornerHigh(1));
  const bow = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 24, 0.016, 8, false), materials.frame);
  group.add(bow);

  // Throttle quadrant on the left of the panel: a slotted box and a lever with a black knob.
  const quadrant = new THREE.Group();
  quadrant.position.set(-halfCabin + 0.1, -0.06, 0.14);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.26), materials.fascia);
  quadrant.add(box);
  const throttleLever = new THREE.Group();
  throttleLever.position.set(-0.02, 0.03, 0);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.012), materials.metal);
  lever.position.y = 0.07;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), materials.knob);
  knob.position.y = 0.145;
  throttleLever.add(lever, knob);
  const mixtureLever = new THREE.Group();
  mixtureLever.position.set(0.025, 0.03, 0);
  const mixture = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.12, 0.01), materials.metal);
  mixture.position.y = 0.06;
  const mixtureKnob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), materials.red);
  mixtureKnob.position.y = 0.12;
  mixtureLever.add(mixture, mixtureKnob);
  mixtureLever.rotation.x = -0.5;
  quadrant.add(throttleLever, mixtureLever);
  group.add(quadrant);

  // The stick (or yoke) in front of the pilot.
  const stickPivot = new THREE.Group();
  const gripLocal = new THREE.Vector3();
  if (usesYoke) {
    stickPivot.position.set(0, eye.y - 0.33, eye.z - 0.46);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 10), materials.metal);
    column.rotation.x = Math.PI / 2;
    column.position.z = -0.2;
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.04), materials.black);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.028, 0.03), materials.black);
    bar.position.y = -0.01;
    stickPivot.add(column, hub, bar);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.09, 4, 8), materials.black);
      horn.position.set(side * 0.17, 0.035, 0);
      stickPivot.add(horn);
    }
    gripLocal.set(0.17, 0.05, 0);
  } else {
    stickPivot.position.set(0.07, eye.y - 0.86, eye.z - 0.42);
    const boot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 12, 1, true), materials.black);
    boot.position.y = 0.06;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.019, 0.48, 10), materials.metal);
    shaft.position.y = 0.3;
    const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.09, 4, 10), materials.black);
    grip.position.y = 0.56;
    grip.rotation.x = 0.18;
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), materials.red);
    hat.position.set(0, 0.625, -0.01);
    stickPivot.add(boot, shaft, grip, hat);
    gripLocal.set(0, 0.54, 0.01);
  }
  group.add(stickPivot);

  // The pilot's arms: right hand on the stick (or yoke), left hand on the throttle.
  const rightArm = new THREE.Group();
  const leftArm = new THREE.Group();
  group.add(rightArm, leftArm);
  const handScratch = new THREE.Vector3();
  function placeArms() {
    rightArm.clear();
    leftArm.clear();
    stickPivot.updateMatrix();
    handScratch.copy(gripLocal).applyMatrix4(stickPivot.matrix);
    rightArm.add(pilotArm(new THREE.Vector3(eye.x + 0.24, eye.y - 0.52, eye.z + 0.02), handScratch.clone(), materials));
    quadrant.updateMatrix();
    throttleLever.updateMatrix();
    const knobAt = knob.position.clone().applyMatrix4(throttleLever.matrix).applyMatrix4(quadrant.matrix);
    leftArm.add(pilotArm(new THREE.Vector3(eye.x - 0.3, eye.y - 0.5, eye.z + 0.04), knobAt.add(new THREE.Vector3(0.01, 0.01, 0.02)), materials));
  }

  for (const child of group.children) child.traverse((o) => {
    if (o.isMesh) o.renderOrder = 1;
  });
  rig.cockpitAnchor.add(group);
  let timer = 0;
  let armTimer = 0;
  const switchState = { registration: rig.spec?.registration ?? '', clock: '' };
  return {
    group,
    set visible(v) {
      group.visible = v;
    },
    update(readout, controls, dt, extras = {}) {
      if (!group.visible) return;
      if (usesYoke) {
        stickPivot.position.z = eye.z - 0.46 + controls.pitch * 0.06;
        stickPivot.rotation.z = -controls.roll * 0.6;
      } else {
        stickPivot.rotation.x = -controls.pitch * 0.28;
        stickPivot.rotation.z = -controls.roll * 0.28;
      }
      throttleLever.rotation.x = 0.55 - controls.throttle * 1.1;
      armTimer -= dt;
      if (armTimer <= 0) {
        armTimer = 1 / 30;
        placeArms();
      }
      timer -= dt;
      if (timer > 0) return;
      timer = 1 / 30;
      ctx.drawImage(base, 0, 0);
      drawInstrumentRow(ctx, readout, GAUGE_X, GAUGE_Y, GAUGE_R, GAUGE_GAP, 1.25);
      ctx.drawImage(glass, 0, 0);
      drawAnnunciators(ctx, readout);
      switchState.LAND = extras.landingLights !== false;
      switchState.clock = extras.clock ?? '';
      drawSwitchRow(ctx, switchState);
      texture.needsUpdate = true;
    },
  };
}
