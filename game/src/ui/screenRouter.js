// Opens one menu screen at a time and wires its buttons: every element with data-action calls the
// handler of that name. Keyboard: Escape triggers the screen's back action, Enter its confirm action
// and a handler named key:<code> (key:KeyR) answers that key. Every sheet marked .fits-window is
// shrunk to fit the window (down to 70%), and past that its .sheet-body scrolls while the button
// row below it stays in view, so Continue, Retry and Fly can always be clicked.

/** Creates the router over the screen elements (by id). */
export function createScreenRouter(ids, onClick = () => {}) {
  const screens = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  let open = null;
  let handlers = {};
  for (const element of Object.values(screens)) {
    element.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target || target.disabled) return;
      const action = target.dataset.action;
      onClick(action);
      handlers[action]?.(target.dataset.arg, target);
    });
  }
  window.addEventListener('resize', () => {
    if (open) fitToWindow(screens[open]);
  });
  return {
    get open() {
      return open;
    },
    /** Shows screen `id` with `html` and the button handlers. */
    show(id, html, actionHandlers = {}) {
      for (const [key, element] of Object.entries(screens)) element.classList.toggle('is-open', key === id);
      if (id && html !== undefined) screens[id].innerHTML = html;
      handlers = actionHandlers;
      open = id;
      if (id) fitToWindow(screens[id]);
    },
    hideAll() {
      for (const element of Object.values(screens)) element.classList.remove('is-open');
      handlers = {};
      open = null;
    },
    back() {
      handlers.back?.();
    },
    /** Enter: the screen's main action; true when the screen has one. */
    confirm() {
      if (!handlers.confirm) return false;
      handlers.confirm();
      return true;
    },
    /** A hotkey (KeyR = retry on the debrief); true when the screen answers it. */
    press(code) {
      const handler = handlers[`key:${code}`];
      if (!handler) return false;
      handler();
      return true;
    },
  };
}

/** Shrinks each .fits-window sheet of `screen` until its whole content fits the window, down to 70%. */
export function fitToWindow(screen) {
  for (const sheet of screen.querySelectorAll('.fits-window')) {
    sheet.style.fontSize = '';
    const body = sheet.querySelector('.sheet-body') ?? sheet;
    // max-height reads back as a percentage of the screen (the window) or in pixels.
    const limit = getComputedStyle(sheet).maxHeight;
    const room = limit.endsWith('%') ? (window.innerHeight * parseFloat(limit)) / 100 : Number.isFinite(parseFloat(limit)) ? parseFloat(limit) : window.innerHeight * 0.94;
    let scale = 1;
    // Borders and gaps do not shrink with the text, so measure again after each step.
    for (let i = 0; i < 4; i += 1) {
      const natural = sheet.offsetHeight + Math.max(0, body.scrollHeight - body.clientHeight);
      if (natural <= room + 1 || scale <= 0.7) break;
      scale = Math.max(0.7, scale * (room / natural) * (i ? 0.99 : 1));
      sheet.style.fontSize = `${scale.toFixed(3)}em`;
    }
  }
}
