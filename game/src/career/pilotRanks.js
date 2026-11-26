// Career ranks earned with experience, and what each one opens up.

export const RANKS = [
  { name: 'Cadet', xp: 0 },
  { name: 'Solo Pilot', xp: 150 },
  { name: 'Island Hopper', xp: 600 },
  { name: 'Bush Captain', xp: 1400 },
  { name: 'Archipelago Ace', xp: 2600 },
];

/** Rank index for an experience total. */
export function rankIndexFor(xp) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.xp) index = i;
  });
  return index;
}

/** Rank name and progress toward the next one. */
export function rankProgress(xp) {
  const index = rankIndexFor(xp);
  const current = RANKS[index];
  const next = RANKS[index + 1];
  return { index, name: current.name, next: next?.name ?? null, toNext: next ? next.xp - xp : 0, fraction: next ? (xp - current.xp) / (next.xp - current.xp) : 1 };
}
