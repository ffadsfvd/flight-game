// Vertical speed indicator: feet per minute, climbing above the zero at nine o'clock and
// descending below it, with the rate in a window.
import { drawGaugeFace, drawGlass, drawNeedle, drawTicks, drawWindow } from './gaugeKit.js';

export function drawVerticalSpeedIndicator(ctx, x, y, r, d, glow = 1) {
  drawGaugeFace(ctx, x, y, r, 'VS FPM', glow);
  const v = Math.max(-2000, Math.min(2000, d.vsFpm));
  drawTicks(ctx, x, y, r, -2000, 2000, 100, 500, -90 - 170, 340, (s) => (Math.abs(s) % 1000 === 0 ? String(Math.abs(s) / 1000) : null));
  const t = (v + 2000) / 4000;
  const angle = ((-90 - 170 + 340 * t - 90) * Math.PI) / 180;
  const color = d.vsFpm < -900 && d.aglFt < 600 ? '#ff5a4a' : '#fff4dc';
  drawWindow(ctx, x + r * 0.18, y + r * 0.42, r * 0.66, r * 0.24, `${d.vsFpm > 0 ? '+' : ''}${Math.round(d.vsFpm / 10) * 10}`, color);
  drawNeedle(ctx, x, y, r, angle);
  drawGlass(ctx, x, y, r);
}
