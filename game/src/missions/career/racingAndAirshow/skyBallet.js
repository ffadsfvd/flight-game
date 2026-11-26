// Racing and Airshow 1: a scored aerobatic display over the bay: loop, roll, inverted pass and wingover.
export const skyBallet = {
  id: 'sky-ballet', chapter: 4, title: 'Sky Ballet', kind: 'Aerobatics', giver: 'teo', aircraft: 'swiftlet',
  summary: 'Fly a display over the bay of Porto Celeste: loop, aileron roll, inverted pass and wingover.',
  time: 'golden', wind: { from: 250, speed: 2, gust: 0.5, turbulence: 0.1 }, fuel: 0.6,
  start: { type: 'air', x: -2200, y: 900, z: 5200, heading: 90, speed: 85, flaps: 0, throttle: 0.75, gearDown: false },
  briefing: [['teo', 'Teo Ranieri, team Scirocco. They say you can fly. Show the beach.'], ['teo', 'Loop, roll, inverted pass, wingover. Smoke on with T. Lose too much height and the judges notice.']],
  stages: [
    { type: 'aerobatics', figures: ['loop', 'roll', 'inverted', 'wingover'], box: [-500, 5200, 1800], say: ['teo', 'Smoke on and show me a loop.'] },
  ],
  reward: { money: 700, xp: 300 },
};
