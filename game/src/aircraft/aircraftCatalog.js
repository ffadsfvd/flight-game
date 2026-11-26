// The three aircraft of Solvane Aeroworks with their flight-model numbers: mass, wing, lift and
// drag curves, engine, control rates, stability, gear and damage limits, plus what each costs and
// unlocks in the career. Speeds are m/s, masses kg, forces N.

export const AIRCRAFT = [
  {
    id: 'wren', name: 'Wren T1', role: 'Two-seat trainer', maker: 'Solvane Aeroworks', registration: 'SV-102',
    blurb: 'Forgiving low-wing trainer with fixed gear. Gentle stall, soft on the controls, sips fuel.',
    unlockRank: 0, price: 0,
    mass: 790, fuelCapacity: 70, fuelBurnFull: 0.05, fuelBurnIdle: 0.006,
    wingArea: 15.2, span: 9.8, chord: 1.55, cl0: 0.28, clAlpha: 5.1, alphaStall: 0.27, cd0: 0.029, inducedK: 0.055,
    flapCl: 0.5, flapCd: 0.05, flapDetents: [0, 0.4, 1], gearCd: 0.012, sideArea: 0.55,
    engine: 'prop', thrustStatic: 2450, propSpeedLimit: 82, spool: 0.6, propWash: 0.6, heatRate: 1.0,
    refSpeed: 46, pitchRate: 1.15, rollRate: 1.6, yawRate: 0.65, response: 4.2,
    pitchStability: 7.5, yawStability: 5.5, dihedral: 1.6, alphaTrim: 0.03,
    inertia: [1300, 1900, 1100],
    gLimit: 5.5, vne: 77, vFlapMax: 46, vGearMax: 999, vRotate: 27, vApproach: 32, gearRetracts: false,
    gearLimitFpm: 560, gearCollapseFpm: 1050,
    wheelRadius: 0.28, gear: [[0, -0.98, -1.75, 'nose'], [-1.2, -0.98, 0.32, 'main'], [1.2, -0.98, 0.32, 'main']],
    floats: null,
    crashPoints: [[0, -0.86, -2.25, 'prop'], [0, -0.05, -2.55, 'nose'], [-4.9, -0.2, 0.15, 'wingtip'], [4.9, -0.2, 0.15, 'wingtip'], [0, -0.4, 4.6, 'tail'], [0, -0.66, 0.1, 'belly'], [0, 1.05, -0.1, 'canopy'], [0, 1.4, 4.5, 'fin']],
    eye: [0, 0.62, -0.25], chaseDistance: 15, chaseHeight: 3.6,
    cargoCapacity: 120, waterCapacity: 0,
  },
  {
    id: 'heron', name: 'Heron A6', role: 'Amphibian bush hauler', maker: 'Solvane Aeroworks', registration: 'SV-618',
    blurb: 'High-wing amphibian on floats with retractable wheels. Lands on water or grass, scoops and drops water, carries cargo.',
    unlockRank: 2, price: 1800,
    mass: 1650, fuelCapacity: 150, fuelBurnFull: 0.085, fuelBurnIdle: 0.01,
    wingArea: 23, span: 14.4, chord: 1.7, cl0: 0.36, clAlpha: 5.0, alphaStall: 0.28, cd0: 0.045, inducedK: 0.046,
    flapCl: 0.62, flapCd: 0.06, flapDetents: [0, 0.45, 1], gearCd: 0.01, sideArea: 1.1,
    engine: 'prop', thrustStatic: 5200, propSpeedLimit: 76, spool: 0.8, propWash: 0.55, heatRate: 1.1,
    refSpeed: 42, pitchRate: 0.9, rollRate: 1.2, yawRate: 0.55, response: 3.4,
    pitchStability: 6.5, yawStability: 5.0, dihedral: 2.0, alphaTrim: 0.035,
    inertia: [3600, 5200, 3900],
    gLimit: 4.2, vne: 74, vFlapMax: 44, vGearMax: 55, vRotate: 26, vApproach: 31, gearRetracts: true,
    gearLimitFpm: 520, gearCollapseFpm: 1000,
    wheelRadius: 0.3, gear: [[-1.65, -2.05, -2.3, 'nose'], [1.65, -2.05, -2.3, 'nose'], [-1.65, -2.05, 0.75, 'main'], [1.65, -2.05, 0.75, 'main']],
    floats: [[-1.65, -1.85, -2.6], [1.65, -1.85, -2.6], [-1.65, -1.85, 0.2], [1.65, -1.85, 0.2], [-1.65, -1.7, 2.7], [1.65, -1.7, 2.7]],
    crashPoints: [[0, -0.55, -3.15, 'prop'], [0, 0.0, -3.3, 'nose'], [-7.2, 1.25, 0.2, 'wingtip'], [7.2, 1.25, 0.2, 'wingtip'], [0, -0.2, 6.0, 'tail'], [0, -0.75, 0.4, 'belly'], [0, 1.9, 0.3, 'canopy'], [0, 2.3, 5.8, 'fin']],
    eye: [0, 0.85, -0.9], chaseDistance: 19, chaseHeight: 4.6,
    cargoCapacity: 450, waterCapacity: 900,
  },
  {
    id: 'swiftlet', name: 'Swiftlet S9', role: 'Aerobatic light jet', maker: 'Solvane Aeroworks', registration: 'SV-901',
    blurb: 'Twin-tailed light jet built for racing and display flying. Fast, crisp roll, thirsty, lands hot.',
    unlockRank: 3, price: 4200,
    mass: 2350, fuelCapacity: 240, fuelBurnFull: 0.2, fuelBurnIdle: 0.02,
    wingArea: 16, span: 9.4, chord: 1.9, cl0: 0.12, clAlpha: 4.7, alphaStall: 0.31, cd0: 0.03, inducedK: 0.07,
    flapCl: 0.45, flapCd: 0.04, flapDetents: [0, 0.5, 1], gearCd: 0.02, sideArea: 0.7,
    engine: 'jet', thrustStatic: 14500, propSpeedLimit: 0, spool: 2.2, propWash: 0, heatRate: 0.8,
    refSpeed: 95, pitchRate: 1.6, rollRate: 3.4, yawRate: 0.7, response: 5.5,
    pitchStability: 8.5, yawStability: 6.5, dihedral: 0.8, alphaTrim: 0.02,
    inertia: [5200, 7600, 2900],
    gLimit: 8, vne: 232, vFlapMax: 80, vGearMax: 110, vRotate: 52, vApproach: 62, gearRetracts: true,
    gearLimitFpm: 650, gearCollapseFpm: 1150,
    wheelRadius: 0.3, gear: [[0, -1.25, -2.6, 'nose'], [-1.35, -1.25, 0.6, 'main'], [1.35, -1.25, 0.6, 'main']],
    floats: null,
    crashPoints: [[0, -0.1, -4.4, 'nose'], [-4.7, -0.35, 1.2, 'wingtip'], [4.7, -0.35, 1.2, 'wingtip'], [0, -0.2, 4.2, 'tail'], [0, -0.62, 0.3, 'belly'], [0, 0.95, -1.4, 'canopy'], [-1.1, 1.7, 3.9, 'fin'], [1.1, 1.7, 3.9, 'fin']],
    eye: [0, 0.68, -1.55], chaseDistance: 17, chaseHeight: 3.8,
    cargoCapacity: 0, waterCapacity: 0,
  },
];

/** Upgrades the hangar sells for each aircraft, with what they change in the flight model. */
export const UPGRADES = [
  { id: 'engine', name: 'Engine tune', price: 650, describe: '+12% thrust', apply: (spec) => ({ ...spec, thrustStatic: spec.thrustStatic * 1.12 }) },
  { id: 'tank', name: 'Long-range tank', price: 450, describe: '+35% fuel', apply: (spec) => ({ ...spec, fuelCapacity: spec.fuelCapacity * 1.35 }) },
  { id: 'gear', name: 'Reinforced gear', price: 500, describe: '+35% touchdown tolerance', apply: (spec) => ({ ...spec, gearLimitFpm: spec.gearLimitFpm * 1.35, gearCollapseFpm: spec.gearCollapseFpm * 1.25 }) },
  { id: 'cooling', name: 'Cooling kit', price: 400, describe: '-35% engine heat', apply: (spec) => ({ ...spec, heatRate: spec.heatRate * 0.65 }) },
];

/** The catalogue entry for an id (falls back to the trainer). */
export function aircraftById(id) {
  return AIRCRAFT.find((a) => a.id === id) ?? AIRCRAFT[0];
}

/** The spec with the bought upgrades applied. */
export function tunedSpec(id, upgrades = []) {
  let spec = aircraftById(id);
  for (const upgrade of UPGRADES) if (upgrades.includes(upgrade.id)) spec = upgrade.apply(spec);
  return spec;
}

/** Clean stall speed (m/s) at the given mass and flap setting, for the HUD's speed tape bands. */
export function stallSpeed(spec, mass, flaps = 0) {
  const clMax = spec.cl0 + spec.clAlpha * spec.alphaStall + spec.flapCl * flaps;
  return Math.sqrt((2 * mass * 9.81) / (1.225 * spec.wingArea * clMax));
}
