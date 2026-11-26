// Racing and Airshow 5: a low race in Wrens against two club rivals round the red mesas of Orsa Cay.
export const mesaGrandPrix = {
  id: 'mesa-gp', chapter: 4, title: 'Mesa Grand Prix', kind: 'Air race', giver: 'teo', aircraft: 'wren',
  summary: 'Race two Orsa flying-club Wrens round the red rock mesas of Orsa Cay: seven gates, one lap, no prizes for second.',
  time: 'golden', wind: { from: 240, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.5,
  start: { type: 'air', x: -7000, y: 210, z: -1900, heading: 43, speed: 52, flaps: 0, throttle: 0.9 },
  briefing: [['teo', 'The Orsa club runs this every summer. Club Wrens, so nobody can blame the machine.'], ['teo', 'Seven gates round the mesas. The rock is closer than it looks in the evening light.']],
  stages: [
    { type: 'rings', radius: 36, par: 150, penalty: 5,
      rivals: [{ name: 'Rosa Ferro', aircraft: 'wren', speed: 56, color: '#ff8a3a' }, { name: 'Ugo Salt', aircraft: 'wren', speed: 53, color: '#3ad0ff', delay: 0.8 }],
      course: [[-6300, -2650, 200, true], [-5650, -4100, 200, true], [-4650, -3900, 210, true], [-4300, -2950, 210, true], [-4950, -2050, 200, true], [-5800, -2250, 190, true], [-6450, -3050, 170, true]],
      say: ['teo', 'Green light. Go!'] },
  ],
  reward: { money: 620, xp: 270 },
};
