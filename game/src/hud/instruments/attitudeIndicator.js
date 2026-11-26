// Attitude indicator: sky and earth rolled with the bank and shifted with the pitch, a pitch
// ladder, the bank scale with its pointer and the orange miniature aircraft.
import { drawGlass, INSTRUMENT_FONT } from './gaugeKit.js';

export function drawAttitudeIndicator(ctx, x, y, r, d) {
  ctx.save();
  const bezel = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  bezel.addColorStop(0, '#8a8f96');
  bezel.addColorStop(0.5, '#2c3036');
  bezel.addColorStop(1, '#6b7078');
  ctx.fillStyle = bezel;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.clip();
  const pxPerDeg = r * 0.03;
  ctx.translate(x, y);
  ctx.rotate((-d.bank * Math.PI) / 180);
  const shift = Math.max(-r * 1.4, Math.min(r * 1.4, d.pitch * pxPerDeg));
  const sky = ctx.createLinearGradient(0, -r * 2 + shift, 0, shift);
  sky.addColorStop(0, '#1d5fb8');
  sky.addColorStop(1, '#5aa6e8');
  ctx.fillStyle = sky;
  ctx.fillRect(-r * 2, -r * 3 + shift, r * 4, r * 3);
  const earth = ctx.createLinearGradient(0, shift, 0, shift + r * 2);
  earth.addColorStop(0, '#8a5a2e');
  earth.addColorStop(1, '#4a2e16');
  ctx.fillStyle = earth;
  ctx.fillRect(-r * 2, shift, r * 4, r * 3);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = r * 0.025;
  ctx.beginPath();
  ctx.moveTo(-r * 2, shift);
  ctx.lineTo(r * 2, shift);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(r * 0.13)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let p = -30; p <= 30; p += 5) {
    if (p === 0) continue;
    const yy = shift - p * pxPerDeg;
    const half = p % 10 === 0 ? r * 0.28 : r * 0.13;
    ctx.lineWidth = r * 0.018;
    ctx.beginPath();
    ctx.moveTo(-half, yy);
    ctx.lineTo(half, yy);
    ctx.stroke();
    if (p % 10 === 0) {
      ctx.fillText(String(Math.abs(p)), -half - r * 0.12, yy);
      ctx.fillText(String(Math.abs(p)), half + r * 0.12, yy);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = r * 0.025;
  for (const b of [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]) {
    const a = ((b - 90) * Math.PI) / 180;
    const inner = b % 30 === 0 ? r * 0.72 : r * 0.79;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88);
    ctx.stroke();
  }
  ctx.rotate((-d.bank * Math.PI) / 180);
  ctx.fillStyle = '#ffb340';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(-r * 0.07, -r * 0.58);
  ctx.lineTo(r * 0.07, -r * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ff9a1f';
  ctx.fillStyle = '#ff9a1f';
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, 0);
  ctx.lineTo(-r * 0.2, 0);
  ctx.lineTo(-r * 0.1, r * 0.1);
  ctx.moveTo(r * 0.55, 0);
  ctx.lineTo(r * 0.2, 0);
  ctx.lineTo(r * 0.1, r * 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawGlass(ctx, x, y, r);
}
