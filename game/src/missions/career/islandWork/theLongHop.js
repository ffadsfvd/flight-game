// Island Work 11: the reef doctor's samples flown from Coral Keys (no fuel there) south past Orsa Cay to
// the Marenza lab into a southerly wind, on what is left in the tanks: bingo comes up near Orsa whatever
// the power, and the pilot decides there whether to divert or press on.
export const theLongHop = {
  id: 'long-hop', chapter: 2, title: 'The Long Hop', kind: 'Fuel decision', giver: 'mags', aircraft: 'wren',
  summary: "Coral Keys has no fuel. Fly the reef doctor's samples south past Orsa Cay to the Marenza lab on what is left in the tanks. Bingo comes up near Orsa: divert there, or press on.",
  time: 'golden', wind: { from: 190, speed: 5, gust: 2, turbulence: 0.4 }, fuel: 0.21, payload: 40,
  start: { type: 'air', x: -3000, y: 170, z: -5200, heading: 210, speed: 46, flaps: 0, throttle: 0.7 },
  briefing: [['mags', 'The reef doctor needs those samples at the Marenza lab tonight, and Coral Keys has no fuel to sell you. You have what you landed with.'], ['mags', 'It is a long hop south into the wind. You will hit bingo somewhere past Orsa: divert and the samples wait a day, press on and land on fumes. Fly it lean, 50 to 60 percent, and the fumes go further.']],
  stages: [
    { type: 'reach', name: 'Orsa Cay', x: -4700, z: -2300, radius: 900, label: 'Leg 1: south-west to Orsa Cay', hint: 'Lean power, 50-60%: the fuel panel shows range and bingo', startDistance: 3400 },
    { type: 'reach', name: 'Marenza final', x: -5800, z: 2950, radius: 600, maxFt: 1200, label: 'Leg 2: south to the final for 09 at Marenza', hint: 'Keep west of the cliffs, then turn in for runway 09', startDistance: 5400, say: ['mags', 'Orsa is behind you. Marenza is the next field with a lab, and fuel.'] },
    { type: 'land', field: 'marenza', end: 0, say: ['dario', 'Brightwater 102, Marenza Tower, runway 09, wind 190 at 10, cleared to land, the lab van is on the apron.'] },
  ],
  bonus: [
    { type: 'reserve', kg: 7, label: 'Land with 7 kg left: fly it lean' },
    { type: 'mission-par', seconds: 330, label: 'Samples in within 5:30' },
    { type: 'stable', label: 'Stable final' },
  ],
  reward: { money: 700, xp: 290 },
  cargo: true,
};
