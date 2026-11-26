// Paints a runway surface on a canvas: asphalt with threshold bars, designators, aiming points,
// touchdown-zone marks and centreline dashes, or a mown grass strip with its stripes.

const PX_PER_M_ALONG = 4;

/** Draws a runway designator (e.g. "27") centred at (x, y), `height` px tall, optionally flipped. */
function drawDesignator(ctx, text, x, y, height, flipped) {
  ctx.save();
  ctx.translate(x, y);
  if (flipped) ctx.rotate(Math.PI);
  ctx.fillStyle = 'rgba(245,245,240,0.92)';
  ctx.font = `700 ${height}px Bahnschrift, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.scale(1, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.restore();
}

/** A canvas painted with the markings of a paved or grass runway, plus its scale in px per metre. */
export function paintRunwaySurface(field) {
  const width = field.kind === 'grass' ? 128 : 512;
  const height = Math.min(8192, Math.round(field.length * PX_PER_M_ALONG));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const pxAcross = width / field.width;
  const pxAlong = height / field.length;
  let seed = 99;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  if (field.kind === 'grass') {
    ctx.fillStyle = '#7f9e47';
    ctx.fillRect(0, 0, width, height);
    const stripe = 25 * pxAlong;
    for (let y = 0; y < height; y += stripe * 2) {
      ctx.fillStyle = 'rgba(190,210,120,0.22)';
      ctx.fillRect(0, y, width, stripe);
    }
    for (let i = 0; i < 1600; i += 1) {
      ctx.fillStyle = `rgba(${90 + rand() * 60},${110 + rand() * 50},${40 + rand() * 30},0.35)`;
      ctx.fillRect(rand() * width, rand() * height, 2 + rand() * 5, 2 + rand() * 9);
    }
    ctx.fillStyle = 'rgba(160,130,80,0.35)';
    ctx.fillRect(width * 0.3, 0, width * 0.12, height);
    ctx.fillRect(width * 0.58, 0, width * 0.12, height);
    return { canvas, pxAcross, pxAlong };
  }

  ctx.fillStyle = '#6a6863';
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 9000; i += 1) {
    const g = 80 + rand() * 40;
    ctx.fillStyle = `rgba(${g},${g},${g - 2},0.5)`;
    ctx.fillRect(rand() * width, rand() * height, 1 + rand() * 3, 1 + rand() * 6);
  }
  // Tyre marks in the touchdown zones.
  for (const end of [0, 1]) {
    for (let i = 0; i < 70; i += 1) {
      const along = (180 + rand() * 520) * pxAlong;
      const y = end === 0 ? height - along : along;
      const x = width / 2 + (rand() - 0.5) * 9 * pxAcross;
      ctx.fillStyle = 'rgba(20,20,22,0.35)';
      ctx.fillRect(x, y, 3 + rand() * 6, 20 + rand() * 80);
    }
  }
  const white = 'rgba(244,244,238,0.93)';
  ctx.fillStyle = white;
  // Edge lines.
  ctx.fillRect(1.0 * pxAcross, 0, 0.9 * pxAcross, height);
  ctx.fillRect(width - 1.9 * pxAcross, 0, 0.9 * pxAcross, height);
  // Centreline dashes: 30 m dash, 20 m gap, between the designators.
  const margin = 110;
  for (let a = margin; a < field.length - margin; a += 50) {
    ctx.fillRect(width / 2 - 0.45 * pxAcross, height - (a + 30) * pxAlong, 0.9 * pxAcross, 30 * pxAlong);
  }
  const keys = field.width >= 40 ? 12 : 8;
  const keyWidth = (field.width - 6) / (keys * 2);
  for (const end of [0, 1]) {
    const base = (a) => (end === 0 ? height - a * pxAlong : a * pxAlong);
    // Threshold piano keys (6..36 m from the end).
    for (let k = 0; k < keys; k += 1) {
      const across = 3 + keyWidth * (k * 2 + 0.5) + (k >= keys / 2 ? keyWidth : 0);
      const y0 = Math.min(base(6), base(36));
      ctx.fillRect(across * pxAcross, y0, keyWidth * pxAcross, 30 * pxAlong);
    }
    // Designator.
    drawDesignator(ctx, field.ends[end], width / 2, base(62), Math.min(width * 0.55, 20 * pxAlong * 1.4), end === 1);
    // Aiming point bars at 300 m and touchdown-zone pairs.
    for (const [at, len, bar, gap] of [[300, 45, 9, 9], [150, 22, 3, 6], [450, 22, 3, 6], [600, 22, 3, 6]]) {
      if (at > field.length * 0.45) continue;
      const y0 = Math.min(base(at), base(at + len));
      for (const side of [-1, 1]) {
        const x = width / 2 + side * (gap + bar / 2) * pxAcross - (bar / 2) * pxAcross;
        ctx.fillRect(x, y0, bar * pxAcross, len * pxAlong);
      }
    }
  }
  return { canvas, pxAcross, pxAlong };
}
