// The head-up tapes either side of the aircraft and along the top: airspeed with its coloured
// limit bands and trend arrow, altitude with the vertical-speed bar and ground marker, and the
// heading tape with the objective bug and the wind.
import { prepareCanvas } from './canvasSizing.js';
import { INSTRUMENT_FONT } from './instruments/gaugeKit.js';

const GREEN = '#6be38a';
const PANEL = 'rgba(9,16,30,0.62)';
const EDGE = 'rgba(255,196,120,0.55)';

function tapeBackground(ctx, w, h) {
  ctx.fillStyle = PANEL;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(1, 1, w - 2, h - 2, 8);
  ctx.fill();
  ctx.stroke();
}

function readoutBox(ctx, x, y, w, h, text, color, pointLeft) {
  ctx.save();
  ctx.fillStyle = '#05080e';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (pointLeft) {
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x, y - h / 2);
    ctx.lineTo(x + w, y - h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x, y + h / 2);
  } else {
    ctx.moveTo(x + w + 9, y);
    ctx.lineTo(x + w, y - h / 2);
    ctx.lineTo(x, y - h / 2);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(h * 0.68)}px ${INSTRUMENT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 1);
  ctx.restore();
}

/** Airspeed tape (knots). */
export function createSpeedTape(canvas) {
  const W = 84;
  const H = 300;
  let trend = 0;
  let last = null;
  return {
    draw(d, dt) {
      if (last !== null && dt > 0) trend += ((d.kt - last) / dt - trend) * Math.min(1, dt * 2);
      last = d.kt;
      const ctx = prepareCanvas(canvas, W, H);
      tapeBackground(ctx, W, H);
      const pxPerKt = 3.2;
      const cy = H / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(2, 2, W - 4, H - 4);
      ctx.clip();
      const band = (from, to, color) => {
        const y0 = cy - (to - d.kt) * pxPerKt;
        const y1 = cy - (from - d.kt) * pxPerKt;
        ctx.fillStyle = color;
        ctx.fillRect(W - 9, y0, 6, y1 - y0);
      };
      band(0, d.vs1Kt, '#ff3b2f');
      band(d.vsoKt, d.vfeKt, '#f4f1ea');
      band(d.vfeKt, d.vneKt * 0.82, GREEN);
      band(d.vneKt * 0.82, d.vneKt, '#ffc23a');
      band(d.vneKt, d.vneKt + 400, '#ff3b2f');
      ctx.strokeStyle = '#f4efe6';
      ctx.fillStyle = '#f4efe6';
      ctx.font = `600 15px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const start = Math.floor((d.kt - 50) / 5) * 5;
      for (let v = Math.max(0, start); v < d.kt + 50; v += 5) {
        const y = cy - (v - d.kt) * pxPerKt;
        ctx.lineWidth = v % 10 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(W - 12, y);
        ctx.lineTo(W - (v % 10 === 0 ? 24 : 18), y);
        ctx.stroke();
        if (v % 20 === 0) ctx.fillText(String(v), W - 28, y);
      }
      if (Math.abs(trend) > 0.4) {
        const len = Math.max(-120, Math.min(120, trend * 6 * pxPerKt));
        ctx.strokeStyle = '#ff4fd8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W - 6, cy);
        ctx.lineTo(W - 6, cy - len);
        ctx.stroke();
      }
      ctx.restore();
      const color = d.stall > 0.25 || d.kt > d.vneKt ? '#ff5a4a' : '#ffffff';
      readoutBox(ctx, 6, cy, 62, 34, String(Math.round(d.kt)), color, false);
      ctx.fillStyle = 'rgba(255,196,106,0.95)';
      ctx.font = `700 13px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('IAS KT', W / 2, 14);
      ctx.fillStyle = 'rgba(244,239,230,0.8)';
      ctx.font = `600 12px ${INSTRUMENT_FONT}`;
      ctx.fillText(`GS ${Math.round(d.gsKt)}`, W / 2, H - 12);
    },
  };
}

/** Altitude tape (feet) with vertical-speed bar. */
export function createAltitudeTape(canvas) {
  const W = 104;
  const H = 300;
  return {
    draw(d) {
      const ctx = prepareCanvas(canvas, W, H);
      tapeBackground(ctx, W, H);
      const pxPerFt = 0.5;
      const cy = H / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(2, 2, W - 4, H - 4);
      ctx.clip();
      const groundFt = d.altFt - d.aglFt;
      const gy = cy + (d.altFt - groundFt) * pxPerFt;
      if (gy < H) {
        ctx.fillStyle = 'rgba(160,110,60,0.55)';
        ctx.fillRect(2, gy, W - 22, H - gy);
        ctx.strokeStyle = '#ffb340';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, gy);
        ctx.lineTo(W - 20, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f4efe6';
      ctx.fillStyle = '#f4efe6';
      ctx.font = `600 14px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const start = Math.floor((d.altFt - 320) / 20) * 20;
      for (let v = start; v < d.altFt + 320; v += 20) {
        const y = cy - (v - d.altFt) * pxPerFt;
        const major = v % 100 === 0;
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(4, y);
        ctx.lineTo(major ? 16 : 10, y);
        ctx.stroke();
        if (major && v % 200 === 0) ctx.fillText(String(v), 19, y);
      }
      // Vertical speed bar on the right edge.
      const vs = Math.max(-2000, Math.min(2000, d.vsFpm));
      const barH = (vs / 2000) * (H / 2 - 20);
      ctx.fillStyle = vs >= 0 ? GREEN : vs < -1000 ? '#ff5a4a' : '#ffc23a';
      ctx.fillRect(W - 14, Math.min(cy, cy - barH), 8, Math.abs(barH));
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      for (const mark of [-1500, -1000, -500, 500, 1000, 1500]) {
        const y = cy - (mark / 2000) * (H / 2 - 20);
        ctx.beginPath();
        ctx.moveTo(W - 16, y);
        ctx.lineTo(W - 4, y);
        ctx.stroke();
      }
      ctx.restore();
      readoutBox(ctx, 12, cy, 70, 34, Math.round(d.altFt).toLocaleString('en-US'), d.aglFt < 150 && d.vsFpm < -700 ? '#ff5a4a' : '#ffffff', true);
      ctx.fillStyle = 'rgba(255,196,106,0.95)';
      ctx.font = `700 13px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('ALT FT', W / 2 - 6, 14);
      ctx.fillStyle = 'rgba(244,239,230,0.85)';
      ctx.font = `600 12px ${INSTRUMENT_FONT}`;
      ctx.fillText(`AGL ${Math.max(0, Math.round(d.aglFt))}  VS ${d.vsFpm > 0 ? '+' : ''}${Math.round(d.vsFpm / 10) * 10}`, W / 2, H - 12);
    },
  };
}

const CARDINALS = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };

/** Heading tape (degrees) with the objective bug and wind readout. */
export function createHeadingTape(canvas) {
  const W = 440;
  const H = 58;
  return {
    draw(d) {
      const ctx = prepareCanvas(canvas, W, H);
      tapeBackground(ctx, W, H);
      const pxPerDeg = 3.4;
      const cx = W / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(3, 3, W - 6, H - 6);
      ctx.clip();
      ctx.strokeStyle = '#f4efe6';
      ctx.fillStyle = '#f4efe6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const start = Math.floor((d.heading - 70) / 5) * 5;
      for (let h = start; h < d.heading + 70; h += 5) {
        const x = cx + (h - d.heading) * pxPerDeg;
        const n = ((h % 360) + 360) % 360;
        const major = n % 10 === 0;
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, H - 4);
        ctx.lineTo(x, H - (major ? 16 : 10));
        ctx.stroke();
        if (n % 30 === 0 || CARDINALS[n]) {
          const label = CARDINALS[n] ?? String(n / 10).padStart(2, '0');
          ctx.font = `${CARDINALS[n] ? 800 : 600} ${CARDINALS[n] ? 16 : 14}px ${INSTRUMENT_FONT}`;
          ctx.fillStyle = CARDINALS[n] ? '#ffc46a' : '#f4efe6';
          ctx.fillText(label, x, H - 27);
        }
      }
      if (d.bug !== null && d.bug !== undefined) {
        let diff = ((d.bug - d.heading + 540) % 360) - 180;
        const clamped = Math.max(-62, Math.min(62, diff));
        const x = cx + clamped * pxPerDeg;
        ctx.fillStyle = '#ff4fd8';
        ctx.beginPath();
        ctx.moveTo(x, H - 3);
        ctx.lineTo(x - 8, H - 15);
        ctx.lineTo(x + 8, H - 15);
        ctx.closePath();
        ctx.fill();
        if (Math.abs(diff) > 62) {
          ctx.font = `700 12px ${INSTRUMENT_FONT}`;
          ctx.fillText(diff > 0 ? '▶' : '◀', x + (diff > 0 ? -14 : 14), H - 9);
        }
      }
      ctx.restore();
      ctx.fillStyle = '#05080e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 30, 2, 60, 26, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 20px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.round(d.heading) % 360).padStart(3, '0'), cx, 16);
      ctx.fillStyle = 'rgba(255,196,106,0.95)';
      ctx.font = `700 12px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('HDG', 10, 14);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#5fe3d0';
      ctx.fillText(`WIND ${String(Math.round(d.windFrom)).padStart(3, '0')}°/${Math.round(d.windKt)} KT`, W - 10, 14);
    },
  };
}
