export async function onRequestGet(context) {
  const { env } = context;
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown',
    storage: 'unknown',
    media: {
      pending: null,
      processing: null,
      failed: null,
      ready: null,
      total: null,
    },
    r2_public_url: null,
  };

  // Check D1
  try {
    if (env.DB) {
      await env.DB.prepare('SELECT 1 as ok').first();
      checks.database = 'ok';
      // Media processing stats (non-sensitive counts only)
      try {
        const stats = await env.DB.prepare(`
          SELECT
            SUM(CASE WHEN processing_status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN processing_status = 'processing' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN processing_status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN processing_status = 'ready' THEN 1 ELSE 0 END) as ready,
            COUNT(*) as total
          FROM photos
        `).first();
        if (stats) {
          checks.media.pending = stats.pending ?? 0;
          checks.media.processing = stats.processing ?? 0;
          checks.media.failed = stats.failed ?? 0;
          checks.media.ready = stats.ready ?? 0;
          checks.media.total = stats.total ?? 0;
        }
      } catch {
        // Keep null if table not yet migrated
      }
    } else {
      checks.database = 'not_configured';
    }
  } catch (_e) {
    checks.database = 'error';
    checks.status = 'degraded';
  }

  // Check R2
  try {
    if (env.R2) {
      checks.storage = 'ok';
    } else {
      checks.storage = 'not_configured';
    }
  } catch {
    checks.storage = 'error';
    checks.status = 'degraded';
  }

  // R2 public URL config status (do not expose value, only boolean/domain presence)
  try {
    if (env.R2_PUBLIC_URL && typeof env.R2_PUBLIC_URL === 'string' && env.R2_PUBLIC_URL.trim()) {
      const u = new URL(env.R2_PUBLIC_URL);
      checks.r2_public_url = `configured:${u.hostname}`;
      if (u.hostname !== 'images.muwanshots.com') checks.r2_public_url += ' (custom)';
    } else {
      checks.r2_public_url = 'not_configured (using /api/media fallback)';
    }
  } catch {
    checks.r2_public_url = 'invalid';
  }

  // Overall status: degraded if DB/storage error or media failed >0 with pending stuck?
  // Keep simple: only DB/storage errors degrade; media stats are informational
  const status = checks.status === 'ok' ? 200 : 503;
  return new Response(JSON.stringify(checks), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
