// Serves R2 objects for local development / fallback if no custom domain
// Real production should use R2 custom domain (R2_PUBLIC_URL) for direct CDN

export async function onRequestGet(context) {
  const { params, env } = context;
  if (!env.R2) {
    return new Response('R2 not configured', { status: 503 });
  }
  const path = params.path ? params.path.join('/') : '';
  const r2_key = path.startsWith('photos/') ? path : `photos/${path}`;

  try {
    const object = await env.R2.get(r2_key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (e) {
    console.error('R2 get error', e);
    return new Response('Internal server error', { status: 500 });
  }
}
