// Island Work 2: the Heron's first water landing, on the buoyed lane of Lumeno Lagoon.
export const lagoonTouchdown = {
  id: 'lagoon', chapter: 2, title: 'Lagoon Touchdown', kind: 'Seaplane', giver: 'mags', aircraft: 'heron',
  summary: 'Bring the Heron down on the water lane of Lumeno Lagoon: gear up, gentle descent, stop by the buoys.',
  time: 'golden', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.5,
  start: { type: 'air', x: -480, y: 220, z: 4500, heading: 70, speed: 40, flaps: 1, throttle: 0.45, gearDown: false },
  briefing: [['mags', 'Your first job in the Heron. Lumeno has no runway, just the lagoon and a line of orange buoys.'], ['mags', 'Wheels UP for water. Wheels down on water and she flips, and I keep your wages for the repairs.']],
  stages: [
    { type: 'land', field: 'lumeno', end: 0, water: true, label: 'Land on the Lumeno Lagoon water lane', hint: 'Gear UP, flaps down, 55 kt, 200 fpm down onto the water' },
  ],
  reward: { money: 480, xp: 220 },
};
