// Night and Storm 4: the last ferry flight into Orsa Cay ahead of a gale, a gusty approach past the mesas.
export const orsaGale = {
  id: 'orsa-gale', chapter: 5, title: 'Gale at Orsa Cay', kind: 'Storm approach', giver: 'mags', aircraft: 'wren',
  summary: 'Beat the gale into Orsa Cay: a long final to runway 22 in heavy gusts and rain, with the mesas beside the approach.',
  time: 'storm', wind: { from: 205, speed: 10, gust: 6, turbulence: 1.6 }, fuel: 0.45, payload: 60,
  start: { type: 'approach', field: 'orsa', end: 1, distance: 5200, height: 90, flaps: 0 },
  briefing: [['mags', 'The Orsa ferry is cancelled, so the doctor flies with you. The front reaches the cay in twenty minutes.'], ['mags', 'Gusts to thirty knots on the approach. Carry a little extra speed, crab into it, and do not drift toward the big mesa.']],
  stages: [
    { type: 'land', field: 'orsa', end: 1, label: 'Land on Orsa Cay runway 22 in the gale', hint: '70 kt, crab into the wind, keep the diamonds centred', say: ['mags', 'Orsa Field says wind 205 at 20, gusting 32. Rather you than me.'] },
  ],
  reward: { money: 700, xp: 310 },
  cargo: true,
};
