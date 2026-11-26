// The five aircraft of Solvane Aeroworks (trainer, amphibian, biplane, twin and jet) with their
// flight-model numbers: mass, wing, lift and drag curves, engine, control rates, stability, gear
// and damage limits, plus what each costs and unlocks in the career. Speeds are m/s, masses kg,
// forces N.

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
    id: 'kestrel', name: 'Kestrel B2', role: 'Aerobatic biplane', maker: 'Solvane Aeroworks', registration: 'SV-327',
    blurb: 'Two wings, one seat and a big round cowling: a barnstorming taildragger that rolls like a top, stalls honestly and lands slow.',
    unlockRank: 2, price: 2600,
    mass: 760, fuelCapacity: 90, fuelBurnFull: 0.07, fuelBurnIdle: 0.008,
    wingArea: 18.5, span: 7.6, chord: 1.2, cl0: 0.2, clAlpha: 4.6, alphaStall: 0.26, cd0: 0.042, inducedK: 0.075,
    flapCl: 0.25, flapCd: 0.03, flapDetents: [0, 0.4, 1], gearCd: 0.014, sideArea: 0.6,
    engine: 'prop', thrustStatic: 3300, propSpeedLimit: 80, spool: 0.7, propWash: 0.7, heatRate: 1.05,
    refSpeed: 44, pitchRate: 1.5, rollRate: 3.0, yawRate: 0.85, response: 5.0,
    pitchStability: 6.5, yawStability: 5.0, dihedral: 1.2, alphaTrim: 0.03,
    inertia: [1100, 1500, 800],
    gLimit: 7, vne: 85, vFlapMax: 45, vGearMax: 999, vRotate: 25, vApproach: 30, gearRetracts: false,
    gearLimitFpm: 600, gearCollapseFpm: 1100,
    wheelRadius: 0.3, gear: [[-0.95, -1.35, -1.05, 'main'], [0.95, -1.35, -1.05, 'main'], [0, -0.46, 4.0, 'tailwheel']],
    floats: null,
    crashPoints: [[0, -0.95, -2.15, 'prop'], [0, 0.05, -2.2, 'nose'], [-3.85, 1.0, -0.85, 'wingtip'], [3.85, 1.0, -0.85, 'wingtip'], [-3.6, -0.3, -0.5, 'wingtip'], [3.6, -0.3, -0.5, 'wingtip'], [0, -0.45, 4.15, 'tail'], [0, -0.75, 0.3, 'belly'], [0, 0.95, 0.25, 'canopy'], [0, 1.3, 4.0, 'fin']],
    eye: [0, 0.74, 0.25], chaseDistance: 13, chaseHeight: 3.2,
    cargoCapacity: 0, waterCapacity: 0,
  },
  {
    id: 'pelican', name: 'Pelican T6', role: 'Twin-engine island hopper', maker: 'Solvane Aeroworks', registration: 'SV-640',
    blurb: 'Two engines, eight seats and a high wing for rough island strips. Heavy, steady in gusts, carries the most cargo and lands short for its size.',
    unlockRank: 3, price: 3400,
    mass: 2300, fuelCapacity: 260, fuelBurnFull: 0.13, fuelBurnIdle: 0.016,
    wingArea: 26, span: 16.4, chord: 1.6, cl0: 0.32, clAlpha: 5.0, alphaStall: 0.27, cd0: 0.036, inducedK: 0.045,
    flapCl: 0.6, flapCd: 0.055, flapDetents: [0, 0.45, 1], gearCd: 0.012, sideArea: 1.4,
    engine: 'prop', thrustStatic: 7600, propSpeedLimit: 88, spool: 0.8, propWash: 0.45, heatRate: 1.0,
    refSpeed: 50, pitchRate: 0.85, rollRate: 1.1, yawRate: 0.5, response: 3.2,
    pitchStability: 7.5, yawStability: 6.0, dihedral: 2.2, alphaTrim: 0.035,
    inertia: [5200, 8200, 5600],
    gLimit: 3.8, vne: 90, vFlapMax: 50, vGearMax: 999, vRotate: 31, vApproach: 36, gearRetracts: false,
    gearLimitFpm: 560, gearCollapseFpm: 1050,
    wheelRadius: 0.34, gear: [[0, -1.25, -2.6, 'nose'], [-2.6, -1.25, 0.45, 'main'], [2.6, -1.25, 0.45, 'main']],
    floats: null,
    crashPoints: [[-2.6, -0.42, -2.62, 'prop'], [2.6, -0.42, -2.62, 'prop'], [0, -0.1, -3.35, 'nose'], [-8.2, 0.85, -0.1, 'wingtip'], [8.2, 0.85, -0.1, 'wingtip'], [0, 0.0, 5.7, 'tail'], [0, -0.68, 0.3, 'belly'], [0, 0.95, -1.0, 'canopy'], [0, 2.6, 5.4, 'fin']],
    eye: [0, 0.72, -1.35], chaseDistance: 25, chaseHeight: 5.6,
    cargoCapacity: 700, waterCapacity: 0,
  },
  {
    id: 'swallow', name: 'Swallow M2', role: 'Self-launching motor glider', maker: 'Solvane Aeroworks', registration: 'SV-205',
    blurb: 'A 17-metre sailplane with a small nose motor to launch itself. Switch the motor off and it floats on thermals and ridge lift for hours.',
    unlockRank: 1, price: 1500,
    mass: 420, fuelCapacity: 20, fuelBurnFull: 0.012, fuelBurnIdle: 0.002,
    wingArea: 11.5, span: 17.2, chord: 0.7, cl0: 0.35, clAlpha: 5.6, alphaStall: 0.22, cd0: 0.011, inducedK: 0.018,
    flapCl: 0.3, flapCd: 0.09, flapDetents: [0, 0.4, 1], gearCd: 0.004, sideArea: 0.45,
    engine: 'prop', thrustStatic: 1150, propSpeedLimit: 55, spool: 0.5, propWash: 0.3, heatRate: 0.7,
    refSpeed: 30, pitchRate: 1.0, rollRate: 0.9, yawRate: 0.55, response: 3.0,
    pitchStability: 6.0, yawStability: 4.5, dihedral: 2.4, alphaTrim: 0.04,
    inertia: [900, 1700, 900],
    gLimit: 5.3, vne: 60, vFlapMax: 45, vGearMax: 999, vRotate: 20, vApproach: 25, gearRetracts: false,
    gearLimitFpm: 420, gearCollapseFpm: 900,
    wheelRadius: 0.2, gear: [[0, -0.58, -2.3, 'nose'], [-0.9, -0.62, 0.25, 'main'], [0.9, -0.62, 0.25, 'main']],
    floats: null,
    crashPoints: [[0, -0.22, -3.05, 'nose'], [-8.6, 0.65, -0.2, 'wingtip'], [8.6, 0.65, -0.2, 'wingtip'], [0, -0.3, 4.3, 'tail'], [0, -0.36, -1.0, 'belly'], [0, 0.85, -1.6, 'canopy'], [0, 1.7, 4.0, 'fin']],
    eye: [0, 0.58, -1.55], chaseDistance: 17, chaseHeight: 3.6,
    cargoCapacity: 0, waterCapacity: 0,
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
