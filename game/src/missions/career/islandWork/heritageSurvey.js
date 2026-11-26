// Island Work 4: a photo survey of the Rocca Celeste ruins, the Monte Aurio radio mast and the Lumeno wind farm.
export const heritageSurvey = {
  id: 'heritage-survey', chapter: 2, title: 'Heritage Survey', kind: 'Photo survey', giver: 'nadia', aircraft: 'wren',
  summary: 'Survey three landmarks for the island council: the Rocca Celeste castle ruins, the radio mast on Monte Aurio and the Lumeno wind farm.',
  time: 'golden', wind: { from: 260, speed: 4, gust: 1, turbulence: 0.4 }, fuel: 0.6,
  start: { type: 'air', x: -3050, y: 360, z: 2500, heading: 345, speed: 48, flaps: 0, throttle: 0.7 },
  briefing: [['nadia', 'The island council wants a record of its old stones and new steel. Castle, mast, turbines, in that order.'], ['nadia', 'The ruins are just north of you on the hill. Then the mast on Monte Aurio, then the long leg east to Lumeno.']],
  stages: [
    { type: 'photo', targets: ['castle', 'radio-mast', 'wind-farm'], range: [160, 1600], say: ['nadia', 'Rocca Celeste first. Slow down, they are only walls now.'] },
  ],
  reward: { money: 480, xp: 220 },
};
