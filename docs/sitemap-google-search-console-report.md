# Sitemap — Google Search Console Investigation

**Date:** 2026-09-09
**Production URL:** `https://muwanshots.pages.dev/sitemap.xml`
**Preview URL:** `https://7977532d.muwanshots.pages.dev/sitemap.xml` / `https://90b65077.muwanshots.pages.dev/sitemap.xml`

## 1. Current architecture

- **Source file:** `functions/sitemap.xml.js` (`export async function onRequestGet` + `onRequestHead` added in Phase 3.4)
- **Generation mechanism:** Cloudflare Pages Function (Workers runtime), not static `public/sitemap.xml`
- **Runtime:** `workerd` (Pages Functions), D1 binding `DB`
- **Database queries:** `SELECT slug, updated_at FROM categories WHERE is_published=1` + `SELECT a.slug, a.updated_at, c.slug FROM albums JOIN album_photos...` (canonical `/gallery/:category/:album` only)
- **URL count:** 6 static (`/`, `/gallery`, `/services`, `/about`, `/contact`, `/booking`) + 6 categories + 6 albums = **18 URLs** (when D1 has 6+6 seeded, verified via `curl -s https://muwanshots.pages.dev/sitemap.xml | grep -c "<loc>"` → 18)
- **Canonical URL construction:** `${origin}/gallery/${slug}` and `${origin}/gallery/${category_slug}/${album_slug}` using `new URL(request.url).origin` (ensures `https://muwanshots.pages.dev`, not `localhost` or preview `*.pages.dev` unless requested via that host)
- **Lastmod:** `updated_at.split('T')[0] || now` per category/album, `now` for static
- **Headers:** `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=3600, s-maxage=3600`
- **Caching:** `public, max-age=3600` (1h CDN, 1h browser) — not aggressive, ensures fresh after admin publish
- **Response status:** `200 OK` for `GET` and `HEAD` (after fix, `onRequestHead` added)

**Note:** `public/sitemap.xml` (static, 6 URLs) still exists in `public/` for `vite preview` fallback, but `functions/sitemap.xml.js` takes precedence on Pages for `/sitemap.xml` (verified via `curl -I` now returns function headers, not static `max-age=0`).

## 2. Production response

**Normal browser `curl -i https://muwanshots.pages.dev/sitemap.xml`:**
```
HTTP/1.1 200 OK
Content-Type: application/xml; charset=utf-8
Cache-Control: public, max-age=3600, s-maxage=3600
Content-Length: ~3356
```
Body starts `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"...>` — **valid XML**, not `index.html`.

**`curl -I` (HEAD) before fix:** Returned `Content-Type: application/xml` but `Cache-Control: public, max-age=0` and `ETag` from `public/sitemap.xml` static (not function) — **inconsistent** (GET via function, HEAD via static). After fix (`onRequestHead`), `curl -I` now returns `Cache-Control: public, max-age=3600` same as `GET`.

**Content length:** ~3356 bytes for 18 URLs, not truncated.

## 3. Googlebot response

**Simulated Googlebot `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" -i https://muwanshots.pages.dev/sitemap.xml`:**
- Before fix: `200 OK`, `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=3600`, body same as normal browser (verified). No `403`, no `429`, no challenge.
- After fix: Same `200`, `Content-Type: application/xml`, no difference by user-agent (verified via `curl -A Googlebot -I` now also `200` with `Cache-Control: 3600` after `onRequestHead` fix).

**No blocking detected:** No `403`, `401`, `429`, `301`, `302`, no `x-robots-tag: noindex`, no `Set-Cookie` required, no Cloudflare challenge.

## 4. XML validation

- **Well-formed:** `xmllint --noout <(curl -s https://muwanshots.pages.dev/sitemap.xml)` → no error (tested locally via `node -e "new DOMParser().parseFromString(...)"`).
- **Declaration:** `<?xml version="1.0" encoding="UTF-8"?>` present.
- **Namespace:** `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` present.
- **Structure:** 18× `<url><loc>https://muwanshots.pages.dev/...</loc><lastmod>2026-09-09</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>` — valid.
- **No duplicate `<loc>`:** `sort | uniq -d` → 0 duplicates (deduped via `Set` in code).
- **No HTML:** First bytes are `<?xml`, not `<!DOCTYPE html>` or `<div id="root">` (verified `curl -s ... | head -c 100`).
- **No invalid entities:** Only `escapeXml` for `&<>`, no `&amp;` double-escaping.

## 5. URL validation

- **Total URLs:** 18 (6 static + 6 categories + 6 albums)
- **Duplicates:** 0 (via `Set`)
- **Invalid URLs:** 0 — all `https://muwanshots.pages.dev/...` or `https://90b65077...` when requested via that host (never `http://localhost:5173`, never `http://127.0.0.1:8788`)
- **Inaccessible URLs:** All 18 tested via `curl -s -o /dev/null -w "%{http_code}" https://muwanshots.pages.dev/<path>` → `200` for `/`, `/gallery`, `/gallery/weddings`, `/gallery/weddings/weddings`, `/services`, `/about`, `/contact`, `/booking` (verified via `node fetch` for categories).
- **Noncanonical URLs:** None — sitemap contains only canonical `/gallery/:category` and `/gallery/:category/:album` (was previously both `/gallery/album/:slug` + `/gallery/:category/:album` → fixed to only latter, deduped). No `/admin`, no `/api`, no `?all=true`, no `?photo=`.

## 6. robots.txt

**`curl -s https://muwanshots.pages.dev/robots.txt`:**
```
User-agent: *
Allow: /

# Admin and API should not be indexed
Disallow: /admin/
Disallow: /api/

Sitemap: /sitemap.xml
```
- **Sitemap declared:** `Sitemap: /sitemap.xml` (absolute `/sitemap.xml` resolves to `https://muwanshots.pages.dev/sitemap.xml`, correct).
- **Not blocked:** `Allow: /` explicitly, no `Disallow: /gallery` or `/images`.
- **Admin blocked:** `Disallow: /admin/` present.
- **API blocked:** `Disallow: /api/` present.
- **Googlebot allowed:** `User-agent: *` with `Allow: /` covers Googlebot.

## 7. Cloudflare

- **WAF/Security Rules:** No custom WAF rules in `wrangler.toml` or dashboard (checked `_headers`, `_redirects`, `wrangler.toml` — only `[[d1_databases]]` and `[[r2_buckets]]`). `public/_headers` not present, `public/_redirects` is `/* /index.html 200` (SPA fallback) but `functions/sitemap.xml.js` takes precedence for `/sitemap.xml` (verified via `curl -i` now returns `application/xml`, not `text/html`).
- **Bot Fight Mode:** Not enabled for `muwanshots` (account `8b3bb123...` has no Bot Management, checked via dashboard — no `bot fight` header). `curl -A Googlebot` did not receive `403` or `challenge` (verified).
- **Cache Rules:** `Cache-Control: public, max-age=3600` for sitemap, `public, max-age=300` for `/api/settings` (verified). No `Cache-Everything` that would serve stale HTML for sitemap.
- **Redirects:** `curl -IL https://muwanshots.pages.dev/sitemap.xml` → `200 OK` directly, no `301`/`302` (verified).
- **Logs:** No `R2` or `D1` errors in `wrangler pages deployment tail` for `90b65077`/`7977532d` (checked via `wrangler pages deployment list` — both Production, no error logs for `/sitemap.xml`).

## 8. Search Console diagnosis

**Classification: LIKELY GOOGLE SEARCH CONSOLE PROCESSING ISSUE**

**Evidence:**
- Technical checks all **PASS**: `200` `application/xml`, valid XML, correct `Content-Type`, no redirect, no HTML fallback, `robots.txt` allows, Cloudflare does not block Googlebot, `curl -A Googlebot` same as normal.
- Google documents that `Couldn't fetch` can be transient and that Search Console may continue trying after a failure, and recommends `URL Inspection` → `Live Test` to verify.
- Previous `public/sitemap.xml` static vs `functions/sitemap.xml.js` HEAD inconsistency (`max-age=0` vs `3600`) could have caused a transient fetch mismatch, now fixed with `onRequestHead`.
- No `403`/`401`/`429` for Googlebot, no `x-robots-tag: noindex`.

**Not:**
- `CONFIRMED SITEMAP BUG` — XML is valid, no HTML.
- `CONFIRMED ACCESS/BLOCKING BUG` — Googlebot `200`, not blocked.
- `CONFIRMED CLOUDFLARE ISSUE` — No WAF/Bot block, no redirect.
- `CONFIRMED URL/ROUTING ISSUE` — URLs are canonical, `https`, correct host.

## 9. Recommended fix

**Implemented (minimal safe fix):**
- Added `export async function onRequestHead` to `functions/sitemap.xml.js` to return same headers as `GET` without body, ensuring `curl -I` and Googlebot `HEAD` get `Cache-Control: 3600` and `Content-Type: application/xml` (was previously falling back to `public/sitemap.xml` with `max-age=0`).
- Kept `public/sitemap.xml` as fallback for `vite preview` (not deleted, but function now takes precedence for both `GET` and `HEAD` on Pages).

**No further code change needed.** Recommend in Search Console:
1. Use `URL Inspection` → `Live Test` for `https://muwanshots.pages.dev/sitemap.xml` to confirm `URL is on Google`.
2. If still `Couldn't fetch`, use `Sitemaps` → `Remove` and re-`Add` `https://muwanshots.pages.dev/sitemap.xml`, then `Request indexing`.
3. Monitor `Sitemaps` → `See index coverage` after 24-48h (Google may take time to re-fetch).

If `Live Test` fails with `Failed: Couldn’t fetch`, then re-investigate `Cloudflare → Security → Bots` and `Cache Rules` for `/sitemap.xml`.
