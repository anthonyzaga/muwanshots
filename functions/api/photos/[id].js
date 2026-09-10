import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const id = params.id;
  try {
    const photo = await env.DB.prepare('SELECT p.*, c.slug as category_slug FROM photos p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').bind(id).first();
    if (!photo) return errorResponse('Photo not found', 404);
    if (!photo.is_published) {
      const auth = await requireAuth(request, env);
      if (auth.error) return errorResponse('Not found', 404);
    }
    // Fetch variants
    const variantsRes = await env.DB.prepare('SELECT * FROM media_variants WHERE photo_id = ?').bind(id).all();
    const variants = {};
    for (const v of variantsRes.results || []) {
      variants[v.variant_name] = v.image_url;
    }
    if (Object.keys(variants).length === 0) variants['original'] = photo.image_url;
    return jsonResponse({ photo: { ...photo, variants, variants_list: variantsRes.results || [] } });
  } catch (e) {
    console.error('GET photo error', e);
    return errorResponse('Failed to fetch photo', 500);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  try {
    const existing = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
    if (!existing) return errorResponse('Photo not found', 404);

    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    const title = body.title !== undefined ? (body.title ? String(body.title).trim() : null) : existing.title;
    const description = body.description !== undefined ? (body.description ? String(body.description).trim() : null) : existing.description;
    const category_id = body.category_id !== undefined ? (body.category_id ? String(body.category_id) : null) : existing.category_id;
    const r2_key = body.r2_key !== undefined ? String(body.r2_key).trim() : existing.r2_key;
    const image_url = body.image_url !== undefined ? String(body.image_url).trim() : existing.image_url;
    const alt_text = body.alt_text !== undefined ? (body.alt_text ? String(body.alt_text).trim() : null) : existing.alt_text;
    const is_published = body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published;
    const is_featured = body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : existing.is_featured;
    const sort_order = body.sort_order !== undefined && Number.isFinite(body.sort_order) ? Number(body.sort_order) : existing.sort_order;

    if (category_id) {
      const cat = await env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(category_id).first();
      if (!cat) return errorResponse('Category not found', 400);
    }

    await env.DB.prepare(
      `UPDATE photos SET title = ?, description = ?, category_id = ?, r2_key = ?, image_url = ?, alt_text = ?, is_published = ?, is_featured = ?, sort_order = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    ).bind(title, description, category_id, r2_key, image_url, alt_text, is_published, is_featured, sort_order, id).run();

    const updated = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
    return jsonResponse({ photo: updated });
  } catch (e) {
    console.error('PUT photo error', e);
    return errorResponse('Failed to update photo', 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  const id = params.id;
  try {
    const existing = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
    if (!existing) return errorResponse('Photo not found', 404);

    // Prevent deleting a photo currently used as hero/OG or category/album cover
    const usedAsCover = await env.DB.prepare(
      `SELECT 'category' as type, id, name FROM categories WHERE cover_media_id = ?
       UNION ALL SELECT 'album' as type, id, name FROM albums WHERE cover_media_id = ?
       UNION ALL SELECT 'setting' as type, setting_key as id, setting_value as name FROM site_settings WHERE setting_key IN ('hero_image','og_image') AND setting_value = ?`
    ).bind(id, id, existing.image_url).all();
    if (usedAsCover.results && usedAsCover.results.length > 0) {
      const uses = usedAsCover.results.map(r => `${r.type}:${r.id}`).join(', ');
      return errorResponse(`Cannot delete — photo is currently used as cover for ${uses}. Change cover first.`, 409);
    }

    // Delete from R2 (original + all variants) then DB
    try {
      if (env.R2) {
        if (existing.r2_key) await env.R2.delete(existing.r2_key).catch((_e) => { void _e; });
        // Delete variants
        const variants = await env.DB.prepare('SELECT r2_key FROM media_variants WHERE photo_id = ?').bind(id).all();
        for (const v of variants.results || []) {
          try { await env.R2.delete(v.r2_key); } catch (_e) { void _e; }
        }
        const prefix = existing.r2_key ? existing.r2_key.replace(/\/[^/]+$/, '') : null;
        if (prefix && prefix !== existing.r2_key) {
          try {
            const listed = await env.R2.list({ prefix: `${prefix}/${id}/` });
            for (const obj of listed.objects || []) {
              await env.R2.delete(obj.key);
            }
          } catch (_e) { void _e; }
        }
      }
    } catch (_r2Err) {
      console.warn('R2 delete failed for', existing.r2_key, _r2Err);
    }

    await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true });
  } catch (e) {
    console.error('DELETE photo error', e);
    return errorResponse('Failed to delete photo', 500);
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
