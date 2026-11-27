// Builds an approximation of the judge's source outline from out/dossier.json (run main.ts first):
// a first line saying what it is, the Game block's Source files and Totals lines, then every source
// file in the dossier's order (index.html, the scripts in load order, the rest by path) with its
// path, size and first declarations (functions, classes, methods, exports, top-level assignments,
// CSS selectors, HTML lines with an id, a script or a link). Declarations are shared across the
// files: each file gets a few, in order, until the line budget runs out.
//   node tools/judge-outline.mjs [--lines=60] [--per-file=3]
import { readFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=') || true];
}));
const budget = Number(args.lines ?? 60);
const perFile = Number(args['per-file'] ?? 3);
const dossier = JSON.parse(readFileSync('out/dossier.json', 'utf8'));
const text = dossier.text;

const game = text.split('## Sources')[0];
const sourceLine = game.split('\n').find((l) => l.startsWith('Source files:'));
const totalsLine = game.split('\n').find((l) => l.startsWith('Totals:'));

// Split the Sources part into files: "### path (N lines, B bytes)" then a fenced block.
const files = [];
const re = /^### (\S+) \((\d+) lines, (\d+) bytes\)\n\n```\w*\n([\s\S]*?)\n```/gm;
for (let m = re.exec(text); m; m = re.exec(text)) files.push({ path: m[1], lines: Number(m[2]), bytes: Number(m[3]), body: m[4] });

function declarations(file) {
  const out = [];
  const lines = file.body.split('\n');
  if (file.path.endsWith('.html')) {
    for (const l of lines) if (/\bid=|<script|<link/.test(l)) out.push(l.trim().slice(0, 110));
    return out;
  }
  if (file.path.endsWith('.css')) {
    for (const l of lines) {
      const m = /^([^\s/@][^{]*)\{/.exec(l);
      if (m) out.push(m[1].trim().slice(0, 80));
    }
    return out;
  }
  for (const l of lines) {
    let m;
    if ((m = /^export\s+(default\s+)?(async\s+)?function\*?\s+(\w+)/.exec(l))) out.push(`export function ${m[3]}`);
    else if ((m = /^(async\s+)?function\*?\s+(\w+)/.exec(l))) out.push(`function ${m[2]}`);
    else if ((m = /^export\s+(const|let|var|class)\s+(\w+)/.exec(l))) out.push(`export ${m[1]} ${m[2]}`);
    else if ((m = /^(const|let|var|class)\s+(\w+)/.exec(l))) out.push(`${m[1]} ${m[2]}`);
    else if ((m = /^([A-Za-z_$][\w$.]*)\s*=[^=]/.exec(l))) out.push(`${m[1]} =`);
    else if ((m = /^ {2,4}(?:async\s+)?(?:get\s+|set\s+)?([a-z_$][\w$]*)\s*\([^)]*\)\s*\{\s*$/.exec(l)) && !/^(if|for|while|switch|catch|function)$/.test(m[1])) out.push(`method ${m[1]}`);
  }
  return out;
}

const outline = ['Outline of the game source (paths, sizes and first declarations, in the dossier order).', sourceLine, totalsLine];
let shownFiles = 0;
for (const file of files) {
  if (outline.length >= budget) break;
  const decl = declarations(file).slice(0, perFile);
  outline.push(`${file.path} (${file.bytes} B)${decl.length ? `: ${decl.join(' · ')}` : ''}`);
  shownFiles += 1;
}
outline.push(`[${files.length - shownFiles} more source files not shown]`);
console.log(outline.slice(0, budget + 1).join('\n'));
