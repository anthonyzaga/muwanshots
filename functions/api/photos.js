import { requireAuth, jsonResponse, errorResponse } from '../lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category'); // slug
  const featured = url.searchParams.get('featured');
  const album = url.searchParams.get('album'); // slug
  const search = url.searchParams.get('search'); // search title/description/alt_text
  const all = url.searchParams.get('all') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  // If requesting all (including unpublished) require auth
  if (all) {
    const auth = await requireAuth(request, env);
    if (auth.error) return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    let query = `
      SELECT p.*, c.slug as category_slug, c.name as category_name
      FROM photos p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (!all) {
      conditions.push('p.is_published = 1');
    }

    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }

    if (featured === 'true') {
      conditions.push('p.is_featured = 1');
    }

    if (search) {
      const like = `%${search.trim()}%`;
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.alt_text LIKE ?)');
      params.push(like, like, like);
    }

    if (album) {
      // Join album_photos
      query = `
        SELECT p.*, c.slug as category_slug, c.name as category_name
        FROM photos p
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN album_photos ap ON ap.photo_id = p.id
        JOIN albums a ON a.id = ap.album_id
      `;
      // Need to re-apply conditions after rewriting query
      const albumConditions = [];
      if (!all) albumConditions.push('p.is_published = 1');
      if (category) albumConditions.push('c.slug = ?');
      if (featured === 'true') albumConditions.push('p.is_featured = 1');
      if (search) {
        albumConditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.alt_text LIKE ?)');
        // Rebuild params for album case to match condition order
        params.length = 0;
        if (category) params.push(category);
        const likeSearch = `%${search.trim()}%`;
        params.push(likeSearch, likeSearch, likeSearch);
      }
      albumConditions.push('a.slug = ?');
      params.push(album);
      if (albumConditions.length) query += ' WHERE ' + albumConditions.join(' AND ');
    } else {
      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.sort_order ASC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await env.DB.prepare(query).bind(...params).all();
    // Attach variants for each photo (if any)
    let photosWithVariants = result.results || [];
    if (photosWithVariants.length > 0) {
      const ids = photosWithVariants.map(p => p.id);
      const placeholders = ids.map(() => '?').join(',');
      const variantsRes = await env.DB.prepare(`SELECT * FROM media_variants WHERE photo_id IN (${placeholders})`).bind(...ids).all();
      const variantsByPhoto = {};
      for (const v of variantsRes.results || []) {
        if (!variantsByPhoto[v.photo_id]) variantsByPhoto[v.photo_id] = [];
        variantsByPhoto[v.photo_id].push(v);
      }
      photosWithVariants = photosWithVariants.map(p => {
        const variants = variantsByPhoto[p.id] || [];
        // Build variants map for frontend: { "480": url, "768": url, ... , original: url }
        const variantsMap = {};
        let width = p.width;
        let height = p.height;
        for (const v of variants) {
          variantsMap[v.variant_name] = v.image_url;
          // Use largest variant dimensions as fallback if photo width/height missing
          if (!width && v.variant_name === 'original') { width = v.width; height = v.height; }
        }
        // Fallback to single image_url if no variants yet (pending)
        if (Object.keys(variantsMap).length === 0) {
          variantsMap['original'] = p.image_url;
        }
        return {
          ...p,
          width: width || p.width || null,
          height: height || p.height || null,
          variants: variantsMap,
          variants_list: variants,
          // For backward compat, also expose image_url as src
        };
      });
    }

    // Also get total count for pagination (without limit/offset)
    let countQuery = 'SELECT COUNT(*) as total FROM photos p LEFT JOIN categories c ON p.category_id = c.id';
    if (album) {
      countQuery = 'SELECT COUNT(*) as total FROM photos p LEFT JOIN categories c ON p.category_id = c.id JOIN album_photos ap ON ap.photo_id = p.id JOIN albums a ON a.id = ap.album_id';
    }
    const countConditions = [];
    const countParams = [];
    if (!all) countConditions.push('p.is_published = 1');
    if (category) { countConditions.push('c.slug = ?'); countParams.push(category); }
    if (featured === 'true') countConditions.push('p.is_featured = 1');
    if (search) {
      countConditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.alt_text LIKE ?)');
      const like = `%${search.trim()}%`;
      countParams.push(like, like, like);
    }
    if (album) { countConditions.push('a.slug = ?'); countParams.push(album); }
    if (countConditions.length) countQuery += ' WHERE ' + countConditions.join(' AND ');
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

    const headers = {};
    if (!all) {
      headers['Cache-Control'] = 'public, max-age=60, s-maxage=300';
    } else {
      headers['Cache-Control'] = 'no-store';
    }
    return jsonResponse({ photos: photosWithVariants, total: countResult?.total || 0, limit, offset }, 200, headers);
  } catch (e) {
    console.error('GET photos error', e);
    return errorResponse('Failed to fetch photos', 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.r2_key || !body.image_url) {
      return errorResponse('r2_key and image_url are required', 400);
    }

    const id = body.id ? String(body.id) : crypto.randomUUID();
    const title = body.title ? String(body.title).trim() : null;
    const description = body.description ? String(body.description).trim() : null;
    const category_id = body.category_id ? String(body.category_id) : null;
    const r2_key = String(body.r2_key).trim();
    const image_url = String(body.image_url).trim();
    const alt_text = body.alt_text ? String(body.alt_text).trim() : null;
    const is_published = body.is_published != null ? (body.is_published ? 1 : 0) : 1;
    const is_featured = body.is_featured ? 1 : 0;
    const sort_order = Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0;

    // Validate R2 key safety: no .., no leading /, only safe chars
    if (r2_key.includes('..') || r2_key.startsWith('/') || !/^photos\/[a-z0-9_\-/]+\.[a-z0-9]+$/i.test(r2_key)) {
      return errorResponse('Invalid r2_key format. Use photos/<category>/...', 400);
    }

    // Validate category exists if provided
    if (category_id) {
      const cat = await env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(category_id).first();
      if (!cat) return errorResponse('Category not found', 400);
    }

    await env.DB.prepare(
      `INSERT INTO photos (id, title, description, category_id, r2_key, image_url, alt_text, is_published, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, title, description, category_id, r2_key, image_url, alt_text, is_published, is_featured, sort_order).run();

    const created = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
    return jsonResponse({ photo: created }, 201);
  } catch (e) {
    console.error('POST photos error', e);
    return errorResponse('Failed to create photo', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
