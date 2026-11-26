// Racing and Airshow 4: the Archipelago Cup jet race against three AI rivals round the islands.
export const archipelagoCup = {
  id: 'archipelago-cup', chapter: 4, title: 'Archipelago Cup', kind: 'Air race', giver: 'teo', aircraft: 'swiftlet',
  summary: 'Race Teo Ranieri and two other jets round the islands, through the arch and home to Marenza.',
  time: 'golden', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.7,
  start: { type: 'air', x: 900, y: 160, z: 1900, heading: 20, speed: 95, flaps: 0, throttle: 0.9, gearDown: false },
  briefing: [['teo', 'The Archipelago Cup. Three jets, nine gates, one winner. I have won it four years running.'], ['teo', 'Through the arch, round Calvera, out to Pellet Rock, past the lighthouse and home. Try to keep up.']],
  stages: [
    { type: 'rings', radius: 34, par: 170, penalty: 6,
      rivals: [{ name: 'Teo Ranieri', aircraft: 'swiftlet', speed: 112, color: '#4f8cff' }, { name: 'Sara Moll', aircraft: 'swiftlet', speed: 104, color: '#ff6a4a', delay: 0.6 }, { name: 'Pip Calder', aircraft: 'swiftlet', speed: 98, color: '#6be38a', delay: 1.1 }],
      course: [[1850, -1650, 28, true, 40], [1300, -3700, 230, true], [2600, -5900, 300, true], [5200, -5600, 300, true], [6300, -800, 120, true], [6200, 2600, 110, true], [3600, 4400, 90, true], [1200, 3600, 120, true], [-400, 2950, 100, true]],
      say: ['teo', 'Three, two, one, go!'] },
  ],
  reward: { money: 900, xp: 360 },
};
