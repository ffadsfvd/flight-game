// The one-line score pop-up under the heading tape: what the flying-discipline score just counted
// ("+40 ×2  STABLE AT 380 FT", "STREAK LOST · POWER SLAMMED"). One line at a time, each shown at
// least a second; a newer line waits its turn and replaces any older one still waiting.

const MIN_SHOW = 1.1;

/** Creates the pop-up in its container. */
export function createDisciplinePopup(element) {
  let shownId = 0;
  let shownFor = Infinity;
  let waiting = null;
  let held = false;
  function show(p) {
    shownId = p.id;
    shownFor = 0;
    const div = document.createElement('div');
    div.textContent = p.text;
    div.className = `${p.tone}${held ? ' is-held' : ''}`;
    element.replaceChildren(div);
  }
  return {
    /** Keeps the current line on screen (screenshots). */
    hold() {
      held = true;
      element.firstChild?.classList.add('is-held');
    },
    clear() {
      held = false;
      waiting = null;
      shownId = 0;
      shownFor = Infinity;
      element.replaceChildren();
    },
    update(latest, dt) {
      shownFor += dt;
      if (latest && latest.id > shownId && latest.id !== waiting?.id) waiting = latest;
      if (waiting && shownFor >= MIN_SHOW) {
        show(waiting);
        waiting = null;
      }
      if (!held && shownFor > 2.4 && element.firstChild) element.replaceChildren();
    },
  };
}
