// A short original music loop for the menus: a warm four-chord progression on soft pads with a
// plucked arpeggio and a light shaker, sequenced in Web Audio. It fades down in flight.

const CHORDS = [
  [57, 61, 64, 69], [54, 57, 61, 66], [50, 54, 57, 62], [52, 56, 59, 64],
];
const ARP = [0, 2, 1, 3, 2, 1, 3, 2];
const STEP = 0.24;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Creates the music player. */
export function createMusicLoop(audio) {
  let playing = false;
  let nextTime = 0;
  let step = 0;
  let timer = null;
  let level = 1;

  function pad(freq, t, length) {
    const ctx = audio.ctx;
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05 * level, t + 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + length);
      osc.connect(g);
      g.connect(audio.music);
      osc.start(t);
      osc.stop(t + length + 0.1);
    }
  }
  function pluck(freq, t) {
    const ctx = audio.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(g);
    g.connect(audio.music);
    osc.start(t);
    osc.stop(t + 0.6);
  }
  function shaker(t, accent) {
    const ctx = audio.ctx;
    const src = audio.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((accent ? 0.05 : 0.025) * level, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(filter);
    filter.connect(g);
    g.connect(audio.music);
    src.start(t);
    src.stop(t + 0.1);
  }
  function schedule() {
    const ctx = audio.ctx;
    while (nextTime < ctx.currentTime + 0.6) {
      const bar = Math.floor(step / 8) % CHORDS.length;
      const chord = CHORDS[bar];
      if (step % 8 === 0) for (const n of chord) pad(midi(n - 12), nextTime, STEP * 8);
      pluck(midi(chord[ARP[step % 8]] + 12), nextTime);
      shaker(nextTime, step % 2 === 0);
      nextTime += STEP;
      step += 1;
    }
  }
  return {
    setLevel(v) {
      level = v;
    },
    start() {
      if (!audio.ready || playing) return;
      playing = true;
      nextTime = audio.ctx.currentTime + 0.1;
      timer = setInterval(schedule, 150);
    },
    stop() {
      playing = false;
      if (timer) clearInterval(timer);
      timer = null;
    },
    get playing() {
      return playing;
    },
  };
}
