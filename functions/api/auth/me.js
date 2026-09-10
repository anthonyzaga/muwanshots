import { requireAuth, jsonResponse } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = await requireAuth(request, env);
  if (auth.error) {
    return jsonResponse({ error: auth.error }, auth.status);
  }
  const { admin } = auth;
  return jsonResponse({ admin });
}
