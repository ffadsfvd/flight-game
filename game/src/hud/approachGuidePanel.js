// The approach guide shown on final: glide-slope and localizer scales with their diamonds, a
// four-light PAPI row, distance to the threshold, target speed and a plain-words verdict.
import { approachVerdict } from '../world/approachGeometry.js';
import { INSTRUMENT_FONT } from './instruments/gaugeKit.js';
import { prepareCanvas } from './canvasSizing.js';

const PAPI = [2.5, 2.83, 3.17, 3.5];

/** Creates the panel inside its container element. */
export function createApproachGuidePanel(element) {
  element.innerHTML = '<div class="head"><span>APPROACH <b data-id="rwy"></b></span><span data-id="dist"></span></div><canvas width="240" height="110"></canvas><div class="verdict" data-id="verdict"></div>';
  const canvas = element.querySelector('canvas');
  const rwy = element.querySelector('[data-id="rwy"]');
  const dist = element.querySelector('[data-id="dist"]');
  const verdict = element.querySelector('[data-id="verdict"]');
  let lastText = '';
  return {
    show(visible) {
      element.classList.toggle('is-hidden', !visible);
    },
    draw(g, readout, targetKt) {
      const text = `RWY ${g.name}`;
      if (text !== lastText) {
        rwy.textContent = `${g.field.code} ${g.field.kind === 'water' ? 'LANE' : 'RWY'} ${g.name}`;
        lastText = text;
      }
      dist.textContent = g.distance > 0 ? `${(g.distance / 1852).toFixed(1)} NM` : 'OVER RWY';
      const v = approachVerdict(g);
      verdict.textContent = v.text;
      verdict.style.color = v.tone === 'good' ? '#6be38a' : v.tone === 'warn' ? '#ffb02e' : '#ff4d3d';
      const W = 240;
      const H = 110;
      const ctx = prepareCanvas(canvas, W, H);
      // Glide slope scale (left, vertical).
      const gx = 22;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, 8);
      ctx.lineTo(gx, H - 8);
      ctx.stroke();
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.arc(gx + 10, H / 2 + i * 22, i === 0 ? 0 : 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillRect(gx + 2, H / 2 - 1, 16, 2);
      const gd = Math.max(-1, Math.min(1, g.glideDev / 1.4));
      ctx.fillStyle = '#ff4fd8';
      ctx.beginPath();
      const gy = H / 2 + gd * 44;
      ctx.moveTo(gx + 10, gy - 8);
      ctx.lineTo(gx + 18, gy);
      ctx.lineTo(gx + 10, gy + 8);
      ctx.lineTo(gx + 2, gy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(244,239,230,0.75)';
      ctx.font = `600 10px ${INSTRUMENT_FONT}`;
      ctx.save();
      ctx.translate(8, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('GLIDE', 0, 0);
      ctx.restore();
      // Localizer scale (bottom, horizontal) with a runway picture.
      const ly = H - 18;
      const lx0 = 54;
      const lx1 = W - 10;
      const lc = (lx0 + lx1) / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(lx0, ly);
      ctx.lineTo(lx1, ly);
      ctx.stroke();
      for (let i = -2; i <= 2; i += 1) {
        if (i === 0) continue;
        ctx.beginPath();
        ctx.arc(lc + i * 36, ly, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      const ld = Math.max(-1, Math.min(1, g.locDev / 2.5));
      ctx.fillStyle = '#ff4fd8';
      ctx.beginPath();
      const lxx = lc - ld * 72;
      ctx.moveTo(lxx, ly - 8);
      ctx.lineTo(lxx + 8, ly);
      ctx.lineTo(lxx, ly + 8);
      ctx.lineTo(lxx - 8, ly);
      ctx.closePath();
      ctx.fill();
      // Perspective runway drawn from the deviations.
      const rx = lc - ld * 30;
      const top = 18 + gd * 10;
      ctx.fillStyle = 'rgba(120,120,125,0.9)';
      ctx.beginPath();
      ctx.moveTo(rx - 5, top);
      ctx.lineTo(rx + 5, top);
      ctx.lineTo(rx + 28, top + 44);
      ctx.lineTo(rx - 28, top + 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, top + 3);
      ctx.lineTo(rx, top + 42);
      ctx.stroke();
      ctx.setLineDash([]);
      // PAPI lights.
      const angle = g.glideDev + 3;
      PAPI.forEach((a, i) => {
        const white = angle > PAPI[3 - i];
        ctx.fillStyle = white ? '#fff6e0' : '#ff3b2f';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(W - 64 + i * 15, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(244,239,230,0.85)';
      ctx.font = `600 11px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(`TGT ${Math.round(targetKt)} KT`, W - 70, 36);
      ctx.fillText(`${readout.kt >= targetKt - 5 && readout.kt <= targetKt + 8 ? 'SPEED OK' : readout.kt < targetKt - 5 ? 'SLOW' : 'FAST'}`, W - 70, 50);
      ctx.fillText(`${readout.gearDown || !readout.gearRetracts ? 'GEAR DN' : 'GEAR UP!'}`, W - 70, 64);
    },
  };
}
