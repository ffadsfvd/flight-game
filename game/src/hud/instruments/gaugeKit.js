// Shared drawing for the round instruments: a machined bezel, a backlit black face, tick rings,
// arcs, needles with a glow, labels and digital windows. Every instrument draws at any centre and
// radius so the HUD strip and the 3D cockpit panel share them.

export const INSTRUMENT_FONT = 'Bahnschrift, "DIN Alternate", "Segoe UI", sans-serif';
export const LIT = '#fff4dc';
export const LIT_DIM = 'rgba(255,244,220,0.55)';
export const AMBER = '#ffb340';

/** Bezel and face; `glow` (0..1) is the strength of the panel lighting. */
export function drawGaugeFace(ctx, x, y, r, label, glow = 1) {
  ctx.save();
  const bezel = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  bezel.addColorStop(0, '#8a8f96');
  bezel.addColorStop(0.5, '#2c3036');
  bezel.addColorStop(1, '#6b7078');
  ctx.fillStyle = bezel;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  const face = ctx.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r * 0.92);
  face.addColorStop(0, '#1d2129');
  face.addColorStop(1, '#07090c');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  if (glow > 0) {
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 0.9);
    halo.addColorStop(0, 'rgba(255,190,110,0)');
    halo.addColorStop(1, `rgba(255,190,110,${0.12 * glow})`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  if (label) {
    ctx.fillStyle = LIT_DIM;
    ctx.font = `600 ${Math.round(r * 0.15)}px ${INSTRUMENT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - r * 0.36);
  }
  ctx.restore();
}

/** Glass glare over a face. */
export function drawGlass(ctx, x, y, r) {
  ctx.save();
  const g = ctx.createLinearGradient(x - r, y - r, x + r * 0.3, y + r * 0.2);
  g.addColorStop(0, 'rgba(255,255,255,0.14)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.02)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Angle (rad, canvas: 0 = east, clockwise) for a value on a dial from `start` sweeping `sweep` deg. */
export function dialAngle(value, min, max, startDeg, sweepDeg) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return ((startDeg + sweepDeg * t - 90) * Math.PI) / 180;
}

/** Tick marks every `step` (major every `major`) with numbers from `labelFn`. */
export function drawTicks(ctx, x, y, r, min, max, step, major, startDeg, sweepDeg, labelFn) {
  ctx.save();
  ctx.strokeStyle = LIT;
  ctx.fillStyle = LIT;
  ctx.font = `600 ${Math.round(r * 0.17)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let v = min; v <= max + 1e-6; v += step) {
    const a = dialAngle(v, min, max, startDeg, sweepDeg);
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const inner = isMajor ? r * 0.7 : r * 0.77;
    ctx.lineWidth = isMajor ? r * 0.035 : r * 0.02;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    ctx.lineTo(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86);
    ctx.stroke();
    if (isMajor && labelFn) {
      const text = labelFn(v);
      if (text !== null) ctx.fillText(text, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
    }
  }
  ctx.restore();
}

/** A coloured arc band between two values. */
export function drawArc(ctx, x, y, r, from, to, min, max, startDeg, sweepDeg, color, width = 0.07) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = r * width;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, dialAngle(from, min, max, startDeg, sweepDeg), dialAngle(to, min, max, startDeg, sweepDeg));
  ctx.stroke();
  ctx.restore();
}

/** A needle at canvas angle `a`, `length` as a fraction of r. */
export function drawNeedle(ctx, x, y, r, a, length = 0.78, color = '#ffffff', width = 0.055) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.shadowColor = 'rgba(255,200,120,0.6)';
  ctx.shadowBlur = r * 0.08;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * width * 0.7);
  ctx.lineTo(r * length, -r * 0.012);
  ctx.lineTo(r * length, r * 0.012);
  ctx.lineTo(-r * 0.16, r * width * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.fillRect(r * (length - 0.16), -r * 0.016, r * 0.16, r * 0.032);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#3a3f46';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A small digital window with a value, centred at (x, y). */
export function drawWindow(ctx, x, y, w, h, text, color = LIT) {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = 'rgba(255,244,220,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(h * 0.78)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + h * 0.04);
  ctx.restore();
}
