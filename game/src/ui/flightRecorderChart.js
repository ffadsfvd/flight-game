// Draws the flight data recorder for the debrief: altitude as a filled amber profile and airspeed
// as a cyan line against time, with a mark for every event of the sortie (take-off, rings, drops,
// photos, the bingo decision, damage, touchdowns, the crash), labelled in two staggered rows.

/** Paints `record` ({ samples, marks, duration }) into a canvas at its own pixel size. */
export function paintFlightRecorder(canvas, record, { font = 'Bahnschrift, "Segoe UI", sans-serif' } = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const samples = record?.samples ?? [];
  const pad = { left: 58, right: 54, top: 40, bottom: 26 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  ctx.fillStyle = 'rgba(4, 9, 18, 0.72)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 10);
  ctx.fill();
  if (samples.length < 2) {
    ctx.fillStyle = '#a9b4c4';
    ctx.font = `600 18px ${font}`;
    ctx.fillText('No flight recorded', pad.left, H / 2);
    return;
  }
  const duration = Math.max(record.duration, samples.at(-1).t, 1);
  const maxAlt = Math.max(200, ...samples.map((s) => s.altFt)) * 1.12;
  const minAlt = Math.min(0, ...samples.map((s) => s.altFt));
  const maxKt = Math.max(60, ...samples.map((s) => s.kt)) * 1.1;
  const x = (t) => pad.left + (t / duration) * plotW;
  const yAlt = (a) => pad.top + plotH - ((a - minAlt) / (maxAlt - minAlt)) * plotH;
  const yKt = (k) => pad.top + plotH - (k / maxKt) * plotH;

  // Grid and axes: altitude feet on the left, knots on the right, minutes along the bottom.
  ctx.font = `600 13px ${font}`;
  ctx.lineWidth = 1;
  const altStep = niceStep(maxAlt - minAlt, 4);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let a = Math.ceil(minAlt / altStep) * altStep; a <= maxAlt; a += altStep) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(pad.left, yAlt(a));
    ctx.lineTo(W - pad.right, yAlt(a));
    ctx.stroke();
    ctx.fillStyle = '#ffc46a';
    ctx.fillText(`${Math.round(a)}`, pad.left - 8, yAlt(a));
  }
  ctx.textAlign = 'left';
  const ktStep = niceStep(maxKt, 4);
  for (let k = ktStep; k <= maxKt; k += ktStep) {
    ctx.fillStyle = '#5fe3d0';
    ctx.fillText(`${Math.round(k)}`, W - pad.right + 8, yKt(k));
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const tStep = niceStep(duration, 6);
  for (let t = 0; t <= duration + 0.1; t += tStep) {
    ctx.fillStyle = '#a9b4c4';
    ctx.fillText(clock(t), x(t), H - pad.bottom + 6);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffc46a';
  ctx.textAlign = 'left';
  ctx.fillText('ALT FT', 8, pad.top - 10);
  ctx.fillStyle = '#5fe3d0';
  ctx.textAlign = 'right';
  ctx.fillText('KT', W - 8, pad.top - 10);

  // Altitude profile, filled.
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  grad.addColorStop(0, 'rgba(255,190,90,0.55)');
  grad.addColorStop(1, 'rgba(255,150,60,0.06)');
  ctx.beginPath();
  ctx.moveTo(x(samples[0].t), yAlt(minAlt));
  for (const s of samples) ctx.lineTo(x(s.t), yAlt(s.altFt));
  ctx.lineTo(x(samples.at(-1).t), yAlt(minAlt));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  samples.forEach((s, i) => (i ? ctx.lineTo(x(s.t), yAlt(s.altFt)) : ctx.moveTo(x(s.t), yAlt(s.altFt))));
  ctx.strokeStyle = '#ffc46a';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Airspeed line, lightly smoothed (five samples) so gust ripples do not hide the profile.
  const smooth = samples.map((s, i) => {
    const near = samples.slice(Math.max(0, i - 2), i + 3);
    return near.reduce((sum, n) => sum + n.kt, 0) / near.length;
  });
  ctx.beginPath();
  samples.forEach((s, i) => (i ? ctx.lineTo(x(s.t), yKt(smooth[i])) : ctx.moveTo(x(s.t), yKt(smooth[i]))));
  ctx.strokeStyle = '#5fe3d0';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Event marks: a line down the plot, the icon on the profile, the label in one of two rows.
  const marks = (record.marks ?? []).filter((m) => m.t <= duration + 1);
  const rowEnds = [-Infinity, -Infinity];
  ctx.font = `700 12px ${font}`;
  for (const m of marks) {
    const style = MARK_STYLE[m.kind] ?? MARK_STYLE.ring;
    const mx = x(m.t);
    const near = samples.reduce((best, s) => (Math.abs(s.t - m.t) < Math.abs(best.t - m.t) ? s : best), samples[0]);
    ctx.strokeStyle = style.color;
    ctx.globalAlpha = m.kind === 'ring' ? 0.45 : 0.8;
    ctx.lineWidth = m.kind === 'ring' ? 1.5 : 2.5;
    ctx.setLineDash(m.kind === 'ring' ? [2, 3] : [4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, pad.top - 4);
    ctx.lineTo(mx, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = style.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${m.kind === 'ring' ? 11 : 14}px ${font}`;
    ctx.fillText(style.icon, mx, yAlt(near.altFt));
    const label = m.kind === 'ring' ? m.label : m.label;
    ctx.font = `700 ${m.kind === 'ring' ? 11 : 12}px ${font}`;
    const w = ctx.measureText(label).width + 8;
    let row = rowEnds[0] <= mx - w / 2 ? 0 : rowEnds[1] <= mx - w / 2 ? 1 : rowEnds[0] < rowEnds[1] ? 0 : 1;
    if (m.kind === 'ring') row = rowEnds[1] <= mx - w / 2 ? 1 : row;
    rowEnds[row] = mx + w / 2;
    const ly = 10 + row * 15;
    ctx.fillStyle = 'rgba(4,9,18,0.85)';
    ctx.fillRect(mx - w / 2, ly - 7, w, 14);
    ctx.fillStyle = style.color;
    ctx.fillText(label, mx, ly);
  }
}

/** A round tick spacing for an axis covering `range` in about `steps` steps. */
function niceStep(range, steps) {
  const raw = range / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
}

function clock(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const MARK_STYLE = {
  takeoff: { color: '#6be38a', icon: '▲' },
  touchdown: { color: '#6be38a', icon: '▼' },
  ring: { color: '#5fe3d0', icon: '◯' },
  drop: { color: '#4fb8ff', icon: '◆' },
  photo: { color: '#ff7fe0', icon: '◉' },
  decision: { color: '#ffb02e', icon: '◆' },
  damage: { color: '#ff5a4a', icon: '✱' },
  crash: { color: '#ff3b2f', icon: '✖' },
};
