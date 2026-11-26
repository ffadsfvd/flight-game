// The shapes and paint of the three aircraft as data for the model builder: fuselage
// cross-sections, wing and tail stations, control-surface spans, gear legs, floats, propeller or
// jet nozzle, livery colours and light positions. Model space: nose -z, up +y, right +x.

export const AIRCRAFT_DESIGNS = {
  wren: {
    livery: { base: '#f5f0e6', stripe: '#13827f', accent: '#f0892a', wing: '#f5f0e6', tip: '#f0892a', tail: '#13827f', textAt: 0.66 },
    fuselage: {
      squareness: 2.3,
      sections: [
        { z: -2.32, w: 0.3, h: 0.3, y: -0.02 }, { z: -2.2, w: 0.44, h: 0.42, y: -0.02 }, { z: -1.8, w: 0.54, h: 0.52, y: 0 },
        { z: -1.1, w: 0.6, h: 0.6, y: 0.04 }, { z: -0.3, w: 0.62, h: 0.62, y: 0.06 }, { z: 0.6, w: 0.58, h: 0.58, y: 0.08 },
        { z: 1.6, w: 0.44, h: 0.47, y: 0.12 }, { z: 2.7, w: 0.3, h: 0.35, y: 0.18 }, { z: 3.8, w: 0.17, h: 0.24, y: 0.26 },
        { z: 4.6, w: 0.08, h: 0.14, y: 0.32 }, { z: 4.8, w: 0.02, h: 0.04, y: 0.34 },
      ],
    },
    canopy: { w: 0.5, h: 0.52, length: 1.05, y: 0.48, z: -0.35 },
    pilot: { y: 0.1, z: -0.2 },
    wing: {
      root: { x: 0.45, le: -0.78, chord: 1.65, y: -0.42, t: 0.14 },
      tip: { x: 4.9, le: -0.55, chord: 1.1, y: -0.03, t: 0.11 },
      flap: [0.6, 2.5, 0.3], aileron: [2.9, 4.6, 0.28],
    },
    stabilizer: { root: { x: 0.1, le: 3.95, chord: 0.95, y: 0.3, t: 0.09 }, tip: { x: 1.75, le: 4.2, chord: 0.62, y: 0.3, t: 0.08 }, elevator: 0.38 },
    fins: [{ x: 0, cant: 0, root: { x: 0.38, le: 3.72, chord: 1.08, y: 0, t: 0.1 }, tip: { x: 1.55, le: 4.25, chord: 0.6, y: 0, t: 0.08 }, rudder: 0.36 }],
    propeller: { z: -2.32, y: -0.02, radius: 0.86, blades: 2, spinner: 0.22, spinnerLength: 0.42 },
    gear: {
      retracts: false,
      legs: [
        { attach: [0, -0.45, -1.75], wheel: [0, -0.98, -1.75], pant: true },
        { attach: [-0.45, -0.42, 0.3], wheel: [-1.2, -0.98, 0.32], pant: true },
        { attach: [0.45, -0.42, 0.3], wheel: [1.2, -0.98, 0.32], pant: true },
      ],
    },
    lights: { left: [-4.92, -0.02, -0.1], right: [4.92, -0.02, -0.1], tail: [0, 0.36, 4.82], landing: [-1.9, -0.33, -0.76] },
    panel: { z: -1.02, y: 0.17, width: 0.98, tilt: 0.36 },
  },
  heron: {
    livery: { base: '#f7f4ee', stripe: '#e8641e', accent: '#1e3a5f', wing: '#f7f4ee', tip: '#e8641e', tail: '#e8641e', textAt: 0.62 },
    fuselage: {
      squareness: 3.2,
      sections: [
        { z: -3.05, w: 0.36, h: 0.36, y: 0.15 }, { z: -2.9, w: 0.55, h: 0.55, y: 0.15 }, { z: -2.4, w: 0.68, h: 0.7, y: 0.2 },
        { z: -1.5, w: 0.78, h: 0.85, y: 0.3 }, { z: -0.4, w: 0.82, h: 0.95, y: 0.35 }, { z: 1.0, w: 0.78, h: 0.9, y: 0.35 },
        { z: 2.4, w: 0.6, h: 0.7, y: 0.45 }, { z: 3.8, w: 0.4, h: 0.48, y: 0.6 }, { z: 5.2, w: 0.2, h: 0.3, y: 0.8 },
        { z: 6.1, w: 0.08, h: 0.16, y: 0.9 }, { z: 6.25, w: 0.02, h: 0.05, y: 0.92 },
      ],
    },
    canopy: { w: 0.74, h: 0.42, length: 1.25, y: 0.98, z: -1.05 },
    pilot: { y: 0.45, z: -0.85 },
    wing: {
      root: { x: 0.3, le: -0.95, chord: 1.78, y: 1.32, t: 0.14 },
      tip: { x: 7.2, le: -0.85, chord: 1.45, y: 1.38, t: 0.12 },
      flap: [0.5, 3.8, 0.3], aileron: [4.2, 6.9, 0.28],
      struts: [[0.72, -0.35, -0.2], [3.6, 1.28, -0.3]],
    },
    stabilizer: { root: { x: 0.1, le: 5.0, chord: 1.2, y: 0.95, t: 0.09 }, tip: { x: 2.6, le: 5.35, chord: 0.8, y: 0.95, t: 0.08 }, elevator: 0.38 },
    fins: [{ x: 0, cant: 0, root: { x: 0.98, le: 4.75, chord: 1.55, y: 0, t: 0.1 }, tip: { x: 2.6, le: 5.6, chord: 0.85, y: 0, t: 0.08 }, rudder: 0.36 }],
    propeller: { z: -3.08, y: 0.15, radius: 1.02, blades: 3, spinner: 0.26, spinnerLength: 0.5 },
    floats: {
      x: 1.65, color: '#e8641e', top: '#f7f4ee',
      sections: [
        { z: -3.7, w: 0.08, h: 0.08, y: -1.42 }, { z: -3.4, w: 0.3, h: 0.28, y: -1.46 }, { z: -2.6, w: 0.42, h: 0.36, y: -1.5 },
        { z: 0, w: 0.45, h: 0.38, y: -1.52 }, { z: 2.4, w: 0.36, h: 0.3, y: -1.48 }, { z: 3.9, w: 0.12, h: 0.12, y: -1.4 }, { z: 4.1, w: 0.03, h: 0.03, y: -1.38 },
      ],
      struts: [[[1.65, -1.16, -1.7], [0.6, -0.42, -1.3]], [[1.65, -1.16, 1.0], [0.6, -0.42, 0.7]]],
    },
    gear: {
      retracts: true, stowedY: -1.5,
      legs: [
        { attach: [-1.65, -1.6, -2.3], wheel: [-1.65, -2.05, -2.3] }, { attach: [1.65, -1.6, -2.3], wheel: [1.65, -2.05, -2.3] },
        { attach: [-1.65, -1.6, 0.75], wheel: [-1.65, -2.05, 0.75] }, { attach: [1.65, -1.6, 0.75], wheel: [1.65, -2.05, 0.75] },
      ],
    },
    lights: { left: [-7.22, 1.38, -0.2], right: [7.22, 1.38, -0.2], tail: [0, 0.95, 6.27], landing: [-2.4, 1.2, -0.96] },
    panel: { z: -1.82, y: 0.46, width: 1.2, tilt: 0.32, yoke: true },
  },
  swiftlet: {
    livery: { base: '#1f3f8a', stripe: '#f2b632', accent: '#ffffff', wing: '#1f3f8a', tip: '#f2b632', tail: '#f2b632', textAt: 0.6, nose: '#f4f2ec' },
    fuselage: {
      squareness: 2.0,
      sections: [
        { z: -4.5, w: 0.03, h: 0.03, y: -0.05 }, { z: -4.2, w: 0.18, h: 0.16, y: -0.05 }, { z: -3.5, w: 0.36, h: 0.34, y: 0 },
        { z: -2.5, w: 0.52, h: 0.5, y: 0.08 }, { z: -1.2, w: 0.6, h: 0.58, y: 0.1 }, { z: 0.2, w: 0.74, h: 0.56, y: 0.05 },
        { z: 1.6, w: 0.72, h: 0.52, y: 0.05 }, { z: 3.0, w: 0.6, h: 0.46, y: 0.05 }, { z: 4.0, w: 0.48, h: 0.39, y: 0.05 }, { z: 4.32, w: 0.45, h: 0.37, y: 0.05 },
      ],
    },
    canopy: { w: 0.44, h: 0.46, length: 1.45, y: 0.42, z: -1.55 },
    pilot: { y: 0.06, z: -1.5 },
    wing: {
      root: { x: 0.5, le: -0.7, chord: 2.7, y: -0.12, t: 0.1 },
      tip: { x: 4.6, le: 1.15, chord: 1.05, y: 0.02, t: 0.08 },
      flap: [0.7, 2.4, 0.28], aileron: [2.8, 4.3, 0.27],
      tipPods: true,
    },
    stabilizer: { root: { x: 0.35, le: 3.35, chord: 1.2, y: 0.02, t: 0.08 }, tip: { x: 2.05, le: 3.95, chord: 0.6, y: 0.06, t: 0.07 }, elevator: 0.38 },
    fins: [
      { x: -0.45, cant: 0.36, root: { x: 0.3, le: 2.9, chord: 1.5, y: 0, t: 0.09 }, tip: { x: 1.65, le: 3.9, chord: 0.7, y: 0, t: 0.07 }, rudder: 0.34 },
      { x: 0.45, cant: -0.36, root: { x: 0.3, le: 2.9, chord: 1.5, y: 0, t: 0.09 }, tip: { x: 1.65, le: 3.9, chord: 0.7, y: 0, t: 0.07 }, rudder: 0.34 },
    ],
    jet: { z: 4.32, y: 0.05, radius: 0.34 },
    intakes: [[-0.72, 0.05, 0.1], [0.72, 0.05, 0.1]],
    gear: {
      retracts: true,
      legs: [
        { attach: [0, -0.45, -2.6], wheel: [0, -1.25, -2.6], fold: 'forward' },
        { attach: [-1.3, -0.3, 0.6], wheel: [-1.35, -1.25, 0.6], fold: 'inward' },
        { attach: [1.3, -0.3, 0.6], wheel: [1.35, -1.25, 0.6], fold: 'inward' },
      ],
    },
    lights: { left: [-4.75, 0.02, 1.55], right: [4.75, 0.02, 1.55], tail: [0, 0.4, 4.4], landing: [0, -0.62, -2.9] },
    panel: { z: -2.2, y: 0.12, width: 0.92, tilt: 0.36 },
  },
};
