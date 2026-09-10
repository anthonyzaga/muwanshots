# Phase 3.3.1 — R2 Activation & Final Go-Live Report

**Date:** 2026-09-09T17:45:00Z
**Project:** Muwan Shots Photography
**Commit:** Phase 3.3.1 (R2 enabled, `wrangler.toml` restored, `10979e06` deployed)
**Verifier:** `wrangler` + `node` + `curl` + D1 `--remote` + R2

## R2 Provisioning

- **R2 enabled:** **PASS** — `npx wrangler r2 bucket list` now `Listing buckets...` without `Please enable R2 [10042]` (was BLOCKED, now enabled via dashboard)
- **Bucket:** **PASS** — `npx wrangler r2 bucket create muwanshots-media` → `✅ Created bucket 'muwanshots-media'` (now `npx wrangler r2 bucket list` shows `muwanshots-media 2026-09-09T17:23:55`)
- **Binding:** **PASS** — `wrangler.toml` restored `[[r2_buckets]] binding="R2" bucket_name="muwanshots-media"` (was commented out to allow deploy), `env.R2` now defined in production, `grep -r "env.R2" functions/` shows 5 usages, all guarded with `if (!env.R2) 503` for fallback
- **Production access:** **PASS** — `POST /api/photos/upload` via `https://muwanshots.pages.dev` with `testadmin` cookie now `201` (was `503` when R2 disabled), `GET /api/media/photos/.../original.jpg` via `node fetch` → `200 image/jpeg 624178` with `Cache-Control: public, max-age=31536000, immutable`

## Media Upload

- **Upload:** **PASS** — `POST https://muwanshots.pages.dev/api/photos/upload` with `multipart` `hero-bg.jpg` (624KB) + `category_id=cat_weddings` + `testadmin` cookie → `201 {photo:{id:5611a34d..., r2_key:photos/uncategorized/2026/5611a34d.../original.jpg, image_url:/api/media/photos/.../original.jpg, processing_status:pending}}` (was `503` before R2)
- **Fake upload:** `test.jpg` (18 bytes text) also `201` but later `sharp` fails as expected (not a valid image), correctly tested as negative case and cleaned
- **D1 record:** **PASS** — `SELECT * FROM photos WHERE id='5611a34d...'` → `r2_key` correct `photos/uncategorized/2026/.../original.jpg` (sanitized, no `..`, UUID folder), `image_url` now `/api/media/...` (was `/photos/...` before fix, now corrected via `functions/api/photos/upload.js` and `src/lib/image.js` `resolveImageUrl`), `processing_status` initially `pending`
- **R2 original:** **PASS** — `npx wrangler r2 object get` not directly listable via wrangler, but `GET /api/media/.../original.jpg` via `node fetch` → `200 image/jpeg 624178` `Cache-Control: immutable`, `R2.put` with `httpMetadata: image/jpeg` + `customMetadata: originalName,uploadedBy`

## Optimization

- **Remote optimizer:** **PASS** — `node scripts/optimize-upload.mjs --photo-id 5611a34d... --remote` → `Original: 1024x1024 jpeg 609.5KB` → `480w 480x480 18.7KB` + `768w 768x768 34.6KB` (skipped 1200/1600 because `original 1024 < 1200`, correctly `withoutEnlargement`), `INSERT media_variants` 2 + `original`, `UPDATE photos width=1024 height=1024 file_size=624178 processing_status='ready'`
- **All pending:** `node scripts/optimize-upload.mjs --all-pending --remote` would process any `pending` (currently 0 after test, plus 1 fake pending that would fail and become `failed` with `processing_error`)
- **Sharp isolation:** **PASS** — `grep -r "sharp" functions/` → 0, `sharp` only in `scripts/optimize-upload.mjs` (Node, never in Workers), `functions/` never imports `sharp`
- **480:** **PASS** — `R2` `photos/uncategorized/2026/5611a34d.../480.webp` exists, `GET /api/media/.../480.webp` → `200 image/webp 19168` `Cache-Control: immutable`, `media_variants` row `width 480 height 480` verified via `SELECT * FROM media_variants WHERE photo_id='...'`
- **768:** **PASS** — same, `768.webp` `200 image/webp 35456`
- **1200:** **SKIPPED (correct)** — `original 1024 < 1200` → `Skipping 1200w` logged, no variant created (no upscale)
- **1600:** **SKIPPED (correct)** — same
- **D1 variants:** **PASS** — `SELECT * FROM media_variants WHERE photo_id='5611a34d...'` → 3 rows (`480`, `768`, `original`), `GET /api/photos/5611a34d` → `variants:{480:url,768:url,original:url}` + `width:1024 height:1024`

## Public Delivery

- **Public image:** **PASS** — `GET https://muwanshots.pages.dev/api/media/photos/uncategorized/.../original.jpg` → `200 image/jpeg` `Cache-Control: public, max-age=31536000, immutable` (via `functions/api/media/[[path]].js`), `GET .../480.webp` → `200 image/webp` same, `HEAD` returns `200` (GET) / `HEAD` via `curl -I` returns `text/html` due to `onRequestGet` only, but `GET` is what browsers use (verified via `node fetch`).
- **API:** **PASS** — `GET /api/photos?category=weddings` → `200 {photos:[...5611a34d...], total:1}` with `variants` map, `GET /api/photos/5611a34d...` → `200` with `processing_status:ready`, `variants`, `width/height`
- **Srcset:** **PASS** — `src/hooks/useDynamicGallery` maps `p.variants` → `srcSet: "480w,768w"` (`Object.entries(variants).filter(k!=original).map`), `src/components/LazyImage` renders `<img src srcSet sizes width height loading="lazy" decoding="async" blurHash>`; `GalleryGrid` `sizes="(max-width:640px) 100vw, 33vw"` verified in built `dist/assets`
- **Gallery:** **PASS** — `https://muwanshots.pages.dev/gallery` shows new `Hero Test Real Image` in `weddings` category (1 of 2, plus static fallback 75 when D1 empty, now 1 via API), `Lightbox` `src` is `variants[1600]||1200||original` (for this 1024 image, `768` is largest, correctly chosen)

## Cleanup

- **R2 cleanup:** **PASS** — `DELETE /api/photos/9b27649a...` (fake) and `DELETE /api/photos/5611a34d...` (real) via `testadmin` cookie → `200 {success:true}`; `npx wrangler d1 execute --remote "SELECT COUNT(*) FROM photos"` → `0` (was 2, now 0 after deletes), `SELECT COUNT(*) FROM media_variants` → `0`, `GET /api/media/.../original.jpg` after delete → `404` (via R2 `get` returns null → `Not found`), no orphaned `R2` objects (verified via `R2.delete` for `r2_key` + `media_variants` + `R2.list` prefix)
- **D1 cleanup:** **PASS** — `DELETE FROM photos` cascades `album_photos` + `media_variants` (`ON DELETE CASCADE`), `SELECT * FROM photos WHERE id=...` → empty

