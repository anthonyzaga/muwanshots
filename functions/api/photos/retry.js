import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

// POST /api/photos/retry
// Body: { id: "<photoId>" } or { ids: ["<photoId>", ...] }
// Only allows retry when processing_status = 'failed' -> sets to 'pending' for next optimizer run
// Strictly authenticated, rate-limited via is_active check + max 20 ids per call

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    let ids = [];
    if (body.id) ids = [String(body.id)];
    else if (Array.isArray(body.ids)) ids = body.ids.map(String);
    else if (body.photoId) ids = [String(body.photoId)];

    if (ids.length === 0) return errorResponse('id or ids required', 400);
    if (ids.length > 20) return errorResponse('Too many ids (max 20)', 400);

    // Only allow failed -> pending; preserve successful variants (idempotency)
    const placeholders = ids.map(() => '?').join(',');
    const photos = await env.DB.prepare(
      `SELECT id, processing_status, processing_error FROM photos WHERE id IN (${placeholders})`
    ).bind(...ids).all();

    if (!photos.results || photos.results.length === 0) return errorResponse('Photo not found', 404);
    // Check all are failed
    const failedIds = photos.results.filter(p => p.processing_status === 'failed').map(p => p.id);
    const notFailed = photos.results.filter(p => p.processing_status !== 'failed');
    if (failedIds.length === 0) {
      return errorResponse(`No failed photos to retry. Statuses: ${photos.results.map(p => `${p.id.slice(0,8)}=${p.processing_status}`).join(', ')}`, 400);
    }

    const failedPlaceholders = failedIds.map(() => '?').join(',');
    await env.DB.prepare(
      `UPDATE photos SET processing_status = 'pending', processing_error = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id IN (${failedPlaceholders})`
    ).bind(...failedIds).run();

    return jsonResponse({ success: true, retried: failedIds.length, ids: failedIds, skipped: notFailed.length });
  } catch (e) {
    console.error('Retry error', e);
    return errorResponse('Retry failed', 500);
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
