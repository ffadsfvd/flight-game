// Expedition 2: soaring the Swallow motor glider with the motor off, climbing in the thermals over the red mesas of Orsa Cay.
export const silentWings = {
  id: 'silent-wings', chapter: 6, title: 'Silent Wings', kind: 'Soaring', giver: 'ines', aircraft: 'swallow',
  summary: 'Stop the Swallow\'s motor over Orsa Cay and climb from gate to gate in the thermals rising off the hot red mesas, then glide in to land.',
  time: 'golden', wind: { from: 240, speed: 4, gust: 1, turbulence: 0.4 }, fuel: 0.6,
  start: { type: 'air', x: -6600, y: 430, z: -3300, heading: 70, speed: 28, flaps: 0, throttle: 0.6 },
  briefing: [['ines', 'No engine today, just the sun. The red rock of the mesas heats the air and it rises in columns.'], ['ines', 'Find the lift on the variometer, circle tight inside it, and climb to each gate before you leave it. Then glide home to the strip: no second tries.']],
  stages: [
    { type: 'rings', radius: 45, par: 420, engineOff: true, label: 'Climb in the thermals through the soaring gates', hint: 'Circle where the VSI climbs; 50 kt, 30° bank',
      course: [[-5920, -3650, 640, true], [-4790, -3290, 780, true], [-5300, -2900, 720, true], [-6200, -2600, 600, true]],
      say: ['ines', 'Motor off. Feel for the lift over the north mesa and circle in it.'] },
    { type: 'land', field: 'orsa', label: 'Glide in and land at Orsa Cay Field', hint: 'Airbrakes with F; 50 kt on final', say: ['ines', 'Lovely. Now spend that height wisely and land on the strip.'] },
  ],
  reward: { money: 760, xp: 330 },
};
