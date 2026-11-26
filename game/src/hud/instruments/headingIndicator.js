// Heading indicator: a compass card turning under the lubber line, with a magenta bug on the
// bearing to the current objective and, on approach, a course needle showing runway alignment.
import { drawGaugeFace, drawGlass, INSTRUMENT_FONT, LIT } from './gaugeKit.js';

const CARDINAL = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

export function drawHeadingIndicator(ctx, x, y, r, d, glow = 1) {
  drawGaugeFace(ctx, x, y, r, null, glow);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-d.heading * Math.PI) / 180);
  ctx.strokeStyle = LIT;
  ctx.fillStyle = LIT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 0; h < 360; h += 5) {
    const a = ((h - 90) * Math.PI) / 180;
    const major = h % 30 === 0;
    ctx.lineWidth = major ? r * 0.03 : r * 0.016;
    const inner = major ? r * 0.7 : h % 10 === 0 ? r * 0.76 : r * 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
    ctx.stroke();
    if (major) {
      ctx.save();
      ctx.rotate(((h) * Math.PI) / 180);
      ctx.font = `${CARDINAL[h] ? 800 : 600} ${Math.round(r * (CARDINAL[h] ? 0.2 : 0.15))}px ${INSTRUMENT_FONT}`;
      ctx.fillStyle = h === 0 ? '#ffb340' : LIT;
      ctx.fillText(CARDINAL[h] ?? String(h / 10), 0, -r * 0.56);
      ctx.restore();
    }
  }
  if (d.course !== null && d.course !== undefined) {
    ctx.save();
    ctx.rotate((d.course * Math.PI) / 180);
    ctx.strokeStyle = '#5fe3d0';
    ctx.lineWidth = r * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(0, -r * 0.3);
    ctx.moveTo(0, r * 0.3);
    ctx.lineTo(0, r * 0.62);
    ctx.stroke();
    const dev = Math.max(-1, Math.min(1, d.cdi ?? 0)) * r * 0.26;
    ctx.beginPath();
    ctx.moveTo(dev, -r * 0.28);
    ctx.lineTo(dev, r * 0.28);
    ctx.stroke();
    ctx.restore();
  }
  if (d.bug !== null && d.bug !== undefined) {
    ctx.save();
    ctx.rotate((d.bug * Math.PI) / 180);
    ctx.fillStyle = '#ff4fd8';
    ctx.beginPath();
    ctx.moveTo(-r * 0.09, -r * 0.9);
    ctx.lineTo(r * 0.09, -r * 0.9);
    ctx.lineTo(r * 0.09, -r * 0.8);
    ctx.lineTo(0, -r * 0.74);
    ctx.lineTo(-r * 0.09, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ff9a1f';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.66);
  ctx.lineTo(-r * 0.07, -r * 0.8);
  ctx.lineTo(r * 0.07, -r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff9a1f';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(0, r * 0.22);
  ctx.moveTo(-r * 0.2, 0);
  ctx.lineTo(r * 0.2, 0);
  ctx.moveTo(-r * 0.09, r * 0.18);
  ctx.lineTo(r * 0.09, r * 0.18);
  ctx.stroke();
  ctx.fillStyle = '#000000';
  ctx.fillRect(-r * 0.22, r * 0.3, r * 0.44, r * 0.22);
  ctx.fillStyle = LIT;
  ctx.font = `700 ${Math.round(r * 0.18)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(Math.round(d.heading) % 360).padStart(3, '0'), 0, r * 0.415);
  ctx.restore();
  drawGlass(ctx, x, y, r);
}
