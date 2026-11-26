// Racing and Airshow: a flat-out pylon race in Saker R4 racers, sixty metres over the surf along
// Marenza's south shore, from Marina Sabbia past Porto Celeste to San Telmo.
export const celesteCoastSprint = {
  id: 'coast-sprint', chapter: 4, title: 'Celeste Coast Sprint', kind: 'Pylon race', giver: 'teo', aircraft: 'saker',
  summary: 'Race two Saker R4 racers along Marenza\'s south shore at 170 knots, sixty metres over the surf, through seven gates from Marina Sabbia to San Telmo.',
  time: 'golden', wind: { from: 250, speed: 4, gust: 1.5, turbulence: 0.4 }, fuel: 0.6,
  start: { type: 'air', x: -5000, y: 80, z: 2800, heading: 114, speed: 80, flaps: 0, throttle: 0.95, gearDown: false },
  briefing: [
    ['teo', 'Team Scirocco lent you a Saker. Two hundred knots, a wing the size of a door, and it stalls the moment you get greedy.'],
    ['teo', 'Seven gates down the beach, sixty metres over the water. Gear up, full power, and keep the turns shallow: every degree of bank costs you speed.'],
  ],
  stages: [
    { type: 'rings', radius: 34, par: 85, penalty: 4,
      rivals: [{ name: 'Teo Ranieri', aircraft: 'saker', speed: 88, color: '#3a7aff' }, { name: 'Ada Brill', aircraft: 'saker', speed: 84, color: '#ff5a5a', delay: 0.6 }],
      course: [[-4200, 3150, 60, true], [-3000, 3720, 55, true], [-1800, 3880, 55, true], [-600, 4110, 60, true], [600, 4060, 60, true], [1600, 3700, 60, true], [2300, 3300, 70, true]],
      label: 'Beat the Sakers through seven gates along the beach', hint: 'Gear up, full power, shallow turns, watch the engine temperature',
      say: ['teo', 'Three, two, one... go! See you at San Telmo.'] },
  ],
  reward: { money: 820, xp: 360 },
};
