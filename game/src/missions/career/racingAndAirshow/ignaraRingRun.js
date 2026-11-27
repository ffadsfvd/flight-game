// Racing and Airshow 3: ten rings round Mount Ignara and a finish through the Arco Solare sea arch.
export const ignaraRingRun = {
  id: 'volcano-run', chapter: 4, title: 'Ignara Ring Run', kind: 'Time trial', giver: 'teo', aircraft: 'heron', alternatives: ['wren', 'kestrel', 'saker'],
  summary: 'Circle Mount Ignara through ten rings and finish through the Arco Solare sea arch.',
  time: 'golden', wind: { from: 250, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.6,
  start: { type: 'air', x: 1400, y: 300, z: -2600, heading: 10, speed: 50, flaps: 0, throttle: 0.85, gearDown: false },
  briefing: [['teo', 'The Ignara run: round the volcano, under the smoke, and home through the arch. Even a bush plane can do it.'], ['teo', 'Watch the hot air near the crater, it bumps.']],
  stages: [
    { type: 'rings', radius: 30, par: 230,
      course: [[1700, -3800, 260, true], [2300, -5100, 330, true], [3500, -5900, 380, true], [4900, -5400, 380, true], [5900, -4100, 330, true], [5800, -2700, 280, true], [4900, -1500, 220, true], [3600, -1250, 160, true], [2850, -2050, 110, true], [2050, -2300, 60, true], [1850, -1650, 26, true, 34]],
      say: ['teo', 'Clock is running.'] },
  ],
  reward: { money: 650, xp: 300 },
};
