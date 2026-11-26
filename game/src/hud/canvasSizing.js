// Keeps a HUD canvas's backing store matched to its on-screen size and pixel ratio, and lets each
// panel draw in fixed logical units whatever the window size.

/** Resizes `canvas` if needed and returns its 2D context scaled to a logical width x height. */
export function prepareCanvas(canvas, logicalWidth, logicalHeight) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(width / logicalWidth, 0, 0, height / logicalHeight, 0, 0);
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  return ctx;
}
