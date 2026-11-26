// Keyboard state: which keys are held (by physical code) and which were pressed since the last
// frame. Browser shortcuts the game uses (Space, arrows, Ctrl) are kept from scrolling the page.

const CAPTURED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ControlLeft', 'ControlRight', 'Tab', 'F1']);

/** Starts listening on window; returns held(code), takePressed() and clear(). */
export function createKeyboardInput(target = window) {
  const held = new Set();
  const pressed = [];
  target.addEventListener('keydown', (event) => {
    if (CAPTURED.has(event.code)) event.preventDefault();
    if (!event.repeat) pressed.push({ code: event.code, shift: event.shiftKey });
    held.add(event.code);
  });
  target.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());
  return {
    held: (code) => held.has(code),
    anyHeld: (...codes) => codes.some((c) => held.has(c)),
    takePressed() {
      const list = pressed.splice(0, pressed.length);
      return list;
    },
    clear() {
      held.clear();
      pressed.length = 0;
    },
  };
}
