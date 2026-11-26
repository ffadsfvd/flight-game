// The frame loop: measures real time between frames (capped so a stalled tab does not replay a
// long gap), counts frames per second for the perf tool, and pauses when the tab is hidden.

/** Starts calling frame(dt) every animation frame; returns a stats object. */
export function startMainLoop(frame) {
  const stats = { fps: 0, frameMs: 0, frames: 0 };
  let last = performance.now();
  let windowStart = last;
  let count = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const t0 = performance.now();
    frame(dt);
    stats.frameMs = stats.frameMs * 0.9 + (performance.now() - t0) * 0.1;
    count += 1;
    stats.frames += 1;
    if (now - windowStart >= 1000) {
      stats.fps = Math.round((count * 1000) / (now - windowStart));
      count = 0;
      windowStart = now;
    }
  }
  requestAnimationFrame(tick);
  return stats;
}
