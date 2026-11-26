// Expedition: a cold front over Marenza. Carry the Nesta hut's mail south over the Velo Saddle of
// the Monte Aurio range, above the freezing level, with ice building on the wings.
export const iceOnVeloSaddle = {
  id: 'velo-ice', chapter: 6, title: 'Ice on the Velo Saddle', kind: 'Mountain pass · icing', giver: 'ines', aircraft: 'wren',
  summary: 'Cross the Monte Aurio range over the 1,880 ft Velo Saddle in a cold front. The freezing level is 1,540 ft: run the anti-ice, keep the climb going and get back under the ice on the far side.',
  time: 'cold', wind: { from: 250, speed: 5, gust: 2.5, turbulence: 0.9 }, fuel: 0.6, payload: 40,
  icing: { level: 470 },
  start: { type: 'air', x: -2250, y: 470, z: -2900, heading: 180, speed: 44, flaps: 0, throttle: 1 },
  briefing: [
    ['ines', 'Cold air came down from the north overnight. Cloud fills Corvo Canyon, so the mail from Nesta goes over the top, through the Velo Saddle.'],
    ['ines', 'Freezing level is 1,540 ft and the saddle is 1,880. Anything you fly above that line picks up ice: it eats your lift and your climb. Anti-ice on with I before you climb into it, and accept the power it costs.'],
    ['ines', 'Over the top, get down below the freezing level and let the ice melt before you fly the approach. Land on 27 at Marenza.'],
  ],
  stages: [
    { type: 'rings', radius: 40, par: 100, penalty: 8, label: 'Cross the Velo Saddle through the three gates', hint: 'Full power, 75 kt climb, anti-ice on (I) above 1,540 ft',
      course: [[-2250, -1500, 520, true], [-2250, 80, 650, true], [-2250, 1350, 430, true]],
      say: ['ines', 'There is the saddle, under the cap cloud. If the climb dies, turn back north while you still can.'] },
    { type: 'land', field: 'marenza', end: 1, label: 'Land on runway 27 at Marenza International', hint: 'Below 1,500 ft the ice melts; 65 kt on final, light headwind',
      say: ['dario', 'Marenza Tower: SV-102, wind 250 at 10, runway 27, cleared to land. Glad to see you over the hill.'] },
  ],
  reward: { money: 760, xp: 340 },
  cargo: true,
};
