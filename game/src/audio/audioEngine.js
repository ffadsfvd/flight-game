// The Web Audio context, started on the first click or key press (browsers require a gesture),
// with master, effects and music buses and a shared white-noise buffer.

/** Creates the audio engine; everything is silent until unlock() runs from a user gesture. */
export function createAudioEngine() {
  const engine = { ctx: null, master: null, sfx: null, music: null, noise: null, ready: false, volume: 0.8, musicVolume: 0.5 };
  engine.unlock = function unlock() {
    if (engine.ready) {
      if (engine.ctx.state === 'suspended') engine.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    engine.ctx = ctx;
    engine.master = ctx.createGain();
    engine.master.gain.value = engine.volume;
    engine.master.connect(ctx.destination);
    engine.sfx = ctx.createGain();
    engine.sfx.connect(engine.master);
    engine.music = ctx.createGain();
    engine.music.gain.value = engine.musicVolume * 0.35;
    engine.music.connect(engine.master);
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b = 0;
    for (let i = 0; i < length; i += 1) {
      b = 0.97 * b + 0.03 * (Math.random() * 2 - 1);
      data[i] = (Math.random() * 2 - 1) * 0.6 + b * 2.5;
    }
    engine.noise = buffer;
    engine.ready = true;
    for (const fn of engine.onReady) fn();
  };
  engine.onReady = [];
  engine.setVolume = function setVolume(volume, music) {
    engine.volume = volume;
    engine.musicVolume = music;
    if (!engine.ready) return;
    engine.master.gain.setTargetAtTime(volume, engine.ctx.currentTime, 0.05);
    engine.music.gain.setTargetAtTime(music * 0.35, engine.ctx.currentTime, 0.2);
  };
  /** A looping noise source. */
  engine.noiseSource = function noiseSource() {
    const src = engine.ctx.createBufferSource();
    src.buffer = engine.noise;
    src.loop = true;
    return src;
  };
  const unlock = () => engine.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  return engine;
}
