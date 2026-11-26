// Racing and Airshow 2: formation flying in the slot off Ines Varga's right wing round Marenza.
export const wingOfTheLead = {
  id: 'formation', chapter: 4, title: 'Wing of the Lead', kind: 'Formation', giver: 'ines', aircraft: 'wren',
  summary: 'Fly formation off Ines Varga\'s right wing around the south coast of Marenza.',
  time: 'golden', wind: { from: 250, speed: 2, gust: 0.5, turbulence: 0.2 }, fuel: 0.6,
  start: { type: 'air', x: -3400, y: 330, z: 4000, heading: 80, speed: 46, flaps: 0, throttle: 0.6 },
  briefing: [['ines', 'Formation is about small corrections. Little power changes, little banks, eyes on my wingtip.'], ['ines', 'Stay in the gold slot off my right wing. Lose me and the lesson is over.']],
  stages: [
    { type: 'formation', aircraft: 'wren', speed: 44, slot: [20, 0, 24], tolerance: 26,
      path: [[-2400, 4100, 330], [-600, 4500, 330], [1200, 4100, 340], [1900, 2900, 360], [1100, 1700, 380], [-300, 1500, 380], [-1800, 1650, 360], [-3200, 2300, 330]],
      say: ['ines', 'Join up on my right wing. Smoothly now.'] },
  ],
  reward: { money: 600, xp: 280 },
};
