// Island Work 9: a honeymoon couple's flight over Calvera in the Heron, from high over the glowing
// crater of Mount Ignara down past the old lava fields and the Arco Solare to San Calvo harbour,
// a long, gentle descent through the bumpy air that rises off the volcano.
export const ignaraHoneymoon = {
  id: 'ignara-honeymoon', chapter: 2, title: 'Honeymoon over Ignara', kind: 'Sightseeing tour', giver: 'rosa', aircraft: 'heron', alternatives: ['pelican'],
  summary: 'Show a honeymoon couple Calvera from the air: the crater of Mount Ignara, the lava fields, the sea arch and San Calvo, coming down gently through the bumpy volcanic air.',
  time: 'golden', wind: { from: 20, speed: 4, gust: 1.5, turbulence: 0.5 }, fuel: 0.6, payload: 150,
  start: { type: 'air', x: 5700, y: 1250, z: -3700, heading: 267, speed: 44, flaps: 0, throttle: 0.55, gearDown: false },
  briefing: [
    ['rosa', 'Honeymooners tonight, Sofi and Marco Bruni. They booked the volcano flight months ago.'],
    ['rosa', 'You are up at four thousand feet east of Mount Ignara. Crater first, then the lava fields and the sea arch, and down to San Calvo where they were married.'],
    ['rosa', 'The air over Calvera is bumpy. Bring them down slowly: power back, no more than a thousand feet a minute, shallow turns.'],
  ],
  stages: [
    {
      type: 'sightseeing', passenger: 'sofi', comfort: { maxBank: 32, climbFpm: 1400 },
      sights: [
        { name: 'the crater of Mount Ignara', x: 3700, z: -3600, radius: 600, minFt: 200, say: ['sofi', 'It is glowing down there. That is the most beautiful thing I have ever seen.'] },
        { name: 'the old lava fields', x: 3000, z: -3000, radius: 500, say: ['sofi', 'Black rivers of stone, all the way down to the sea. Marco, look!'] },
        { name: 'the Arco Solare', x: 1850, z: -1650, radius: 450, say: ['sofi', 'An arch of stone standing in the sea. It looks like a ring for giants.'] },
        { name: 'San Calvo harbour', x: 4900, z: -2000, radius: 450, maxFt: 2000, say: ['sofi', 'There is the little church where we got married! Thank you, captain.'] },
      ],
      say: ['rosa', 'The crater is just ahead. Keep above the rim, and keep it smooth.'],
    },
  ],
  reward: { money: 520, xp: 230 },
};
