import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const archiveDir = path.join(publicRoot, 'images', '_archive', 'placeholders');
fs.mkdirSync(archiveDir, { recursive: true });

// Use duplicate-report to find non-canonical duplicates (the 25 files)
const dupReport = JSON.parse(fs.readFileSync(path.join(root, 'audit', 'duplicate-report.json'), 'utf8'));
let moved = 0;
let kept = 0;
for (const group of dupReport.duplicate_groups) {
  const sorted = [...group.paths].sort();
  const canonical = sorted[0];
  for (const p of sorted) {
    if (p === canonical) { kept++; continue; }
    const src = path.join(publicRoot, p.replace(/^\//, ''));
    if (!fs.existsSync(src)) { console.log(`Missing already ${p}`); continue; }
    const dest = path.join(archiveDir, path.basename(p) + `__${group.sha256.slice(0,8)}${path.extname(p)}`);
    // Ensure unique dest name to avoid collision
    let destFinal = dest;
    let idx=1;
    while (fs.existsSync(destFinal)) {
      destFinal = path.join(archiveDir, `${path.basename(p, path.extname(p))}__${group.sha256.slice(0,8)}_${idx}${path.extname(p)}`);
      idx++;
    }
    fs.renameSync(src, destFinal);
    console.log(`Archived ${p} -> ${path.relative(publicRoot, destFinal)}`);
    moved++;
  }
}
console.log(`Done. Moved ${moved} duplicate placeholders to ${path.relative(root, archiveDir)}, kept ${kept} canonicals. Originals preserved in archive, not deleted.`);
