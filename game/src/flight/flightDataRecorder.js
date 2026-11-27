// The flight data recorder: the whole sortie sampled twice a second (altitude, height above the
// ground, airspeed, fuel) with marks for what happened when (take-off, rings, drops, photos, the
// bingo decision, damage, touchdowns, the crash). The debrief draws its chart from this record.

/** Creates an empty recorder. */
export function createFlightDataRecorder() {
  let samples = [];
  let marks = [];
  let clock = 0;
  let next = 0;
  return {
    get samples() {
      return samples;
    },
    get marks() {
      return marks;
    },
    get duration() {
      return clock;
    },
    reset() {
      samples = [];
      marks = [];
      clock = 0;
      next = 0;
    },
    /** Advances the recorder's clock and samples the body when a sample is due. */
    record(body, dt) {
      clock += dt;
      if (clock < next || !body) return;
      next = clock + SAMPLE_SECONDS;
      if (samples.length >= MAX_SAMPLES) samples = samples.filter((_, i) => i % 2 === 0);
      samples.push({ t: clock, altFt: body.position.y * FT, aglFt: Math.max(0, body.agl * FT), kt: body.airspeed * KT, fuelKg: body.engine.fuel, onGround: body.onGround });
    },
    /** Marks an event at the current time: kind sets its colour and icon, label its text. */
    mark(kind, label, extra = {}) {
      const last = marks.at(-1);
      // Two marks of one kind within a second are one event (a bounce, a double report).
      if (last && last.kind === kind && clock - last.t < 1) return;
      marks.push({ t: clock, kind, label, ...extra });
    },
    /** A copy small enough to keep with the result. */
    snapshot() {
      return { samples: samples.slice(), marks: marks.slice(), duration: clock };
    },
  };
}

const SAMPLE_SECONDS = 0.5;
const MAX_SAMPLES = 3600;
const FT = 3.28084;
const KT = 1.94384;
