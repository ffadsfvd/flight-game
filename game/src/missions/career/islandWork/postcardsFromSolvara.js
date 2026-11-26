// Island Work 3: aerial photographs of the lighthouse, the volcano and the sea arch for the Gazette.
export const postcardsFromSolvara = {
  id: 'postcards', chapter: 2, title: 'Postcards from Solvara', kind: 'Aerial photography', giver: 'nadia', aircraft: 'wren',
  summary: 'Photograph the Faro Lumeno lighthouse, Mount Ignara and the Arco Solare sea arch for the Gazette.',
  time: 'golden', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.55,
  start: { type: 'air', x: 4700, y: 260, z: 1500, heading: 150, speed: 48, flaps: 0, throttle: 0.7 },
  briefing: [['nadia', 'Nadia from the Solvara Gazette. The summer issue needs three covers and the light is perfect.'], ['nadia', 'Point the nose at each landmark from a few hundred metres and press Space. Centred and close is best.']],
  stages: [
    { type: 'photo', targets: ['lighthouse', 'volcano', 'arch'], range: [180, 1700], say: ['nadia', 'Lighthouse first, it is just south of you.'] },
  ],
  reward: { money: 450, xp: 210 },
};
