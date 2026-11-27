// Objective: take off and climb to a height above the ground, keeping the climb speed.

export function createTakeoffObjective(stage) {
  const target = stage.altitudeFt ?? 800;
  let rotateCalled = false;
  return {
    kind: 'takeoff',
    score: 100,
    begin(ctx) {
      if (stage.say) ctx.radio(stage.say[0], stage.say[1]);
    },
    update(dt, ctx) {
      const b = ctx.body;
      if (b.onGround && !rotateCalled && b.airspeed > b.spec.vRotate) {
        rotateCalled = true;
        ctx.radio(stage.coach ?? 'ines', 'Rotate! Ease the stick back.', { priority: true, duration: 2.5 });
      }
      return !b.onGround && b.agl * FT >= target ? 'done' : 'active';
    },
    info(ctx) {
      const b = ctx.body;
      const agl = Math.max(0, Math.round(b.agl * FT));
      return {
        objective: b.onGround ? stage.label ?? 'Full power, take off' : `Climb to ${target} ft above the ground`,
        next: b.onGround ? `Shift for power, lift off at ${Math.round(b.spec.vRotate * 1.944)} kt (S)` : `Hold ${Math.round(b.spec.vRotate * 1.944 * 1.35)} kt in the climb`,
        stats: [['AGL FT', agl], ['TARGET FT', target], ['SPEED', `${Math.round(b.airspeed * 1.944)} KT`]],
        progress: Math.min(1, agl / target),
      };
    },
    markers: () => [],
    guidance: () => null,
  };
}

const FT = 3.28084;
