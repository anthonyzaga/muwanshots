import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return errorResponse('ids array is required', 400);
    }
    const ids = body.ids.map(String);
    const action = String(body.action || '').toLowerCase();

    if (!['publish', 'unpublish', 'feature', 'unfeature', 'delete'].includes(action)) {
      return errorResponse('Invalid action. Use publish, unpublish, feature, unfeature, delete', 400);
    }

    if (ids.length > 50) return errorResponse('Too many ids (max 50)', 400);

    if (action === 'delete') {
      // Check if any photo is used as cover for category/album or hero/OG before deleting
      const placeholders = ids.map(() => '?').join(',');
      const usedCheck = await env.DB.prepare(
        `SELECT 'category' as type, c.id, c.name FROM categories c WHERE c.cover_media_id IN (${placeholders})
         UNION ALL SELECT 'album' as type, a.id, a.name FROM albums a WHERE a.cover_media_id IN (${placeholders})
         UNION ALL SELECT 'setting' as type, s.setting_key as id, s.setting_value as name FROM site_settings s WHERE s.setting_key IN ('hero_image','og_image') AND s.setting_value IN (SELECT image_url FROM photos WHERE id IN (${placeholders}))`
      ).bind(...ids, ...ids, ...ids).all();
      if (usedCheck.results && usedCheck.results.length > 0) {
        return errorResponse(`Cannot delete — ${usedCheck.results.length} photo(s) currently used as cover (e.g., ${usedCheck.results[0].type}:${usedCheck.results[0].id}). Change cover first.`, 409);
      }
      // Delete R2 originals + variants, then DB (no orphaned files)
      const photos = await env.DB.prepare(`SELECT id, r2_key FROM photos WHERE id IN (${placeholders})`).bind(...ids).all();
      for (const photo of photos.results || []) {
        try {
          if (photo.r2_key && env.R2) await env.R2.delete(photo.r2_key).catch((_e) => { void _e; });
          const variants = await env.DB.prepare('SELECT r2_key FROM media_variants WHERE photo_id = ?').bind(photo.id).all();
          for (const v of variants.results || []) {
            try { await env.R2.delete(v.r2_key); } catch (_e) { void _e; }
          }
        } catch (_e) {
          console.warn('Bulk R2 delete failed', photo.r2_key, String(_e));
        }
      }
      await env.DB.prepare(`DELETE FROM photos WHERE id IN (${placeholders})`).bind(...ids).run();
      return jsonResponse({ success: true, deleted: ids.length });
    }

    let field, value;
    if (action === 'publish') { field = 'is_published'; value = 1; }
    else if (action === 'unpublish') { field = 'is_published'; value = 0; }
    else if (action === 'feature') { field = 'is_featured'; value = 1; }
    else if (action === 'unfeature') { field = 'is_featured'; value = 0; }

    const placeholders = ids.map(() => '?').join(',');
    await env.DB.prepare(`UPDATE photos SET ${field} = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id IN (${placeholders})`).bind(value, ...ids).run();

    return jsonResponse({ success: true, updated: ids.length, action });
  } catch (e) {
    console.error('Bulk photos error', e);
    return errorResponse('Bulk operation failed', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
