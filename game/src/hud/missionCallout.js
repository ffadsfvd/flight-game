// The big mission callout over the upper middle of the view: one short line in large letters raised
// by the mission itself (SPACE · DROP WATER, SCOOPING 64%, DIRECT HIT) with a smaller line under it
// (fire contained, what to do), so the next step reads at a glance.

/** Creates the callout in `element`; update({ text, sub, tone, key } | null). */
export function createMissionCallout(element) {
  let shown = '';
  return {
    update(callout) {
      const key = callout ? `${callout.tone}|${callout.text}|${callout.sub ?? ''}` : '';
      if (key === shown) return;
      shown = key;
      if (!callout) {
        element.classList.add('is-hidden');
        element.replaceChildren();
        return;
      }
      element.className = `tone-${callout.tone ?? 'info'}`;
      const title = document.createElement('b');
      title.textContent = callout.text;
      element.replaceChildren(title);
      if (callout.sub) {
        const sub = document.createElement('span');
        sub.textContent = callout.sub;
        element.appendChild(sub);
      }
    },
  };
}
