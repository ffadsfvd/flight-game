// The 3D cockpit for the pilot's view: an instrument panel whose six round gauges and annunciators
// are painted live onto a backlit texture, a glare shield, the windscreen frame, side sills and a
// control stick that moves with the pilot's inputs. Shown only in cockpit view.
import * as THREE from 'three';
import { drawInstrumentRow } from '../hud/instrumentStrip.js';
import { INSTRUMENT_FONT } from '../hud/instruments/gaugeKit.js';

const TEX_W = 1024;
const TEX_H = 400;

function drawAnnunciators(ctx, d) {
  const items = [
    ['FUEL', `${Math.round(d.fuelKg)} KG`, d.fuelFrac < 0.15 ? '#ff4d3d' : '#6be38a'],
    ['TEMP', `${Math.round(d.temp)}°C`, d.temp > d.tempRed ? '#ff4d3d' : d.temp > d.tempRed - 20 ? '#ffb02e' : '#6be38a'],
    ['THR', `${Math.round(d.throttle * 100)}%`, '#ffc46a'],
    ['FLAPS', ['UP', '15°', '35°'][d.flapSetting] ?? '', d.flapSetting ? '#ffc46a' : '#8a94a3'],
    ['GEAR', !d.gearRetracts ? 'FIXED' : d.gear > 0.98 ? 'DOWN' : d.gear < 0.02 ? 'UP' : 'TRANSIT', d.gear > 0.98 ? '#6be38a' : d.gear < 0.02 ? '#8a94a3' : '#ffb02e'],
    ['G', d.gForce.toFixed(1), Math.abs(d.gForce) > 4 ? '#ffb02e' : '#6be38a'],
  ];
  items.forEach(([label, value, color], i) => {
    const x = 40 + i * 160;
    const y = 262;
    ctx.fillStyle = '#05070a';
    ctx.strokeStyle = 'rgba(255,244,220,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 140, 60, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,244,220,0.6)';
    ctx.font = `600 18px ${INSTRUMENT_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 70, y + 20);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.font = `700 26px ${INSTRUMENT_FONT}`;
    ctx.fillText(value, x + 70, y + 48);
    ctx.shadowBlur = 0;
  });
  const warn = d.stall > 0.25 ? 'STALL' : !d.engineRunning ? 'ENGINE OUT' : d.fuelFrac < 0.1 ? 'LOW FUEL' : '';
  ctx.fillStyle = warn ? '#ff3b2f' : '#2a0f0d';
  ctx.beginPath();
  ctx.roundRect(392, 340, 240, 46, 8);
  ctx.fill();
  ctx.fillStyle = warn ? '#ffffff' : '#5a2a26';
  ctx.font = `800 28px ${INSTRUMENT_FONT}`;
  ctx.fillText(warn || 'MASTER WARN', 512, 372);
}

/** Builds the cockpit for a rig and attaches it to the rig's cockpit anchor. */
export function createCockpitPanel(rig) {
  const design = rig.design.panel;
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const group = new THREE.Group();
  group.visible = false;
  const width = design.width;
  const height = (width * TEX_H) / TEX_W;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshLambertMaterial({ map: texture, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.85 }));
  face.rotation.x = -design.tilt;
  face.position.set(0, 0, 0);
  const dark = new THREE.MeshLambertMaterial({ color: '#23262b' });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(width * 1.3, height * 1.35, 0.1), dark);
  backing.position.set(0, -0.02, -0.07);
  backing.rotation.x = -design.tilt;
  const shield = new THREE.Mesh(new THREE.BoxGeometry(width * 1.25, 0.04, 0.22), new THREE.MeshLambertMaterial({ color: '#16181c' }));
  shield.position.set(0, height * 0.5 + 0.01, -0.12);
  const frameMaterial = new THREE.MeshLambertMaterial({ color: '#3a4048' });
  const frame = new THREE.Group();
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.8, 0.028), frameMaterial);
    post.position.set(side * width * 0.66, height * 0.5 + 0.36, -0.05);
    post.rotation.z = side * -0.42;
    post.rotation.x = -0.45;
    frame.add(post);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.4), new THREE.MeshLambertMaterial({ color: rig.design.livery.base }));
    sill.position.set(side * width * 0.72, -0.02, 0.7);
    frame.add(sill);
  }
  const bow = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.03, 0.03), frameMaterial);
  bow.position.set(0, height * 0.5 + 0.68, 0.3);
  frame.add(bow);
  const stickPivot = new THREE.Group();
  stickPivot.position.set(0, -height * 0.9, 0.45);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.42, 8), dark);
  stick.position.y = 0.21;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 10), new THREE.MeshLambertMaterial({ color: '#111111' }));
  grip.position.y = 0.44;
  stickPivot.add(stick, grip);
  group.add(backing, face, shield, frame, stickPivot);
  rig.cockpitAnchor.add(group);
  let timer = 0;
  return {
    group,
    set visible(v) {
      group.visible = v;
    },
    update(readout, controls, dt) {
      if (!group.visible) return;
      stickPivot.rotation.x = -controls.pitch * 0.3;
      stickPivot.rotation.z = -controls.roll * 0.3;
      timer -= dt;
      if (timer > 0) return;
      timer = 1 / 30;
      const g = ctx.createLinearGradient(0, 0, 0, TEX_H);
      g.addColorStop(0, '#2c3036');
      g.addColorStop(1, '#1a1d22');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TEX_W, TEX_H);
      ctx.fillStyle = '#3a3f46';
      for (const [x, y] of [[14, 14], [TEX_W - 14, 14], [14, TEX_H - 14], [TEX_W - 14, TEX_H - 14]]) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      drawInstrumentRow(ctx, readout, 92, 124, 74, 168, 1.2);
      drawAnnunciators(ctx, readout);
      texture.needsUpdate = true;
    },
  };
}
