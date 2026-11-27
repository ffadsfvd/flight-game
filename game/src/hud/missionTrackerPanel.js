// The mission tracker: chapter and mission name, "stage X of Y" with a progress bar, the current
// objective, the next step, up to three live stats (timer, rings, band, water...), the checklist
// of main goals and bonus goals (ticked when met, crossed when lost, with their credits), and the
// flying-discipline score with its streak multiplier.

const TICK = { met: '✓', failed: '✗', open: '○', current: '▸' };

function goalLine(g) {
  const reward = g.reward ? `<em>${g.status === 'failed' ? '' : '+'}${g.reward} cr</em>` : '';
  return `<div class="goal is-${g.status}"><b>${TICK[g.status] ?? '○'}</b>${g.text}${reward}</div>`;
}

/** Creates the tracker inside its container element. */
export function createMissionTrackerPanel(element) {
  element.innerHTML = '<div class="chapter"></div><div class="title"></div><div class="stage"><span data-id="stage"></span><span data-id="status"></span></div><div class="stage-bar"><i></i></div><div class="objective"></div><div class="next"></div><div class="stats"></div><div class="goals"></div><div class="discipline"></div>';
  const chapter = element.querySelector('.chapter');
  const title = element.querySelector('.title');
  const stage = element.querySelector('[data-id="stage"]');
  const status = element.querySelector('[data-id="status"]');
  const bar = element.querySelector('.stage-bar i');
  const objective = element.querySelector('.objective');
  const next = element.querySelector('.next');
  const stats = element.querySelector('.stats');
  const goals = element.querySelector('.goals');
  const discipline = element.querySelector('.discipline');
  let last = '';
  return {
    show(visible) {
      element.classList.toggle('is-hidden', !visible);
    },
    /** info: { chapter, title, stage, stages, status, progress, objective, next, stats, goals, discipline } */
    update(info) {
      const { discipline: disc, ...rest } = info;
      const key = JSON.stringify(rest) + (disc ? `${disc.points}|${disc.multiplier}|${disc.streak}` : '');
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
      const list = info.goals ?? [];
      const main = list.filter((g) => g.main);
      const bonus = list.filter((g) => !g.main);
      goals.style.display = list.length ? '' : 'none';
      goals.innerHTML = `${main.map(goalLine).join('')}${bonus.length ? `<div class="goal-head">BONUS GOALS</div>${bonus.map(goalLine).join('')}` : ''}`;
      if (disc) {
        discipline.style.display = '';
        discipline.innerHTML = `<span>DISCIPLINE</span><b>${disc.points.toLocaleString('en-US')}</b><span>STREAK ${disc.streak}</span><i class="${disc.multiplier > 1 ? '' : 'is-cold'}">×${disc.multiplier}</i>`;
      } else {
        discipline.style.display = 'none';
      }
    },
  };
}
