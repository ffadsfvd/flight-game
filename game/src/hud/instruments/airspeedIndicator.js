// Airspeed indicator: knots on a 300° dial with the white flap arc, green normal range, yellow
// caution range and the red never-exceed line, all from the aircraft's own limits, plus a cyan
// arc for the speed band a ring course is judged in.
import { dialAngle, drawArc, drawGaugeFace, drawGlass, drawNeedle, drawTicks, drawWindow } from './gaugeKit.js';

export function drawAirspeedIndicator(ctx, x, y, r, d, glow = 1) {
  const max = Math.ceil((d.vneKt * 1.12) / 20) * 20;
  drawGaugeFace(ctx, x, y, r, 'KNOTS', glow);
  drawArc(ctx, x, y, r, d.vsoKt, d.vfeKt, 0, max, -150, 300, '#f4f1ea', 0.06);
  drawArc(ctx, x, y, r * 0.93, d.vs1Kt, d.vneKt * 0.82, 0, max, -150, 300, '#3ccf6a', 0.07);
  drawArc(ctx, x, y, r * 0.93, d.vneKt * 0.82, d.vneKt, 0, max, -150, 300, '#ffc23a', 0.07);
  drawArc(ctx, x, y, r * 0.93, d.vneKt, d.vneKt + max * 0.012, 0, max, -150, 300, '#ff3b2f', 0.12);
  if (d.bandKt) drawArc(ctx, x, y, r * 0.8, d.bandKt[0], d.bandKt[1], 0, max, -150, 300, '#5fe3d0', 0.07);
  const step = max > 300 ? 20 : 10;
  drawTicks(ctx, x, y, r, 0, max, step, step * (max > 300 ? 5 : 4), -150, 300, (v) => (v === 0 ? null : String(v)));
  drawWindow(ctx, x, y + r * 0.42, r * 0.62, r * 0.26, String(Math.round(d.kt)), d.stall > 0.3 ? '#ff5a4a' : '#fff4dc');
  drawNeedle(ctx, x, y, r, dialAngle(d.kt, 0, max, -150, 300));
  drawGlass(ctx, x, y, r);
}
