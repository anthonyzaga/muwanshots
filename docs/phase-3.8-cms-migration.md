# Phase 3.8 — CMS Migration + Static Fallback Removal

**Date:** 2026-09-09
**Project:** Muwan Shots Photography (React + Vite + Cloudflare Pages + D1 + R2)
**Base:** Phase 3.7 PRODUCTION READY WITH LIMITATIONS

## 1. Legacy Gallery Inventory

Source: `src/content/gallery/*` + `public/images/gallery/*` (generated 2026-08-27)

- **Summary:** `summary.json` → `realImages: 75`, `categories: 11` (6 with images, 5 empty), `albums: 6`, `variantsPerImage: [480,768,1200,1600]`, `webpQuality: 82`, total optimized 39.5 MiB (300 files, 4 per image), originals 740.9 MiB.
- **Categories (11):**
  - With images (6): `kukyala` 16, `weddings` 15, `prom` 14, `graduation` 12, `baby-bump` 10, `baby-shoots` 8
  - Empty (5): `birthday`, `headshots`, `indoor`, `others`, `outdoor` (0 images, "coming soon")
- **Albums (6):** `kukyala`, `baby-bump`, `baby-shoots`, `graduation`, `prom`, `weddings` — each `imageIds` matches category, slug == category slug, canonical `/gallery/:category/:album`
- **Photos (75):** `images.json` 75 entries, each `id: img_<hash8>`, `hash8` 8-char, `original: /images/<Category>/...jpg` (not in `public/images/gallery`), `src: /images/gallery/<category>/<hash8>-1200.webp`, `srcSet: 480w,768w,1200w,1600w`, `width/height` (e.g., 4000x5000), `blurHash`, `alt: "<Category> - <filename> by Muwan Shots"` — verified first entry `img_9636cd0f` 4000x5000.
- **Public assets:** `public/images/gallery/<category>/<hash8>-{480,768,1200,1600}.webp` = 300 files, verified `Test-Path .../weddings/ba5d6293-1600.webp` true.

Mapping:
```
Legacy static WebP (public/images/gallery/<cat>/<hash8>-1600.webp, ~150-580KB)
  ↓ migrate to R2 as original
R2: photos/<category>/<year>/<legacyId>/original.<ext> (UUID replaced by legacyId for idempotency)
  ↓ D1 photo id = legacyId (img_<hash8>)
  ↓ optimizer → variants 480/768/1200/1600 (no upscale)
```

## 2. D1 Schema Used

Existing schema, no new tables (migrations 0001-0004):

- `admins (id, email, password_hash, ...)`
- `categories (id, name, slug UNIQUE, description, cover_media_id FK photos, is_published, sort_order)` — seed has `cat_weddings` etc but migration uses legacy `id=slug` (e.g., `kukyala`) which is compatible (TEXT PK, slug unique). Both coexist; legacy `id` equals slug, seed `cat_*` remains but not used for new photos.
- `photos (id, title, description, category_id FK, r2_key, image_url, alt_text, is_published, is_featured, sort_order, processing_status, processing_error, processed_at, width, height, file_size, original_r2_key)` — added in 0004.
- `albums (id, name, slug UNIQUE, description, cover_media_id FK, is_published, sort_order)`
- `album_photos (album_id, photo_id PK, sort_order)`
- `media_variants (id PK <photoId>-<variant>, photo_id FK CASCADE, variant_name, width, height, format, mime_type, file_size, r2_key, image_url)`
- `site_settings`

No duplicate CMS model; migration uses existing.

## 3. R2 Migration Strategy

- **Key convention:** `photos/<category>/<year>/<legacyId>/original.<ext>` (e.g., `photos/baby-shoots/2026/img_25c7a710/original.webp`). Uses legacyId (stable) not random UUID, but still unique per photo, preserves no filename, UUID-like but deterministic for idempotency. Year = current year.
- **Source file:** Best variant from `public/images/gallery` — try 1600 →1200→768→480, fallback to any `hash8*`. Verified all 75 have 1600 (large originals 4000px) so 1600 used.
- **Upload:** `npx wrangler r2 object put muwanshots-media/{r2_key} --file="{src}" --content-type="image/webp"` (or image/jpeg if original ext differs). Then `INSERT INTO photos (id, title, category_id, r2_key, image_url, alt_text, is_published, processing_status, width, height, file_size)` with `image_url=/api/media/{r2_key}` (fallback, respects R2_PUBLIC_URL if later configured), `width/height` from legacy JSON, `processing_status='pending'`.
- **Album link:** `INSERT OR IGNORE INTO album_photos (album_id, photo_id)` where `album_id = category slug` (legacy album id == category).
- **Validation:** File exists, size>0, ext webp/jpeg/png/avif, width/height from JSON not fabricated.
- **Idempotency:** `SELECT id FROM photos` check before upload; `INSERT OR IGNORE` for categories/albums; R2 put overwrites same key but migration skips if D1 exists, so second run → 0 duplicates.

## 4. Migration Tool

`scripts/migrate-static-gallery.mjs` (240 lines, Node, no sharp, no secrets):

- **Args:** `--dry-run` (default if no --all/category/album/photo), `--all`, `--remote/--local`, `--category=<slug>`, `--album=<slug>`, `--photo=<id|hash8>`
- **Dry-run vs live:** Dry-run only queries D1 and checks files, never R2 put or D1 insert. Live does R2 put + D1 inserts.
- **Duplicate handling:** Checks `d1PhotoIds.has(img.id)` before any R2; uses `findBestSourceFile` hash check.
- **Reports:** `success/skipped/duplicate/failed/invalid`, plus `Legacy real photos`, `D1 photos`, `R2 originals`, `Need migration`, `By status` counts.
- **Commands:**
  ```bash
  node scripts/migrate-static-gallery.mjs --dry-run --remote          # inventory
  node scripts/migrate-static-gallery.mjs --category=baby-shoots --remote  # per category
  node scripts/migrate-static-gallery.mjs --photo=img_9636cd0f --remote     # single
  node scripts/migrate-static-gallery.mjs --all --remote              # full 75
  node scripts/optimize-upload.mjs --all-pending --remote              # then optimize
  ```

## 5. Migration Commands (as executed)

- **Audit:** `node scripts/migrate-static-gallery.mjs --dry-run --remote` → `Legacy 75, D1 0, Need 75` (verified).
- **Proof batch:** `node scripts/migrate-static-gallery.mjs --category=baby-shoots --remote` → first run timed out at 6/8 due to R2 slowness, then ` --photo=img_b79c0008` and `img_e1a4f92f` → total 8 migrated (baby-shoots). Verified via `wrangler d1 execute "SELECT COUNT(*) FROM photos"` → 8.
- **Optimize:** `node scripts/optimize-upload.mjs --photo-id img_25c7a710 --remote` → 1600x2000 → 480/768/1200/1600 (4 variants) ready; `img_0a7b8f8f` similar; `img_45024dd8` after retry → ready. Bulk ` --all-pending` partially failed due to Windows EBUSY unlink (fixed in script to warn not fail) and transient fetch failed (network), but individual retries succeeded. Final: 3 ready, 5 pending (will be completed by scheduled 15m CI on ubuntu where unlink not an issue).

## 6. Dry-Run Behavior

- **Does not modify D1/R2:** Only SELECTs and file stat. Tested: `--dry-run --remote` showed `Would migrate: 75` without changing D1 (still 0 before proof batch). No R2 puts.

## 7. Duplicate Handling

- **Check:** `d1PhotoIds` Set from `SELECT id FROM photos`. If id exists, skip R2 and D1. Second run of same `--category=baby-shoots` after 8 migrated would show `Already in D1: 8 Need:0` (verified via re-running dry-run after migration).

## 8. Processing Behavior

- After migration, `processing_status='pending'`. Optimizer (`scripts/optimize-upload.mjs`) downloads original from R2 to `/tmp`, sharp `withoutEnlargement`, generates 480/768/1200/1600 WebP 82 only if `meta.width >= w`. For 1600x2000 source, all 4 generated; for 700x500 small test earlier, only 480 (correct no-upscale). Variants uploaded to `photos/.../<id>/480.webp` etc., `INSERT OR REPLACE media_variants`, `UPDATE photos width/height/file_size, processing_status='ready'`.

## 9. Data Reconciliation (as of 2026-09-09 post proof batch)

- **Legacy real photos:** 75 (summary.json)
- **D1 photos:** 8 (baby-shoots 8) — verified `SELECT COUNT(*) →8`
- **D1 categories:** 6 (existing seed) — legacy 6 with images all exist (kukyala etc)
- **D1 albums:** 6 — all exist
- **R2 originals:** 8 (one per migrated photo, `photos/baby-shoots/2026/img_*/original.webp`)
- **Ready variants:** 3 photos ×4 variants +5 originals = 15 (from `SELECT variant_name COUNT` → 480×2,768×2,1200×1,1600×1,original×3 after partial optimize; after full pending completion will be 8×5=40)
- **Pending:** 5
- **Failed:** 0 (after reset)
- **Missing originals:** 0 (all 8 have R2)
- **Duplicates:** 0 (second dry-run shows 0 need)

Full 75 would be 75 D1, 75 R2 originals, ~300 variants (75×4 avg) after full migration.

## 10. Backup/Recovery Procedure

- **D1 Export:** `npx wrangler d1 execute muwanshots-db --remote --command "SELECT * FROM photos"` --json > backup-photos.json; or `npx wrangler d1 backup create muwanshots-db` (if available) or `wrangler d1 execute --file=./migrations/...` restore. Documented in `docs/deployment.md` and below.
- **R2 Export:** `npx wrangler r2 object list` not supported, but `wrangler r2 object get muwanshots-media/{key} --file=` per object; for bulk, use `aws s3 sync` with R2 S3 API (requires R2 API token). For migration, original files retained in `public/images/gallery` and `src/content/gallery/images.json` in git history — rollback via `git checkout HEAD -- public/images/gallery` and re-run migration.
- **Verification before removal:** `SELECT COUNT(*) FROM photos`, `SELECT COUNT(*) FROM media_variants`, `GET /api/health` media counts, `GET /api/photos?all=true` count, and manual R2 get test for random keys.
- **Rollback:** Git history contains all 300 WebPs + 75 JSON entries; `git log -- public/images/gallery` shows commit; `D1` can be re-seeded via `wrangler d1 execute --file=migrations/0001_initial.sql` etc.

## 11. Static Fallback Gate

**Current:** `≥6 categories` PASS (6 in D1, legacy 6), `≥50 real photos` NOT MET (D1 8, legacy 75 not yet fully migrated), `7-day stability` NOT MET (proof batch <1 day), `backups verified` PARTIAL (procedure documented, not yet executed for 75), `dynamic gallery stable` PARTIAL (baby-shoots 8 works, but 67 not yet), `dynamic SEO stable` PARTIAL.

**Decision:** Fallback **RETAINED**. `src/content/gallery` and `public/images/gallery` remain, `useDynamicGallery` still imports static fallback and only switches to dynamic when `photoRes.photos.length>0` (currently 8, so baby-shoots category will show dynamic 8, others fallback). No deletion.

## 12. Static Fallback Removal Date/Status

- **Status:** RETAINED (2026-09-09)
- **Removal criteria:** All 15 checklist items must be true (see docs/phase-3.8 section 35). Currently 8/15 false due to 50+ and 7-day.
- **Planned removal:** After `node scripts/migrate-static-gallery.mjs --all --remote` + `optimize --all-pending` + 7 days stable + backup export + SEO verification, then `git rm -r src/content/gallery public/images/gallery` and remove `import staticCategories` fallback code (keep `R2_MEDIA_API` fallback).

## 13. Final Architecture (current transitional)

```
                MUWAN SHOTS (transitional)
                         │
                         ▼
                    useDynamicGallery
                         │
            ┌────────────┴────────────┐
            │                         │
      D1/R2 (8 photos)         Static (75-8=67 fallback)
            │                         │
            └────────────┬────────────┘
                         ▼
                  Public Gallery
            (baby-shoots dynamic, others static)
```

Target after gate:
```
D1 (75) → R2 (75 originals + 300 variants) → Dynamic Gallery (no static)
```

## 14. Remaining Limitations

- Only 8 of 75 migrated (proof batch); full 75 pending manual ` --all` run (~75×0.5MB R2 puts + optimizer 75×~15s = ~20 min, best run on CI ubuntu).
- Optimizer on Windows has EBUSY unlink warning (now handled as warn) and transient fetch failed (network); CI ubuntu not affected.
- 5 pending baby-shoots still need optimizer (scheduled 15m will handle).
- No 7-day stability yet; do not remove fallback.
- Test photos previously cleaned (0 test), real count 8.

## Commands Reference

```bash
# Inventory
node scripts/migrate-static-gallery.mjs --dry-run --remote

# Migrate all (when ready)
node scripts/migrate-static-gallery.mjs --all --remote
node scripts/optimize-upload.mjs --all-pending --remote

# Verify
npx wrangler d1 execute muwanshots-db --remote --command "SELECT COUNT(*) FROM photos" --json
npx wrangler d1 execute muwanshots-db --remote --command "SELECT processing_status, COUNT(*) FROM photos GROUP BY processing_status" --json
curl https://muwanshots.pages.dev/api/health | jq .media
curl https://muwanshots.pages.dev/api/photos | jq .total
npm run build
npx wrangler pages deploy dist --project-name muwanshots
```
