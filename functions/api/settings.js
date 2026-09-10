import { requireAuth, jsonResponse, errorResponse } from '../lib/auth.js';

const ALLOWED_SETTINGS = [
  'site_name',
  'site_tagline',
  'hero_title',
  'hero_subtitle',
  'hero_description',
  'hero_cta_text',
  'hero_cta_url',
  'hero_image',
  'about_title',
  'about_description',
  'contact_title',
  'contact_description',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'youtube_url',
  'whatsapp_url',
  'email',
  'phone',
  'location',
  'default_meta_title',
  'default_meta_description',
  'og_image',
];

const PUBLIC_SETTINGS = new Set([
  'site_name',
  'site_tagline',
  'hero_title',
  'hero_subtitle',
  'hero_description',
  'hero_cta_text',
  'hero_cta_url',
  'hero_image',
  'about_title',
  'about_description',
  'contact_title',
  'contact_description',
  'instagram_url',
  'facebook_url',
  'tiktok_url',
  'youtube_url',
  'whatsapp_url',
  'email',
  'phone',
  'location',
  'default_meta_title',
  'default_meta_description',
  'og_image',
]);

function isValidUrl(value) {
  if (!value) return true; // allow empty
  try {
    const u = new URL(value, 'http://example.com');
    return ['http:', 'https:', '/'].includes(u.protocol) || value.startsWith('/');
  } catch {
    return value.startsWith('/') || value.startsWith('http');
  }
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const result = await env.DB.prepare('SELECT setting_key, setting_value, setting_type, updated_at FROM site_settings WHERE setting_key IN (' + ALLOWED_SETTINGS.map(() => '?').join(',') + ')').bind(...ALLOWED_SETTINGS).all();
    const settings = {};
    for (const row of result.results || []) {
      if (PUBLIC_SETTINGS.has(row.setting_key)) {
        settings[row.setting_key] = row.setting_value;
      }
    }
    // Ensure all allowed keys present (fallback to empty string)
    for (const key of ALLOWED_SETTINGS) {
      if (!(key in settings)) settings[key] = '';
    }
    return new Response(JSON.stringify({ settings }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (e) {
    console.error('GET settings error', e);
    return errorResponse('Failed to fetch settings', 500);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) return jsonResponse({ error: auth.error }, auth.status);

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return errorResponse('Invalid JSON', 400);

    const updates = [];
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTINGS.includes(key)) {
        return errorResponse(`Unknown setting: ${key}`, 400);
      }
      const strVal = value == null ? '' : String(value);
      if (strVal.length > 2000) return errorResponse(`${key} too long (max 2000)`, 400);
      // Reject HTML/script injection for plain text fields
      if (strVal && /<\s*script|<\s*iframe|javascript:/i.test(strVal)) {
        return errorResponse(`Invalid content for ${key}`, 400);
      }
      if (key.endsWith('_url') || key === 'og_image' || key === 'hero_image') {
        if (strVal && !isValidUrl(strVal)) {
          return errorResponse(`Invalid URL for ${key}`, 400);
        }
      }
      if (key === 'email' && strVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        return errorResponse('Invalid email', 400);
      }
      if ((key === 'phone' || key === 'location') && strVal.length > 200) {
        return errorResponse(`${key} too long`, 400);
      }
      updates.push({ key, value: strVal });
    }

    if (updates.length === 0) return errorResponse('No valid settings provided', 400);

    // Update each
    for (const u of updates) {
      await env.DB.prepare(
        `INSERT INTO site_settings (id, setting_key, setting_value, setting_type, updated_at) VALUES (?, ?, ?, 'text', strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`
      ).bind(`set_${u.key}`, u.key, u.value).run();
    }

    // Return updated public settings
    const result = await env.DB.prepare('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (' + ALLOWED_SETTINGS.map(() => '?').join(',') + ')').bind(...ALLOWED_SETTINGS).all();
    const settings = {};
    for (const row of result.results || []) {
      if (PUBLIC_SETTINGS.has(row.setting_key)) settings[row.setting_key] = row.setting_value;
    }
    return jsonResponse({ settings, updated: updates.length });
  } catch (e) {
    console.error('PUT settings error', e);
    return errorResponse('Failed to update settings', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
