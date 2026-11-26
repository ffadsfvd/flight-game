// The lit instrument strip along the bottom of the chase view: airspeed, attitude, altimeter,
// heading, vertical speed and engine gauges on a glare-shielded panel.
import { prepareCanvas } from './canvasSizing.js';
import { drawAirspeedIndicator } from './instruments/airspeedIndicator.js';
import { drawAttitudeIndicator } from './instruments/attitudeIndicator.js';
import { drawAltimeter } from './instruments/altimeter.js';
import { drawHeadingIndicator } from './instruments/headingIndicator.js';
import { drawVerticalSpeedIndicator } from './instruments/verticalSpeedIndicator.js';
import { drawEngineGauge } from './instruments/engineGauge.js';

const W = 820;
const H = 150;

/** Draws all six instruments into a row; used by the HUD strip and the cockpit panel texture. */
export function drawInstrumentRow(ctx, readout, x0, y, r, gap, glow = 1) {
  const draws = [drawAirspeedIndicator, drawAttitudeIndicator, drawAltimeter, drawHeadingIndicator, drawVerticalSpeedIndicator, drawEngineGauge];
  draws.forEach((draw, i) => draw(ctx, x0 + i * gap, y, r, readout, glow));
}

/** Creates the strip on its canvas element. */
export function createInstrumentStrip(canvas) {
  return {
    draw(readout) {
      const ctx = prepareCanvas(canvas, W, H);
      ctx.save();
      const panel = ctx.createLinearGradient(0, 0, 0, H);
      panel.addColorStop(0, 'rgba(22,26,33,0.92)');
      panel.addColorStop(1, 'rgba(10,12,16,0.94)');
      ctx.fillStyle = panel;
      ctx.beginPath();
      ctx.roundRect(4, 6, W - 8, H - 8, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,196,120,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      drawInstrumentRow(ctx, readout, 72, 78, 64, 135, 1);
    },
  };
}
