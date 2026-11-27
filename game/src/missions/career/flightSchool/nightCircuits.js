// Flight School 4: the circuit again after dark, with only the runway, approach and town lights to go by.
export const nightCircuits = {
  id: 'night-circuits', chapter: 1, title: 'Night Circuits', kind: 'Night training', giver: 'ines', aircraft: 'wren',
  summary: 'Fly the Marenza circuit at night: take off from 09, follow the rings over the dark bay and land on the lit runway.',
  time: 'night', wind: { from: 80, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.55,
  start: { type: 'runway', field: 'marenza', end: 0 },
  briefing: [['ines', 'Same circuit as your first solo, but the horizon is gone. Over the bay there is nothing outside, so the attitude indicator is your horizon.'], ['ines', 'Find the approach lights and the PAPI early. Two white, two red, all the way down.']],
  stages: [
    // The take-off counts at 300 ft, so the first ring on the climb-out (500 ft) is inside the circuit stage.
    { type: 'takeoff', altitudeFt: 300, say: ['dario', 'SV-102, night circuits approved, runway 09 lights are up, cleared for take-off.'] },
    { type: 'rings', radius: 36, par: 220, band: [70, 100], label: 'Fly the night circuit through the rings', hint: 'Trust the attitude indicator over the dark sea; 750 ft, 80 kt',
      course: [[-700, 2950, 150], [-100, 3560, 200], [-1300, 4100, 230], [-3000, 4100, 230], [-4300, 3620, 190], [-4100, 2950, 71, true]],
      say: ['ines', 'Straight on through the first ring, then the crosswind turn. Watch the town lights slide under the wing.'] },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'SV-102, runway 09, cleared to land. The lights are yours.'] },
  ],
  reward: { money: 380, xp: 170 },
};
