// Rescue Service 3: medical supplies for the Coral Keys reef station at dusk, dropped onto a tiny white sand key.
export const coralKeysDrop = {
  id: 'coral-drop', chapter: 3, title: 'Coral Keys at Dusk', kind: 'Supply drop', giver: 'lena', aircraft: 'wren',
  summary: 'The reef station on Coral Keys has run out of medicine. Drop three crates on the key before the light goes.',
  time: 'dusk', wind: { from: 30, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.5,
  start: { type: 'air', x: -2500, y: 300, z: -2700, heading: 345, speed: 48, flaps: 0, throttle: 0.7 },
  briefing: [['lena', 'The Coral Keys reef station has a sick diver and an empty cabinet. The boat is two hours out.'], ['lena', 'The key is barely bigger than a football pitch. They will light a flare. Low, slow, and allow for the north-easterly.']],
  stages: [
    { type: 'supply-drop', x: -3000, z: -5700, radius: 45, crates: 3, say: ['lena', 'Flare is lit on the key, dead ahead about two miles.'] },
  ],
  reward: { money: 540, xp: 240 },
};
