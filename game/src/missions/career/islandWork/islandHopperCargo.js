// Island Work 5: a two-leg freight run, Marenza to Orsa Cay to Calvera Highstrip, with too little fuel for both.
export const islandHopperCargo = {
  id: 'island-hopper', chapter: 2, title: 'Island Hopper', kind: 'Multi-leg cargo', giver: 'mags', aircraft: 'wren',
  summary: 'Deliver spares to Orsa Cay, then fly on to Calvera Highstrip. The tanks hold one leg and a reserve: refuel at Orsa (R) or gamble.',
  time: 'golden', wind: { from: 250, speed: 5, gust: 2, turbulence: 0.4 }, fuel: 0.26, payload: 80,
  start: { type: 'runway', field: 'marenza', end: 1 },
  briefing: [['mags', 'Two drops today. Pump parts for Orsa Cay, then a crate of fence wire for the Highstrip farm on Calvera.'], ['mags', 'I filled you for one leg and a reserve. Orsa has fuel: stop, press R on the apron, and pay for it. Or do not, and explain the glide to me.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400 },
    { type: 'reach', name: 'Orsa Cay', x: -5000, z: -2300, radius: 1500, label: 'Leg 1: fly north-west to Orsa Cay', hint: '75% power, 1,000 ft', startDistance: 7000 },
    { type: 'land', field: 'orsa', say: ['mags', 'Orsa has you. Land, and think about that fuel gauge.'] },
    { type: 'takeoff', altitudeFt: 400, say: ['mags', 'Pump parts delivered. Calvera next, east past the volcano.'] },
    { type: 'reach', name: 'Calvera Highstrip', x: 2080, z: -2350, radius: 1300, label: 'Leg 2: fly east to Calvera Highstrip', hint: 'Keep north of Marenza, the strip is on the volcano\'s west flank', startDistance: 7800 },
    { type: 'land', field: 'calvera', end: 1, say: ['mags', 'Highstrip in sight? Land uphill on 35.'] },
  ],
  reward: { money: 760, xp: 300 },
  cargo: true,
};
