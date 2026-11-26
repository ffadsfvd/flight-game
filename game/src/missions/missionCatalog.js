// The Solvara career: three chapters of missions, each with its giver, aircraft, start, weather,
// briefing dialogue, stages and pay. Stage types: takeoff, rings, land, reach, supply-drop,
// firefighting, photo, aerobatics, formation (and land with failEngine for the dead stick).

export const CHAPTERS = [
  { id: 1, name: 'Flight School', subtitle: 'Marenza Flight School with Ines Varga', rank: 0 },
  { id: 2, name: 'Island Work', subtitle: 'Freight, rescue and fire duty across the islands', rank: 1 },
  { id: 3, name: 'Pro Pilot', subtitle: 'Storms, emergencies, display flying and the Archipelago Cup', rank: 2 },
];

export const MISSIONS = [
  {
    id: 'first-solo', chapter: 1, title: 'First Solo', kind: 'Training', giver: 'ines', aircraft: 'wren',
    summary: 'Take off from Marenza, fly the right-hand circuit over Porto Celeste through six rings and land back on runway 09.',
    time: 'golden', wind: { from: 75, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.6,
    start: { type: 'runway', field: 'marenza', end: 0 },
    briefing: [['ines', 'Your first solo. Full power, lift off at 50 knots, climb straight ahead to 500 feet.'], ['ines', 'Then follow the rings round the circuit over the town and bring her back to runway 09. Gear is fixed, so just flaps and a gentle flare.'], ['dario', 'Marenza Tower: SV-102, wind 075 at 6, runway 09, cleared for take-off.']],
    stages: [
      { type: 'takeoff', altitudeFt: 500, say: ['dario', 'SV-102, cleared for take-off runway 09. Good luck.'] },
      { type: 'rings', radius: 34, par: 210, label: 'Fly the circuit through the rings', hint: 'Gentle 20° banks, hold about 750 ft and 80 kt',
        course: [[-700, 2950, 150], [-100, 3560, 200], [-1300, 4100, 230], [-3000, 4100, 230], [-4300, 3620, 190], [-4100, 2950, 71, true]],
        say: ['ines', 'Nice climb. Turn right onto the crosswind leg and pick up the rings.'] },
      { type: 'land', field: 'marenza', end: 0, say: ['dario', 'SV-102, number one, runway 09, cleared to land.'] },
    ],
    reward: { money: 350, xp: 160 },
  },
  {
    id: 'canyon-run', chapter: 1, title: 'Corvo Canyon', kind: 'Time trial', giver: 'ines', aircraft: 'wren',
    summary: 'Thread twelve rings through the gorge of Corvo Canyon to the north coast. Beat the par time.',
    time: 'golden', wind: { from: 250, speed: 2, gust: 1, turbulence: 0.5 }, fuel: 0.5,
    start: { type: 'air', x: -230, y: 150, z: 2750, heading: 352, speed: 50, flaps: 0, throttle: 0.8 },
    briefing: [['ines', 'Corvo Canyon is where the school sorts pilots from passengers. The walls are close, so fly the rings, not the scenery.'], ['ines', 'Keep your speed up, look ahead to the next ring, and do not chase the floor.']],
    stages: [
      { type: 'rings', radius: 26, par: 95, label: 'Fly the canyon through every ring', hint: 'Look one ring ahead; bank early, level early',
        course: [[-200, 2050, 112, true], [-160, 1720, 104, true], [-300, 1350, 102, true], [-380, 1050, 104, true], [-330, 700, 110, true], [-265, 420, 112, true], [-450, 120, 108, true], [-640, -180, 102, true], [-600, -500, 94, true], [-565, -820, 86, true], [-720, -1160, 74, true], [-880, -1500, 64, true]],
        say: ['ines', 'Into the canyon. Smooth hands.'] },
    ],
    reward: { money: 400, xp: 180 },
    medals: { gold: 85, silver: 65, bronze: 35 },
  },
  {
    id: 'highstrip', chapter: 1, title: 'Highstrip Short Field', kind: 'Short field', giver: 'ines', aircraft: 'wren',
    summary: 'Land on the 640 m grass strip high on Calvera and stop within the first 260 m.',
    time: 'golden', wind: { from: 340, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.45,
    start: { type: 'air', x: 1650, y: 420, z: -300, heading: 8, speed: 46, flaps: 1, throttle: 0.5 },
    briefing: [['ines', 'Calvera Highstrip: grass, short, and uphill wind off the volcano. Touch down in the first 260 metres or you go home in a tractor.'], ['ines', 'Full flaps, slow and steady, firm touchdown is fine. Brakes on the moment you are down.']],
    stages: [
      { type: 'land', field: 'calvera', end: 1, shortField: 260, label: 'Land on Highstrip 35 within 260 m of the threshold', hint: 'Full flaps (F), 60 kt, aim at the threshold markers' },
    ],
    reward: { money: 420, xp: 200 },
  },
  {
    id: 'mail-run', chapter: 2, title: 'Mail Run to Orsa Cay', kind: 'Cargo', giver: 'mags', aircraft: 'wren',
    summary: 'Carry 110 kg of mail from Marenza to Orsa Cay Field. A soft landing keeps the parcels intact.',
    time: 'golden', wind: { from: 240, speed: 5, gust: 2, turbulence: 0.4 }, fuel: 0.42, payload: 110,
    start: { type: 'runway', field: 'marenza', end: 1 },
    briefing: [['mags', 'Brightwater Freight, Mags speaking. Mail bags for Orsa Cay, 110 kilos. The islanders want their letters dry and their parcels unsquashed.'], ['mags', 'Fuel is tight on purpose: no sightseeing. Pay depends on how gently you put her down.']],
    stages: [
      { type: 'takeoff', altitudeFt: 400 },
      { type: 'reach', name: 'Orsa Cay', x: -5000, z: -2300, radius: 1500, label: 'Fly north-west to Orsa Cay', hint: 'Cruise at 1,000 ft, about 75% power to save fuel', startDistance: 7000 },
      { type: 'land', field: 'orsa', say: ['mags', 'Orsa Field has you in sight. Land into the wind.'] },
    ],
    reward: { money: 520, xp: 200 },
    cargo: true,
  },
  {
    id: 'lagoon', chapter: 2, title: 'Lagoon Touchdown', kind: 'Seaplane', giver: 'mags', aircraft: 'heron',
    summary: 'Bring the Heron down on the water lane of Lumeno Lagoon: gear up, gentle descent, stop by the buoys.',
    time: 'golden', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.5,
    start: { type: 'air', x: 1300, y: 230, z: 2450, heading: 70, speed: 40, flaps: 1, throttle: 0.45, gearDown: false },
    briefing: [['mags', 'Your first job in the Heron. Lumeno has no runway, just the lagoon and a line of orange buoys.'], ['mags', 'Wheels UP for water. Wheels down on water and she flips, and I keep your wages for the repairs.']],
    stages: [
      { type: 'land', field: 'lumeno', end: 0, water: true, label: 'Land on the Lumeno Lagoon water lane', hint: 'Gear UP, flaps down, 55 kt, 200 fpm down onto the water' },
    ],
    reward: { money: 480, xp: 220 },
  },
  {
    id: 'rescue-drop', chapter: 2, title: 'Flare on Gannet Skerry', kind: 'Search & rescue', giver: 'lena', aircraft: 'wren',
    summary: 'Two kayakers are stranded on Gannet Skerry. Find their red flare and drop a supply crate on it.',
    time: 'golden', wind: { from: 230, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.5,
    start: { type: 'air', x: -4200, y: 320, z: 1300, heading: 255, speed: 48, flaps: 0, throttle: 0.7 },
    briefing: [['lena', 'Rescue Control. Two kayakers on Gannet Skerry, cold and wet. The boat cannot reach them before the tide turns.'], ['lena', 'You have three crates with parachutes. Come in low and slow and release with Space just before the smoke. Mind the wind drift.']],
    stages: [
      { type: 'supply-drop', x: -6560, z: 2620, radius: 50, crates: 3, say: ['lena', 'They have lit the flare. Red smoke, west of you.'] },
    ],
    reward: { money: 500, xp: 230 },
  },
  {
    id: 'firebreak', chapter: 2, title: 'Fire on Calvera', kind: 'Firefighting', giver: 'bruno', aircraft: 'heron',
    summary: 'A forest fire is spreading on Calvera. Drop water on the hot spots and scoop more from the sea.',
    time: 'golden', wind: { from: 220, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.6,
    start: { type: 'air', x: 3200, y: 230, z: -500, heading: 5, speed: 42, flaps: 1, throttle: 0.65, gearDown: false },
    briefing: [['bruno', 'Fire Base Calvera. Pine forest burning above San Calvo. Two hot spots, moving uphill.'], ['bruno', 'Your tank is full. Release low over the flames with Space, then skim the sea at speed to scoop more. Gear up on the water!']],
    stages: [
      { type: 'firefighting', startFull: true, fires: [[3250, -2050, 55], [3600, -2000, 50], [3420, -2250, 45]], say: ['bruno', 'Smoke is in sight dead ahead. Hit the downwind edge first.'] },
    ],
    reward: { money: 650, xp: 260 },
  },
  {
    id: 'postcards', chapter: 2, title: 'Postcards from Solvara', kind: 'Aerial photography', giver: 'nadia', aircraft: 'wren',
    summary: 'Photograph the Faro Lumeno lighthouse, Mount Ignara and the Arco Solare sea arch for the Gazette.',
    time: 'golden', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.55,
    start: { type: 'air', x: 4700, y: 260, z: 1500, heading: 150, speed: 48, flaps: 0, throttle: 0.7 },
    briefing: [['nadia', 'Nadia from the Solvara Gazette. The summer issue needs three covers and the light is perfect.'], ['nadia', 'Point the nose at each landmark from a few hundred metres and press Space. Centred and close is best.']],
    stages: [
      { type: 'photo', targets: ['lighthouse', 'volcano', 'arch'], range: [180, 1700], say: ['nadia', 'Lighthouse first, it is just south of you.'] },
    ],
    reward: { money: 450, xp: 210 },
  },
  {
    id: 'dead-stick', chapter: 3, title: 'Dead Stick', kind: 'Emergency', giver: 'ines', aircraft: 'wren',
    summary: 'The engine quits at 2,000 ft over the bay. Glide to the nearest runway and land without power.',
    time: 'golden', wind: { from: 250, speed: 4, gust: 1, turbulence: 0.3 }, fuel: 0.4,
    start: { type: 'air', x: 1800, y: 620, z: 3900, heading: 290, speed: 46, flaps: 0, throttle: 0.6 },
    briefing: [['ines', 'Today I pull the mixture on you. No warning, no engine.'], ['ines', 'Best glide is about 75 knots: trade height for distance, not speed. Pick the nearest field and commit.']],
    stages: [
      { type: 'land', field: 'nearest', failEngine: true, label: 'Engine failure: glide to a runway and land', say: ['ines', 'Engine failure! Best glide speed, find your field.'] },
    ],
    reward: { money: 600, xp: 280 },
  },
  {
    id: 'storm-approach', chapter: 3, title: 'Storm Front', kind: 'Instrument approach', giver: 'dario', aircraft: 'wren',
    summary: 'A squall line hides Marenza. Fly the approach guide down to runway 27 in rain, gusts and low cloud.',
    time: 'storm', wind: { from: 235, speed: 9, gust: 5, turbulence: 1.4 }, fuel: 0.45,
    start: { type: 'approach', field: 'marenza', end: 1, distance: 6500, height: 120, flaps: 0 },
    briefing: [['dario', 'Marenza Tower. Visibility under three kilometres in rain, wind 235 gusting 28 knots.'], ['dario', 'Fly the approach guide: keep the diamonds centred and the PAPI two white, two red. Crab into the wind.']],
    stages: [
      { type: 'land', field: 'marenza', end: 1, label: 'Fly the approach guide to runway 27', hint: 'Centre both diamonds, 70 kt, crab into the gusts', say: ['dario', 'SV-102, you are cleared to land runway 27, wind 235 gusting 28.'] },
    ],
    reward: { money: 650, xp: 300 },
  },
  {
    id: 'sky-ballet', chapter: 3, title: 'Sky Ballet', kind: 'Aerobatics', giver: 'teo', aircraft: 'swiftlet',
    summary: 'Fly a display over the bay of Porto Celeste: loop, aileron roll, inverted pass and wingover.',
    time: 'golden', wind: { from: 250, speed: 2, gust: 0.5, turbulence: 0.1 }, fuel: 0.6,
    start: { type: 'air', x: -2200, y: 900, z: 5200, heading: 90, speed: 85, flaps: 0, throttle: 0.75, gearDown: false },
    briefing: [['teo', 'Teo Ranieri, team Scirocco. They say you can fly. Show the beach.'], ['teo', 'Loop, roll, inverted pass, wingover. Smoke on with T. Lose too much height and the judges notice.']],
    stages: [
      { type: 'aerobatics', figures: ['loop', 'roll', 'inverted', 'wingover'], box: [-500, 5200, 1800], say: ['teo', 'Smoke on and show me a loop.'] },
    ],
    reward: { money: 700, xp: 300 },
  },
  {
    id: 'formation', chapter: 3, title: 'Wing of the Lead', kind: 'Formation', giver: 'ines', aircraft: 'wren',
    summary: 'Fly formation off Ines Varga\'s right wing around the south coast of Marenza.',
    time: 'golden', wind: { from: 250, speed: 2, gust: 0.5, turbulence: 0.2 }, fuel: 0.6,
    start: { type: 'air', x: -3400, y: 330, z: 4000, heading: 80, speed: 46, flaps: 0, throttle: 0.6 },
    briefing: [['ines', 'Formation is about small corrections. Little power changes, little banks, eyes on my wingtip.'], ['ines', 'Stay in the gold slot off my right wing. Lose me and the lesson is over.']],
    stages: [
      { type: 'formation', aircraft: 'wren', speed: 44, slot: [20, 0, 24], tolerance: 26,
        path: [[-2400, 4100, 330], [-600, 4500, 330], [1200, 4100, 340], [1900, 2900, 360], [1100, 1700, 380], [-300, 1500, 380], [-1800, 1650, 360], [-3200, 2300, 330]],
        say: ['ines', 'Join up on my right wing. Smoothly now.'] },
    ],
    reward: { money: 600, xp: 280 },
  },
  {
    id: 'volcano-run', chapter: 3, title: 'Ignara Ring Run', kind: 'Time trial', giver: 'teo', aircraft: 'heron',
    summary: 'Circle Mount Ignara through ten rings and finish through the Arco Solare sea arch.',
    time: 'golden', wind: { from: 250, speed: 4, gust: 2, turbulence: 0.6 }, fuel: 0.6,
    start: { type: 'air', x: 1400, y: 300, z: -2600, heading: 10, speed: 50, flaps: 0, throttle: 0.85, gearDown: false },
    briefing: [['teo', 'The Ignara run: round the volcano, under the smoke, and home through the arch. Even a bush plane can do it.'], ['teo', 'Watch the hot air near the crater, it bumps.']],
    stages: [
      { type: 'rings', radius: 30, par: 230,
        course: [[1700, -3800, 260, true], [2300, -5100, 330, true], [3500, -5900, 380, true], [4900, -5400, 380, true], [5900, -4100, 330, true], [5800, -2700, 280, true], [4900, -1500, 220, true], [3600, -1050, 160, true], [2600, -1350, 90, true], [1850, -1650, 26, true, 34]],
        say: ['teo', 'Clock is running.'] },
    ],
    reward: { money: 650, xp: 300 },
  },
  {
    id: 'night-mail', chapter: 3, title: 'Night Mail', kind: 'Night cargo', giver: 'mags', aircraft: 'wren',
    summary: 'Fly the late mail from Orsa Cay back to Marenza under the stars and land on the lit runway.',
    time: 'night', wind: { from: 250, speed: 3, gust: 1, turbulence: 0.2 }, fuel: 0.45, payload: 90,
    start: { type: 'runway', field: 'orsa', end: 1 },
    briefing: [['mags', 'Last bags of the day. Marenza has the runway lights on for you.'], ['mags', 'At night the approach lights and the PAPI are your best friends. Trust the instruments.']],
    stages: [
      { type: 'takeoff', altitudeFt: 400 },
      { type: 'reach', name: 'Marenza approach', x: 1200, z: 2950, radius: 1600, label: 'Fly south-east to the Marenza approach', hint: 'Follow the bug; the runway lights are visible from far out', startDistance: 9000 },
      { type: 'land', field: 'marenza', end: 1, say: ['dario', 'Night mail, Marenza Tower, runway 27, lights are up, cleared to land.'] },
    ],
    reward: { money: 600, xp: 260 },
    cargo: true,
  },
  {
    id: 'archipelago-cup', chapter: 3, title: 'Archipelago Cup', kind: 'Air race', giver: 'teo', aircraft: 'swiftlet',
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
  },
];

/** The mission with this id. */
export function missionById(id) {
  return MISSIONS.find((m) => m.id === id) ?? null;
}

/** Medal for a 0..100 score with the mission's thresholds. */
export function medalFor(mission, score) {
  const m = mission?.medals ?? { gold: 85, silver: 65, bronze: 40 };
  return score >= m.gold ? 'gold' : score >= m.silver ? 'silver' : score >= m.bronze ? 'bronze' : 'none';
}
