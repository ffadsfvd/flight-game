// Opens one menu screen at a time and wires its buttons: every element with data-action calls the
// handler of that name. Keyboard: Escape triggers the screen's back action.

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
    },
    hideAll() {
      for (const element of Object.values(screens)) element.classList.remove('is-open');
      handlers = {};
      open = null;
    },
    back() {
      handlers.back?.();
    },
  };
}
