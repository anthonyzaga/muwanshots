#!/usr/bin/env node
// Node-only media optimizer — uses sharp (never in Workers)
// Usage:
//   node scripts/optimize-upload.mjs --photo-id <uuid>            # optimize single pending photo
//   node scripts/optimize-upload.mjs --all-pending                 # optimize all pending
//   node scripts/optimize-upload.mjs --file ./path/to/image.jpg --category weddings --photo-id <uuid> --r2-key photos/weddings/2026/<uuid>/original.jpg
// Requires: .dev.vars with R2 binding via wrangler, or set R2 via env
// This script is for local/CI use, not for Cloudflare Pages Functions.

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const WIDTHS = [480, 768, 1200, 1600];
const QUALITY = 82;
const FORMATS = ['webp']; // could add avif with sharp({avif})

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const k = args[i].slice(2);
      const v = args[i+1] && !args[i+1].startsWith('--') ? args[++i] : true;
      out[k] = v;
    }
  }
  return out;
}

async function getPhotoFromD1(photoId, local = true) {
  const cmd = `npx wrangler d1 execute muwanshots-db ${local ? '--local' : '--remote'} --command "SELECT * FROM photos WHERE id = '${photoId}'" --json`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  const json = JSON.parse(out);
  const row = json[0]?.results?.[0];
  return row;
}

async function updatePhotoStatus(photoId, status, error = null, local = true) {
  // Escape single quotes for SQL and sanitize for shell (remove double quotes and newlines that would break --command "...")
  let errEscaped = null;
  if (error) {
    // Truncate to avoid huge SQL and shell issues, remove newlines and double quotes
    let sanitized = String(error).slice(0, 800).replace(/\r?\n/g, ' ').replace(/"/g, "'").replace(/'/g, "''");
    // Also remove backticks and $ that could affect shell
    sanitized = sanitized.replace(/[`$]/g, '');
    errEscaped = sanitized;
  }
  const cmd = `npx wrangler d1 execute muwanshots-db ${local ? '--local' : '--remote'} --command "UPDATE photos SET processing_status='${status}', processing_error=${errEscaped ? `'${errEscaped}'` : 'NULL'}, processed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id='${photoId}'"`;
  execSync(cmd, { stdio: 'inherit' });
}

async function insertVariant(photoId, variant, local = true) {
  const id = `${photoId}-${variant.variant_name}`;
  const cmd = `npx wrangler d1 execute muwanshots-db ${local ? '--local' : '--remote'} --command "INSERT OR REPLACE INTO media_variants (id, photo_id, variant_name, width, height, format, mime_type, file_size, r2_key, image_url) VALUES ('${id}', '${variant.photo_id}', '${variant.variant_name}', ${variant.width}, ${variant.height}, '${variant.format}', '${variant.mime_type}', ${variant.file_size}, '${variant.r2_key}', '${variant.image_url}')"`;
  execSync(cmd, { stdio: 'pipe' });
}

async function uploadToR2(localPath, r2Key, contentType, local = true) {
  // Use wrangler r2 put
  const cmd = `npx wrangler r2 object put muwanshots-media/${r2Key} --file="${localPath}" --content-type="${contentType}" ${local ? '--local' : '--remote'}`;
  execSync(cmd, { stdio: 'inherit' });
}

async function fetchR2ToTemp(r2Key, tmpPath, local = true) {
  const cmd = `npx wrangler r2 object get muwanshots-media/${r2Key} --file="${tmpPath}" ${local ? '--local' : '--remote'}`;
  execSync(cmd, { stdio: 'inherit' });
  return tmpPath;
}

function getR2PublicUrl(r2Key) {
  // Priority: env var (CI/Pages) > .dev.vars file > fallback
  const envUrl = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;
  if (envUrl && envUrl.trim()) return `${envUrl.trim().replace(/\/$/, '')}/${r2Key}`;
  try {
    const devVars = fs.readFileSync(path.join(process.cwd(), '.dev.vars'), 'utf-8');
    const m = devVars.match(/R2_PUBLIC_URL\s*=\s*["']?([^"'\n]+)["']?/);
    if (m && m[1] && m[1].trim()) return `${m[1].trim().replace(/\/$/, '')}/${r2Key}`;
  } catch {}
  return `/api/media/${r2Key}`;
}

async function optimizeOne({ photoId, filePath, r2Key, local = true }) {
  console.log(`\nOptimizing ${photoId} from ${r2Key || filePath}...`);
  let tmpOriginal = filePath;
  let needsCleanup = false;
  if (!tmpOriginal && r2Key) {
    // Fetch from R2 to temp
    tmpOriginal = path.join('/tmp', `orig-${photoId}-${Date.now()}.jpg`);
    await fetchR2ToTemp(r2Key, tmpOriginal, local);
    needsCleanup = true;
  }
  if (!tmpOriginal || !fs.existsSync(tmpOriginal)) {
    throw new Error(`Original file not found: ${tmpOriginal || r2Key}`);
  }

  const meta = await sharp(tmpOriginal).metadata();
  console.log(`  Original: ${meta.width}x${meta.height} ${meta.format} ${(fs.statSync(tmpOriginal).size/1024).toFixed(1)}KB`);

  // Determine base R2 prefix: photos/<category>/<year>/<uuid>/
  // If r2Key is photos/weddings/2026/abc123.jpg, base is photos/weddings/2026/abc123/
  // For legacy single-file keys like photos/weddings/2026/abc123.webp, we treat the file as original and create folder variants
  const baseDir = r2Key ? r2Key.replace(/\.[^/.]+$/, '') : `photos/uncategorized/${new Date().getFullYear()}/${photoId}`;
  const basePrefix = baseDir.includes('.') ? baseDir.replace(/\/[^/]+$/, '') : baseDir; // ensure no file ext
  // Actually we want a folder per photo: use photoId as folder if legacy key is file
  // Simpler: use r2Key without ext as folder base if r2Key contains photoId, else use baseDir
  // For new uploads, r2Key is already photos/<cat>/<year>/<uuid>/original.<ext> or similar
  // We'll generate variants as <basePrefix>/480.webp etc., where basePrefix is directory of original

  // Determine original's directory
  const originalDir = path.posix.dirname(r2Key || basePrefix);
  // For new structure where original is photos/.../<photoId>/original.jpg, originalDir is photos/.../<photoId>
  // For legacy where original is photos/.../<uuid>.webp, originalDir is photos/... and file is <uuid>.webp — we will still create variants as <photoId>/480.webp but need consistent
  // Safer: use photoId as folder: photos/<category>/<year>/<photoId>/
  let variantBase;
  if (r2Key && r2Key.includes(photoId)) {
    // r2Key already contains photoId, use its directory
    variantBase = path.posix.dirname(r2Key);
    // If r2Key is like photos/weddings/2026/abc123.jpg (where abc123 != photoId), this will be photos/weddings/2026 — not ideal
    // But for new uploads we generate r2Key as photos/<cat>/<year>/<photoId>/original.<ext>, so dirname is photos/<cat>/<year>/<photoId>
    // For legacy, r2Key is photos/weddings/2026/8f42...webp where 8f42 is hash, not photoId — we should still use that hash as folder?
    // To keep stable, use photoId as folder for all new variants: photos/<category>/<year>/<photoId>/
    // We can derive category from r2Key
    const catMatch = r2Key.match(/^photos\/([^/]+)\//);
    const cat = catMatch ? catMatch[1] : 'uncategorized';
    const year = new Date().getFullYear();
    variantBase = `photos/${cat}/${year}/${photoId}`;
  } else {
    const cat = 'uncategorized';
    variantBase = `photos/${cat}/${new Date().getFullYear()}/${photoId}`;
    if (r2Key) {
      const catMatch = r2Key.match(/^photos\/([^/]+)\//);
      if (catMatch) variantBase = `photos/${catMatch[1]}/${new Date().getFullYear()}/${photoId}`;
    }
  }

  // Also ensure original is stored as original.ext in that folder (if not already)
  const originalExt = path.extname(r2Key || tmpOriginal).replace('.', '') || meta.format || 'jpg';
  const originalR2Key = `${variantBase}/original.${originalExt}`;
  // If original already at r2Key and r2Key !== originalR2Key, we should copy original to new location or keep as is
  // For now, we keep original at its current r2Key and also ensure variants are in variantBase

  await updatePhotoStatus(photoId, 'processing', null, local);

  const variants = [];
  for (const w of WIDTHS) {
    if (meta.width < w) {
      console.log(`  Skipping ${w}w (original ${meta.width} < ${w})`);
      continue;
    }
    const outTmp = path.join('/tmp', `${photoId}-${w}.webp`);
    const resized = await sharp(tmpOriginal)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(outTmp);
    const stats = fs.statSync(outTmp);
    const variantR2Key = `${variantBase}/${w}.webp`;
    const mime = 'image/webp';
    await uploadToR2(outTmp, variantR2Key, mime, local);
    const imageUrl = getR2PublicUrl(variantR2Key);
    const variant = {
      photo_id: photoId,
      variant_name: String(w),
      width: resized.width,
      height: resized.height,
      format: 'webp',
      mime_type: mime,
      file_size: stats.size,
      r2_key: variantR2Key,
      image_url: imageUrl,
    };
    await insertVariant(photoId, variant, local);
    variants.push(variant);
    console.log(`  → ${w}w ${resized.width}x${resized.height} ${(stats.size/1024).toFixed(1)}KB → ${variantR2Key}`);
    fs.unlinkSync(outTmp);
  }

  // Also ensure original variant entry exists (for consistent API)
  const origStats = fs.statSync(tmpOriginal);
  const origVariant = {
    photo_id: photoId,
    variant_name: 'original',
    width: meta.width,
    height: meta.height,
    format: meta.format || originalExt,
    mime_type: `image/${meta.format || originalExt}`,
    file_size: origStats.size,
    r2_key: r2Key || originalR2Key,
    image_url: getR2PublicUrl(r2Key || originalR2Key),
  };
  await insertVariant(photoId, origVariant, local);
  console.log(`  → original ${meta.width}x${meta.height} ${(origStats.size/1024).toFixed(1)}KB`);

  // Update photos table with dimensions and status
  const cmd = `npx wrangler d1 execute muwanshots-db ${local ? '--local' : '--remote'} --command "UPDATE photos SET width=${meta.width}, height=${meta.height}, file_size=${origStats.size}, original_r2_key='${(r2Key || originalR2Key).replace(/'/g, "''")}', processing_status='ready', processed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id='${photoId}'"`;
  execSync(cmd, { stdio: 'inherit' });

  if (needsCleanup && fs.existsSync(tmpOriginal)) {
    try { fs.unlinkSync(tmpOriginal); } catch (e) {
      // Windows EBUSY can happen if file still held; retry after brief delay
      try { await new Promise(r => setTimeout(r, 200)); fs.unlinkSync(tmpOriginal); } catch (_e2) { console.warn(`  Warning: could not clean temp ${tmpOriginal}:`, _e2.message); }
    }
  }
  console.log(`✓ ${photoId} ready with ${variants.length} variants`);
  return variants;
}

async function main() {
  const args = parseArgs();
  const local = !args.remote;

  if (args['photo-id']) {
    const photoId = args['photo-id'];
    const photo = await getPhotoFromD1(photoId, local);
    if (!photo) throw new Error(`Photo ${photoId} not found`);
    await optimizeOne({ photoId, r2Key: photo.r2_key, local });
  } else if (args['all-pending']) {
    const cmd = `npx wrangler d1 execute muwanshots-db ${local ? '--local' : '--remote'} --command "SELECT id, r2_key FROM photos WHERE processing_status='pending'" --json`;
    const out = execSync(cmd, { encoding: 'utf-8' });
    const json = JSON.parse(out);
    const rows = json[0]?.results || [];
    console.log(`Found ${rows.length} pending photos`);
    for (const row of rows) {
      try {
        await optimizeOne({ photoId: row.id, r2Key: row.r2_key, local });
      } catch (e) {
        console.error(`Failed ${row.id}:`, e.message);
        await updatePhotoStatus(row.id, 'failed', e.message, local);
      }
    }
  } else if (args.file) {
    const filePath = args.file;
    const photoId = args['photo-id'] || `tmp-${Date.now()}`;
    const r2Key = args['r2-key'] || `photos/uncategorized/${new Date().getFullYear()}/${photoId}/original${path.extname(filePath)}`;
    await optimizeOne({ photoId, filePath, r2Key, local });
  } else {
    console.log(`
Usage:
  node scripts/optimize-upload.mjs --photo-id <uuid> [--remote]
  node scripts/optimize-upload.mjs --all-pending [--remote]
  node scripts/optimize-upload.mjs --file ./image.jpg --r2-key photos/weddings/2026/<uuid>/original.jpg --photo-id <uuid> [--remote]

Notes:
  - Requires .dev.vars with R2 binding (wrangler) and sharp (Node only, never in functions/)
  - Variants: ${WIDTHS.join(', ')} (WebP, quality ${QUALITY}, no upscale)
  - R2 structure: photos/<category>/<year>/<photo-id>/original.<ext> + 480/768/1200/1600.webp
  - Runs outside Workers (Node), safe for production via local or CI
`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
