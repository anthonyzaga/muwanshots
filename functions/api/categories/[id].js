import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = params.id;
  try {
    // Try by id or slug
    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!category) return errorResponse('Category not found', 404);
    // Public should only see published unless admin
    if (!category.is_published) {
      // Check if request is admin — allow if authenticated
      const auth = await requireAuth(context.request, env);
      if (auth.error) return errorResponse('Not found', 404);
    }
    return jsonResponse({ category });
  } catch (e) {
    console.error('GET category error', e);
    return errorResponse('Failed to fetch category', 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  try {
    const existing = await env.DB.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!existing) return errorResponse('Category not found', 404);

    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    const name = body.name ? String(body.name).trim() : existing.name;
    const slug = body.slug ? slugify(body.slug) : body.name ? slugify(body.name) : existing.slug;
    const description = body.description !== undefined ? (body.description ? String(body.description).trim() : null) : existing.description;
    const cover_media_id = body.cover_media_id !== undefined ? (body.cover_media_id ? String(body.cover_media_id) : null) : existing.cover_media_id;
    const is_published = body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published;
    const sort_order = body.sort_order !== undefined && Number.isFinite(body.sort_order) ? Number(body.sort_order) : existing.sort_order;

    if (slug !== existing.slug) {
      const dup = await env.DB.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').bind(slug, existing.id).first();
      if (dup) return errorResponse('Slug already exists', 409);
    }

    await env.DB.prepare(
      `UPDATE categories SET name = ?, slug = ?, description = ?, cover_media_id = ?, is_published = ?, sort_order = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    ).bind(name, slug, description, cover_media_id, is_published, sort_order, existing.id).run();

    const updated = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(existing.id).first();
    return jsonResponse({ category: updated });
  } catch (e) {
    console.error('PUT category error', e);
    return errorResponse('Failed to update category', 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  const url = new URL(request.url);
  const reassignTo = url.searchParams.get('reassign_to');
  const force = url.searchParams.get('force') === 'true';

  try {
    const existing = await env.DB.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').bind(id, id).first();
    if (!existing) return errorResponse('Category not found', 404);

    const countResult = await env.DB.prepare('SELECT COUNT(*) as cnt FROM photos WHERE category_id = ?').bind(existing.id).first();
    const photoCount = countResult?.cnt || 0;

    if (photoCount > 0 && !force && !reassignTo) {
      return jsonResponse(
        {
          error: `Category contains ${photoCount} photo(s). Move photos to another category or add ?reassign_to=<category_id> or ?force=true to delete.`,
          photosCount: photoCount,
          code: 'CATEGORY_HAS_PHOTOS',
        },
        409
      );
    }

    if (photoCount > 0 && reassignTo) {
      const target = await env.DB.prepare('SELECT id FROM categories WHERE id = ? OR slug = ?').bind(reassignTo, reassignTo).first();
      if (!target) return errorResponse('Reassign target category not found', 400);
      if (target.id === existing.id) return errorResponse('Cannot reassign to same category', 400);
      await env.DB.prepare('UPDATE photos SET category_id = ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\') WHERE category_id = ?').bind(target.id, existing.id).run();
    } else if (photoCount > 0 && force) {
      await env.DB.prepare('UPDATE photos SET category_id = NULL, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\') WHERE category_id = ?').bind(existing.id).run();
    }

    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(existing.id).run();
    return jsonResponse({ success: true, reassigned: photoCount });
  } catch (e) {
    console.error('DELETE category error', e);
    return errorResponse('Failed to delete category', 500);
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
