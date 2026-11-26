// Altimeter: the long needle sweeps hundreds of feet, the short one thousands, with a digital
// window for the exact altitude above sea level.
import { drawGaugeFace, drawGlass, drawNeedle, drawTicks, drawWindow } from './gaugeKit.js';

export function drawAltimeter(ctx, x, y, r, d, glow = 1) {
  drawGaugeFace(ctx, x, y, r, 'ALT FT', glow);
  drawTicks(ctx, x, y, r, 0, 1000, 20, 100, 0, 360, (v) => (v >= 1000 ? null : String(v / 100)));
  const ft = Math.max(0, d.altFt);
  drawWindow(ctx, x, y + r * 0.42, r * 0.78, r * 0.26, Math.round(ft).toLocaleString('en-US'));
  drawNeedle(ctx, x, y, r, (((ft % 10000) / 10000) * 360 - 90) * (Math.PI / 180), 0.48, '#d8d2c6', 0.08);
  drawNeedle(ctx, x, y, r, (((ft % 1000) / 1000) * 360 - 90) * (Math.PI / 180), 0.8);
  drawGlass(ctx, x, y, r);
}
