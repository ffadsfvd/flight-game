// Rescue Service 4: a patient from Orsa Cay to the hospital at Marenza against the clock, through the route gates.
export const medevacToMarenza = {
  id: 'medevac', chapter: 3, title: 'Medevac to Marenza', kind: 'Medical evacuation', giver: 'lena', aircraft: 'wren',
  summary: 'Fly an injured fisherman from Orsa Cay to Marenza International as fast as the gates allow, then land gently.',
  time: 'golden', wind: { from: 250, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.5, payload: 90,
  start: { type: 'runway', field: 'orsa', end: 0 },
  briefing: [['lena', 'A fisherman with a broken leg at Orsa Cay. The ambulance meets you on the Marenza apron.'], ['lena', 'Fly the route gates fast, but the landing must be soft: your patient feels every bump.']],
  stages: [
    { type: 'takeoff', altitudeFt: 300, say: ['lena', 'Patient aboard. Go, go, go.'] },
    { type: 'rings', radius: 40, par: 190, label: 'Fly the route gates to Marenza', hint: 'Full power, 1,000 ft, cut the corners inside the gates',
      course: [[-4900, -1800, 300, true], [-4700, 200, 300, true], [-4900, 1900, 230, true], [-4700, 2950, 120, true]],
      say: ['lena', 'Marenza knows you are coming. Straight in for runway 09.'] },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'Medevac, Marenza Tower, runway 09 cleared to land, ambulance waiting.'] },
  ],
  reward: { money: 680, xp: 280 },
  cargo: true,
};
