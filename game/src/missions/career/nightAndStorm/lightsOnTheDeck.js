// Night and Storm 6: the rescue medic flown out to the Sette platform at night, landed on a deck
// that is nothing but two rows of white lights on black water.
export const lightsOnTheDeck = {
  id: 'sette-night', chapter: 5, title: 'Lights on the Deck', kind: 'Night platform landing', giver: 'lena', aircraft: 'wren',
  summary: 'Fly the rescue medic to the Sette platform at night and land on its 300 m deck, two rows of white lights 22 m above a black sea with no horizon.',
  time: 'night', wind: { from: 275, speed: 5, gust: 1.5, turbulence: 0.5 }, fuel: 0.5, payload: 75,
  start: { type: 'approach', field: 'sette', end: 1, distance: 3600, height: 70, flaps: 1 },
  briefing: [
    ['lena', 'A crane hand on Sette has crushed his hand and the sea is too rough for the boat. Our medic Jonas flies out with you tonight.'],
    ['lena', 'At night the platform is a few white lights on black water. There is no horizon and no sea to judge your height by: fly the approach guide and the altimeter, not your eyes.'],
    ['lena', 'Green lights mark the start of the deck. Cross them low, full flaps, and stand on the brakes.'],
  ],
  stages: [
    { type: 'land', field: 'sette', end: 1, label: 'Land on the lit Sette deck, runway 27', hint: 'No horizon: hold the glide path, 58 kt, full flaps, then brake (B)',
      say: ['pia', 'Sette traffic, Solvara Radio: deck lights are on, wind 275 at 10. Black water all round, so trust your instruments.'] },
  ],
  reward: { money: 720, xp: 330 },
  cargo: true,
};
