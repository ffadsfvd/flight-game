// The continuous sounds of flight: the engine (propeller drone with firing harmonics, or the jet's
// roar and whine) following RPM and throttle, the wind rising with airspeed, tyre rumble on the
// ground, the stall horn and the warning chime.

/** Creates the flight sound bed on the audio engine. */
export function createFlightSounds(audio) {
  let nodes = null;
  function build() {
    const ctx = audio.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(audio.sfx);
    const prop = ctx.createOscillator();
    prop.type = 'sawtooth';
    const firing = ctx.createOscillator();
    firing.type = 'square';
    const propFilter = ctx.createBiquadFilter();
    propFilter.type = 'lowpass';
    propFilter.frequency.value = 700;
    const propGain = ctx.createGain();
    propGain.gain.value = 0;
    prop.connect(propFilter);
    firing.connect(propFilter);
    propFilter.connect(propGain);
    propGain.connect(out);
    const roar = audio.noiseSource();
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = 'bandpass';
    roarFilter.Q.value = 0.7;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0;
    roar.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(out);
    const whine = ctx.createOscillator();
    whine.type = 'sine';
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0;
    whine.connect(whineGain);
    whineGain.connect(out);
    const wind = audio.noiseSource();
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.Q.value = 0.5;
    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(out);
    const rumble = audio.noiseSource();
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 180;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(out);
    const horn = ctx.createOscillator();
    horn.type = 'square';
    horn.frequency.value = 880;
    const hornGain = ctx.createGain();
    hornGain.gain.value = 0;
    horn.connect(hornGain);
    hornGain.connect(out);
    for (const s of [prop, firing, roar, whine, wind, rumble, horn]) s.start();
    nodes = { out, prop, firing, propFilter, propGain, roar, roarFilter, roarGain, whine, whineGain, wind, windFilter, windGain, rumbleGain, horn, hornGain };
  }
  return {
    /** active: flying view; d: readout; warnings: active warning ids. */
    update(active, d, warnings, time) {
      if (!audio.ready) return;
      if (!nodes) build();
      const t = audio.ctx.currentTime;
      const k = 0.08;
      nodes.out.gain.setTargetAtTime(active ? 1 : 0, t, 0.3);
      if (!active) return;
      const rpm = d.engineRunning ? d.rpm : d.rpm * 0.5;
      if (d.isJet) {
        nodes.propGain.gain.setTargetAtTime(0, t, k);
        nodes.roarFilter.frequency.setTargetAtTime(300 + rpm * 1400, t, k);
        nodes.roarGain.gain.setTargetAtTime(d.engineRunning ? 0.08 + rpm * 0.32 : 0, t, k);
        nodes.whine.frequency.setTargetAtTime(1800 + rpm * 2600, t, k);
        nodes.whineGain.gain.setTargetAtTime(d.engineRunning ? 0.012 + rpm * 0.02 : 0, t, k);
      } else {
        const base = 28 + rpm * 62;
        const rough = d.engineHealth < 0.6 ? Math.sin(time * 23) * 6 * (1 - d.engineHealth) : 0;
        nodes.prop.frequency.setTargetAtTime(base + rough, t, k);
        nodes.firing.frequency.setTargetAtTime(base * 2 + rough, t, k);
        nodes.propFilter.frequency.setTargetAtTime(300 + rpm * 900, t, k);
        nodes.propGain.gain.setTargetAtTime(d.engineRunning ? 0.05 + rpm * 0.14 : 0, t, k);
        nodes.roarFilter.frequency.setTargetAtTime(160 + rpm * 500, t, k);
        nodes.roarGain.gain.setTargetAtTime(d.engineRunning ? 0.04 + rpm * 0.1 : 0, t, k);
        nodes.whineGain.gain.setTargetAtTime(0, t, k);
      }
      const speed = Math.min(1, d.kt / 220);
      nodes.windFilter.frequency.setTargetAtTime(300 + speed * 1600, t, k);
      nodes.windGain.gain.setTargetAtTime(0.01 + speed * speed * 0.3, t, k);
      nodes.rumbleGain.gain.setTargetAtTime(d.onGround && !d.onWater ? Math.min(0.35, d.gsKt / 120) : 0, t, k);
      const stall = warnings.some((w) => w.id === 'stall');
      const pull = warnings.some((w) => w.id === 'pullup');
      const horn = stall || (pull && Math.sin(time * 12) > 0);
      nodes.horn.frequency.setTargetAtTime(pull && !stall ? 620 : 880, t, 0.01);
      nodes.hornGain.gain.setTargetAtTime(horn ? 0.045 : 0, t, 0.02);
    },
  };
}
