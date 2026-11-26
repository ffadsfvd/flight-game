// The airfields of the archipelago as data: where each runway lies, how long and wide it is,
// what stands beside it, and the frame helpers every system uses to talk about a runway. Kinds:
// paved, grass, water (a seaplane lane) and platform (a deck on legs out at sea).

export const AIRFIELDS = [
  {
    id: 'marenza', name: 'Marenza International', code: 'SVMZ', kind: 'paved', island: 'marenza',
    x: -2300, z: 2950, heading: 90, length: 1800, width: 45, elevation: 12,
    ends: ['09', '27'], edgeLights: true, approachLights: true, papi: true,
    tower: true, hangars: 3, terminal: true, fuel: true, apronSide: 1, apronOffset: 150, apronLength: 620, apronDepth: 120, parallelTaxiway: true,
    flatHalfWidth: 330, frequency: '118.40',
  },
  {
    id: 'orsa', name: 'Orsa Cay Field', code: 'SVOC', kind: 'paved', island: 'orsa',
    x: -5550, z: -3080, heading: 40, length: 1050, width: 30, elevation: 20,
    ends: ['04', '22'], edgeLights: true, approachLights: false, papi: true,
    tower: false, hangars: 1, terminal: false, fuel: true, apronSide: 1, apronOffset: 95, apronLength: 260, apronDepth: 70,
    flatHalfWidth: 200, frequency: '122.75',
  },
  {
    id: 'calvera', name: 'Calvera Highstrip', code: 'SVCH', kind: 'grass', island: 'calvera',
    x: 2080, z: -3120, heading: 172, length: 640, width: 26, elevation: 'auto',
    ends: ['17', '35'], edgeLights: false, approachLights: false, papi: false,
    tower: false, hangars: 1, terminal: false, fuel: true, apronSide: -1, apronOffset: 60, apronLength: 120, apronDepth: 50,
    flatHalfWidth: 110, frequency: '123.10',
  },
  {
    id: 'lumeno', name: 'Lumeno Lagoon Seaplane Base', code: 'SVLL', kind: 'water', island: 'lumeno',
    x: 3250, z: 3150, heading: 70, length: 950, width: 70, elevation: 0,
    ends: ['07W', '25W'], edgeLights: false, approachLights: false, papi: false,
    tower: false, hangars: 1, terminal: false, fuel: true, apronSide: 1, apronOffset: 470, apronLength: 90, apronDepth: 40,
    flatHalfWidth: 0, frequency: '121.90',
  },
  {
    id: 'sette', name: 'Sette Offshore Platform', code: 'SVSP', kind: 'platform', island: null,
    x: -4300, z: 5000, heading: 90, length: 300, width: 24, elevation: 22, deckWidth: 40, crossingHeight: 4,
    ends: ['09', '27'], edgeLights: true, approachLights: false, papi: false,
    tower: false, hangars: 0, terminal: false, fuel: true, apronSide: 1, apronOffset: 0, apronLength: 0, apronDepth: 0,
    flatHalfWidth: 0, frequency: '123.45',
  },
  {
    id: 'nesta', name: 'Nesta Mountain Strip', code: 'SVNM', kind: 'grass', island: 'nesta',
    x: 260, z: -4935, heading: 92, length: 520, width: 22, elevation: 'auto',
    ends: ['09', '27'], edgeLights: false, approachLights: false, papi: false,
    tower: false, hangars: 1, terminal: false, fuel: false, apronSide: 1, apronOffset: 45, apronLength: 90, apronDepth: 35,
    flatHalfWidth: 70, frequency: '122.30',
  },
  {
    id: 'coral', name: 'Coral Keys Strip', code: 'SVCK', kind: 'grass', island: 'coral',
    x: -3000, z: -5690, heading: 84, length: 380, width: 20, elevation: 'auto',
    ends: ['08', '26'], edgeLights: false, approachLights: false, papi: false,
    tower: false, hangars: 0, terminal: false, fuel: false, apronSide: -1, apronOffset: 35, apronLength: 50, apronDepth: 25,
    flatHalfWidth: 55, frequency: '122.30',
  },
];

/** The airfield with this id (throws on a typo, so a mission can never point at nothing). */
export function airfieldById(id) {
  const field = AIRFIELDS.find((a) => a.id === id);
  if (!field) throw new Error(`unknown airfield ${id}`);
  return field;
}

/** Unit vectors of a runway: forward along `heading` (deg, 0 = north = -z) and right of it. */
export function runwayAxes(field) {
  const h = (field.heading * Math.PI) / 180;
  return { fx: Math.sin(h), fz: -Math.cos(h), rx: Math.cos(h), rz: Math.sin(h) };
}

/** Position of (x, z) in a runway's frame: metres along the heading and to its right. */
export function toRunwayFrame(field, x, z) {
  const { fx, fz, rx, rz } = runwayAxes(field);
  const dx = x - field.x;
  const dz = z - field.z;
  return { along: dx * fx + dz * fz, across: dx * rx + dz * rz };
}

/** World (x, z) of a point given in a runway's frame. */
export function fromRunwayFrame(field, along, across) {
  const { fx, fz, rx, rz } = runwayAxes(field);
  return { x: field.x + fx * along + rx * across, z: field.z + fz * along + rz * across };
}

/**
 * One landing direction of a runway: end 0 lands along the heading (threshold at the start of the
 * strip), end 1 lands against it. Gives the threshold, the landing heading and the frame sign.
 */
export function landingDirection(field, end) {
  const sign = end === 0 ? 1 : -1;
  const threshold = fromRunwayFrame(field, -sign * field.length * 0.5, 0);
  const heading = (field.heading + (end === 0 ? 0 : 180)) % 360;
  return { sign, threshold, heading, name: field.ends[end] };
}

/** Is (x, z) on the paved or grass strip itself (with a small margin)? */
export function isOnRunway(field, x, z, margin = 2) {
  const p = toRunwayFrame(field, x, z);
  return Math.abs(p.along) <= field.length * 0.5 + margin && Math.abs(p.across) <= field.width * 0.5 + margin;
}

/** The airfield whose zone contains (x, z), or null. Water bases count their lane and dock. */
export function airfieldAt(x, z, extra = 150) {
  for (const field of AIRFIELDS) {
    const p = toRunwayFrame(field, x, z);
    if (Math.abs(p.along) <= field.length * 0.5 + extra && Math.abs(p.across) <= Math.max(field.flatHalfWidth, field.width) + extra) return field;
  }
  return null;
}

/** The airfield nearest to (x, z) with its distance in metres. */
export function nearestAirfield(x, z, filter = () => true) {
  let best = null;
  let bestDistance = Infinity;
  for (const field of AIRFIELDS) {
    if (!filter(field)) continue;
    const d = Math.hypot(field.x - x, field.z - z);
    if (d < bestDistance) {
      bestDistance = d;
      best = field;
    }
  }
  return { field: best, distance: bestDistance };
}
