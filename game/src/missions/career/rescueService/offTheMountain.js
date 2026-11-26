// Rescue Service 7: a climber with a broken leg flown off the Nesta Mountain Strip, a short grass
// take-off from the terrace, across the strait to Calvera Highstrip and the waiting ambulance.
export const offTheMountain = {
  id: 'off-the-mountain', chapter: 3, title: 'Off the Mountain', kind: 'Mountain strip rescue', giver: 'lena', aircraft: 'wren',
  summary: 'Take off from the 520 m grass terrace of the Nesta Mountain Strip with an injured climber aboard, cross the strait and land him gently on Calvera Highstrip.',
  time: 'golden', wind: { from: 150, speed: 5, gust: 1.5, turbulence: 0.6 }, fuel: 0.5, payload: 90,
  start: { type: 'runway', field: 'nesta', end: 0 },
  briefing: [
    ['lena', 'Mountain rescue carried a climber down to the Nesta hut: broken leg, very cold and very polite about it. You are his way off the mountain.'],
    ['lena', 'The terrace is five hundred and twenty metres of grass and then a long drop to the sea. Flaps 15, full power before you roll, and lift off as soon as she flies.'],
    ['lena', 'Then across the strait to Calvera Highstrip, runway 17. The ambulance is already climbing the road, so land like he is made of glass.'],
  ],
  stages: [
    { type: 'takeoff', altitudeFt: 300, label: 'Short-field take-off from the Nesta terrace, runway 09', coach: 'lena' },
    { type: 'land', field: 'calvera', end: 0, label: 'Land on Calvera Highstrip, runway 17', hint: 'Full flaps, 58 kt, grass strip on the volcano flank',
      say: ['bruno', 'Fire Base Calvera: the ambulance is at the strip. Wind 150 at 10, land on 17 and roll to the end.'] },
  ],
  reward: { money: 660, xp: 290 },
  cargo: true,
};
