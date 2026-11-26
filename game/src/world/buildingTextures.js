// Canvas textures for the island buildings, painted once at start: plaster and stone facades in
// pale neutral tones (each building's own colour tints them) with shuttered windows, balcony
// doors, front doors and a plinth, and clay roof tiles. A facade texture holds two window bays
// side by side: the upper half is an upper floor, the lower half the ground floor, the bottom
// strip the plinth, so wall geometry picks a floor by its v range and repeats bays along u.
import * as THREE from 'three';
import { createSeededRandom } from '../core/seededRandom.js';

const SIZE = 512;
const HALF = 256;
const SHUTTER = '#5f8c83';
const FRAME = '#f1f0eb';

function speckle(ctx, x, y, w, h, count, rand, colors) {
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(x + rand() * w, y + rand() * h, 1 + rand() * 2.5, 1 + rand() * 2.5);
  }
}

function paintPlaster(ctx, rand) {
  ctx.fillStyle = '#f2f0ec';
  ctx.fillRect(0, 0, SIZE, SIZE);
  speckle(ctx, 0, 0, SIZE, SIZE, 3200, rand, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.4)', 'rgba(120,100,80,0.07)']);
  for (let i = 0; i < 14; i += 1) {
    // Faint damp patches and patched render.
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30 + rand() * 50);
    g.addColorStop(0, 'rgba(110,95,80,0.08)');
    g.addColorStop(1, 'rgba(110,95,80,0)');
    ctx.save();
    ctx.translate(rand() * SIZE, rand() * SIZE);
    ctx.fillStyle = g;
    ctx.fillRect(-80, -80, 160, 160);
    ctx.restore();
  }
}

function paintStone(ctx, rand) {
  ctx.fillStyle = '#aaa294';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rowHeight = 21;
  for (let y = 0; y < SIZE; y += rowHeight) {
    let x = -rand() * 40;
    while (x < SIZE) {
      const w = 24 + rand() * 36;
      const l = 200 + rand() * 45;
      ctx.fillStyle = `rgb(${l | 0}, ${(l - 5 - rand() * 8) | 0}, ${(l - 15 - rand() * 14) | 0})`;
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, rowHeight - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, 2);
      x += w;
    }
  }
  speckle(ctx, 0, 0, SIZE, SIZE, 2200, rand, ['rgba(0,0,0,0.07)', 'rgba(255,255,255,0.25)']);
}

function shutterPair(ctx, x, top, w, h, gap) {
  ctx.fillStyle = SHUTTER;
  ctx.fillRect(x - gap - w, top, w, h);
  ctx.fillRect(x + gap, top, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = top + 5; y < top + h - 3; y += 7) {
    ctx.fillRect(x - gap - w + 3, y, w - 6, 2);
    ctx.fillRect(x + gap + 3, y, w - 6, 2);
  }
}

function glassPane(ctx, x, y, w, h) {
  const glass = ctx.createLinearGradient(0, y, 0, y + h);
  glass.addColorStop(0, '#41596d');
  glass.addColorStop(1, '#1b2530');
  ctx.fillStyle = glass;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.55);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w * 0.7, y);
  ctx.lineTo(x, y + h * 0.95);
  ctx.closePath();
  ctx.fill();
}

function drawWindow(ctx, cx, bottom, { grille = false } = {}) {
  const w = 84;
  const h = 108;
  const top = bottom - h;
  shutterPair(ctx, cx, top, 40, h, w / 2 + 6);
  ctx.fillStyle = 'rgba(60,50,40,0.25)';
  ctx.fillRect(cx - w / 2 - 6, top - 6, w + 12, h + 12);
  ctx.fillStyle = FRAME;
  ctx.fillRect(cx - w / 2 - 5, top - 5, w + 10, h + 10);
  glassPane(ctx, cx - w / 2, top, w, h);
  ctx.fillStyle = FRAME;
  ctx.fillRect(cx - 2, top, 4, h);
  ctx.fillRect(cx - w / 2, top + h * 0.38, w, 4);
  if (grille) {
    ctx.fillStyle = '#262626';
    for (let x = cx - w / 2 + 7; x < cx + w / 2; x += 11) ctx.fillRect(x, top, 2, h);
    ctx.fillRect(cx - w / 2, top + h * 0.7, w, 2);
  }
  ctx.fillStyle = '#dad6cd';
  ctx.fillRect(cx - w / 2 - 10, bottom + 5, w + 20, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(cx - w / 2 - 10, bottom + 13, w + 20, 3);
}

function drawBalconyDoor(ctx, cx, floor) {
  const w = 74;
  const h = 166;
  const top = floor - h;
  shutterPair(ctx, cx, top, 36, h, w / 2 + 6);
  ctx.fillStyle = FRAME;
  ctx.fillRect(cx - w / 2 - 5, top - 5, w + 10, h + 5);
  glassPane(ctx, cx - w / 2, top, w, h);
  ctx.fillStyle = FRAME;
  ctx.fillRect(cx - 2, top, 4, h);
  for (const f of [0.33, 0.66]) ctx.fillRect(cx - w / 2, top + h * f, w, 4);
  // Slab, its shadow, and the iron railing.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(cx - 64, floor + 2, 128, 8);
  ctx.fillStyle = '#d8d4ca';
  ctx.fillRect(cx - 64, floor - 9, 128, 11);
  ctx.fillStyle = '#242424';
  ctx.fillRect(cx - 62, floor - 54, 124, 4);
  for (let x = cx - 60; x <= cx + 60; x += 8) ctx.fillRect(x, floor - 52, 2, 44);
}

function drawDoor(ctx, cx, floor) {
  const w = 78;
  const h = 168;
  const top = floor - h;
  ctx.fillStyle = '#e6e2d9';
  ctx.fillRect(cx - w / 2 - 8, top - 8, w + 16, h + 8);
  ctx.fillStyle = '#6e4b32';
  ctx.fillRect(cx - w / 2, top, w, h);
  glassPane(ctx, cx - w / 2 + 6, top + 6, w - 12, 30);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w / 2 + 8, top + 46, w / 2 - 12, h - 60);
  ctx.strokeRect(cx + 4, top + 46, w / 2 - 12, h - 60);
  ctx.fillStyle = '#d9c27a';
  ctx.fillRect(cx + 4, top + h * 0.55, 6, 4);
  ctx.fillStyle = '#cfcac0';
  ctx.fillRect(cx - w / 2 - 12, floor - 6, w + 24, 6);
}

/** A facade texture of `kind` 'plaster' or 'stone'. */
function facadeTexture(kind, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const rand = createSeededRandom(seed);
  if (kind === 'stone') paintStone(ctx, rand);
  else paintPlaster(ctx, rand);
  // Upper floor: a shuttered window, then a balcony door.
  drawWindow(ctx, HALF / 2, HALF - 74);
  drawBalconyDoor(ctx, HALF + HALF / 2, HALF - 6);
  // A string course between the floors.
  ctx.fillStyle = 'rgba(70,60,50,0.18)';
  ctx.fillRect(0, HALF - 4, SIZE, 4);
  // Ground floor: the front door, then a window with a grille; the plinth below.
  const plinthTop = SIZE - 18;
  drawDoor(ctx, HALF / 2, plinthTop);
  drawWindow(ctx, HALF + HALF / 2, plinthTop - 74, { grille: true });
  ctx.fillStyle = '#b8b0a3';
  ctx.fillRect(0, plinthTop, SIZE, 18);
  speckle(ctx, 0, plinthTop, SIZE, 18, 300, rand, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.2)']);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** Clay roof tiles in rows, pale so the roof colour tints them. */
function roofTileTexture(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rand = createSeededRandom(seed);
  ctx.fillStyle = '#7a746e';
  ctx.fillRect(0, 0, 256, 256);
  const rowHeight = 16;
  const tileWidth = 21.33;
  for (let row = 0; row < 256 / rowHeight; row += 1) {
    const y = row * rowHeight;
    const shift = row % 2 ? tileWidth / 2 : 0;
    for (let x = -tileWidth + shift; x < 256; x += tileWidth) {
      const l = 0.86 + rand() * 0.14;
      const g = ctx.createLinearGradient(0, y, 0, y + rowHeight);
      g.addColorStop(0, `rgba(${(250 * l) | 0},${(244 * l) | 0},${(236 * l) | 0},1)`);
      g.addColorStop(1, `rgba(${(190 * l) | 0},${(180 * l) | 0},${(170 * l) | 0},1)`);
      ctx.fillStyle = g;
      ctx.fillRect(x + 1, y + 1, tileWidth - 2, rowHeight - 1);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + tileWidth - 3, y + 1, 2, rowHeight - 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** The building materials: plaster and stone walls, tiled and flat roofs (instance colours tint them). */
export function createBuildingMaterials() {
  return {
    plaster: new THREE.MeshLambertMaterial({ map: facadeTexture('plaster', 811) }),
    stone: new THREE.MeshLambertMaterial({ map: facadeTexture('stone', 812) }),
    tiles: new THREE.MeshLambertMaterial({ map: roofTileTexture(813) }),
    flat: new THREE.MeshLambertMaterial({ color: '#ffffff' }),
  };
}
