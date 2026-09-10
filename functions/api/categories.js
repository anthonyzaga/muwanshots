import { requireAuth, jsonResponse, errorResponse } from '../lib/auth.js';

function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const includeUnpublished = url.searchParams.get('all') === 'true';

  if (includeUnpublished) {
    const auth = await requireAuth(request, env);
    if (auth.error) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  try {
    let query = 'SELECT id, name, slug, description, cover_media_id, is_published, sort_order, created_at, updated_at FROM categories';
    if (!includeUnpublished) {
      query += ' WHERE is_published = 1';
    }
    query += ' ORDER BY sort_order ASC, created_at ASC';

    const result = await env.DB.prepare(query).all();
    const headers = {};
    if (!includeUnpublished) {
      headers['Cache-Control'] = 'public, max-age=60, s-maxage=300';
    } else {
      headers['Cache-Control'] = 'no-store';
    }
    return jsonResponse({ categories: result.results || [] }, 200, headers);
  } catch (e) {
    console.error('GET categories error', e);
    return errorResponse('Failed to fetch categories', 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name) {
      return errorResponse('Name is required', 400);
    }
    const name = String(body.name).trim();
    if (name.length < 2) return errorResponse('Name must be at least 2 characters', 400);

    const slug = body.slug ? slugify(body.slug) : slugify(name);
    if (!slug) return errorResponse('Invalid slug', 400);

    const description = body.description ? String(body.description).trim() : null;
    const cover_media_id = body.cover_media_id ? String(body.cover_media_id) : null;
    const is_published = body.is_published != null ? (body.is_published ? 1 : 0) : 1;
    const sort_order = Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0;
    const id = body.id ? String(body.id) : crypto.randomUUID();

    // Check slug uniqueness
    const existing = await env.DB.prepare('SELECT id FROM categories WHERE slug = ?').bind(slug).first();
    if (existing) {
      return errorResponse('Slug already exists', 409);
    }

    await env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, cover_media_id, is_published, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, name, slug, description, cover_media_id, is_published, sort_order).run();

    const created = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    return jsonResponse({ category: created }, 201);
  } catch (e) {
    console.error('POST categories error', e);
    return errorResponse('Failed to create category', 500);
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
