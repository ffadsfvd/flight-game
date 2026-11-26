// Rescue Service 5: a lightning fire in the forest below Monte Nesta's snow line, fought from the sea.
export const fireOnNesta = {
  id: 'nesta-fire', chapter: 3, title: 'Lightning on Nesta', kind: 'Firefighting', giver: 'bruno', aircraft: 'heron',
  summary: 'Lightning has lit the forest on Nesta\'s east slope. Three hot spots under the mountain, and the sea is your only water.',
  time: 'golden', wind: { from: 300, speed: 5, gust: 2, turbulence: 0.7 }, fuel: 0.6,
  start: { type: 'air', x: 500, y: 300, z: -3800, heading: 10, speed: 42, flaps: 1, throttle: 0.65, gearDown: false },
  briefing: [['bruno', 'Dry storm over Nesta last night. Three fires in the pines on the east slope, under the snow.'], ['bruno', 'Drop going downhill, toward the sea, never into the mountain. Scoop off the east shore and come round again.']],
  stages: [
    { type: 'firefighting', startFull: true, fires: [[1300, -5500, 50], [1450, -5650, 45], [1550, -5420, 40]], say: ['bruno', 'Smoke on the east slope. Run in from the west, downhill.'] },
  ],
  reward: { money: 700, xp: 290 },
};
