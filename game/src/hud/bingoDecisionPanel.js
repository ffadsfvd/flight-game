// The bingo-fuel choice on the HUD: fuel left against the reserve, a countdown, and the two
// answers with their keys and what each costs or earns (J divert to the nearest field, K press on).

/** Creates the panel in its container (hidden while no decision is open). */
export function createBingoDecisionPanel(element) {
  let last = '';
  return {
    update(panel) {
      if (!panel) {
        if (last) element.classList.add('is-hidden');
        last = '';
        return;
      }
      const html = `<div class="head">${panel.title}<small>${panel.fuel} · ${panel.timer} s</small></div>${panel.options.map((o) => `<div class="option"><kbd>${o.key}</kbd><div><b>${o.label}</b><span>${o.detail}</span></div></div>`).join('')}`;
      if (html === last) return;
      last = html;
      element.innerHTML = html;
      element.classList.remove('is-hidden');
    },
  };
}
