export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  const now = new Date().toISOString().split('T')[0];

  // Static routes
  const urls = [
    { loc: `${origin}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${origin}/gallery`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${origin}/services`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${origin}/about`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${origin}/contact`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${origin}/booking`, changefreq: 'monthly', priority: '0.8' },
  ];

  try {
    if (env.DB) {
      const cats = await env.DB.prepare("SELECT slug, updated_at FROM categories WHERE is_published = 1 ORDER BY sort_order ASC").all();
      for (const c of cats.results || []) {
        urls.push({ loc: `${origin}/gallery/${c.slug}`, changefreq: 'weekly', priority: '0.8', lastmod: c.updated_at?.split('T')[0] || now });
      }
      // Canonical album route is /gallery/:category/:album — resolve category for each album via first photo or album slug
      const albums = await env.DB.prepare(`
        SELECT a.slug as album_slug, a.updated_at, c.slug as category_slug
        FROM albums a
        LEFT JOIN album_photos ap ON ap.album_id = a.id
        LEFT JOIN photos p ON p.id = ap.photo_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE a.is_published = 1
        GROUP BY a.id
        ORDER BY a.sort_order ASC
      `).all();
      for (const a of albums.results || []) {
        const catSlug = a.category_slug || a.album_slug;
        // Only canonical: /gallery/:category/:album
        urls.push({ loc: `${origin}/gallery/${catSlug}/${a.album_slug}`, changefreq: 'weekly', priority: '0.7', lastmod: a.updated_at?.split('T')[0] || now });
      }
    }
  } catch (e) {
    console.error('sitemap DB error', e);
  }

  // Deduplicate and escape
  const seen = new Set();
  const deduped = [];
  for (const u of urls) {
    if (!seen.has(u.loc)) {
      seen.add(u.loc);
      deduped.push(u);
    }
  }

  function escapeXml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${deduped.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod || now)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export async function onRequestHead(context) {
  // HEAD should return same headers as GET without body, for Googlebot and curl -I
  const res = await onRequestGet(context);
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  });
}
