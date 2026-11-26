// Night and Storm 3: the late mail from Orsa Cay to Marenza under the stars, down to the lit runway.
export const nightMail = {
  id: 'night-mail', chapter: 5, title: 'Night Mail', kind: 'Night cargo', giver: 'mags', aircraft: 'wren',
  summary: 'Fly the late mail from Orsa Cay back to Marenza under the stars and land on the lit runway.',
  time: 'night', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.45, payload: 90,
  start: { type: 'runway', field: 'orsa', end: 1 },
  briefing: [['mags', 'Last bags of the day. Marenza has the runway lights on for you.'], ['mags', 'At night the approach lights and the PAPI are your best friends. Trust the instruments.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400 },
    { type: 'reach', name: 'Marenza approach', x: 1200, z: 2950, radius: 1600, label: 'Fly south-east to the Marenza approach', hint: 'Follow the bug; the runway lights are visible from far out', startDistance: 9000 },
    { type: 'land', field: 'marenza', end: 1, say: ['dario', 'Night mail, Marenza Tower, runway 27, lights are up, cleared to land.'] },
  ],
  reward: { money: 600, xp: 260 },
  cargo: true,
};
