// Night and Storm 3: the late mail from Orsa Cay to Marenza under the stars in the Pelican twin, round
// the west coast over the water (Monte Aurio stands 3,000 ft high in the dark on the straight line)
// and down to the lit runway 09.
export const nightMail = {
  id: 'night-mail', chapter: 5, title: 'Night Mail', kind: 'Night cargo', giver: 'mags', aircraft: 'pelican', alternatives: ['wren', 'heron'],
  summary: 'Fly the late mail from Orsa Cay back to Marenza under the stars, round the west coast over the water, and land on the lit runway.',
  time: 'night', wind: { from: 160, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.45, payload: 90,
  start: { type: 'runway', field: 'orsa', end: 1 },
  briefing: [['mags', 'Last bags of the day. Marenza has the runway lights on for you.'], ['mags', 'Do not fly the straight line home: Monte Aurio is on it, three thousand feet of rock in the dark. Go south round the west coast over the water and come in on 09. The approach lights and the PAPI are your best friends tonight.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400 },
    { type: 'reach', name: 'the west bay', x: -6500, z: 2950, radius: 700, label: 'Fly south round the west coast to the bay off Marenza', hint: 'Over the water at 800 ft; Monte Aurio stands in the dark to your left', startDistance: 6200 },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'Night mail, Marenza Tower, runway 09, lights are up, cleared to land.'] },
  ],
  reward: { money: 600, xp: 260 },
  cargo: true,
};
