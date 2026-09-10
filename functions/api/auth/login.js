import { verifyPassword, signSession, setSessionCookie, checkRateLimit, jsonResponse, errorResponse } from '../../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!checkRateLimit(request)) {
      return errorResponse('Too many login attempts, please try again later', 429);
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.email || !body.password) {
      return errorResponse('Email and password are required', 400);
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    // Basic validation
    if (!email.includes('@') || password.length < 6) {
      return errorResponse('Invalid credentials', 401);
    }

    const admin = await env.DB.prepare('SELECT id, email, password_hash, name, is_active FROM admins WHERE email = ?').bind(email).first();

    if (!admin) {
      return errorResponse('Invalid credentials', 401);
    }

    if (!admin.is_active) {
      return errorResponse('Account is disabled', 403);
    }

    const valid = await verifyPassword(password, admin.password_hash);
    if (!valid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Update last_login_at
    await env.DB.prepare("UPDATE admins SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").bind(admin.id).run();

    const token = await signSession({ sub: admin.id, email: admin.email, name: admin.name }, env, '7d');

    const isSecure = new URL(request.url).protocol === 'https:' || env.ENVIRONMENT === 'production';

    return jsonResponse(
      { success: true, admin: { id: admin.id, email: admin.email, name: admin.name } },
      200,
      { 'Set-Cookie': setSessionCookie(token, { isSecure }) }
    );
  } catch (err) {
    console.error('login error', err);
    return errorResponse('Internal server error', 500);
  }
}

// Allow CORS preflight if needed (Pages handles CORS via _headers, but add here for safety)
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
