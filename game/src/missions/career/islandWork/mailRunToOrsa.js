// Island Work 1: 110 kg of mail from Marenza to Orsa Cay Field, paid by how gently it arrives.
export const mailRunToOrsa = {
  id: 'mail-run', chapter: 2, title: 'Mail Run to Orsa Cay', kind: 'Cargo', giver: 'mags', aircraft: 'wren',
  summary: 'Carry 110 kg of mail from Marenza to Orsa Cay Field. A soft landing keeps the parcels intact.',
  time: 'golden', wind: { from: 240, speed: 5, gust: 2, turbulence: 0.4 }, fuel: 0.42, payload: 110,
  start: { type: 'runway', field: 'marenza', end: 1 },
  briefing: [['mags', 'Brightwater Freight, Mags speaking. Mail bags for Orsa Cay, 110 kilos. The islanders want their letters dry and their parcels unsquashed.'], ['mags', 'Fuel is tight on purpose: no sightseeing. Pay depends on how gently you put her down.']],
  stages: [
    { type: 'takeoff', altitudeFt: 400 },
    { type: 'reach', name: 'Orsa Cay', x: -5000, z: -2300, radius: 1500, label: 'Fly north-west to Orsa Cay', hint: 'Cruise at 1,000 ft, about 75% power to save fuel', startDistance: 7000 },
    { type: 'land', field: 'orsa', say: ['mags', 'Orsa Field has you in sight. Land into the wind, mind the mesas.'] },
  ],
  reward: { money: 520, xp: 200 },
  cargo: true,
};
