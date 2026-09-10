# Media Optimization — Muwan Shots

## Why `sharp` is not in Workers

`sharp` is a Node.js native addon (`libvips`). Cloudflare Workers/Pages Functions run on V8 isolates, not Node. Importing `sharp` into `functions/` would fail deployment:

```
Could not resolve "sharp"
ERR_DLOPEN
```

**Rule:** `sharp` MUST only be imported under `scripts/` (Node).

## Architecture (Phase 3.1)

```
Admin upload
    ↓ (POST /api/photos/upload)
Pages Function (Workers)
    ↓ validation, auth, R2.put(original), D1 INSERT (processing_status='pending')
    ↓
D1 photos.pending
    ↓
Node media processor (scripts/optimize-upload.mjs) — outside Workers
    ↓ sharp
    ↓ 480/768/1200/1600 WebP (quality 82, no upscale)
    ↓ R2.put each variant
    ↓ INSERT media_variants, UPDATE photos (width/height/file_size, processing_status='ready')
    ↓
Public API GET /api/photos returns variants
    ↓
Browser LazyImage src + srcset/sizes
```

## R2 Structure

```
photos/<category>/<year>/<photo-id>/original.<ext>   # e.g., photos/weddings/2026/550e8400-.../original.jpg
photos/<category>/<year>/<photo-id>/480.webp
photos/<category>/<year>/<photo-id>/768.webp
photos/<category>/<year>/<photo-id>/1200.webp
photos/<category>/<year>/<photo-id>/1600.webp
```

- `photo-id` is `crypto.randomUUID()` (stable, not user filename).
- `category` is sanitized `slug` (`[^a-z0-9-]` → `-`).
- Never use original filename as R2 key.

## Variant Generation

- **Widths:** 480, 768, 1200, 1600 (only if `original.width >= variant`, no upscale)
- **Format:** `webp`, `effort: 4`, `quality: 82`
- **Aspect:** preserve, `withoutEnlargement: true`
- **Example:**
  - `original 700px` → `480` + `original` (skip 768/1200/1600)
  - `original 2500px` → `480,768,1200,1600` + `original`

## Database

`media_variants` (migration `0004`):
- `id` PK (`<photoId>-<variant>`), `photo_id FK photos ON DELETE CASCADE`, `variant_name` (480/768/1200/1600/original), `width,height,format,mime_type,file_size,r2_key,image_url`
- `photos` now has `processing_status` (`pending|processing|ready|failed`), `processing_error`, `processed_at`, `width,height,file_size,original_r2_key`

Public `GET /api/photos` joins `media_variants` and returns `variants: {480:url,768:url,...}` + `width/height` for `LazyImage`.

## How to Run (Local)

```bash
# 1. Upload via admin UI or API (creates pending)
# 2. Process pending
node scripts/optimize-upload.mjs --all-pending --local
# or single
node scripts/optimize-upload.mjs --photo-id <uuid> --local

# For a local file without DB:
node scripts/optimize-upload.mjs --file ./test.jpg --r2-key photos/test/2026/<uuid>/original.jpg --photo-id <uuid> --local
```

For production (remote D1/R2):
```bash
node scripts/optimize-upload.mjs --all-pending --remote
# Requires wrangler login and R2 binding, uses `wrangler r2 object put --remote`
```

**Current limitation:** No automatic trigger. Admin must run manually or via CI (GitHub Action `on: workflow_dispatch` + `cron`). Documented as Phase 3 subtask; not faked as async job.

## Recovery & Cleanup

- `processing_status='failed'` + `processing_error` set on exception, retry with same command.
- Old media before delete: `DELETE /api/photos/:id` deletes original + all variants from R2 (via `media_variants` lookup + `R2.delete`), then DB (CASCADE). Bulk delete does same.
- Replaced image: upload new original → validate → `PUT /api/photos/:id` with new `r2_key`/`image_url` only after new variants succeed, then delete old `r2_key`/variants.

## Frontend

- `src/hooks/useDynamicGallery` now maps `p.variants` to `srcSet` (`480w,768w...`), `width`/`height` to `LazyImage` `width`/`height` to avoid CLS.
- `src/components/LazyImage` supports `src/srcset/sizes/width/height/loading="lazy" decoding="async"` + blurHash, hero uses `fetchpriority="high"` (not lazy).

## Future

- Move to Cloudflare Images (`imagedelivery.net`) or `cdn-cgi/image` if Transformations enabled, then `image_url` can be transformed on the fly without pre-generating variants.
