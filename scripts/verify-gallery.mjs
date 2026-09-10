import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const galleryDir = path.join(root, 'src', 'content', 'gallery');

function checkExists(publicPath){
  const fsPath = path.join(publicRoot, publicPath.replace(/^\//, ''));
  return fs.existsSync(fsPath);
}

const categories = JSON.parse(fs.readFileSync(path.join(galleryDir, 'categories.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(galleryDir, 'images.json'), 'utf8'));
const albums = JSON.parse(fs.readFileSync(path.join(galleryDir, 'albums.json'), 'utf8'));
const summary = JSON.parse(fs.readFileSync(path.join(galleryDir, 'summary.json'), 'utf8'));

let errors = [];
let warnings = [];
let checks = [];

// 1. every referenced image exists
for (const img of images) {
  if (!checkExists(img.src)) errors.push(`Missing src ${img.src} for ${img.id}`);
  else checks.push(`OK src ${img.src}`);
  // srcSet targets
  for (const [w, p] of Object.entries(img.variants || {})) {
    if (!checkExists(p)) errors.push(`Missing variant ${w} ${p} for ${img.id}`);
  }
  if (!img.width || !img.height) errors.push(`Missing dimensions for ${img.id}`);
  if (!img.alt || img.alt.length < 5) warnings.push(`Weak alt for ${img.id}: ${img.alt}`);
  if (!img.blurHash) warnings.push(`Missing blurHash for ${img.id}`);
  if (!img.category) errors.push(`Missing category for ${img.id}`);
  // category must exist
  if (!categories.find(c=>c.slug===img.category)) errors.push(`Category ${img.category} not found for ${img.id}`);
  // hash id consistency
  if (!img.id.startsWith('img_')) warnings.push(`ID not hash-derived for ${img.id}`);
  // lowercase path check: final asset paths must be lowercase
  for (const p of [img.src, ...Object.values(img.variants||{})]) {
    if (p !== p.toLowerCase()) errors.push(`Non-lowercase path ${p} for ${img.id} — will break on Linux`);
  }
}

// 2. every category valid
for (const cat of categories) {
  if (!cat.id || !cat.slug) errors.push(`Category missing id/slug ${JSON.stringify(cat)}`);
  if (cat.slug !== cat.slug.toLowerCase()) errors.push(`Category slug not lowercase ${cat.slug}`);
  if (cat.imageCount !== cat.imageIds.length) warnings.push(`Category ${cat.slug} imageCount mismatch ${cat.imageCount} vs ${cat.imageIds.length}`);
  if (cat.cover && !checkExists(cat.cover)) errors.push(`Category cover missing ${cat.cover}`);
  for (const id of cat.imageIds) {
    if (!images.find(i=>i.id===id)) errors.push(`Category ${cat.slug} references missing image ${id}`);
  }
}

// 3. albums
for (const album of albums) {
  if (!album.id || !album.slug) errors.push(`Album missing id/slug ${album.id}`);
  for (const id of album.imageIds) {
    if (!images.find(i=>i.id===id)) errors.push(`Album ${album.slug} missing image ${id}`);
  }
}

// 4. no duplicate canonical source files (check hash uniqueness)
const hashSet = new Set();
const duplicateHashes = [];
for (const img of images) {
  if (hashSet.has(img.hash)) duplicateHashes.push(img.hash);
  else hashSet.add(img.hash);
}
if (duplicateHashes.length) errors.push(`Duplicate canonical hashes found: ${duplicateHashes.join(', ')}`);

// 5. no case-sensitive inconsistencies already checked via lowercase

// 6. Verify no references to old placeholders in new gallery
const oldPlaceholders = summary.placeholderHashesExcluded || [];
for (const img of images) {
  if (oldPlaceholders.includes(img.hash.slice(0,12)) || oldPlaceholders.includes(img.hash)) {
    errors.push(`Placeholder hash still present in new gallery ${img.id} ${img.hash}`);
  }
}

// 7. Check original files still exist (preservation) — not required to be in gallery but should still be on disk until archive
// We'll just report

const report = {
  generated: new Date().toISOString(),
  checks: {
    totalImages: images.length,
    totalCategories: categories.length,
    categoriesWithImages: categories.filter(c=>c.imageCount>0).length,
    totalAlbums: albums.length,
    totalVariants: images.reduce((sum,i)=> sum + Object.keys(i.variants||{}).length, 0),
    totalOriginalBytes: summary.totalOriginalBytes,
    totalOptimizedBytes: summary.totalOptimizedBytes,
  },
  errors,
  warnings,
  passed: errors.length===0,
};

const outPath = path.join(root, 'src', 'content', 'gallery', 'gallery-verification.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Verification ${report.passed ? 'PASSED' : 'FAILED'} — errors: ${errors.length}, warnings: ${warnings.length}`);
if (errors.length) console.log(errors.join('\n'));
if (warnings.length) console.log('Warnings:', warnings.slice(0,10).join('\n'));
console.log(`Report written to ${outPath}`);

// Also write to audit folder
const auditOut = path.join(root, 'audit', 'gallery-verification.json');
fs.writeFileSync(auditOut, JSON.stringify(report, null, 2));
console.log(`Also written to ${auditOut}`);
