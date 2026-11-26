// Saves and loads the career in localStorage (one slot), tolerating storage being off and old
// or damaged saves.
import { createCareer, DEFAULT_SETTINGS } from '../career/careerProgress.js';

const KEY = 'solvara-skies.career.v1';

export function hasSavedCareer() {
  try {
    return Boolean(window.localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function loadCareer() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const fresh = createCareer();
    return { ...fresh, ...data, settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) }, logbook: { ...fresh.logbook, ...(data.logbook ?? {}) }, upgrades: { ...fresh.upgrades, ...(data.upgrades ?? {}) } };
  } catch {
    return null;
  }
}

export function saveCareer(career) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(career));
    return true;
  } catch {
    return false;
  }
}

export function clearCareer() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
