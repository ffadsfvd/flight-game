// Expedition 3: supplies for the mountain hut, landed on the short grass terrace cut into Monte Nesta's south slope.
export const nestaHutSupply = {
  id: 'nesta-hut', chapter: 6, title: 'Hut under the Snow', kind: 'Mountain strip', giver: 'ines', aircraft: 'wren',
  summary: 'Land food and gas bottles for the mountain hut on the Nesta Mountain Strip, a grass terrace on the slope under the snow cap, with the mountain wind tumbling down.',
  time: 'golden', wind: { from: 300, speed: 6, gust: 3, turbulence: 1.0 }, fuel: 0.5, payload: 70,
  start: { type: 'air', x: -1700, y: 260, z: -4700, heading: 95, speed: 46, flaps: 1, throttle: 0.55 },
  briefing: [['ines', 'The hut warden on Nesta is out of gas and coffee, and only one of those is an emergency.'], ['ines', 'The strip is a terrace on the slope. Come in from the sea on runway 09, expect the wind to roll down the mountain at you, and do not land long: the end of the grass is the end of the mountain.']],
  stages: [
    { type: 'land', field: 'nesta', end: 0, label: 'Land on the Nesta Mountain Strip, runway 09', hint: 'Full flaps, 60 kt, expect sink and gusts off the slope', say: ['pia', 'Nesta traffic, Solvara Radio: the warden says the strip is dry, wind down the slope, gusting.'] },
  ],
  reward: { money: 680, xp: 300 },
  cargo: true,
};
