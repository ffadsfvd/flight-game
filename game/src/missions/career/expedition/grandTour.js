// Expedition 2: the final expedition in the amphibious Heron, Marenza to Orsa Cay by runway and on to Lumeno by water.
export const grandTour = {
  id: 'grand-tour', chapter: 6, title: 'The Grand Tour', kind: 'Expedition', giver: 'mags', aircraft: 'heron',
  summary: 'Fly the survey team across the archipelago in the Heron: Marenza to Orsa Cay on wheels, then on to Lumeno Lagoon on the water.',
  time: 'golden', wind: { from: 250, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.65, payload: 140,
  start: { type: 'runway', field: 'marenza', end: 1 },
  briefing: [['mags', 'The survey team, their kit and a very nervous cat. Orsa Cay first, on the runway, wheels down.'], ['mags', 'Then right across the archipelago to Lumeno Lagoon. That one is water: gear UP before you touch, or we all swim.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400 },
    { type: 'reach', name: 'Orsa Cay', x: -5000, z: -2300, radius: 1500, label: 'Leg 1: fly to Orsa Cay', hint: '1,000 ft, 75% power', startDistance: 7000 },
    { type: 'land', field: 'orsa', say: ['mags', 'Wheels down for Orsa. The cat is not impressed.'] },
    { type: 'takeoff', altitudeFt: 400, say: ['mags', 'Team aboard. Next stop Lumeno, right across the islands.'] },
    { type: 'reach', name: 'Lumeno approach', x: 2300, z: 3500, radius: 1300, label: 'Leg 2: cross the archipelago to Lumeno', hint: 'Pass south of Monte Aurio, then over the bay', startDistance: 10000 },
    { type: 'land', field: 'lumeno', end: 0, water: true, label: 'Land on Lumeno Lagoon, gear UP', hint: 'Gear UP (G), flaps down, 55 kt onto the water', say: ['mags', 'Lagoon lane is clear. Gear up, gear up, gear up.'] },
  ],
  reward: { money: 1100, xp: 420 },
  cargo: true,
};
