// One-shot sounds made from oscillators and noise: tyre chirp and touchdown thump, crash, splash,
// gear and flap motors, ring chime, missed ring, stage chime, release, camera shutter, bird strike,
// engine failure, warning ping and menu clicks.

/** Creates the effects player on the audio engine. */
export function createSoundEffects(audio) {
  function tone(freq, duration, { type = 'sine', gain = 0.2, slide = 0, delay = 0 } = {}) {
    const ctx = audio.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(audio.sfx);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }
  function noise(duration, { freq = 800, q = 1, gain = 0.3, type = 'bandpass', sweep = 0, delay = 0 } = {}) {
    const ctx = audio.ctx;
    const t = ctx.currentTime + delay;
    const src = audio.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(30, freq + sweep), t + duration);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(audio.sfx);
    src.start(t);
    src.stop(t + duration + 0.05);
  }
  const library = {
    touchdown: (s = 1) => {
      noise(0.25, { freq: 2400, q: 2, gain: 0.18 * s });
      tone(70, 0.35, { gain: 0.35 * s, slide: -30 });
    },
    crash: () => {
      noise(1.8, { freq: 900, q: 0.4, gain: 0.7, type: 'lowpass', sweep: -800 });
      tone(55, 1.2, { gain: 0.5, slide: -25, type: 'triangle' });
    },
    splash: () => noise(1.2, { freq: 1500, q: 0.6, gain: 0.45, sweep: -1100 }),
    gear: () => {
      noise(1.6, { freq: 300, q: 3, gain: 0.12 });
      tone(160, 0.12, { gain: 0.15, delay: 1.5, type: 'square' });
    },
    flaps: () => noise(1.0, { freq: 520, q: 5, gain: 0.08 }),
    ring: () => {
      tone(880, 0.18, { gain: 0.15 });
      tone(1320, 0.25, { gain: 0.12, delay: 0.08 });
    },
    miss: () => tone(240, 0.35, { gain: 0.18, type: 'square', slide: -80 }),
    stage: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.22, { gain: 0.12, delay: i * 0.09 })),
    success: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.4, { gain: 0.14, delay: i * 0.12, type: 'triangle' })),
    fail: () => [392, 330, 262].forEach((f, i) => tone(f, 0.45, { gain: 0.14, delay: i * 0.16, type: 'triangle' })),
    release: () => {
      noise(0.5, { freq: 700, q: 1, gain: 0.25, sweep: -400 });
      tone(200, 0.2, { gain: 0.12, type: 'square' });
    },
    shutter: () => {
      noise(0.05, { freq: 4000, q: 1, gain: 0.3 });
      noise(0.06, { freq: 3000, q: 1, gain: 0.25, delay: 0.09 });
    },
    bird: () => {
      noise(0.15, { freq: 1200, q: 1, gain: 0.5 });
      tone(90, 0.3, { gain: 0.3, slide: -40 });
    },
    'engine-fail': () => {
      noise(0.6, { freq: 400, q: 1, gain: 0.4, type: 'lowpass', sweep: -300 });
      tone(48, 1.2, { gain: 0.25, slide: -20, type: 'sawtooth' });
    },
    warning: () => tone(1250, 0.15, { gain: 0.12, type: 'square' }),
    click: () => tone(1500, 0.04, { gain: 0.06, type: 'square' }),
    radio: () => noise(0.12, { freq: 2500, q: 3, gain: 0.08 }),
  };
  return {
    play(name, strength) {
      if (!audio.ready || !library[name]) return;
      library[name](strength);
    },
  };
}
