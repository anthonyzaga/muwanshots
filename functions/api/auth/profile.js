import { requireAuth, jsonResponse, errorResponse } from '../../lib/auth.js';

export async function onRequestPut(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Invalid JSON', 400);

    const currentPassword = body.currentPassword ? String(body.currentPassword) : null;
    const newEmailRaw = body.newEmail ? String(body.newEmail).trim().toLowerCase() : null;
    const newNameRaw = body.newName ? String(body.newName).trim() : null;

    // At least one field to update
    if (!newEmailRaw && !newNameRaw) {
      return errorResponse('No changes provided (newEmail or newName required)', 400);
    }

    // Require current password for any profile change
    if (!currentPassword) {
      return errorResponse('Current password is required', 400);
    }

    const admin = await env.DB.prepare('SELECT id, email, password_hash, name FROM admins WHERE id = ?').bind(auth.admin.id).first();
    if (!admin) return errorResponse('Admin not found', 404);

    // Verify current password
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return errorResponse('Current password is incorrect', 401);
    }

    let newEmail = admin.email;
    let newName = admin.name;

    if (newEmailRaw) {
      const email = newEmailRaw.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse('Invalid email', 400);
      }
      if (email.length > 254) return errorResponse('Email too long', 400);
      // Check duplicate
      const existing = await env.DB.prepare('SELECT id FROM admins WHERE email = ? AND id != ?').bind(email, admin.id).first();
      if (existing) {
        return errorResponse('Email already in use', 409);
      }
      newEmail = email;
    }

    if (newNameRaw !== null) {
      if (newNameRaw.length > 100) return errorResponse('Name too long (max 100)', 400);
      if (newNameRaw.length < 1) return errorResponse('Name cannot be empty', 400);
      // Basic HTML injection check
      if (/<\s*script|<\s*iframe|javascript:/i.test(newNameRaw)) {
        return errorResponse('Invalid name', 400);
      }
      newName = newNameRaw;
    }

    await env.DB.prepare(
      `UPDATE admins SET email = ?, name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
    ).bind(newEmail, newName, admin.id).run();

    // Invalidate existing session by requiring re-login: clear cookie will be handled by client, but we also could rotate JWT.
    // For now, we keep session valid but email changed, so next /api/auth/me will reflect new email.
    // Alternatively, we could clear cookie here and require re-login. We'll keep session but update payload email is stale until re-login.
    // To force re-login, we could clear cookie: return with clearSessionCookie
    // For better security, we will clear session and require re-login when email changes
    const emailChanged = newEmail !== admin.email;
    if (emailChanged) {
      // Import clear helper
      const { clearSessionCookie } = await import('../../lib/auth.js');
      return jsonResponse(
        { success: true, admin: { id: admin.id, email: newEmail, name: newName }, requiresRelogin: true },
        200,
        { 'Set-Cookie': clearSessionCookie() }
      );
    }

    const updated = await env.DB.prepare('SELECT id, email, name, is_active, created_at FROM admins WHERE id = ?').bind(admin.id).first();
    return jsonResponse({ admin: updated });
  } catch (e) {
    console.error('PUT profile error', e);
    return errorResponse('Failed to update profile', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
