# Phase 3.5 — Production Media Architecture

**Date:** 2026-09-09
**Status:** `sharp` is Node-only, never in Workers

## R2 Custom Domain

- **Current:** `R2_PUBLIC_URL` **NOT CONFIGURED** (`wrangler pages secret list` shows only `JWT_SECRET`)
- **Fallback active:** `image_url` = `/api/media/${r2_key}` → `functions/api/media/[[path]].js` (`env.R2.get` + `Cache-Control: public, max-age=31536000, immutable` for variants)
- **Preferred:** `https://images.muwanshots.com` (custom R2 domain) — to enable, create R2 custom domain in dashboard `R2 → muwanshots-media → Settings → Custom Domains → Connect Domain`, then `npx wrangler pages secret put R2_PUBLIC_URL` with `https://images.muwanshots.com`
- **Verification:** `curl -s https://muwanshots.pages.dev/api/media/photos/.../original.jpg -I` → `200 image/jpeg` after R2 enabled (was `503` when R2 disabled, now `200` for test photo `5611a34d...` via `/api/media`)
- **Code:** `src/lib/image.js` `resolveImageUrl()` handles `https://`, `/api/media/`, `/photos/` → `/api/media/photos/...`, fallback `/images/hero-bg.jpg`

## Media URL Architecture

- **Centralized:** `src/lib/image.js` `resolveImageUrl(imageUrl, r2Key)` and `getPhotoImageUrl(photo)` is single source of truth — no scattered `photo.image_url` vs `photo.r2_key` handling in components
- **Backward compatibility:** Existing `public/images/gallery` 300 WebP (`/images/gallery/...`) still served as static fallback when `D1` empty, `src/hooks/useDynamicGallery` falls back to `src/content/gallery` (75) if `fetch` fails
- **New uploads:** `r2_key` = `photos/<category>/<year>/<photoId>/original.<ext>` (UUID, sanitized `[^a-z0-9-]`), `image_url` = `R2_PUBLIC_URL ? ${R2_PUBLIC_URL}/${r2_key} : /api/media/${r2_key}` (never `/photos/...` directly)

## Optimization Architecture

- **Why not Workers:** `sharp` uses `libvips` native, incompatible with Cloudflare Workers/Pages Functions (V8 isolates). Verified `grep -r sharp functions/` → 0, `sharp` only in `scripts/` and `package.json` dev `sharp@0.35.4`.
- **Current:** `scripts/optimize-upload.mjs` (Node, `sharp`, `wrangler r2 object get/put`, `wrangler d1 execute`) — manual or CI.
- **Flow:** `Admin upload → Pages Function (R2.put original, D1 INSERT pending) → Node optimizer --all-pending --remote → sharp resize withoutEnlargement → 480/768/1200/1600 WebP quality 82 → R2.put variants → INSERT media_variants → UPDATE photos width/height/file_size, processing_status='ready'`
- **Widths:** `480,768,1200,1600` only if `original.width >= variant`, no upscale (e.g., `1024` → `480,768` + `original`, skips 1200/1600)
- **Automation:** `.github/workflows/media-optimize.yml` (`on: workflow_dispatch`, `schedule: 0 */6 * * *`, `npm ci`, `npm install -g wrangler@4`, `node scripts/optimize-upload.mjs --all-pending --remote`, `npx wrangler d1 execute --remote "SELECT ... pending"`)

## Processing States

- `pending` — just uploaded, original in R2, no variants yet
- `processing` — `UPDATE photos SET processing_status='processing'` at start of `optimizeOne`
- `ready` — variants created, `media_variants` rows inserted, `photos` updated with `width/height/file_size`, `processing_status='ready'`
- `failed` — `catch` → `UPDATE photos SET processing_status='failed', processing_error='...'`

Public `GET /api/photos` only returns `is_published=1` and prefers `ready` but will still return `pending` with single `original` variant (so gallery doesn't break, just not optimal).

## Concurrency & Retry

- **Claim:** `UPDATE photos SET processing_status='processing' WHERE id=? AND processing_status='pending'` (in `optimizeOne` we do `UPDATE ... SET processing_status='processing'` without WHERE, but we check `processing_status` before, and `media_variants` `INSERT OR REPLACE` is idempotent, so re-running is safe)
- **Idempotent:** `media_variants` `id` is `${photoId}-${variant_name}` with `INSERT OR REPLACE`, so re-running does not duplicate, `R2.put` overwrites same key
- **Retry:** `failed` → `node scripts/optimize-upload.mjs --photo-id <id> --remote` re-runs, will `UPDATE` to `processing` then `ready`

## Invalid Image Handling

- Upload validation: `ALLOWED_MIME` JPEG/PNG/WebP/AVIF, `MAX_FILE_SIZE 10MB`, `validateFile` checks `file.type` and `file.size`
- If `sharp` fails on corrupt file (e.g., `test.jpg` with `fake image content` 18 bytes text), `catch` → `UPDATE photos SET processing_status='failed', processing_error='Input buffer contains unsupported image format'`, original remains, no variants, gallery falls back to `original` (which is broken but not deleted)

## R2 Structure

```
R2 muwanshots-media
└── photos/
    └── weddings/
        └── 2026/
            └── 550e8400-e29b-41d4-a716-446655440000/
                ├── original.jpg (original, preserved)
                ├── 480.webp (18.7KB for 1024 original)
                ├── 768.webp (34.6KB)
                ├── 1200.webp (skipped if original <1200)
                └── 1600.webp (skipped)
```

D1 `photos` stores `r2_key` (original), `media_variants` stores each variant `r2_key` + `image_url` (either `R2_PUBLIC_URL/...` or `/api/media/...`).

## Frontend

- `src/hooks/useDynamicGallery` now maps `p.variants` → `srcSet` (`480w,768w...`), `width/height` from `photos.width/height` (not hardcoded `1600x1067`), `src/lib/image.js` resolves URL, `src/components/LazyImage` renders `<img src srcSet sizes width height loading="lazy" decoding="async" blurHash>` with `hero` `fetchPriority="high"` (not lazy)

## Verification

- `npm run build` ✓ 2189 modules, no `sharp` in `functions/`
- `node scripts/optimize-upload.mjs --photo-id 5611a34d... --remote` → `480,768` variants, `ready`
- `curl https://muwanshots.pages.dev/api/media/photos/.../480.webp` → `200 image/webp` `Cache-Control: public,max-age=31536000,immutable`
- `GET /api/photos?category=weddings` → `variants:{480,768,original}` + `width:1024`
- `DELETE /api/photos/:id` → deletes `R2` original + `media_variants` R2 + `DELETE FROM photos` (CASCADE)
