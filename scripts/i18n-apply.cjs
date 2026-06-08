#!/usr/bin/env node
// Merge a flat {dotted.key: value} patch into a nested translation.json,
// without disturbing existing keys. Usage:
//   node scripts/i18n-apply.cjs <target.json> <patch.json>
const fs = require('fs');
const [, , targetPath, patchPath] = process.argv;
const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

// These files use FLAT dotted keys (e.g. "common.error": "Error"), matching the
// existing convention — NOT nested objects. Add each key as a literal flat key.
let added = 0, skipped = 0;
for (const [dotted, value] of Object.entries(patch)) {
  if (dotted in target) { skipped++; continue; }   // never overwrite existing translation
  target[dotted] = value;
  added++;
}
fs.writeFileSync(targetPath, JSON.stringify(target, null, 2) + '\n');
console.log(`${targetPath}: +${added} added, ${skipped} already present`);
