// Island Work 10: a green-island sightseeing tour of Lumeno in the Wren, in from the sea past the
// Faro Lumeno lighthouse, up over the ridge wind farm, down across Ventara harbour and out low over
// the lagoon, for an old Lumeno fisherman seeing his island from the air for the first time.
export const lumenoGardenTour = {
  id: 'lumeno-tour', chapter: 2, title: 'Lumeno from the Air', kind: 'Sightseeing tour', giver: 'rosa', aircraft: 'wren', alternatives: ['heron', 'pelican'],
  summary: 'Fly Elio round his home island of Lumeno: the Faro Lumeno lighthouse, the ridge wind farm, Ventara harbour and the green lagoon, gently, so he can point out his house.',
  time: 'golden', wind: { from: 240, speed: 4, gust: 1.5, turbulence: 0.35 }, fuel: 0.6, payload: 90,
  start: { type: 'air', x: 6900, y: 240, z: 3400, heading: 275, speed: 46, flaps: 0, throttle: 0.6, gearDown: false },
  briefing: [
    ['rosa', 'A quieter one today, over Lumeno. Your passenger is Elio, a fisherman who has worked that lagoon for fifty years and never once seen it from above.'],
    ['rosa', 'Lighthouse first, then climb for the wind farm on the ridge, over Ventara and down the lagoon. Smooth and slow, he wants to take it all in.'],
    ['elio', 'Fifty years on that water. Let us see what the gulls see, captain.'],
  ],
  stages: [
    {
      type: 'sightseeing', passenger: 'elio',
      sights: [
        { name: 'the Faro Lumeno lighthouse', x: 5980, z: 3480, radius: 450, maxFt: 1000, say: ['elio', 'The old light! It brought me home more nights than I can count.'] },
        { name: 'the ridge wind farm', x: 4750, z: 3260, radius: 500, minFt: 150, say: ['elio', 'Great white things. They turn even when the sea is flat calm.'] },
        { name: 'Ventara harbour', x: 4350, z: 3950, radius: 450, maxFt: 1500, say: ['elio', 'There is my boat, the blue one by the mole. And my house behind it!'] },
        { name: 'the Lumeno lagoon', x: 3250, z: 3150, radius: 500, maxFt: 1200, say: ['rosa', 'That is the tour. He has not stopped smiling. Bring him home whenever you are ready.'] },
      ],
      say: ['rosa', 'The lighthouse is on the point ahead. Take him by it nice and close.'],
    },
  ],
  reward: { money: 500, xp: 220 },
};
