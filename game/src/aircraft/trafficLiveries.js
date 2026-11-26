// Liveries for the aircraft the player shares the sky with: race rivals and the formation leader
// get a scheme built from their own colour, island traffic flies the colours of its operator, so
// no AI aircraft is mistaken for the player's.

/** Operators of the island traffic and their paint schemes. */
export const TRAFFIC_LIVERIES = {
  aeroclub: { base: '#f4f1ea', stripe: '#c8321f', accent: '#1d2a44', wing: '#f4f1ea', tip: '#c8321f', tail: '#c8321f' },
  islandPost: { base: '#f2c230', stripe: '#1f3f8a', accent: '#ffffff', wing: '#f2c230', tip: '#1f3f8a', tail: '#1f3f8a', nose: '#1f3f8a' },
  solvaraAir: { base: '#f7f7f4', stripe: '#1f6f9a', accent: '#f0a020', wing: '#f7f7f4', tip: '#f0a020', tail: '#1f6f9a' },
  farmCoop: { base: '#3f7f3a', stripe: '#f2e6c0', accent: '#f2c230', wing: '#f2c230', tip: '#3f7f3a', tail: '#3f7f3a', nose: '#f2e6c0' },
  lagoonTaxi: { base: '#ffffff', stripe: '#e8641e', accent: '#2a9d8f', wing: '#ffffff', tip: '#2a9d8f', tail: '#2a9d8f' },
  coastGuard: { base: '#e9ecef', stripe: '#d8262a', accent: '#1c2430', wing: '#e9ecef', tip: '#d8262a', tail: '#d8262a', nose: '#1c2430' },
};

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * factor))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** A full scheme in `color`: coloured fuselage and tail, white stripe, darker wing tips. */
export function liveryFromColor(color) {
  return { base: color, stripe: '#f6f3ea', accent: shade(color, 0.45), wing: shade(color, 1.08), tip: shade(color, 0.6), tail: color, nose: shade(color, 0.45) };
}
