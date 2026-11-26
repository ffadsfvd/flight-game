// The mission tracker: chapter and mission name, "stage X of Y" with a progress bar, the current
// objective, the next step, and up to three live stats (timer, rings, score, cargo, water...).

/** Creates the tracker inside its container element. */
export function createMissionTrackerPanel(element) {
  element.innerHTML = '<div class="chapter"></div><div class="title"></div><div class="stage"><span data-id="stage"></span><span data-id="status"></span></div><div class="stage-bar"><i></i></div><div class="objective"></div><div class="next"></div><div class="stats"></div>';
  const chapter = element.querySelector('.chapter');
  const title = element.querySelector('.title');
  const stage = element.querySelector('[data-id="stage"]');
  const status = element.querySelector('[data-id="status"]');
  const bar = element.querySelector('.stage-bar i');
  const objective = element.querySelector('.objective');
  const next = element.querySelector('.next');
  const stats = element.querySelector('.stats');
  let last = '';
  return {
    show(visible) {
      element.classList.toggle('is-hidden', !visible);
    },
    /** info: { chapter, title, stage, stages, status, progress, objective, next, stats: [[label, value]] } */
    update(info) {
      const key = JSON.stringify(info);
      if (key === last) return;
      last = key;
      chapter.textContent = info.chapter;
      title.textContent = info.title;
      stage.textContent = info.stages ? `STAGE ${info.stage} OF ${info.stages}` : 'FREE FLIGHT';
      status.textContent = info.status ?? '';
      bar.style.width = `${Math.round(Math.max(0, Math.min(1, info.progress ?? 0)) * 100)}%`;
      objective.textContent = info.objective;
      next.textContent = info.next ? `Next: ${info.next}` : '';
      stats.innerHTML = (info.stats ?? []).slice(0, 3).map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');
    },
  };
}
