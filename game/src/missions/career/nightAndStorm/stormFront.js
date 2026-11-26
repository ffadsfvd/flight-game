// Night and Storm 2: an instrument approach to Marenza 27 through a squall line, in rain and gusts.
export const stormFront = {
  id: 'storm-approach', chapter: 5, title: 'Storm Front', kind: 'Instrument approach', giver: 'dario', aircraft: 'wren',
  summary: 'A squall line hides Marenza. Fly the approach guide down to runway 27 in rain, gusts and low cloud.',
  time: 'storm', wind: { from: 235, speed: 9, gust: 5, turbulence: 1.4 }, fuel: 0.45,
  start: { type: 'approach', field: 'marenza', end: 1, distance: 6500, height: 120, flaps: 0 },
  briefing: [['dario', 'Marenza Tower. Visibility under three kilometres in rain, wind 235 gusting 28 knots.'], ['dario', 'Fly the approach guide: keep the diamonds centred and the PAPI two white, two red. Crab into the wind.']],
  stages: [
    { type: 'land', field: 'marenza', end: 1, label: 'Fly the approach guide to runway 27', hint: 'Centre both diamonds, 70 kt, crab into the gusts', say: ['dario', 'SV-102, you are cleared to land runway 27, wind 235 gusting 28.'] },
  ],
  reward: { money: 650, xp: 300 },
};
