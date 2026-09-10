#!/usr/bin/env node
// Muwan Shots — Static Gallery → D1/R2 CMS Migration
// Idempotent, dry-run safe, no secrets in code
// Usage:
//   node scripts/migrate-static-gallery.mjs --dry-run            # inventory only, no D1/R2 changes
//   node scripts/migrate-static-gallery.mjs --dry-run --remote   # check remote D1/R2
//   node scripts/migrate-static-gallery.mjs --all --remote       # migrate all 75
//   node scripts/migrate-static-gallery.mjs --category=kukyala --remote
//   node scripts/migrate-static-gallery.mjs --photo=img_9636cd0f --remote

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false, all: false, remote: false, category: null, album: null, photo: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--all') out.all = true;
    else if (a === '--remote') out.remote = true;
    else if (a.startsWith('--category=')) out.category = a.split('=')[1];
    else if (a.startsWith('--album=')) out.album = a.split('=')[1];
    else if (a.startsWith('--photo=')) out.photo = a.split('=')[1];
    else if (a === '--category' && args[i+1]) out.category = args[++i];
    else if (a === '--album' && args[i+1]) out.album = args[++i];
    else if (a === '--photo' && args[i+1]) out.photo = args[++i];
  }
  // If no filter, default to dry-run inventory unless --all is explicitly set
  if (!out.all && !out.category && !out.album && !out.photo) {
    // do not auto-migrate all; require explicit --all
    if (!out.dryRun) {
      console.log("No target specified. Use --dry-run for inventory or --all --remote for full migration.");
      console.log("Examples:");
      console.log("  node scripts/migrate-static-gallery.mjs --dry-run");
      console.log("  node scripts/migrate-static-gallery.mjs --category=kukyala --remote");
      console.log("  node scripts/migrate-static-gallery.mjs --all --remote");
      process.exit(1);
    }
  }
  return out;
}

function exec(cmd, opts = {}) {
  const env = { ...process.env };
  // Force utf-8
  return execSync(cmd, { encoding: 'utf-8', stdio: opts.stdio || 'pipe', env, cwd: root });
}

function wranglerD1(command, remote) {
  const flag = remote ? '--remote' : '--local';
  const cmd = `npx wrangler d1 execute muwanshots-db ${flag} --command "${command.replace(/"/g, '\\"')}" --json`;
  const out = exec(cmd);
  const json = JSON.parse(out);
  return json[0]?.results || [];
}

function wranglerD1Raw(command, remote) {
  const flag = remote ? '--remote' : '--local';
  const cmd = `npx wrangler d1 execute muwanshots-db ${flag} --command "${command.replace(/"/g, '\\"')}" --json`;
  const out = exec(cmd);
  return JSON.parse(out);
}

function loadLegacy() {
  const catPath = path.join(root, 'src/content/gallery/categories.json');
  const albumPath = path.join(root, 'src/content/gallery/albums.json');
  const imgPath = path.join(root, 'src/content/gallery/images.json');
  const summaryPath = path.join(root, 'src/content/gallery/summary.json');
  const categories = JSON.parse(fs.readFileSync(catPath, 'utf-8'));
  const albums = JSON.parse(fs.readFileSync(albumPath, 'utf-8'));
  const images = JSON.parse(fs.readFileSync(imgPath, 'utf-8'));
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  return { categories, albums, images, summary };
}

function findBestSourceFile(category, hash8) {
  // Try 1600 -> 1200 -> 768 -> 480
  const base = path.join(root, 'public/images/gallery', category);
  for (const w of [1600, 1200, 768, 480]) {
    const p = path.join(base, `${hash8}-${w}.webp`);
    if (fs.existsSync(p)) return p;
  }
  // Fallback: any file with hash8
  const files = fs.readdirSync(base).filter(f => f.startsWith(hash8));
  if (files.length > 0) return path.join(base, files[0]);
  return null;
}

async function main() {
  const opts = parseArgs();
  const { categories: legacyCats, albums: legacyAlbums, images: legacyImages, summary } = loadLegacy();

  console.log("=== Muwan Shots Static → CMS Migration ===");
  console.log(`Mode: ${opts.dryRun ? 'DRY-RUN (no changes)' : 'LIVE'}` + (opts.remote ? ' --remote' : ' --local'));
  console.log(`Legacy: ${legacyCats.length} categories (${legacyCats.filter(c=>c.imageCount>0).length} with images), ${legacyAlbums.length} albums, ${legacyImages.length} photos (${summary.realImages} real)`);

  // Filter images based on args
  let targetImages = legacyImages;
  if (opts.category) targetImages = targetImages.filter(i => i.category === opts.category);
  if (opts.album) targetImages = targetImages.filter(i => i.album === opts.album);
  if (opts.photo) targetImages = targetImages.filter(i => i.id === opts.photo || i.hash8 === opts.photo);
  if (!opts.all && !opts.category && !opts.album && !opts.photo) {
    // dry-run inventory only, keep all for reporting
  } else if (!opts.all) {
    console.log(`Filtered: ${targetImages.length} photos (category=${opts.category||'*'} album=${opts.album||'*'} photo=${opts.photo||'*'})`);
  }

  // Check D1 categories/albums/photos
  let d1Cats = [], d1Albums = [], d1Photos = [];
  try {
    d1Cats = wranglerD1("SELECT id, slug, name FROM categories", opts.remote);
    d1Albums = wranglerD1("SELECT id, slug, name FROM albums", opts.remote);
    d1Photos = wranglerD1("SELECT id, title, processing_status FROM photos", opts.remote);
  } catch (e) {
    console.error("Failed to query D1:", e.message);
    process.exit(1);
  }
  const d1CatSlugs = new Set(d1Cats.map(c => c.slug));
  const d1AlbumSlugs = new Set(d1Albums.map(a => a.slug));
  const d1PhotoIds = new Set(d1Photos.map(p => p.id));

  console.log(`\nD1 current: ${d1Cats.length} categories, ${d1Albums.length} albums, ${d1Photos.length} photos`);

  // Category reconciliation
  const catsWithImages = legacyCats.filter(c => c.imageCount > 0);
  console.log("\n--- Categories ---");
  for (const c of legacyCats) {
    const exists = d1CatSlugs.has(c.slug);
    const status = exists ? "EXISTS" : (c.imageCount>0 ? "MISSING (needs migration)" : "MISSING (empty, optional)");
    console.log(`  ${status}: ${c.slug} (${c.name}) - ${c.imageCount} images`);
  }

  // Album reconciliation
  console.log("\n--- Albums ---");
  for (const a of legacyAlbums) {
    const exists = d1AlbumSlugs.has(a.slug);
    console.log(`  ${exists ? "EXISTS" : "MISSING"}: ${a.slug} (${a.title}) - ${a.imageIds.length} images`);
  }

  // Photo inventory
  console.log("\n--- Photos ---");
  let needMigrate = 0, already = 0, invalid = 0, missingFile = 0;
  const report = [];
  for (const img of targetImages) {
    const exists = d1PhotoIds.has(img.id);
    const src = findBestSourceFile(img.category, img.hash8);
    const valid = src && fs.existsSync(src) && fs.statSync(src).size > 0;
    if (exists) already++;
    else if (!src) missingFile++;
    else if (!valid) invalid++;
    else needMigrate++;

    report.push({
      id: img.id,
      hash8: img.hash8,
      category: img.category,
      exists: exists ? "yes" : "no",
      src: src ? path.relative(root, src) : "MISSING",
      size: src && fs.existsSync(src) ? fs.statSync(src).size : 0,
      width: img.width,
      height: img.height,
      alt: img.alt,
    });
  }
  console.log(`  Already in D1: ${already}`);
  console.log(`  Need migration: ${needMigrate}`);
  console.log(`  Missing file: ${missingFile}`);
  console.log(`  Invalid: ${invalid}`);
  console.log(`  Total legacy: ${targetImages.length}`);

  if (opts.dryRun) {
    console.log("\n--- Dry-run details (first 10) ---");
    for (const r of report.slice(0, 10)) {
      console.log(`  ${r.id} ${r.category} ${r.exists} ${r.src} ${r.width}x${r.height} ${r.size} bytes`);
    }
    if (report.length > 10) console.log(`  ... and ${report.length-10} more`);

    console.log("\n=== DRY-RUN COMPLETE ===");
    console.log(`Would migrate: ${needMigrate} photos`);
    console.log(`Would skip (already): ${already}`);
    console.log(`Would skip (missing file): ${missingFile}`);
    console.log("\nCounts reconciliation:");
    console.log(`  Legacy real photos: ${summary.realImages}`);
    console.log(`  D1 photos: ${d1Photos.length}`);
    console.log(`  R2 originals: check via wrangler r2 (not via D1)`);
    console.log(`  Need: ${needMigrate} → after migration D1 would be ${d1Photos.length + needMigrate}`);
    console.log("\nTo migrate, run:");
    console.log("  node scripts/migrate-static-gallery.mjs --all --remote  # full");
    console.log("  node scripts/migrate-static-gallery.mjs --category=kukyala --remote  # per category");
    return;
  }

  // LIVE migration
  console.log("\n=== LIVE MIGRATION ===");
  let migrated = 0, skipped = 0, failed = 0, uploadedBytes = 0;

  // Ensure categories exist (idempotent)
  for (const c of legacyCats.filter(c => c.imageCount>0)) {
    if (d1CatSlugs.has(c.slug)) continue;
    if (opts.category && c.slug !== opts.category) continue;
    console.log(`Creating category ${c.slug}...`);
    const sql = `INSERT OR IGNORE INTO categories (id, name, slug, description, is_published, sort_order) VALUES ('${c.id}', '${c.name.replace(/'/g, "''")}', '${c.slug}', '${(c.description||'').replace(/'/g, "''")}', 1, ${c.imageCount || 0})`;
    try {
      exec(`npx wrangler d1 execute muwanshots-db ${opts.remote?'--remote':'--local'} --command "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`  failed category ${c.slug}:`, e.message);
    }
  }

  // Ensure albums
  for (const a of legacyAlbums) {
    if (d1AlbumSlugs.has(a.slug)) continue;
    if (opts.album && a.slug !== opts.album) continue;
    if (opts.category && a.category !== opts.category) continue;
    console.log(`Creating album ${a.slug}...`);
    const sql = `INSERT OR IGNORE INTO albums (id, name, slug, description, is_published, sort_order) VALUES ('${a.id}', '${a.title.replace(/'/g, "''")}', '${a.slug}', '${(a.description||'').replace(/'/g, "''")}', 1, 0)`;
    try {
      exec(`npx wrangler d1 execute muwanshots-db ${opts.remote?'--remote':'--local'} --command "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`  failed album ${a.slug}:`, e.message);
    }
  }

  // Migrate photos
  for (const img of targetImages) {
    if (d1PhotoIds.has(img.id)) { skipped++; continue; }
    const src = findBestSourceFile(img.category, img.hash8);
    if (!src || !fs.existsSync(src)) { console.log(`  SKIP ${img.id} missing file`); skipped++; continue; }
    const stat = fs.statSync(src);
    if (stat.size === 0) { console.log(`  SKIP ${img.id} zero byte`); skipped++; continue; }
    const ext = path.extname(src).replace('.', '') || 'webp';
    const year = new Date().getFullYear(); // use current year for R2 key per convention
    const r2_key = `photos/${img.category}/${year}/${img.id}/original.${ext}`;
    const image_url = `/api/media/${r2_key}`; // fallback; optimizer will handle R2_PUBLIC_URL if set

    // Upload to R2
    console.log(`  Migrating ${img.id} ${img.category} ${path.basename(src)} → ${r2_key} ...`);
    try {
      const putCmd = `npx wrangler r2 object put muwanshots-media/${r2_key} --file="${src}" --content-type="image/${ext}" ${opts.remote?'--remote':'--local'}`;
      exec(putCmd, { stdio: 'inherit' });
      uploadedBytes += stat.size;

      // Insert D1
      const title = (img.alt || img.id).replace(/'/g, "''");
      const alt = (img.alt || '').replace(/'/g, "''");
      // Find category_id: legacy category id is slug, but D1 categories have id = slug (from seed) or id like cat_weddings? Check: seed uses cat_weddings id, but legacy categories have id=kukyala (slug). Need to map: use slug as id if not found
      const catId = d1Cats.find(c => c.slug === img.category)?.id || img.category;
      const sql = `INSERT INTO photos (id, title, category_id, r2_key, image_url, alt_text, is_published, processing_status, width, height, file_size) VALUES ('${img.id}', '${title}', '${catId}', '${r2_key}', '${image_url}', '${alt}', 1, 'pending', ${img.width||'NULL'}, ${img.height||'NULL'}, ${stat.size})`;
      exec(`npx wrangler d1 execute muwanshots-db ${opts.remote?'--remote':'--local'} --command "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

      // Album relationship - map slug to actual D1 album id (seed uses alb_ prefix)
      if (img.album) {
        const albumId = d1Albums.find(a => a.slug === img.album)?.id || d1Albums.find(a => a.id === img.album)?.id || img.album;
        const apSql = `INSERT OR IGNORE INTO album_photos (album_id, photo_id, sort_order) VALUES ('${albumId}', '${img.id}', 0)`;
        try { exec(`npx wrangler d1 execute muwanshots-db ${opts.remote?'--remote':'--local'} --command "${apSql.replace(/"/g, '\\"')}"`, { stdio: 'pipe' }); } catch {}
      }

      migrated++;
    } catch (e) {
      console.error(`  FAILED ${img.id}:`, e.message);
      failed++;
    }
  }

  console.log("\n=== MIGRATION COMPLETE ===");
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already/missing): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Uploaded bytes: ${(uploadedBytes/1024/1024).toFixed(2)} MB`);

  // Final counts
  try {
    const finalPhotos = wranglerD1("SELECT COUNT(*) as cnt FROM photos", opts.remote);
    console.log(`  D1 photos now: ${finalPhotos[0]?.cnt}`);
    const statusCounts = wranglerD1("SELECT processing_status, COUNT(*) as cnt FROM photos GROUP BY processing_status", opts.remote);
    console.log(`  By status:`, statusCounts);
  } catch {}

  if (migrated > 0) {
    console.log("\nNext: run optimizer to generate variants:");
    console.log(`  node scripts/optimize-upload.mjs --all-pending ${opts.remote?'--remote':'--local'}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
