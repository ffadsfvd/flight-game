// Paints a character's radio portrait on a canvas: backdrop, shoulders, face, hair style, eyes,
// and the details that make each one recognisable (headset, glasses, beard, helmet, shades).
import { characterById } from '../career/characterRoster.js';

const cache = new Map();

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

/** Draws the portrait for `id` into ctx at size s. */
export function paintPortrait(ctx, id, s) {
  const c = characterById(id);
  ctx.save();
  ctx.scale(s / 100, s / 100);
  const bg = ctx.createLinearGradient(0, 0, 0, 100);
  bg.addColorStop(0, shade(c.backdrop, 40));
  bg.addColorStop(1, c.backdrop);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = 'rgba(255,210,150,0.18)';
  ctx.beginPath();
  ctx.arc(78, 18, 30, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders and collar.
  ctx.fillStyle = c.shirt;
  ctx.beginPath();
  ctx.moveTo(8, 100);
  ctx.quadraticCurveTo(14, 72, 50, 70);
  ctx.quadraticCurveTo(86, 72, 92, 100);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(c.shirt, -35);
  ctx.beginPath();
  ctx.moveTo(40, 72);
  ctx.lineTo(50, 86);
  ctx.lineTo(60, 72);
  ctx.closePath();
  ctx.fill();
  // Neck and face.
  ctx.fillStyle = shade(c.skin, -18);
  ctx.fillRect(42, 58, 16, 16);
  if (c.hairStyle === 'long') {
    // Long hair behind the face: a crown and two lengths falling past the ears to the
    // shoulders, kept clear of the chin so it never reads as a beard.
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.ellipse(50, 38, 25, 23, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(25, 37);
    ctx.lineTo(25, 69);
    ctx.quadraticCurveTo(30, 77, 39, 72);
    ctx.lineTo(37, 40);
    ctx.closePath();
    ctx.moveTo(75, 37);
    ctx.lineTo(75, 69);
    ctx.quadraticCurveTo(70, 77, 61, 72);
    ctx.lineTo(63, 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(50, 42, 19, 23, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(c.skin, -12);
  ctx.beginPath();
  ctx.ellipse(31, 44, 3.5, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(69, 44, 3.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hair.
  ctx.fillStyle = c.hair;
  if (c.hairStyle === 'bun') {
    ctx.beginPath();
    ctx.ellipse(50, 26, 20, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(50, 14, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.hairStyle === 'short') {
    ctx.beginPath();
    ctx.ellipse(50, 27, 20, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (c.hairStyle === 'curly') {
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.arc(32 + i * 4.5, 22 + Math.sin(i * 1.7) * 3, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (c.hairStyle === 'bob') {
    ctx.beginPath();
    ctx.ellipse(50, 30, 22, 16, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(28, 28, 7, 24);
    ctx.fillRect(65, 28, 7, 24);
  } else if (c.hairStyle === 'swept') {
    ctx.beginPath();
    ctx.moveTo(30, 34);
    ctx.quadraticCurveTo(36, 12, 66, 16);
    ctx.quadraticCurveTo(72, 22, 70, 32);
    ctx.quadraticCurveTo(52, 22, 30, 34);
    ctx.fill();
  } else if (c.hairStyle === 'long') {
    ctx.beginPath();
    ctx.ellipse(50, 26, 21, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  // Eyes, brows, nose and mouth.
  ctx.fillStyle = '#1b1410';
  ctx.beginPath();
  ctx.ellipse(42, 42, 2.4, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(58, 42, 2.4, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(c.hair, 10);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(37, 36);
  ctx.lineTo(46, 35);
  ctx.moveTo(54, 35);
  ctx.lineTo(63, 36);
  ctx.stroke();
  ctx.strokeStyle = shade(c.skin, -45);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(50, 44);
  ctx.lineTo(48, 51);
  ctx.lineTo(51, 52);
  ctx.stroke();
  ctx.strokeStyle = '#7a2e24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(50, 53, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  if (c.beard) {
    ctx.fillStyle = shade(c.hair, -5);
    ctx.beginPath();
    ctx.moveTo(33, 48);
    ctx.quadraticCurveTo(50, 76, 67, 48);
    ctx.quadraticCurveTo(50, 62, 33, 48);
    ctx.fill();
  }
  if (c.glasses) {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(36, 38, 12, 9);
    ctx.strokeRect(52, 38, 12, 9);
    ctx.beginPath();
    ctx.moveTo(48, 42);
    ctx.lineTo(52, 42);
    ctx.stroke();
  }
  if (c.shades) {
    ctx.fillStyle = '#101418';
    ctx.beginPath();
    ctx.roundRect(35, 37, 13, 9, 3);
    ctx.roundRect(52, 37, 13, 9, 3);
    ctx.fill();
    ctx.fillRect(47, 39, 6, 2);
  }
  if (c.helmet) {
    ctx.fillStyle = '#f2c12e';
    ctx.beginPath();
    ctx.ellipse(50, 26, 24, 15, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(24, 24, 52, 5);
  }
  if (c.headset) {
    ctx.strokeStyle = '#2b2f36';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(50, 40, 23, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = '#2b2f36';
    ctx.beginPath();
    ctx.ellipse(28, 44, 5, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(72, 44, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 50);
    ctx.quadraticCurveTo(34, 60, 44, 58);
    ctx.stroke();
    ctx.fillStyle = '#ff6a3a';
    ctx.beginPath();
    ctx.arc(44, 58, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A ready canvas with the portrait (cached per id and size). */
export function portraitCanvas(id, size = 96) {
  const key = `${id}:${size}`;
  if (!cache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    paintPortrait(canvas.getContext('2d'), id, size);
    cache.set(key, canvas);
  }
  return cache.get(key);
}
