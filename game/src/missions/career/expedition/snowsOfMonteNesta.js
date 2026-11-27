// Expedition 1: mountain flying round the snow-capped summit of Monte Nesta through high gates.
export const snowsOfMonteNesta = {
  id: 'nesta-pass', chapter: 6, title: 'Snows of Monte Nesta', kind: 'Mountain flying', giver: 'ines', aircraft: 'wren', alternatives: ['kestrel', 'heron'],
  summary: 'Climb to 2,000 ft and circle the snow cap of Monte Nesta through six high gates, with downdrafts off every ridge.',
  time: 'golden', wind: { from: 300, speed: 7, gust: 3, turbulence: 1.1 }, fuel: 0.55,
  start: { type: 'air', x: 700, y: 520, z: -4300, heading: 0, speed: 50, flaps: 0, throttle: 0.9 },
  briefing: [['ines', 'Monte Nesta makes its own weather. The air pours off the ridges on the lee side and pushes you down.'], ['ines', 'Keep the speed up, cross every ridge at an angle so you can turn away, and never get slow near the snow.']],
  stages: [
    { type: 'rings', radius: 38, par: 115, label: 'Circle the summit through the high gates', hint: 'Full power in the climb, 75 kt, cross ridges at 45°',
      course: [[700, -5050, 600, true], [224, -5325, 610, true], [224, -5875, 620, true], [700, -6150, 620, true], [1176, -5875, 610, true], [1176, -5325, 600, true], [700, -4700, 450, true]],
      say: ['ines', 'Into the first gate. Feel that sink? That is the mountain breathing.'] },
  ],
  reward: { money: 720, xp: 320 },
};
