// Night and Storm 7: a gull strike off Gannet Skerry, and the Wren nursed home to Marenza with a capped
// engine, a bent left wing that pulls and a cracked gear leg that will not take a firm landing.
export const bringHerHome = {
  id: 'bring-her-home', chapter: 5, title: 'Bring Her Home', kind: 'Damaged aircraft', giver: 'mags', aircraft: 'wren',
  summary: 'A gull came through the cowling off Gannet Skerry: the engine is capped, the left wing pulls and a gear leg is cracked. Nurse the Wren home to Marenza and land her softly.',
  time: 'golden', wind: { from: 80, speed: 4, gust: 1, turbulence: 0.3 }, fuel: 0.45, payload: 60,
  start: { type: 'air', x: -6500, y: 210, z: 3150, heading: 95, speed: 45, flaps: 0, throttle: 0.8 },
  damage: { engine: 0.55, wing: 0.14, side: 1, gear: 0.5 },
  briefing: [['mags', "That's no drill. A gull came through the cowling off Gannet Skerry: the engine gives about eighty percent and the left wing took a knock, so she rolls left on her own."], ['mags', 'And the right main leg is cracked. Fly a long, flat final into Marenza, hold her straight, and land it like a tray of eggs: the gear panel tells you how firm it can take.']],
  stages: [
    { type: 'reach', name: 'Marenza final', x: -5600, z: 2950, radius: 450, maxFt: 900, label: 'Fly to the final for runway 09', hint: 'Hold a little right aileron against the pull, 75 kt, shallow turns only', startDistance: 1500, say: ['mags', 'Easy now. Line her up with 09 from out over the beach.'] },
    { type: 'land', field: 'marenza', end: 0, label: 'Land softly on runway 09', hint: 'Long flat final, gentle flare: the cracked leg bends on a firm touchdown', say: ['dario', 'Brightwater 102, Marenza Tower, the fire crews are standing by, runway 09 is yours, wind 080 at 8.'] },
  ],
  bonus: [
    { type: 'soft', fpm: 250, label: 'Kiss it on: under 250 fpm' },
    { type: 'stable', label: 'Stable final despite the pull' },
    { type: 'zone', label: 'Touch down in the zone' },
  ],
  reward: { money: 720, xp: 300 },
  cargo: true,
};
