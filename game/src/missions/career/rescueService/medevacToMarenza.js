// Rescue Service 4: a patient from Orsa Cay to the hospital at Marenza against the clock, through the
// route gates, on tanks there was no time to fill and past the gulls nesting off the end of runway 04.
export const medevacToMarenza = {
  id: 'medevac', chapter: 3, title: 'Medevac to Marenza', kind: 'Medical evacuation', giver: 'lena', aircraft: 'wren',
  summary: 'Fly an injured fisherman from Orsa Cay to Marenza International as fast as the gates allow, on low tanks, then land gently.',
  time: 'golden', wind: { from: 40, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.3, payload: 90,
  start: { type: 'runway', field: 'orsa', end: 0 },
  briefing: [['lena', 'A fisherman with a broken leg at Orsa Cay. The ambulance meets you on the Marenza apron. There was no time to fill the tanks.'], ['lena', 'Fly the route gates fast, but the landing must be soft: your patient feels every bump. Gulls nest on the cliffs past the end of 04, up to 300 feet: climb hard or turn away early.'], ['lena', 'If you hit bingo before the halfway gate, it is your call: back to Orsa, or on to the hospital. Fly the gates at 75% power and you land with fuel to spare; full power all the way and it gets tight.']],
  stages: [
    { type: 'takeoff', altitudeFt: 300, say: ['lena', 'Patient aboard. Go, go, go.'] },
    { type: 'rings', radius: 40, par: 190, band: [65, 125], label: 'Fly the route gates to Marenza', hint: 'Climb at full power, then 75%: the tanks are low; the last gate is your final at 70 kt',
      course: [[-4900, -1800, 300, true], [-5300, 200, 300, true], [-5800, 2500, 165, true], [-4700, 2950, 100, true]],
      say: ['lena', 'Marenza knows you are coming. The last gate puts you on final for runway 09.'] },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'Medevac 102, Marenza Tower, runway 09, cleared to land, ambulance waiting.'] },
  ],
  hazards: [{ kind: 'birds', x: -5190, z: -3510, radius: 260, topFt: 300, label: 'GULLS' }],
  reward: { money: 680, xp: 280 },
  cargo: true,
  bonus: [
    { type: 'par', seconds: 190, label: 'Route gates under 3:10' },
    { type: 'soft', fpm: 200, label: 'Soft touchdown, under 200 fpm' },
    { type: 'intact', label: 'No new damage' },
  ],
};
