# CMS Migration — From Static to Dynamic

## 1. Populate Categories

Via Admin UI: `/admin/categories` → Create Category (name, slug auto, description, cover, published, sort_order drag)

Or via API:
```bash
curl -X POST https://your-site/api/categories \
  -H "Content-Type: application/json" \
  --cookie "__Host-muwan_session=..." \
  -d '{"name":"Portraits","slug":"portraits","description":"...","is_published":1,"sort_order":7}'
```

Verify: `GET /api/categories` (public) returns published sorted, `GET /api/categories?all=true` (admin) returns all.

## 2. Upload Photos

Admin UI: `/admin/photos` → Upload Photo (select file, category, alt) → POST `/api/photos/upload` (multipart) → R2 `photos/<category>/<year>/<uuid>/original.*` + D1 `photos` with `processing_status=pending`.

Then optimise:
```bash
node scripts/optimize-upload.mjs --all-pending --local
# or --remote for production
node scripts/optimize-upload.mjs --photo-id <uuid> --remote
```
Check: `GET /api/photos?all=true` → `processing_status=ready`, `variants` contains 480/768/1200/1600.

## 3. Create Albums

`/admin/albums` → Create Album (name, slug, description, cover, published) → `POST /api/albums`

Add photos: Open album → Manage Photos → Add Photos (search, multi-select) → `PUT /api/albums/:id` with `photo_ids: [...]` ordered. Reorder via up/down → `PUT` with ordered `photo_ids`.

Verify: `GET /api/albums` (public) and `GET /api/albums/:slug` includes `photos` array.

## 4. Configure Site Settings

`/admin/settings` → 5 groups (General/Social/Homepage/SEO) → Save → `PUT /api/settings` (allowlist). Public `GET /api/settings` cached 5m/1h. Hero/OG image picker reuses existing `photo.image_url` (no duplicate).

Verify: `GET /api/settings` returns 23 keys, homepage reflects `hero_title` etc.

## 5. Verify D1

```bash
npx wrangler d1 execute muwanshots-db --local --command "SELECT id,name,slug FROM categories WHERE is_published=1"
npx wrangler d1 execute muwanshots-db --local --command "SELECT id,title,processing_status FROM photos WHERE is_published=1 LIMIT 5"
npx wrangler d1 execute muwanshots-db --local --command "SELECT * FROM site_settings WHERE setting_key='hero_title'"
```

## 6. Verify R2

```bash
npx wrangler r2 object list muwanshots-media --prefix photos/weddings/ --local --json | head
npx wrangler r2 object get muwanshots-media/photos/weddings/2026/<uuid>/original.jpg --local --file=/tmp/test.jpg && ls -lh /tmp/test.jpg
```

## 7. Verify Dynamic Site

- Public: `/`, `/gallery`, `/gallery/:category`, `/gallery/:category/:album` should show CMS content (published only). If D1 empty, static fallback in `src/content/gallery` and `src/content/content.json` keeps site rendered.
- Admin: `/admin/*` requires login, shows dashboard stats from D1.

## 8. Safely Remove Static Fallback Later

When D1 has ≥6 categories and ≥50 photos and verified via `GET /api/*`:

1. Check `src/hooks/useDynamicGallery.js` fallback: `catch` keeps static. Document `isDynamic` flag.
2. After 1 week production verification, remove `src/content/gallery/*.json` imports and make hook throw if `fetch` fails (show empty state instead of fallback).
3. Keep `src/content/content.json` for `site_settings` defaults until CMS fully replaces.

**Do not delete** `src/content/gallery` blindly — keep as resilience until D1 is source of truth.
