// Racing and Airshow 6: towing the summer festival banner low and slow along the Porto Celeste beach.
export const beachBannerRun = {
  id: 'banner-run', chapter: 4, title: 'Festival Banner', kind: 'Banner towing', giver: 'nadia', aircraft: 'wren',
  summary: 'Tow the Festa del Sole banner along the south beach of Marenza: low, slow and steady through every gate.',
  time: 'golden', wind: { from: 240, speed: 3, gust: 1, turbulence: 0.3 }, fuel: 0.5,
  banner: 'FESTA DEL SOLE · PORTO CELESTE',
  start: { type: 'air', x: -4300, y: 70, z: 3700, heading: 106, speed: 38, flaps: 1, throttle: 0.75 },
  briefing: [['nadia', 'The festival committee paid for one pass along the beach, so make it count.'], ['nadia', 'The banner drags: keep the speed up a little, 150 feet over the sand, and no steep turns or it twists.']],
  stages: [
    { type: 'rings', radius: 38, par: 175, band: [60, 90], label: 'Tow the banner through the beach gates', hint: '150 ft over the sand, 70 kt, gentle banks only',
      course: [[-3600, 3900, 50, true], [-2800, 4060, 45, true], [-2000, 4150, 45, true], [-1200, 4160, 45, true], [-400, 4060, 45, true], [400, 3920, 50, true], [1200, 3760, 60, true]],
      say: ['nadia', 'Banner is flying. The beach is full, wave if you like.'] },
  ],
  reward: { money: 520, xp: 230 },
  birds: true,
};
