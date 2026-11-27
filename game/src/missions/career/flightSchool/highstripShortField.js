// Flight School 3: a short-field landing on the uphill grass of Calvera Highstrip.
export const highstripShortField = {
  id: 'highstrip', chapter: 1, title: 'Highstrip Short Field', kind: 'Short field', giver: 'ines', aircraft: 'wren', alternatives: ['heron'],
  summary: 'Land on the 640 m grass strip high on Calvera and stop within the first 260 m.',
  time: 'golden', wind: { from: 340, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.45,
  start: { type: 'air', x: 1650, y: 420, z: -300, heading: 8, speed: 46, flaps: 1, throttle: 0.5 },
  briefing: [['ines', 'Calvera Highstrip: grass, short, and uphill wind off the volcano. Touch down in the first 260 metres or you go home in a tractor.'], ['ines', 'Full flaps, slow and steady, firm touchdown is fine. Brakes on the moment you are down.']],
  stages: [
    { type: 'land', field: 'calvera', end: 1, shortField: 260, label: 'Land on Highstrip 35 within 260 m of the threshold', hint: 'Full flaps (F), 60 kt, aim at the threshold markers' },
  ],
  reward: { money: 420, xp: 200 },
};
