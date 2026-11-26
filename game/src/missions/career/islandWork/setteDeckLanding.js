// Island Work 7: a spare pump for the Sette offshore platform, landed on its 300 m deck 22 m above the open sea.
export const setteDeckLanding = {
  id: 'sette-deck', chapter: 2, title: 'Deck at Sette', kind: 'Platform landing', giver: 'mags', aircraft: 'wren',
  summary: 'Land a spare pump on the Sette offshore platform: a 300 m deck on legs in the open sea, with nothing but water past its end.',
  time: 'golden', wind: { from: 265, speed: 6, gust: 2, turbulence: 0.6 }, fuel: 0.5, payload: 60,
  start: { type: 'approach', field: 'sette', end: 1, distance: 3200, height: 60, flaps: 1 },
  briefing: [['mags', 'Sette platform has a dead pump and a very bored crew. The deck is three hundred metres, and the last metre is the sea.'], ['mags', 'Aim for the painted threshold, not the middle. Full flaps, slow, firm touchdown, and stand on the brakes.']],
  stages: [
    { type: 'land', field: 'sette', end: 1, label: 'Land on the Sette platform deck, runway 27', hint: 'Full flaps, 55 kt, touch down on the numbers and brake (B)', say: ['pia', 'Sette traffic, Solvara Radio: deck is clear, wind 265 at 12, gusty off the edge.'] },
  ],
  reward: { money: 640, xp: 280 },
  cargo: true,
};
