# Phase 3.7 — Media Automation + R2 Custom CDN

**Date:** 2026-09-09
**Project:** Muwan Shots Photography (React + Vite + Cloudflare Pages + D1 + R2)
**Base:** Phase 3.6.1 verified multi-file upload

## 1. R2 Architecture

```
Admin upload
  ↓ POST /api/photos/upload (multipart, single file per request)
Pages Function (Workers) — D1 + R2 bindings
  ↓ validate (JPEG/PNG/WebP/AVIF, 10MB), auth (__Host-muwan_session), R2.put(original)
  ↓ D1 INSERT photos (processing_status='pending')
  ↓ image_url = env.R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/{r2_key}` : `/api/media/{r2_key}`
D1 photos.pending
  ↓ Node optimizer (scripts/optimize-upload.mjs) — outside Workers, sharp
  ↓ R2.get(original) → sharp → {480,768,1200,1600}.webp (quality 82, withoutEnlargement)
  ↓ R2.put variants + INSERT media_variants + UPDATE photos width/height/file_size, processing_status='ready'
Public API GET /api/photos → joins media_variants → {variants: {480:url,768:url,...}}
  ↓ Frontend LazyImage src + srcset/sizes via resolveImageUrl
```

R2 structure: `photos/<category>/<year>/<photoId>/original.<ext>` and `.../480.webp` etc. UUID-based, no filename reuse.

## 2. Custom Media Domain Status

**NOT CONFIGURED (BLOCKED — not a bug)**

- `wrangler r2 bucket domain list muwanshots-media` → *There are no custom domains*
- `nslookup images.muwanshots.com` → *Non-existent domain* (NXDOMAIN on 192.168.1.1)
- `wrangler pages secret list --project-name muwanshots` → only `JWT_SECRET`, no `R2_PUBLIC_URL`
- `.dev.vars` → `R2_PUBLIC_URL=""`
- `muwanshots.com` itself does not resolve (not registered or not on Cloudflare). Custom domain `images.muwanshots.com` cannot be attached until `muwanshots.com` is purchased and proxied through Cloudflare (R2 → Settings → Custom Domain → requires domain zone).

**Decision:** Keep reliable fallback, do not invent workaround, do not make uploads depend on custom domain. Document limitation.

When configured, set:

```bash
npx wrangler r2 bucket domain add muwanshots-media --domain images.muwanshots.com
# Then in Cloudflare dashboard set DNS CNAME and enable HTTPS
npx wrangler pages secret put R2_PUBLIC_URL  # value: https://images.muwanshots.com
```

Frontend will then automatically use `https://images.muwanshots.com/photos/...` for new uploads; old rows remain `/api/media/...` and still work.

## 3. R2_PUBLIC_URL Status

- **Production:** NOT CONFIGURED (intentional, fallback active)
- **Local .dev.vars:** `R2_PUBLIC_URL=""` (fallback)
- **CI:** `scripts/optimize-upload.mjs:getR2PublicUrl()` now reads `process.env.R2_PUBLIC_URL` / `VITE_R2_PUBLIC_URL` first, then `.dev.vars`, then fallback ` /api/media/`. This ensures CI with secret produces correct `image_url` in `media_variants`.
- **Upload path:** `functions/api/photos/upload.js:39` `env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${r2_key}` : `/api/media/${r2_key}`` — verified.

## 4. Media URL Fallback

**Preserved and hardened:**

- `functions/api/media/[[path]].js` remains, returns `Cache-Control: public, max-age=31536000, immutable` + `ETag` + `Content-Type` via `writeHttpMetadata`. Tested live: `GET /api/media/photos/uncategorized/2026/<uuid>/original.jpg` → 200 47KB image/jpeg immutable (auth cookie present; public fetch via browser also 200, Python urllib blocked by cf bot challenge but browser/fetch with UA succeeds).
- `src/lib/image.js` priority now explicit:

```js
1. absolute http:// https:// → return as-is
2. r2Key + VITE_R2_PUBLIC_URL (if configured && https://) → `${cdn}/${r2Key}`
3. /api/media/{r2Key}
4. legacy /photos/ → /api/media/photos/... and / → as-is, else hero fallback
```

No hard-coded `images.muwanshots.com` in components; all via `resolveImageUrl` / `getPhotoImageUrl` / `getVariantSrcSet`.

- Validates no double slash: `replace(/\/$/, '')` + `replace(/^\//, '')`
- Tested both with and without `VITE_R2_PUBLIC_URL` (empty → fallback).

## 5. Processing Architecture

**Unchanged (intentionally Node+sharp, not Workers):**

- `scripts/optimize-upload.mjs` — Node, `sharp` `resize withoutEnlargement`, `webp quality 82 effort 4`, widths 480,768,1200,1600 only if `meta.width >= w`.
- Idempotent: `INSERT OR REPLACE media_variants (id=<photoId>-<variant>)`, safe to re-run.
- Concurrency: sequential per photo (`for w of WIDTHS`), low memory, not parallel.
- Failure handling: `updatePhotoStatus(..., 'failed', message)`, original retained, partial variants kept, retry via `POST /api/photos/retry`.

## 6. Automation Mechanism

**Investigation outcome:**

- **Option 1 — Cloudflare-native R2 Event Notifications / Queues:** Requires R2 Bucket Notification → Queue → Worker (paid, adds Workers, Queues, extra wiring, not in current wrangler.toml, would need new infrastructure). Verified not present, and would be over-engineering for <50 photos. Documented as not implemented; no unsupported APIs invented.
- **Chosen — Option 2 GitHub Actions improvement (low cost):**

```yaml
on:
  workflow_dispatch:
  schedule: '*/15 * * * *'  # every 15 min (was 6h)
  push:
    branches: [main]
    paths: [functions/api/photos/upload.js, functions/lib/r2.js, scripts/optimize-upload.mjs, ...]
concurrency: media-optimize (no parallel)
permissions: contents: read
jobs:
  optimize:
    if: pending != 0 (check via wrangler d1 execute SELECT COUNT(*) WHERE processing_status IN ('pending','failed'))
    then node scripts/optimize-upload.mjs --all-pending --remote (with R2_PUBLIC_URL secret)
```

- **Latency:** Previously up to 6h pending; now ≤15 min + push trigger. Still `scheduled` (not real-time), documented honestly.
- **Option 3 trigger endpoint:** Instead added lightweight authenticated `POST /api/photos/retry` (admin only) for failed→pending, rate-limited max 20 ids, does not expose R2 creds.

**Not added:** Cloudflare Queues, sharp in Workers, batch upload endpoint, paid image SaaS.

## 7. Processing Frequency / Latency

- **Before:** 6h cron only.
- **After:** 15m cron + push + manual dispatch. Typical pending→ready ≤15m, often faster if admin triggers dispatch. Live test: large 2000x1500 pending→processing→ready in ~30s via manual `node scripts/optimize-upload.mjs --photo-id <id> --remote`.

## 8. Retry Behavior

- New endpoint `POST /api/photos/retry` (`functions/api/photos/retry.js`):
  - Auth required (`requireAuth`), max 20 ids, only `failed` → `pending` (preserves ready variants via INSERT OR REPLACE).
  - Returns `{retried, skipped}`.
- Optimizer `--all-pending` only processes `pending`; failed must be retried via this endpoint (or manually SQL `UPDATE ... pending`). Tested: insert `failed` dummy → POST retry → 200 retried 1 → D1 now pending → cleanup.
- Original never deleted on failure; `processing_error` stored.

## 9. Cache Policy

- **R2 originals/variants via /api/media:** `public, max-age=31536000, immutable` + `ETag` (UUID keys never overwritten) — preserved.
- **Public API:** `GET /api/photos|categories|albums` (no `all`) → `public, max-age=60, s-maxage=300`; `?all=true` and mutations → `no-store` — preserved.
- **Health:** `no-store`.
- **PWA:** `public/sw.js` v6 never caches `/api/*` or `/admin/*`; gallery cache 80 LRU.
- Custom domain (when configured) will inherit R2 Cache Rules; still immutable.

## 10. Security Considerations

- No R2 keys/secrets sent to browser; only `image_url`/`r2_key` strings.
- Upload validates `ALLOWED_MIME` JPEG/PNG/WebP/AVIF, `MAX_FILE_SIZE 10MB`, `generateR2Key` sanitizes category `[^a-z0-9-]` and uses UUID folder, prevents `..`/`/` traversal (`^photos\/...`).
- `__Host-muwan_session` HttpOnly Secure SameSite Lax, 7d, `jose` HS256, `bcryptjs` 10 rounds, `is_active` check.
- GitHub Actions secrets not printed; `R2_PUBLIC_URL` passed as env, not logged.
- `POST /api/photos/retry` auth + 20 max, no arbitrary command.

## 11. Deployment Requirements

- `wrangler.toml` unchanged (DB + R2 bindings, `ENVIRONMENT=production`). Secrets via `wrangler pages secret put JWT_SECRET` (existing) and optionally `R2_PUBLIC_URL`.
- Build: `npm run build` → `dist` (verified 2191 modules, Photos 32.4k, index 442k).
- Deploy: `npx wrangler pages deploy dist --project-name muwanshots` (latest `e5a8e417` 2026-09-09).
- If custom domain ever added: `wrangler r2 bucket domain add ...` + `pages secret put R2_PUBLIC_URL`.

## 12. Remaining Limitations

- **Custom domain not active** — requires purchasing/configuring `muwanshots.com` zone; until then `/api/media` is primary (fully functional, just not CDN-optimal).
- **Automation is scheduled (15m), not real-time** — no R2 event trigger; admin can run `workflow_dispatch` or `node scripts/optimize-upload.mjs --all-pending --remote` for immediate.
- **Processing stuck in 'processing' if optimizer crashes mid-run** — `--all-pending` only picks `pending`; must manually reset that one id to `pending` or use retry (if failed) before re-run. Rare (network blip) and recoverable.
- Static fallback `src/content/gallery`/`public/images/gallery` retained (removal criteria not met: D1 0 real photos, need 6 categories +50 photos +1 week stable).

## Verification Checklist (2026-09-09 live)

- [x] R2 bucket exists (WEUR, 0 objects after cleanup, domain none)
- [x] R2 binding works (Pages Function R2.get/put/delete)
- [x] Custom domain status verified (NOT CONFIGURED via nslookup + wrangler domain list)
- [x] HTTPS verified (Pages https ok, /api/media immutable)
- [x] R2_PUBLIC_URL verified (not_configured fallback, health reports)
- [x] Upload API works (POST 201 pending, 5 photos tested)
- [x] Original media via /api/media 200 immutable
- [x] API media fallback works (unknown key 404, known 200)
- [x] Image URL resolver works (both with/without CDN)
- [x] Optimizer works (large 2000 →480/768/1200/1600+original, small 700→480+original, no-upscale)
- [x] Automation verified (15m schedule + push + dispatch, pending check skip)
- [x] Processing states pending→processing→ready, failed via retry endpoint
- [x] Retry works (failed→pending via POST /api/photos/retry)
- [x] Variants generated (480×5,768×4,1200×1,1600×1, original×5)
- [x] No-upscale works (700 skipped 768/1200/1600)
- [x] Public gallery works (GET /api/photos limit 20 total 0 after cleanup but previously 5)
- [x] Lightbox works (variants srcSet via getVariantSrcSet)
- [x] SEO sitemap 200 <url>, robots 200 Disallow /admin
- [x] Health DB ok storage ok media {pending:0 processing:0 failed:0 ready:5 total:5} -> after cleanup 0
- [x] Security verified (no secrets in bundle, mime/size/key checks)
- [x] Static fallback retained
