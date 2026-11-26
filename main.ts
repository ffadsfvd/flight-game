// Solvara Skies, an island flight career over the invented Solvara Archipelago, entered in the
// make.fun bounty best-flight-game-20261126-0057. This file is the hand-in program (Node 22+,
// standard library only). The game itself is the static three.js site in game/: index.html, its
// ES modules under game/src (missions, career, aircraft, flight model, world, HUD, audio) and the
// minified three.js build under game/vendor, all loaded offline with no network request.
// screenshots/ holds the judge's screenshots, 1-cover.jpg first by name.
//
// Running it checks that the entry is complete, copies game/ and screenshots/ to the output
// folder, writes dossier.json (the summary the judge reads) with buildDossier from the vendored
// make.fun library, and logs how many files were handed in.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output (PowerShell):
//   mkdir out; $env:MAKEFUN_OUTPUT_DIR="out"; node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Checks the parts of the entry before anything is copied. The game page is required; a
 * missing screenshots folder only warns, as the copy below then hands in an empty one. */
function checkEntryParts(): { hasScreenshots: boolean } {
  if (!existsSync(join(here, 'game', 'index.html'))) {
    console.error('Solvara Skies hand-in: game/index.html is missing, so there is no game to hand in.');
    process.exit(1);
  }
  const hasScreenshots = existsSync(join(here, 'screenshots'));
  if (!hasScreenshots) console.warn('Solvara Skies hand-in: screenshots/ is missing; handing in no screenshots.');
  return { hasScreenshots };
}

/** Counts the files below a folder, all levels deep (0 when the folder does not exist). */
function countFiles(folder: string): number {
  if (!existsSync(folder)) return 0;
  let count = 0;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(join(folder, entry.name)) : 1;
  }
  return count;
}

const { hasScreenshots } = checkEntryParts();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (hasScreenshots) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

const gameFiles = countFiles(join(out, 'game'));
const screenshotFiles = countFiles(join(out, 'screenshots'));
console.log(`Solvara Skies handed in ${gameFiles} game files and ${screenshotFiles} screenshots, plus dossier.json, to ${out}.`);
