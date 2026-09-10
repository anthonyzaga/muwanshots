import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';
import * as bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    const currentPassword = body.currentPassword ? String(body.currentPassword) : null;
    const newPassword = body.newPassword ? String(body.newPassword) : null;
    const confirmPassword = body.confirmPassword ? String(body.confirmPassword) : null;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse('Current password, new password and confirm password are required', 400);
    }

    if (newPassword !== confirmPassword) {
      return errorResponse('New password and confirmation do not match', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse('New password must be at least 8 characters', 400);
    }
    if (newPassword.length > 128) {
      return errorResponse('New password too long (max 128)', 400);
    }
    if (newPassword === currentPassword) {
      return errorResponse('New password must be different from current password', 400);
    }

    const admin = await env.DB.prepare('SELECT id, password_hash FROM admins WHERE id = ?').bind(auth.admin.id).first();
    if (!admin) return errorResponse('Admin not found', 404);

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return errorResponse('Current password is incorrect', 401);
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await env.DB.prepare(
      `UPDATE admins SET password_hash = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    ).bind(newHash, admin.id).run();

    // Invalidate all sessions by clearing cookie (client will be required to re-login)
    const { clearSessionCookie } = await import('../../lib/auth.js');
    return jsonResponse(
      { success: true, message: 'Password updated. Please log in again.' },
      200,
      { 'Set-Cookie': clearSessionCookie() }
    );
  } catch (e) {
    console.error('Change password error', e);
    return errorResponse('Failed to change password', 500);
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
