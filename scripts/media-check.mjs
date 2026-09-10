#!/usr/bin/env node
// Admin-only health check: find missing R2 originals/variants and orphaned DB records
// Usage: node scripts/media-check.mjs [--local|--remote]
// Requires: wrangler, D1, R2 bindings

import { execSync } from 'child_process';

const local = !process.argv.includes('--remote');
const flag = local ? '--local' : '--remote';

function q(sql) {
  const cmd = `npx wrangler d1 execute muwanshots-db ${flag} --command "${sql.replace(/"/g, '\\"')}" --json`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  const json = JSON.parse(out);
  return json[0]?.results || [];
}

async function check() {
  console.log(`\n=== Media Health Check (${local ? 'local' : 'remote'}) ===\n`);

  const photos = q('SELECT id, r2_key, image_url, processing_status FROM photos');
  console.log(`Photos in DB: ${photos.length}`);

  const variants = q('SELECT photo_id, r2_key, variant_name FROM media_variants');
  console.log(`Variants in DB: ${variants.length}`);

  const photoIds = new Set(photos.map(p => p.id));
  const variantPhotoIds = new Set(variants.map(v => v.photo_id));
  const orphanVariants = [...variantPhotoIds].filter(id => !photoIds.has(id));
  console.log(`Orphaned variants (photo_id not in photos): ${orphanVariants.length}`);
  if (orphanVariants.length) console.log('  ', orphanVariants.slice(0,5));

  // Check for photos missing variants (pending or failed)
  const pending = q("SELECT id, r2_key, processing_status FROM photos WHERE processing_status != 'ready'");
  console.log(`\nPhotos not ready: ${pending.length}`);
  pending.slice(0,10).forEach(p => console.log(`  ${p.id} ${p.processing_status} ${p.r2_key}`));

  // Check for photos that have no variants at all (should have at least original)
  const noVariants = photos.filter(p => !variants.some(v => v.photo_id === p.id));
  console.log(`\nPhotos with 0 variants in DB: ${noVariants.length}`);
  noVariants.slice(0,10).forEach(p => console.log(`  ${p.id} ${p.r2_key} status=${p.processing_status}`));

  // For R2 existence check, we would need to list R2 objects (expensive, not on every request)
  // Here we just report DB-side health. For R2 missing, use: wrangler r2 object get
  console.log(`
For R2 object existence (expensive, lists R2):
  npx wrangler r2 object list muwanshots-media --prefix photos/ ${flag} --json | head

Do NOT auto-delete. Review and then:
  - Re-run: node scripts/optimize-upload.mjs --photo-id <id> ${flag}
  - Or DELETE via API: DELETE /api/photos/:id
`);
}

check().catch(e => { console.error(e); process.exit(1); });
