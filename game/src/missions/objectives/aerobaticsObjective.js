// Objective: fly a display routine of scored figures: a loop (pitch through 360° with the wings
// level), an aileron roll (360° of roll in under 8 s), an inverted pass (4 s upside down) and a
// climbing turn. Each figure is judged on how much height it gains or loses and how clean it is.

const FIGURES = {
  loop: { name: 'Loop', hint: 'From 140 kt, pull steadily all the way round, wings level' },
  roll: { name: 'Aileron roll', hint: 'Nose a little up, then full aileron for a full turn' },
  inverted: { name: 'Inverted pass', hint: 'Roll upside down and hold it level for 4 s (push W)' },
  wingover: { name: 'Wingover', hint: 'Climb, bank past 75° and come back the other way' },
};

export function createAerobaticsObjective(stage) {
  const figures = stage.figures.map((id) => ({ id, ...FIGURES[id], done: false, score: 0 }));
  let pitchAccum = 0;
  let rollAccum = 0;
  let windowStart = 0;
  let entryAlt = 0;
  let maxBankDev = 0;
  let invertedTime = 0;
  let invertedAlt = 0;
  let headingStart = null;
  let bankPeak = 0;
  const objective = {
    kind: 'aerobatics',
    score: 0,
    rows: [],
    begin(ctx) {
      entryAlt = ctx.body.position.y;
      windowStart = ctx.time;
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    update(dt, ctx) {
      const b = ctx.body;
      const w = b.angularVelocity;
      pitchAccum += w.x * dt;
      rollAccum += w.z * dt;
      maxBankDev = Math.max(maxBankDev, Math.min(Math.abs(b.bank), 180 - Math.abs(b.bank)));
      const elapsed = ctx.time - windowStart;
      const complete = (id, score) => {
        const f = figures.find((x) => x.id === id && !x.done);
        if (!f) return;
        f.done = true;
        f.score = Math.round(Math.max(20, Math.min(100, score)));
        ctx.toast(`${f.name.toUpperCase()}  ${f.score}%`, 'good');
        ctx.sound('ring');
        ctx.report({ kind: 'figure', name: f.name, score: f.score });
      };
      if (Math.abs(pitchAccum) > Math.PI * 1.85 && Math.abs(rollAccum) < Math.PI * 0.6) {
        complete('loop', 100 - Math.abs(b.position.y - entryAlt) * 0.5 - maxBankDev * 0.4);
        reset(ctx);
      } else if (Math.abs(rollAccum) > Math.PI * 1.85 && elapsed < 8) {
        complete('roll', 100 - Math.abs(b.position.y - entryAlt) * 0.8 - Math.max(0, elapsed - 4) * 8);
        reset(ctx);
      } else if (elapsed > (Math.abs(pitchAccum) > 1 ? 25 : 8)) {
        reset(ctx);
      }
      if (Math.abs(b.bank) > 150) {
        if (invertedTime === 0) invertedAlt = b.position.y;
        invertedTime += dt;
        if (invertedTime > 4) {
          complete('inverted', 100 - Math.abs(b.position.y - invertedAlt) * 1.2);
          invertedTime = 0;
        }
      } else {
        invertedTime = 0;
      }
      if (headingStart === null) headingStart = b.heading;
      bankPeak = Math.max(bankPeak, Math.abs(b.bank));
      const turned = Math.abs(((b.heading - headingStart + 540) % 360) - 180);
      if (bankPeak > 75 && turned > 150 && Math.abs(b.bank) < 20) {
        complete('wingover', 70 + Math.min(30, (b.position.y - entryAlt < 60 ? 30 : 10)));
        headingStart = b.heading;
        bankPeak = 0;
      }
      if (Math.abs(b.bank) < 10 && turned < 20) bankPeak = Math.min(bankPeak, 30);
      if (figures.every((f) => f.done)) {
        objective.score = Math.round(figures.reduce((s, f) => s + f.score, 0) / figures.length);
        for (const f of figures) objective.rows.push([f.name, `${f.score}%`]);
        return 'done';
      }
      return 'active';
    },
    info(ctx) {
      const pending = figures.filter((f) => !f.done);
      const f = pending[0];
      return {
        objective: f ? `Figure: ${f.name}` : 'Routine complete',
        next: f ? f.hint : '',
        stats: [['FIGURES', `${figures.length - pending.length} / ${figures.length}`], ['G', ctx.body.gForce.toFixed(1)], ['SMOKE', ctx.body.smokeOn ? 'ON' : 'T KEY']],
        progress: (figures.length - pending.length) / figures.length,
      };
    },
    markers: () => (stage.box ? [{ x: stage.box[0], z: stage.box[1], kind: 'area', radius: stage.box[2], active: true, label: 'DISPLAY BOX', color: '#ff4fd8' }] : []),
    guidance: () => null,
    bearing: () => null,
  };
  function reset(ctx) {
    pitchAccum = 0;
    rollAccum = 0;
    maxBankDev = 0;
    windowStart = ctx.time;
    entryAlt = ctx.body.position.y;
  }
  return objective;
}
