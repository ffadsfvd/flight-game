// Night and Storm 5: a night search for a smuggler's boat running dark between Marenza and Nesta, found and held in the landing light.
export const darkWater = {
  id: 'dark-water', chapter: 5, title: 'Dark Water', kind: 'Night search', giver: 'lena', aircraft: 'wren', alternatives: ['heron', 'pelican'],
  summary: 'A boat is running without lights in the strait north of Marenza. Sweep the search area low with your landing light and hold it in the beam until the patrol arrives.',
  time: 'night', wind: { from: 240, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.55,
  start: { type: 'air', x: -1200, y: 300, z: -1900, heading: 20, speed: 46, flaps: 0, throttle: 0.6 },
  briefing: [['lena', 'The Coast Guard has a fast boat running dark in the strait, probably cigarettes and worse. Their cutter is twenty minutes out.'], ['lena', 'Landing light on, go low and slow over the search box and look for a hull and its wake. When you have it, keep it in the beam for six seconds so the cutter gets a fix.']],
  stages: [
    { type: 'search', area: { x: -200, z: -3600, radius: 900 }, target: { x: 150, z: -3900, heading: 250, speed: 4 }, illuminate: 6, maxHeightFt: 700, parMinutes: 4,
      say: ['lena', 'Search box is north of you, between here and Nesta. Light on, below 700 feet.'],
      found: ['lena', 'Cutter sees your light on it! Hold it there.'] },
  ],
  reward: { money: 720, xp: 310 },
};
