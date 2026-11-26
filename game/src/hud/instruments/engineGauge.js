// Engine gauge: RPM on the main dial with its green and red ranges, cylinder (or exhaust)
// temperature on an inner arc with the red line, and a warning light when the engine is out.
import { dialAngle, drawArc, drawGaugeFace, drawGlass, drawNeedle, drawTicks, drawWindow, INSTRUMENT_FONT } from './gaugeKit.js';

export function drawEngineGauge(ctx, x, y, r, d, glow = 1) {
  drawGaugeFace(ctx, x, y, r, d.isJet ? 'N1 %' : 'RPM x100', glow);
  const maxRpm = d.isJet ? 110 : 30;
  const rpm = d.isJet ? d.rpm * 100 : d.rpm * 27;
  drawArc(ctx, x, y, r * 0.93, maxRpm * 0.25, maxRpm * 0.85, 0, maxRpm, -135, 270, '#3ccf6a', 0.07);
  drawArc(ctx, x, y, r * 0.93, maxRpm * 0.92, maxRpm, 0, maxRpm, -135, 270, '#ff3b2f', 0.07);
  drawTicks(ctx, x, y, r, 0, maxRpm, d.isJet ? 10 : 2, d.isJet ? 20 : 10, -135, 270, (v) => String(v));
  // Temperature arc along the lower face.
  const tMin = 40;
  const tMax = 260;
  ctx.save();
  ctx.lineWidth = r * 0.07;
  const a0 = Math.PI * 0.62;
  const a1 = Math.PI * 0.38;
  const tempAngle = (t) => a0 + (a1 - a0) * ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin));
  ctx.strokeStyle = '#3ccf6a';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, tempAngle(260), tempAngle(60), false);
  ctx.stroke();
  ctx.strokeStyle = '#ff3b2f';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, tempAngle(260), tempAngle(d.tempRed), false);
  ctx.stroke();
  const ta = tempAngle(d.temp);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = r * 0.04;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ta) * r * 0.38, y + Math.sin(ta) * r * 0.38);
  ctx.lineTo(x + Math.cos(ta) * r * 0.6, y + Math.sin(ta) * r * 0.6);
  ctx.stroke();
  ctx.fillStyle = d.temp > d.tempRed ? '#ff5a4a' : 'rgba(255,244,220,0.6)';
  ctx.font = `600 ${Math.round(r * 0.12)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(d.temp)}°C`, x, y + r * 0.72);
  ctx.restore();
  if (!d.engineRunning) drawWindow(ctx, x, y - r * 0.1, r * 0.8, r * 0.22, 'ENGINE OUT', '#ff5a4a');
  drawNeedle(ctx, x, y, r, dialAngle(rpm, 0, maxRpm, -135, 270));
  drawGlass(ctx, x, y, r);
}
