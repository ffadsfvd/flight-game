// Rescue Service 2: water bombing a pine fire on Calvera's south slope, scooping from the sea between drops.
export const fireOnCalvera = {
  id: 'firebreak', chapter: 3, title: 'Fire on Calvera', kind: 'Firefighting', giver: 'bruno', aircraft: 'heron',
  summary: 'A forest fire is spreading on Calvera. Drop water on the hot spots and scoop more from the sea.',
  time: 'golden', wind: { from: 10, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.6,
  start: { type: 'air', x: 3200, y: 230, z: -500, heading: 5, speed: 42, flaps: 1, throttle: 0.65, gearDown: false },
  briefing: [['bruno', 'Fire Base Calvera. Pine forest burning above San Calvo. Two hot spots, moving uphill.'], ['bruno', 'Your tank is full. Release low over the flames with Space, then skim the sea at speed to scoop more. Gear up on the water!']],
  stages: [
    { type: 'firefighting', startFull: true, fires: [[3250, -1780, 55], [3600, -1730, 50], [3430, -1930, 45]], say: ['bruno', 'Smoke is in sight dead ahead. Hit the downwind edge first.'] },
  ],
  reward: { money: 650, xp: 260 },
};
