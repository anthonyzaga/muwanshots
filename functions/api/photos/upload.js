import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';
import { validateFile, generateR2Key, ALLOWED_MIME } from '../../lib/r2.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) return errorResponse('Invalid form data', 400);

    const file = formData.get('file');
    const category = formData.get('category') ? String(formData.get('category')).trim() : 'uncategorized';
    const title = formData.get('title') ? String(formData.get('title')).trim() : null;
    const alt_text = formData.get('alt_text') ? String(formData.get('alt_text')).trim() : null;
    const category_id = formData.get('category_id') ? String(formData.get('category_id')) : null;

    if (!file || typeof file === 'string') return errorResponse('File is required', 400);

    const validationError = validateFile(file);
    if (validationError) return errorResponse(validationError, 400);

    const ext = ALLOWED_MIME[file.type] || 'webp';
    const id = crypto.randomUUID();
    const r2_key = generateR2Key(category, file.name, ext, id);

    if (!env.R2) {
      return errorResponse('R2 storage not configured — enable R2 in Cloudflare dashboard and create bucket muwanshots-media', 503);
    }

    // Store in R2 (original preserved)
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(r2_key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: file.name, uploadedBy: auth.admin.email },
    });

    const image_url = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${r2_key}` : `/api/media/${r2_key}`;
    // Create photo metadata in D1 as pending (Node pipeline will generate variants)
    await env.DB.prepare(
      `INSERT INTO photos (id, title, category_id, r2_key, image_url, alt_text, is_published, processing_status) VALUES (?, ?, ?, ?, ?, ?, 1, 'pending')`
    ).bind(id, title || file.name, category_id, r2_key, image_url, alt_text).run();

    const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();

    return jsonResponse({ photo, r2_key, image_url }, 201);
  } catch (e) {
    console.error('Upload error', e);
    return errorResponse('Upload failed: ' + (e.message || 'unknown'), 500);
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
