import { requireAuth, jsonResponse, errorResponse } from '../lib/auth.js';

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const all = url.searchParams.get('all') === 'true';
  if (all) {
    const auth = await requireAuth(request, env);
    if (auth.error) return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  try {
    let query = 'SELECT * FROM albums';
    if (!all) query += ' WHERE is_published = 1';
    query += ' ORDER BY sort_order ASC, created_at ASC';
    const result = await env.DB.prepare(query).all();
    const headers = {};
    if (!all) headers['Cache-Control'] = 'public, max-age=60, s-maxage=300';
    else headers['Cache-Control'] = 'no-store';
    return jsonResponse({ albums: result.results || [] }, 200, headers);
  } catch (e) {
    console.error('GET albums error', e);
    return errorResponse('Failed to fetch albums', 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name) return errorResponse('Name is required', 400);
    const name = String(body.name).trim();
    const slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) return errorResponse('Invalid slug', 400);

    const description = body.description ? String(body.description).trim() : null;
    const cover_media_id = body.cover_media_id ? String(body.cover_media_id) : null;
    const is_published = body.is_published != null ? (body.is_published ? 1 : 0) : 1;
    const sort_order = Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0;
    const id = body.id ? String(body.id) : crypto.randomUUID();

    const existing = await env.DB.prepare('SELECT id FROM albums WHERE slug = ?').bind(slug).first();
    if (existing) return errorResponse('Slug already exists', 409);

    await env.DB.prepare(
      `INSERT INTO albums (id, name, slug, description, cover_media_id, is_published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, name, slug, description, cover_media_id, is_published, sort_order).run();

    // Handle album_photos if provided (array of photo_ids)
    if (Array.isArray(body.photo_ids) && body.photo_ids.length) {
      for (let i = 0; i < body.photo_ids.length; i++) {
        const photo_id = String(body.photo_ids[i]);
        await env.DB.prepare('INSERT OR IGNORE INTO album_photos (album_id, photo_id, sort_order) VALUES (?, ?, ?)').bind(id, photo_id, i).run();
      }
    }

    const created = await env.DB.prepare('SELECT * FROM albums WHERE id = ?').bind(id).first();
    return jsonResponse({ album: created }, 201);
  } catch (e) {
    console.error('POST albums error', e);
    return errorResponse('Failed to create album', 500);
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
