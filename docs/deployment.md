# Deployment — Muwan Shots

## Local Development

```bash
npm install
cp .dev.vars.example .dev.vars  # fill JWT_SECRET (32+ hex)
# Create D1 and R2 locally (no remote needed)
npx wrangler d1 execute muwanshots-db --local --file=./migrations/0001_initial.sql
npx wrangler d1 execute muwanshots-db --local --file=./migrations/0002_seed.sql
npx wrangler d1 execute muwanshots-db --local --file=./migrations/0003_site_settings.sql
npx wrangler d1 execute muwanshots-db --local --file=./migrations/0004_media_variants.sql

npm run create-admin -- --email admin@muwanshots.com --password <StrongPass> --name "Muwan Admin"
# Or: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin

# Run API + Vite
npx wrangler pages dev dist --port 8788 --d1 DB=muwanshots-db --r2 R2=muwanshots-media --compatibility-date 2024-12-01 &
npm run dev  # Vite on 5173, proxies /api → 8788
```

`vite.config.js` `server.proxy['/api']` forwards to `127.0.0.1:8788`.

## Environment Variables / Secrets

**Never commit `.dev.vars` or production secrets.**

| Variable | Where | Purpose |
|---|---|---|
| `JWT_SECRET` | `.dev.vars` (local) / `wrangler pages secret put JWT_SECRET` (prod) | HS256 for admin JWT, min 32 chars |
| `R2_PUBLIC_URL` | `.dev.vars` / `wrangler pages secret put` | e.g., `https://images.muwanshots.com` for direct CDN URLs, else `/api/media/...` fallback |
| `ENVIRONMENT` | `wrangler.toml [vars]` / `.dev.vars` | `production` enables Secure cookie |

Check `.gitignore` contains `*.local`, `.dev.vars`, `.env`, `dist`, `node_modules`.

## Production (Cloudflare Pages)

```bash
# 1. Create D1 (once)
npx wrangler d1 create muwanshots-db
# → paste database_id into wrangler.toml [[d1_databases]]

# 2. Create R2 (once)
npx wrangler r2 bucket create muwanshots-media

# 3. Set secrets (once)
npx wrangler pages secret put JWT_SECRET
npx wrangler pages secret put R2_PUBLIC_URL # optional

# 4. Apply migrations (remote)
npx wrangler d1 execute muwanshots-db --remote --file=./migrations/0001_initial.sql
npx wrangler d1 execute muwanshots-db --remote --file=./migrations/0002_seed.sql
npx wrangler d1 execute muwanshots-db --remote --file=./migrations/0003_site_settings.sql
npx wrangler d1 execute muwanshots-db --remote --file=./migrations/0004_media_variants.sql

# 5. Create admin (remote)
npm run create-admin -- --email admin@muwanshots.com --password <Strong> --remote

# 6. Build & Deploy
npm run build   # vite build → dist
npx wrangler pages deploy dist --project-name muwanshots

# Media processing (after upload, pending photos)
node scripts/optimize-upload.mjs --all-pending --remote
```

## Custom R2 Domain

- **Status 2026-09-09:** `images.muwanshots.com` is **NOT CONFIGURED** — `nslookup` NXDOMAIN, `wrangler r2 bucket domain list` shows none, `R2_PUBLIC_URL` not set in production (health reports `not_configured`). `muwanshots.com` itself does not resolve; custom domain cannot be attached until the domain is purchased/added to Cloudflare. The app correctly falls back to `/api/media/...` (immutable, 1-year cache) and remains fully functional.
- **When ready to configure:**
  1. Purchase `muwanshots.com` and add zone to Cloudflare (proxy).
  2. In dashboard: R2 → muwanshots-media → Settings → Custom Domain → Add `images.muwanshots.com` → Enable (requires CNAME validation, HTTPS auto).
  3. Verify: `npx wrangler r2 bucket domain list muwanshots-media` should show `images.muwanshots.com` Enabled, `nslookup images.muwanshots.com` resolves, `curl https://images.muwanshots.com/photos/.../480.webp` 200.
  4. Set secret: `npx wrangler pages secret put R2_PUBLIC_URL` value `https://images.muwanshots.com` (and optionally `VITE_R2_PUBLIC_URL` at build time for frontend env).
  5. New uploads will then store `image_url` as `https://images.muwanshots.com/...`; old rows remain `/api/media/...` and still work. Frontend `src/lib/image.js:resolveImageUrl()` handles both: priority absolute URL → CDN base + r2Key → `/api/media` fallback. Never hard-code domain in components.
  6. Verify: `curl https://muwanshots.pages.dev/api/health` should show `r2_public_url: "configured:images.muwanshots.com"` and `GET /api/media/<key>` and `https://images.muwanshots.com/<key>` both 200 with `Cache-Control: public, max-age=31536000, immutable`.

## PWA / Caching

- `public/sw.js` never caches `/api/*` or `/admin/*` (top check), caches `/images/gallery/**` via `GALLERY_CACHE` LRU 80.
- Public `GET /api/settings` `max-age=300, s-maxage=3600`, `GET /api/categories|photos|albums` `max-age=60, s-maxage=300` (public only, `?all=true` is `no-store`).
- After admin `PUT`, frontend `useSiteSettings` clears in-memory `cached` and shows success; CDN cache expires in 5m/1h.

## Media Processing

`sharp` is **Node-only** (`scripts/optimize-upload.mjs`), never in `functions/`. Run locally or in CI (GitHub Action `workflow_dispatch` + `cron` every 15 min + push trigger).

- **Schedule:** `.github/workflows/media-optimize.yml` runs `*/15 * * * *` (15 min) + on push to relevant files, with `concurrency: media-optimize` and pending-check skip to save minutes. Processes only `pending` (failed via `POST /api/photos/retry` → pending). Not real-time, but ≤15 min latency (manual `node scripts/optimize-upload.mjs --all-pending --remote` is immediate).
- **Retry:** `POST /api/photos/retry` (auth, max 20 ids) resets `failed` → `pending`. Optimizer then re-creates variants idempotently (`INSERT OR REPLACE`).

See `docs/media-optimization.md` for variant widths (480/768/1200/1600, WebP 82, no upscale) and R2 structure `photos/<category>/<year>/<photoId>/480.webp` etc.
See `docs/phase-3.7-media-automation.md` for Phase 3.7 and `docs/phase-3.8-cms-migration.md` for Phase 3.8 CMS migration (dry-run, `migrate-static-gallery.mjs`, 75 legacy photos).

## CMS Migration (Phase 3.8)

- **Legacy inventory:** 75 real photos, 6 categories with images, 6 albums, 300 optimized WebPs in `public/images/gallery`.
- **Tool:** `scripts/migrate-static-gallery.mjs` (idempotent, `--dry-run`, `--all`, `--category`, `--photo`, `--remote`).
- **Current status 2026-09-09:** D1 6 categories, 6 albums, 8 photos migrated (baby-shoots proof batch, 3 ready 5 pending). Full 75 not yet migrated; 7-day stability gate not met, so static fallback retained (`src/content/gallery` + `public/images/gallery` still used via `useDynamicGallery` fallback).
- **To complete migration:** `node scripts/migrate-static-gallery.mjs --all --remote && node scripts/optimize-upload.mjs --all-pending --remote` (best on CI ubuntu for EBUSY-free).
- **Removal criteria:** ≥6 categories + ≥50 real photos + 7 days stable + backups + dynamic gallery/SEO verified → then `git rm -r src/content/gallery public/images/gallery` and remove fallback imports (keep `R2_MEDIA_API` fallback).
- **Backup:** `wrangler d1 execute --json > backup.json` and R2 via `aws s3 sync` or git history; see `docs/phase-3.8-cms-migration.md:10`.

## Verification

```bash
npm run build
npm run lint
npx wrangler d1 execute muwanshots-db --local --command "SELECT count(*) FROM photos WHERE is_published=1"
curl http://127.0.0.1:8788/api/settings | jq
curl http://127.0.0.1:8788/api/categories | jq
curl -X POST http://127.0.0.1:8788/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@...","password":"..."}' -v
```
