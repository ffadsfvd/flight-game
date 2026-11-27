// Flight School 2: a time trial through twelve rings in the gorge of Corvo Canyon.
export const corvoCanyon = {
  id: 'canyon-run', chapter: 1, title: 'Corvo Canyon', kind: 'Time trial', giver: 'ines', aircraft: 'wren', alternatives: ['kestrel'],
  summary: 'Thread twelve rings through the gorge of Corvo Canyon to the north coast. Beat the par time.',
  time: 'golden', wind: { from: 250, speed: 2, gust: 1, turbulence: 0.5 }, fuel: 0.5,
  start: { type: 'air', x: -230, y: 150, z: 2750, heading: 352, speed: 50, flaps: 0, throttle: 0.8 },
  briefing: [['ines', 'Corvo Canyon is where the school sorts pilots from passengers. The walls are close, so fly the rings, not the scenery.'], ['ines', 'Keep your speed up, look ahead to the next ring, and do not chase the floor.']],
  stages: [
    { type: 'rings', radius: 26, par: 95, label: 'Fly the canyon through every ring', hint: 'Look one ring ahead; bank early, level early',
      course: [[-200, 2050, 112, true], [-160, 1720, 104, true], [-300, 1350, 102, true], [-380, 1050, 104, true], [-330, 700, 110, true], [-265, 420, 112, true], [-450, 120, 108, true], [-640, -180, 102, true], [-600, -500, 94, true], [-565, -820, 86, true], [-720, -1160, 74, true], [-880, -1500, 64, true]],
      say: ['ines', 'Into the canyon. Smooth hands.'] },
  ],
  reward: { money: 400, xp: 180 },
  medals: { gold: 85, silver: 65, bronze: 35 },
};
