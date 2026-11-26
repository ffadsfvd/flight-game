// The mouse as a control stick: with the pointer locked (click the view) or the left button held,
// moving the mouse deflects the stick, which eases back to centre when the mouse rests. The wheel
// moves the throttle; the right button drags the free-look view.

/** Attaches to the canvas; returns the stick, wheel and free-look state. */
export function createMouseStick(canvas) {
  const state = { x: 0, y: 0, wheel: 0, lookX: 0, lookY: 0, looking: false, dragging: false, locked: false, sensitivity: 0.0045, invertY: false };
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) state.looking = true;
    if (e.button === 0) state.dragging = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 2) state.looking = false;
    if (e.button === 0) state.dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (state.looking) {
      state.lookX += e.movementX * 0.005;
      state.lookY += e.movementY * 0.004;
      return;
    }
    if (state.locked || state.dragging) {
      state.x = Math.max(-1, Math.min(1, state.x + e.movementX * state.sensitivity));
      state.y = Math.max(-1, Math.min(1, state.y + e.movementY * state.sensitivity * (state.invertY ? -1 : 1)));
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.wheel += e.deltaY < 0 ? 1 : -1;
  }, { passive: false });
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
  });
  return {
    state,
    /** Eases the stick toward centre (and free look back to straight ahead when released). */
    relax(dt) {
      const k = Math.exp(-dt * 1.6);
      state.x *= k;
      state.y *= k;
      if (!state.looking) {
        const r = Math.exp(-dt * 2.5);
        state.lookX *= r;
        state.lookY *= r;
      }
    },
    takeWheel() {
      const w = state.wheel;
      state.wheel = 0;
      return w;
    },
    lock() {
      if (canvas.requestPointerLock && document.pointerLockElement !== canvas) {
        try {
          const result = canvas.requestPointerLock();
          if (result && result.catch) result.catch(() => {});
        } catch {
          // Pointer lock can be refused (no user gesture, automation): mouse drag still works.
        }
      }
    },
    unlock() {
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    },
  };
}
