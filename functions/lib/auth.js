// Cloudflare Pages Functions — Auth helpers (Web Crypto + bcryptjs/JWT)
// Uses jose for JWT and bcryptjs for password hashing (pure JS, Workers-compatible)

import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = '__Host-muwan_session';

export function getJwtSecret(env) {
  const secret = env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters (set via `wrangler secret put JWT_SECRET` or .dev.vars)');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload, env, expiresIn = '7d') {
  const secret = getJwtSecret(env);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySession(token, env) {
  const secret = getJwtSecret(env);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }).filter(([k]) => k)
  );
  return cookies[name] || null;
}

export function setSessionCookie(token, { isSecure = true } = {}) {
  // __Host- prefix requires Secure, Path=/, no Domain
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const secure = isSecure ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function requireAuth(request, env) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }
  try {
    const payload = await verifySession(token, env);
    // payload should contain admin id/email
    if (!payload.sub) throw new Error('Invalid session');
    // Verify admin still exists and is_active
    const admin = await env.DB.prepare('SELECT id, email, name, is_active FROM admins WHERE id = ?').bind(payload.sub).first();
    if (!admin) return { error: 'Unauthorized', status: 401 };
    if (!admin.is_active) return { error: 'Account disabled', status: 403 };
    return { admin, payload };
  } catch (_e) {
    return { error: 'Invalid or expired session', status: 401 };
  }
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Basic rate limiting helper (in-memory for single isolate, plus D1 fallback)
// For production, use Cloudflare Rate Limiting or KV.
// Here we do simple per-IP check via request headers (CF-Connecting-IP)
const loginAttempts = new Map();
export function checkRateLimit(request, max = 5, windowMs = 15 * 60 * 1000) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  loginAttempts.set(ip, entry);
  if (entry.count > max) {
    return false;
  }
  return true;
}
