// Night and Storm 1: the engine quits at 2,000 ft over the bay; glide to the nearest runway without power.
export const deadStick = {
  id: 'dead-stick', chapter: 5, title: 'Dead Stick', kind: 'Emergency', giver: 'ines', aircraft: 'wren',
  summary: 'The engine quits at 2,000 ft over the bay. Glide to the nearest runway and land without power.',
  time: 'golden', wind: { from: 250, speed: 4, gust: 1, turbulence: 0.3 }, fuel: 0.4,
  start: { type: 'air', x: 1800, y: 620, z: 3900, heading: 290, speed: 46, flaps: 0, throttle: 0.6 },
  briefing: [['ines', 'Today I pull the mixture on you. No warning, no engine.'], ['ines', 'Best glide is about 75 knots: trade height for distance, not speed. Pick the nearest field and commit.']],
  stages: [
    { type: 'land', field: 'nearest', failEngine: true, label: 'Engine failure: glide to a runway and land', say: ['ines', 'Engine failure! Best glide speed, find your field.'] },
  ],
  reward: { money: 600, xp: 280 },
};
