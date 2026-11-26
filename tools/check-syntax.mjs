// Parses every game module as an ES module (without running it) and reports syntax errors.
// Usage: node --experimental-vm-modules tools/check-syntax.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.m?js$/.test(name) && !name.endsWith('.min.js')) out.push(path);
  }
  return out;
}

let failed = 0;
const files = walk('game/src');
for (const file of files) {
  try {
    new vm.SourceTextModule(readFileSync(file, 'utf8'), { identifier: file });
  } catch (error) {
    failed += 1;
    console.log(`${file}: ${error.message}`);
  }
}
console.log(`${files.length} modules parsed, ${failed} with errors`);
process.exit(failed ? 1 : 0);
