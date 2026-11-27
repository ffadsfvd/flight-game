// Island Work 8: a sunset sightseeing charter in the Pelican, with a family of tourists who want
// a smooth ride past the ruins, the beaches and both harbours before landing back at Marenza.
export const sunsetSightseers = {
  id: 'sunset-tour', chapter: 2, title: 'Sunset Sightseers', kind: 'Sightseeing tour', giver: 'rosa', aircraft: 'pelican',
  summary: 'Fly the Haddon family round Marenza at sunset: the Rocca Celeste ruins, Marina Sabbia, Porto Celeste and San Telmo, gently, then land on 27.',
  time: 'golden', wind: { from: 255, speed: 4, gust: 1.5, turbulence: 0.4 }, fuel: 0.6, payload: 260,
  start: { type: 'air', x: -4200, y: 330, z: 1900, heading: 110, speed: 52, flaps: 0, throttle: 0.6, gearDown: false },
  briefing: [
    ['rosa', 'Rosa from Celeste Air Tours. Four passengers tonight, the Haddons, and the youngest has never flown.'],
    ['rosa', 'Show them the ruins, the beach at Marina Sabbia and both harbours. Keep your banks shallow and your pulls soft: comfort is what they pay for.'],
    ['walt', 'Walt Haddon here. We are ready! Only... not too much of the swooping, please.'],
  ],
  stages: [
    {
      type: 'sightseeing', passenger: 'walt',
      sights: [
        { name: 'the Rocca Celeste ruins', x: -3350, z: 1500, radius: 450, say: ['walt', 'A real castle! The kids are glued to the window.'] },
        { name: 'the beach at Marina Sabbia', x: -3600, z: 3300, radius: 450, maxFt: 1500, say: ['walt', 'Look at that water, it is green and blue at once.'] },
        { name: 'Porto Celeste harbour', x: -300, z: 4000, radius: 450, maxFt: 1500, say: ['walt', 'I can see our hotel by the harbour light!'] },
        { name: 'San Telmo', x: 1150, z: 3100, radius: 450, maxFt: 1500, say: ['rosa', 'Last sight done. Bring them home to runway 27, nice and soft.'] },
      ],
      say: ['rosa', 'The ruins first, on the hill just ahead of you. Gentle turns.'],
    },
    { type: 'land', field: 'marenza', end: 1, label: 'Land on runway 27 at Marenza International', hint: 'Gear down, flaps, 65 kt, a soft touchdown for the passengers',
      say: ['dario', 'Celeste tour, Marenza Tower, runway 27, wind 255 at 8, cleared to land.'] },
  ],
  reward: { money: 560, xp: 240 },
};
