// Describes where something happened in words: "on the slopes of Monte Aurio", "in the sea off
// Porto Celeste", "short of runway 27 at Marenza International". Used by crash and landing reports.
import { ISLANDS, LANDMARKS, TOWNS } from './archipelagoMap.js';
import { AIRFIELDS, toRunwayFrame } from './airfieldDirectory.js';

/** A short phrase locating (x, z); `ground` is the terrain height there. */
export function describePlace(x, z, ground) {
  for (const field of AIRFIELDS) {
    const p = toRunwayFrame(field, x, z);
    if (Math.abs(p.across) < 250 && Math.abs(p.along) < field.length * 0.5 + 1500) {
      if (Math.abs(p.along) <= field.length * 0.5) return `at ${field.name}`;
      const end = p.along < 0 ? field.ends[0] : field.ends[1];
      return `short of runway ${end} at ${field.name}`;
    }
  }
  let nearest = null;
  let best = Infinity;
  for (const place of [...TOWNS, ...LANDMARKS]) {
    const d = Math.hypot(place.x - x, place.z - z);
    if (d < best) {
      best = d;
      nearest = place;
    }
  }
  if (ground < 0) {
    if (nearest && best < 1800) return `in the sea off ${nearest.name}`;
    let island = null;
    let islandBest = Infinity;
    for (const i of ISLANDS) {
      const d = Math.hypot(i.x - x, i.z - z) - Math.max(i.rx, i.rz);
      if (d < islandBest) {
        islandBest = d;
        island = i;
      }
    }
    return island ? `in the open sea ${(Math.max(0, islandBest) / 1852).toFixed(1)} nm from ${island.name}` : 'in the open sea';
  }
  if (nearest && best < 900) return nearest.kind ? `beside ${nearest.name}` : `on the edge of ${nearest.name}`;
  if (ground > 300) {
    const peak = LANDMARKS.find((l) => l.kind === 'peak' || l.kind === 'volcano');
    const volcano = LANDMARKS.find((l) => l.kind === 'volcano');
    if (volcano && Math.hypot(volcano.x - x, volcano.z - z) < 2400) return 'on the slopes of Mount Ignara';
    if (peak) return 'on the slopes of Monte Aurio';
  }
  for (const i of ISLANDS) {
    if (Math.hypot(i.x - x, i.z - z) < Math.max(i.rx, i.rz) * 1.1) return `on ${i.name}`;
  }
  return 'in the archipelago';
}
