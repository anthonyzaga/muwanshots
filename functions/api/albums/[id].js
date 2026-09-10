import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = params.id;
  try {
    const album = await env.DB.prepare('SELECT * FROM albums WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!album) return errorResponse('Album not found', 404);
    if (!album.is_published) {
      const auth = await requireAuth(request, env);
      if (auth.error) return errorResponse('Not found', 404);
    }
    // Fetch photos in album
    const photos = await env.DB.prepare(
      `SELECT p.*, ap.sort_order as album_sort_order FROM photos p JOIN album_photos ap ON ap.photo_id = p.id WHERE ap.album_id = ? ORDER BY ap.sort_order ASC`
    ).bind(album.id).all();

    return jsonResponse({ album, photos: photos.results || [] });
  } catch (e) {
    console.error('GET album error', e);
    return errorResponse('Failed to fetch album', 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  try {
    const existing = await env.DB.prepare('SELECT * FROM albums WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!existing) return errorResponse('Album not found', 404);

    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    const name = body.name ? String(body.name).trim() : existing.name;
    const slug = body.slug ? slugify(body.slug) : body.name ? slugify(body.name) : existing.slug;
    const description = body.description !== undefined ? (body.description ? String(body.description).trim() : null) : existing.description;
    const cover_media_id = body.cover_media_id !== undefined ? (body.cover_media_id ? String(body.cover_media_id) : null) : existing.cover_media_id;
    const is_published = body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published;
    const sort_order = body.sort_order !== undefined && Number.isFinite(body.sort_order) ? Number(body.sort_order) : existing.sort_order;

    if (slug !== existing.slug) {
      const dup = await env.DB.prepare('SELECT id FROM albums WHERE slug = ? AND id != ?').bind(slug, existing.id).first();
      if (dup) return errorResponse('Slug already exists', 409);
    }

    await env.DB.prepare(
      `UPDATE albums SET name = ?, slug = ?, description = ?, cover_media_id = ?, is_published = ?, sort_order = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    ).bind(name, slug, description, cover_media_id, is_published, sort_order, existing.id).run();

    // Update album_photos if photo_ids provided
    if (Array.isArray(body.photo_ids)) {
      await env.DB.prepare('DELETE FROM album_photos WHERE album_id = ?').bind(existing.id).run();
      for (let i = 0; i < body.photo_ids.length; i++) {
        const photo_id = String(body.photo_ids[i]);
        await env.DB.prepare('INSERT OR IGNORE INTO album_photos (album_id, photo_id, sort_order) VALUES (?, ?, ?)').bind(existing.id, photo_id, i).run();
      }
    }

    const updated = await env.DB.prepare('SELECT * FROM albums WHERE id = ?').bind(existing.id).first();
    return jsonResponse({ album: updated });
  } catch (e) {
    console.error('PUT album error', e);
    return errorResponse('Failed to update album', 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  try {
    const existing = await env.DB.prepare('SELECT * FROM albums WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!existing) return errorResponse('Album not found', 404);
    await env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(existing.id).run();
    return jsonResponse({ success: true });
  } catch (e) {
    console.error('DELETE album error', e);
    return errorResponse('Failed to delete album', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
