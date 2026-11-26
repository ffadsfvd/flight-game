// The Solvara Archipelago: every island, town, landmark, valley and road, as plain data. The
// terrain, the minimap, the missions and the title screen's feature line all read from here.
// Coordinates are metres: x east, z south (north is -z), y up. The map is 16 km square.

export const ARCHIPELAGO_NAME = 'Solvara Archipelago';
export const WORLD_HALF_SIZE = 8000;
export const SEA_LEVEL = 0;

/** Islands as warped ellipses: centre, radii, rotation (rad), peak height (m) and profile shape. */
export const ISLANDS = [
  { id: 'marenza', name: 'Marenza', x: -1200, z: 1200, rx: 4300, rz: 2750, rot: 0.12, peak: 110, power: 0.9, coastNoise: 0.16, seed: 1 },
  { id: 'calvera', name: 'Calvera', x: 3700, z: -3600, rx: 2350, rz: 2150, rot: 0.3, peak: 260, power: 1.0, coastNoise: 0.12, seed: 2, volcano: { peak: 1060, radius: 0.92, crater: 0.085, craterDepth: 120 } },
  { id: 'lumeno', name: 'Lumeno', x: 4400, z: 3300, rx: 1800, rz: 1150, rot: -0.25, peak: 170, power: 1.3, coastNoise: 0.18, seed: 3 },
  { id: 'orsa', name: 'Orsa Cay', x: -5500, z: -3100, rx: 1600, rz: 1050, rot: 0.7, peak: 38, power: 0.55, coastNoise: 0.14, seed: 4 },
  { id: 'pellet', name: 'Pellet Rock', x: 6300, z: -500, rx: 380, rz: 300, rot: 0, peak: 55, power: 1.6, coastNoise: 0.25, seed: 5 },
  { id: 'gannet', name: 'Gannet Skerry', x: -6600, z: 2600, rx: 520, rz: 380, rot: 0.4, peak: 70, power: 1.5, coastNoise: 0.25, seed: 6 },
  { id: 'nesta', name: 'Nesta', x: 700, z: -5600, rx: 900, rz: 620, rot: -0.5, peak: 150, power: 1.2, coastNoise: 0.2, seed: 7 },
  { id: 'coral', name: 'Coral Keys', x: -3000, z: -5700, rx: 420, rz: 300, rot: 0.2, peak: 18, power: 0.7, coastNoise: 0.3, seed: 8 },
  { id: 'arco', name: 'Arco Islet', x: 1850, z: -1650, rx: 150, rz: 110, rot: 0.5, peak: 34, power: 1.2, coastNoise: 0.2, seed: 9 },
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

/** Towns: centre, radius and building count. Buildings avoid runways, water and steep ground. */
export const TOWNS = [
  { id: 'porto-celeste', name: 'Porto Celeste', island: 'marenza', x: -350, z: 3450, radius: 480, buildings: 380, flatten: 6 },
  { id: 'san-telmo', name: 'San Telmo', island: 'marenza', x: 1150, z: 3000, radius: 360, buildings: 150, flatten: 4 },
  { id: 'nordelle', name: 'Nordelle', island: 'marenza', x: -2000, z: -1250, radius: 380, buildings: 90, flatten: 0 },
  { id: 'ventara', name: 'Ventara', island: 'lumeno', x: 4350, z: 3950, radius: 330, buildings: 80, flatten: 0 },
  { id: 'orsa-harbour', name: 'Orsa Harbour', island: 'orsa', x: -4900, z: -2500, radius: 220, buildings: 36, flatten: 0 },
  { id: 'calvera-town', name: 'San Calvo', island: 'calvera', x: 4900, z: -2000, radius: 300, buildings: 60, flatten: 0 },
];

/** Landmarks the photo mission, the ring courses and the radio talk refer to. */
export const LANDMARKS = [
  { id: 'lighthouse', name: 'Faro Lumeno lighthouse', x: 5980, z: 3480, kind: 'lighthouse' },
  { id: 'volcano', name: 'Mount Ignara', x: 3700, z: -3600, kind: 'volcano' },
  { id: 'arch', name: 'Arco Solare', x: 1850, z: -1650, kind: 'arch', heading: 35 },
  { id: 'falls', name: 'Velo Falls', x: -2350, z: 230, kind: 'waterfall' },
  { id: 'aurio', name: 'Monte Aurio summit', x: -1800, z: 80, kind: 'peak' },
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

/** World boundary: past this radius from the centre the radio turns the pilot back. */
export const BOUNDARY_RADIUS = 7600;
