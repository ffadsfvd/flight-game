// Island Work 6: the twin-engine Pelican's first job, 450 kg of market produce from Marenza to Orsa Cay.
export const marketDayShuttle = {
  id: 'market-shuttle', chapter: 2, title: 'Market Day Shuttle', kind: 'Heavy cargo', giver: 'mags', aircraft: 'pelican',
  summary: 'Fly the Pelican T6 twin to Orsa Cay with 450 kg of fruit and cheese for the Saturday market. Heavy on take-off, gentle on landing.',
  time: 'golden', wind: { from: 245, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.5, payload: 450,
  start: { type: 'runway', field: 'marenza', end: 1 },
  briefing: [['mags', 'Meet the Pelican: two engines, eight seats, and today every seat holds a crate of melons.'], ['mags', 'She is heavy, so let her run before you rotate, at 60 knots. Land at 70 and float her on: squashed fruit is not paid for.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400, say: ['dario', 'SV-640, heavy, runway 27, cleared for take-off.'] },
    { type: 'reach', name: 'Orsa Cay', x: -5000, z: -2300, radius: 1500, label: 'Fly the produce to Orsa Cay', hint: '1,000 ft, 70% power, small bank angles when heavy', startDistance: 7000 },
    { type: 'land', field: 'orsa', say: ['mags', 'Orsa market is waiting on the apron. Gently.'] },
  ],
  reward: { money: 740, xp: 290 },
  cargo: true,
  birds: true,
};
