// The round moving map: the archipelago painted once from the height grid (shallows, beaches,
// hills, towns, roads, runways), then drawn north-up around the aircraft each frame with the
// mission's rings, targets and airfields, other aircraft, the wind and a range ring.
import { prepareCanvas } from './canvasSizing.js';
import { INSTRUMENT_FONT } from './instruments/gaugeKit.js';
import { LANDMARKS, ROADS, TOWNS, WORLD_HALF_SIZE } from '../world/archipelagoMap.js';
import { AIRFIELDS, fromRunwayFrame } from '../world/airfieldDirectory.js';

const MAP_PX = 1024;

/** Paints the whole map once into an offscreen canvas. */
export function paintArchipelagoMap(terrain) {
  const canvas = document.createElement('canvas');
  canvas.width = MAP_PX;
  canvas.height = MAP_PX;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(MAP_PX, MAP_PX);
  const scale = (WORLD_HALF_SIZE * 2) / MAP_PX;
  for (let py = 0; py < MAP_PX; py += 1) {
    for (let px = 0; px < MAP_PX; px += 1) {
      const x = -WORLD_HALF_SIZE + (px + 0.5) * scale;
      const z = -WORLD_HALF_SIZE + (py + 0.5) * scale;
      const h = terrain.heightAt(x, z);
      let r;
      let g;
      let b;
      if (h < 0) {
        const t = Math.min(1, -h / 30);
        r = 60 - 40 * t;
        g = 190 - 110 * t;
        b = 200 - 60 * t;
      } else if (h < 4) {
        r = 232; g = 212; b = 160;
      } else if (h < 120) {
        const t = h / 120;
        r = 120 + 40 * t; g = 160 - 10 * t; b = 80;
      } else if (h < 500) {
        const t = (h - 120) / 380;
        r = 160 - 20 * t; g = 150 - 40 * t; b = 85 + 10 * t;
      } else {
        const t = Math.min(1, (h - 500) / 500);
        r = 140 + 60 * t; g = 112 + 70 * t; b = 95 + 70 * t;
      }
      const shade = py > 0 && px > 0 ? Math.max(-14, Math.min(14, (terrain.heightAt(x - scale, z - scale) - h) * 0.9)) : 0;
      const i = (py * MAP_PX + px) * 4;
      image.data[i] = r + shade;
      image.data[i + 1] = g + shade;
      image.data[i + 2] = b + shade;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const toPx = (x, z) => [(x + WORLD_HALF_SIZE) / scale, (z + WORLD_HALF_SIZE) / scale];
  ctx.strokeStyle = 'rgba(90,80,70,0.8)';
  ctx.lineWidth = 2;
  for (const road of ROADS) {
    ctx.beginPath();
    road.forEach(([x, z], i) => {
      const [px, py] = toPx(x, z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  for (const town of TOWNS) {
    const [px, py] = toPx(town.x, town.z);
    ctx.fillStyle = 'rgba(236,220,196,0.85)';
    ctx.beginPath();
    ctx.arc(px, py, (town.radius / scale) * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,90,50,0.9)';
    for (let k = 0; k < 14; k += 1) {
      const a = k * 2.4;
      const rr = ((k % 5) / 5) * (town.radius / scale) * 0.6;
      ctx.fillRect(px + Math.cos(a) * rr - 1.5, py + Math.sin(a) * rr - 1.5, 3, 3);
    }
  }
  for (const field of AIRFIELDS) {
    const a = fromRunwayFrame(field, -field.length / 2, 0);
    const b = fromRunwayFrame(field, field.length / 2, 0);
    const [ax, ay] = toPx(a.x, a.z);
    const [bx, by] = toPx(b.x, b.z);
    ctx.strokeStyle = field.kind === 'water' ? 'rgba(255,140,40,0.95)' : field.kind === 'grass' ? '#d8f0a0' : '#f6f6f0';
    ctx.lineWidth = Math.max(3, (field.width / scale) * 1.4);
    if (field.kind === 'water') ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  return { canvas, scale };
}

const ICONS = { lighthouse: '▲', volcano: '▲', arch: '∩', waterfall: '≈', peak: '▲' };

/** Creates the minimap panel on its canvas. */
export function createMinimapPanel(canvas, terrain) {
  const map = paintArchipelagoMap(terrain);
  const W = 236;
  const R = W / 2;
  let range = 3600;
  return {
    zoom() {
      range = range > 5000 ? 1800 : range * 1.6;
      return range;
    },
    set range(v) {
      range = v;
    },
    get range() {
      return range;
    },
    /** Draws the map around `centre` with `heading` and the mission `markers`. */
    draw(centre, heading, markers, others, readout) {
      const ctx = prepareCanvas(canvas, W, W);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#123a55';
      ctx.fillRect(0, 0, W, W);
      const pxPerM = R / range;
      const mapPx = pxPerM * map.scale;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(map.canvas, R - (centre.x + WORLD_HALF_SIZE) * pxPerM, R - (centre.z + WORLD_HALF_SIZE) * pxPerM, MAP_PX * mapPx, MAP_PX * mapPx);
      const toScreen = (x, z) => [R + (x - centre.x) * pxPerM, R + (z - centre.z) * pxPerM];
      // Range ring.
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(R, R, R * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `600 10px ${INSTRUMENT_FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(`${((range * 0.5) / 1852).toFixed(1)} NM`, R, R - R * 0.5 - 4);
      // Landmarks and airfield codes.
      ctx.font = `700 11px ${INSTRUMENT_FONT}`;
      for (const l of LANDMARKS) {
        const [sx, sy] = toScreen(l.x, l.z);
        ctx.fillStyle = l.kind === 'volcano' ? '#ff7a3a' : '#fff1d0';
        ctx.fillText(ICONS[l.kind] ?? '•', sx, sy + 4);
      }
      for (const field of AIRFIELDS) {
        const [sx, sy] = toScreen(field.x, field.z);
        ctx.fillStyle = 'rgba(8,14,26,0.65)';
        ctx.fillRect(sx + 6, sy - 16, 34, 13);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(field.code, sx + 8, sy - 5);
        ctx.textAlign = 'center';
      }
      // Mission markers.
      for (const m of markers) {
        const [sx, sy] = toScreen(m.x, m.z);
        const inside = Math.hypot(sx - R, sy - R) < R - 10;
        const px = inside ? sx : R + ((sx - R) / Math.hypot(sx - R, sy - R)) * (R - 10);
        const py = inside ? sy : R + ((sy - R) / Math.hypot(sx - R, sy - R)) * (R - 10);
        const color = m.color ?? (m.active ? '#ffd34d' : 'rgba(95,227,208,0.8)');
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = m.active ? 3 : 2;
        if (m.kind === 'ring') {
          ctx.beginPath();
          ctx.arc(px, py, m.active ? 6 : 4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (m.kind === 'area') {
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(5, m.radius * pxPerM), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(5, m.radius * pxPerM), 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(px, py - 7);
          ctx.lineTo(px + 6, py);
          ctx.lineTo(px, py + 7);
          ctx.lineTo(px - 6, py);
          ctx.closePath();
          ctx.fill();
        }
        if (m.label && m.active) {
          ctx.font = `700 11px ${INSTRUMENT_FONT}`;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(m.label, px, py - 10);
        }
      }
      for (const o of others) {
        const [sx, sy] = toScreen(o.x, o.z);
        ctx.fillStyle = o.color ?? '#ff6a4a';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Own aircraft.
      ctx.save();
      ctx.translate(R, R);
      ctx.rotate((heading * Math.PI) / 180);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(8, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      // Rim: north marker and wind arrow.
      ctx.strokeStyle = 'rgba(255,196,120,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(R, R, R - 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffc46a';
      ctx.font = `800 13px ${INSTRUMENT_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('N', R, 15);
      if (readout) {
        ctx.save();
        ctx.translate(W - 30, W - 30);
        ctx.fillStyle = 'rgba(8,14,26,0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate(((readout.windFrom + 180) * Math.PI) / 180);
        ctx.strokeStyle = '#5fe3d0';
        ctx.fillStyle = '#5fe3d0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(5, -5);
        ctx.lineTo(-5, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#5fe3d0';
        ctx.font = `700 10px ${INSTRUMENT_FONT}`;
        ctx.fillText(`${Math.round(readout.windKt)}KT`, W - 30, W - 6);
      }
    },
  };
}
