// The Solvara Archipelago: every island, town, landmark, valley and road, as plain data. The
// terrain, the minimap, the missions and the title screen's feature line all read from here.
// Coordinates are metres: x east, z south (north is -z), y up. The map is 16 km square.

export const ARCHIPELAGO_NAME = 'Solvara Archipelago';
export const WORLD_HALF_SIZE = 8000;
export const SEA_LEVEL = 0;

/**
 * Islands as warped ellipses: centre, radii, rotation (rad), peak height (m), profile shape and
 * character, which sets the island's own ground palette and vegetation: the main island's farms
 * and towns, Calvera's black volcanic rock and lava fields, green farming Lumeno, the red canyon
 * rock and mesas of Orsa Cay, alpine Nesta with forest and a snow cap, the white sand of Coral Keys.
 */
export const ISLANDS = [
  { id: 'marenza', name: 'Marenza', character: 'main', x: -1200, z: 1200, rx: 4300, rz: 2750, rot: 0.12, peak: 110, power: 0.9, coastNoise: 0.16, seed: 1 },
  { id: 'calvera', name: 'Calvera', character: 'volcanic', x: 3700, z: -3600, rx: 2350, rz: 2150, rot: 0.3, peak: 260, power: 1.0, coastNoise: 0.12, seed: 2, volcano: { peak: 1060, radius: 0.92, crater: 0.085, craterDepth: 120 } },
  { id: 'lumeno', name: 'Lumeno', character: 'green', x: 4400, z: 3300, rx: 1800, rz: 1150, rot: -0.25, peak: 170, power: 1.3, coastNoise: 0.18, seed: 3 },
  { id: 'orsa', name: 'Orsa Cay', character: 'canyon', x: -5500, z: -3100, rx: 1600, rz: 1050, rot: 0.7, peak: 38, power: 0.55, coastNoise: 0.14, seed: 4 },
  { id: 'pellet', name: 'Pellet Rock', character: 'rock', x: 6300, z: -500, rx: 380, rz: 300, rot: 0, peak: 55, power: 1.6, coastNoise: 0.25, seed: 5 },
  { id: 'gannet', name: 'Gannet Skerry', character: 'rock', x: -6600, z: 2600, rx: 520, rz: 380, rot: 0.4, peak: 70, power: 1.5, coastNoise: 0.25, seed: 6 },
  { id: 'nesta', name: 'Nesta', character: 'alpine', x: 700, z: -5600, rx: 1100, rz: 800, rot: -0.5, peak: 960, power: 1.75, coastNoise: 0.2, seed: 7 },
  { id: 'coral', name: 'Coral Keys', character: 'atoll', x: -3000, z: -5700, rx: 420, rz: 300, rot: 0.2, peak: 18, power: 0.7, coastNoise: 0.3, seed: 8 },
];

/** Flat-topped red rock mesas on Orsa Cay: centre, radius and height (m), clear of the runway. */
export const MESAS = [
  { x: -5920, z: -3650, radius: 170, height: 95 },
  { x: -5250, z: -2500, radius: 120, height: 70 },
  { x: -4790, z: -3290, radius: 150, height: 110 },
  { x: -6130, z: -3330, radius: 95, height: 60 },
];

/** Mountain ranges: a ridge line between two points, with height and half-width. */
export const RANGES = [
  { id: 'aurio', name: 'Monte Aurio range', ax: -4000, az: 250, bx: 1600, bz: -250, height: 760, width: 1100, peakAt: 0.42, peakBoost: 180 },
  { id: 'lumeno-hills', name: 'Lumeno hills', ax: 3600, az: 3000, bx: 5600, bz: 3500, height: 150, width: 500, peakAt: 0.6, peakBoost: 40 },
];

/** Corvo Canyon: a river gorge cut through the Monte Aurio range, used by the ring course. */
export const CANYONS = [
  {
    id: 'corvo', name: 'Corvo Canyon', halfWidth: 120, wall: 260,
    points: [
      [-150, 1750, 55], [-380, 1050, 60], [-260, 420, 70], [-640, -180, 62], [-560, -820, 45], [-880, -1500, 18],
    ],
  },
];

/** Sheltered water carved into an island: the seaplane base and the arch cove. */
export const LAGOONS = [
  { id: 'lumeno-lagoon', name: 'Lumeno Lagoon', x: 3250, z: 3150, rx: 720, rz: 430, rot: -0.35, depth: -7 },
];

/** Low coastal plains where the land is pressed flat: Marenza's south shore holds the airport and Porto Celeste. */
export const PLAINS = [
  { id: 'celeste-plain', name: 'Celeste plain', x: -900, z: 3000, rx: 3500, rz: 700, rot: 0.04, height: 6, keep: 0.16 },
];

/** Towns: centre, radius and most buildings. Buildings avoid runways, water and steep ground;
 *  a city grows taller blocks in its centre, a harbour town a mole with boats and a light. */
export const TOWNS = [
  { id: 'porto-celeste', name: 'Porto Celeste', island: 'marenza', x: -350, z: 3450, radius: 480, buildings: 900, flatten: 6, city: true, harbour: true },
  { id: 'san-telmo', name: 'San Telmo', island: 'marenza', x: 1150, z: 3000, radius: 360, buildings: 360, flatten: 4, harbour: true },
  { id: 'marina-sabbia', name: 'Marina Sabbia', island: 'marenza', x: -3180, z: 3370, radius: 250, buildings: 220, flatten: 0, harbour: true },
  { id: 'nordelle', name: 'Nordelle', island: 'marenza', x: -2000, z: -1250, radius: 380, buildings: 260, flatten: 0, stone: 0.45, slate: 0.35 },
  { id: 'ventara', name: 'Ventara', island: 'lumeno', x: 4350, z: 3950, radius: 330, buildings: 220, flatten: 0, harbour: true },
  { id: 'orsa-harbour', name: 'Orsa Harbour', island: 'orsa', x: -4900, z: -2500, radius: 220, buildings: 110, flatten: 0, harbour: true, stone: 0.5 },
  { id: 'calvera-town', name: 'San Calvo', island: 'calvera', x: 4900, z: -2000, radius: 300, buildings: 170, flatten: 0, harbour: true, stone: 0.4, slate: 0.25 },
];

/** Landmarks the photo mission, the ring courses and the radio talk refer to. */
export const LANDMARKS = [
  { id: 'lighthouse', name: 'Faro Lumeno lighthouse', x: 5980, z: 3480, kind: 'lighthouse' },
  { id: 'volcano', name: 'Mount Ignara', x: 3700, z: -3600, kind: 'volcano' },
  { id: 'arch', name: 'Arco Solare', x: 1850, z: -1650, kind: 'arch', heading: 15 },
  { id: 'falls', name: 'Velo Falls', x: -2350, z: 230, kind: 'waterfall' },
  { id: 'aurio', name: 'Monte Aurio summit', x: -1800, z: 80, kind: 'peak' },
  { id: 'radio-mast', name: 'Monte Aurio radio mast', x: -1650, z: 190, kind: 'mast', height: 110 },
  { id: 'wind-farm', name: 'Lumeno wind farm', x: 4750, z: 3260, kind: 'turbines', count: 5, heading: 76, spacing: 130 },
  { id: 'castle', name: 'Rocca Celeste ruins', x: -3350, z: 1500, kind: 'castle' },
  { id: 'nesta-peak', name: 'Monte Nesta', x: 700, z: -5600, kind: 'peak' },
];

/** Roads as polylines of [x, z]; they follow the ground and connect towns and airfields. */
export const ROADS = [
  [[-2050, 3250], [-1200, 3380], [-350, 3450]],
  [[-350, 3450], [400, 3250], [1150, 3000]],
  [[1150, 3000], [600, 2300], [-150, 1750]],
  [[-2000, -1250], [-1400, -1350], [-880, -1500]],
  [[4350, 3950], [4000, 3600], [3600, 3420]],
  [[-4900, -2500], [-5300, -2850]],
  [[4900, -2000], [4300, -2350], [3400, -2500], [2350, -2950]],
];

/** Rising air for soaring: thermal columns over hot ground, centre, radius and core lift (m/s). */
export const THERMALS = [
  { id: 'mesa-north', x: -5920, z: -3650, radius: 180, lift: 5.6, top: 1100 },
  { id: 'mesa-east', x: -4790, z: -3290, radius: 170, lift: 5.0, top: 1000 },
  { id: 'orsa-plain', x: -5300, z: -2900, radius: 210, lift: 4.3, top: 950 },
  { id: 'lava-fields', x: 3000, z: -3000, radius: 260, lift: 5.5, top: 1300 },
  { id: 'celeste-fields', x: -1600, z: 2500, radius: 220, lift: 3.6, top: 900 },
  { id: 'lumeno-farms', x: 4700, z: 3700, radius: 200, lift: 3.4, top: 850 },
];

/** How gusty and bumpy the air is over each island character (1 = the main island). */
export const WIND_CHARACTER = { main: 1, volcanic: 1.5, green: 0.9, canyon: 1.25, alpine: 1.8, rock: 1.3, atoll: 0.8 };

/** World boundary: past this radius from the centre the radio turns the pilot back. */
export const BOUNDARY_RADIUS = 7600;

/** The island whose shape (x, z) lies in, or lies nearest to, by normalised ellipse distance. */
export function islandAt(x, z) {
  let best = ISLANDS[0];
  let bestDistance = Infinity;
  for (const island of ISLANDS) {
    const dx = x - island.x;
    const dz = z - island.z;
    const c = Math.cos(island.rot);
    const s = Math.sin(island.rot);
    const u = (dx * c + dz * s) / island.rx;
    const v = (-dx * s + dz * c) / island.rz;
    const d = u * u + v * v;
    if (d < bestDistance) {
      bestDistance = d;
      best = island;
    }
  }
  return best;
}
