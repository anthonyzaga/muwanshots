import { clearSessionCookie, jsonResponse } from '../../lib/auth.js';

export async function onRequestPost() {
  return jsonResponse({ success: true }, 200, {
    'Set-Cookie': clearSessionCookie(),
  });
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
