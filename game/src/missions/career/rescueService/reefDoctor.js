// Rescue Service 6: the island doctor flown to the reef station, landed on the short grass strip across Coral Keys at dusk.
export const reefDoctor = {
  id: 'reef-doctor', chapter: 3, title: 'Reef Doctor', kind: 'Island strip', giver: 'lena', aircraft: 'wren',
  summary: 'Fly Doctor Amara to the reef station and land on the 380 m grass strip that crosses Coral Keys from sea to sea.',
  time: 'dusk', wind: { from: 80, speed: 4, gust: 1.5, turbulence: 0.4 }, fuel: 0.5, payload: 85,
  start: { type: 'air', x: -5200, y: 240, z: -5500, heading: 95, speed: 46, flaps: 1, throttle: 0.55 },
  briefing: [['lena', 'The diver from this morning needs more than a crate. Doctor Amara is in your back seat with her bag.'], ['lena', 'Coral Keys has a grass strip from beach to beach, three hundred and eighty metres. Land into the evening breeze on 08 and stop before the reef.']],
  stages: [
    { type: 'land', field: 'coral', end: 0, label: 'Land on the Coral Keys strip, runway 08', hint: 'Full flaps, 58 kt, touch down at the first marker', say: ['pia', 'Coral traffic, Solvara Radio: the station has lit the strip markers for you.'] },
  ],
  reward: { money: 620, xp: 270 },
  cargo: true,
};
