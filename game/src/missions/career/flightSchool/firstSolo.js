// Flight School 1: the first solo, a take-off, the right-hand circuit over Porto Celeste and a landing on 09.
export const firstSolo = {
  id: 'first-solo', chapter: 1, title: 'First Solo', kind: 'Training', giver: 'ines', aircraft: 'wren',
  summary: 'Take off from Marenza, fly the right-hand circuit over Porto Celeste through six rings and land back on runway 09.',
  time: 'golden', wind: { from: 75, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.6,
  start: { type: 'runway', field: 'marenza', end: 0 },
  briefing: [['ines', 'Your first solo. Full power, lift off at 50 knots, climb straight ahead to 500 feet.'], ['ines', 'Then follow the rings round the circuit over the town and bring her back to runway 09. Gear is fixed, so just flaps and a gentle flare.'], ['dario', 'Marenza Tower: SV-102, wind 075 at 6, runway 09, cleared for take-off.']],
  stages: [
    { type: 'takeoff', altitudeFt: 500, say: ['dario', 'SV-102, cleared for take-off runway 09. Good luck.'] },
    { type: 'rings', radius: 34, par: 210, label: 'Fly the circuit through the rings', hint: 'Gentle 20° banks, hold about 750 ft and 80 kt',
      course: [[-700, 2950, 150], [-100, 3560, 200], [-1300, 4100, 230], [-3000, 4100, 230], [-4300, 3620, 190], [-4100, 2950, 71, true]],
      say: ['ines', 'Nice climb. Turn right onto the crosswind leg and pick up the rings.'] },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'SV-102, number one, runway 09, cleared to land.'] },
  ],
  reward: { money: 350, xp: 160 },
};
