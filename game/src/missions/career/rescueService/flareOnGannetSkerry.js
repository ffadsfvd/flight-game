// Rescue Service 1: find the stranded kayakers' red flare on Gannet Skerry and drop supply crates on it.
export const flareOnGannetSkerry = {
  id: 'rescue-drop', chapter: 3, title: 'Flare on Gannet Skerry', kind: 'Search & rescue', giver: 'lena', aircraft: 'wren',
  summary: 'Two kayakers are stranded on Gannet Skerry. Find their red flare and drop a supply crate on it.',
  time: 'golden', wind: { from: 230, speed: 5, gust: 2, turbulence: 0.5 }, fuel: 0.5,
  start: { type: 'air', x: -4200, y: 320, z: 1300, heading: 255, speed: 48, flaps: 0, throttle: 0.7 },
  briefing: [['lena', 'Rescue Control. Two kayakers on Gannet Skerry, cold and wet. The boat cannot reach them before the tide turns.'], ['lena', 'You have three crates with parachutes. Come in low and slow and release with Space just before the smoke. Mind the wind drift.']],
  stages: [
    { type: 'supply-drop', x: -6560, z: 2620, radius: 50, crates: 3, say: ['lena', 'They have lit the flare. Red smoke, west of you.'] },
  ],
  reward: { money: 500, xp: 230 },
};
