// Centralized image URL resolver — handles absolute URL, R2 public URL, API media fallback, static fallback
// Never exposes R2 credentials; frontend only receives image_url from D1 via API
// Priority: 1) explicit absolute URL 2) R2_PUBLIC_URL + r2Key (if configured) 3) /api/media fallback 4) static
// R2_PUBLIC_URL is injected via Vite env (VITE_R2_PUBLIC_URL) or server-provided image_url already contains it

function getR2PublicUrl() {
  // Vite exposes only VITE_ prefixed env at build time
  try {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_R2_PUBLIC_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim().replace(/\/$/, '');
  } catch {}
  return '';
}

function normalizeR2PublicUrl(base, r2Key) {
  const cleanKey = String(r2Key).replace(/^\//, '');
  return `${base}/${cleanKey}`;
}

export function resolveImageUrl(imageUrl, r2Key) {
  if (!imageUrl && !r2Key) return '/images/hero-bg.jpg';
  // 1) Explicit absolute URL - return as-is (already CDN or external)
  if (imageUrl) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/api/media/')) return imageUrl;
    if (imageUrl.startsWith('/photos/')) return `/api/media${imageUrl}`;
    if (imageUrl.startsWith('/')) return imageUrl;
  }
  // 2) R2 custom domain if configured and we have a key
  if (r2Key) {
    const cdnBase = getR2PublicUrl();
    if (cdnBase && /^https?:\/\//.test(cdnBase)) {
      return normalizeR2PublicUrl(cdnBase, r2Key);
    }
    return `/api/media/${r2Key.replace(/^\//, '')}`;
  }
  return imageUrl || '/images/hero-bg.jpg';
}

export function getPhotoImageUrl(photo) {
  if (!photo) return '/images/hero-bg.jpg';
  if (photo.image_url) return resolveImageUrl(photo.image_url, photo.r2_key);
  if (photo.r2_key) return resolveImageUrl(null, photo.r2_key);
  return '/images/hero-bg.jpg';
}

export function getVariantSrcSet(photo) {
  // photo.variants from API: { "480": url, "768": url, ... }
  // Also support photo.variants_list array
  if (!photo || !photo.variants) return null;
  const variants = photo.variants;
  if (typeof variants === 'object' && !Array.isArray(variants)) {
    const entries = Object.entries(variants).filter(([k]) => k !== 'original').sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    if (entries.length === 0) return null;
    return entries.map(([w, url]) => `${url} ${w}w`).join(', ');
  }
  return null;
}
