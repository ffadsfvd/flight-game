// Racing and Airshow 3: the Kestrel biplane's first display, loop, roll and wingover over the Porto Celeste beach.
export const barnstormer = {
  id: 'barnstormer', chapter: 4, title: 'Barnstormer', kind: 'Biplane display', giver: 'teo', aircraft: 'kestrel',
  summary: 'Fly the Kestrel B2 biplane through a loop, an aileron roll and a wingover in front of the festival crowd on the beach.',
  time: 'golden', wind: { from: 250, speed: 2, gust: 0.5, turbulence: 0.15 }, fuel: 0.6,
  start: { type: 'air', x: -2200, y: 800, z: 5200, heading: 90, speed: 62, flaps: 0, throttle: 0.85 },
  briefing: [['teo', 'Forget the jet. This is the Kestrel: two wings, a big round nose and no mercy for a lazy pilot.'], ['teo', 'Dive to 140 knots before the loop, it bleeds speed over the top. Roll is quick, use it. Smoke on with T.']],
  stages: [
    { type: 'aerobatics', figures: ['loop', 'roll', 'wingover'], box: [-500, 5200, 1800], say: ['teo', 'Crowd is waiting. Loop first.'] },
  ],
  reward: { money: 640, xp: 280 },
};
