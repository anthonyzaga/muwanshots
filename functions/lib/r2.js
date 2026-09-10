// R2 helpers — safe key generation and validation

export const ALLOWED_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function generateR2Key(categorySlug, originalName, ext, photoId) {
  const safeCategory = String(categorySlug || 'uncategorized').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const year = new Date().getFullYear();
  const id = photoId || crypto.randomUUID();
  const safeExt = ext.toLowerCase();
  // New structure: photos/<category>/<year>/<photoId>/original.<ext> — preserves original, allows variants alongside
  return `photos/${safeCategory}/${year}/${id}/original.${safeExt}`;
}

export function validateFile(file) {
  if (!file || !file.type || !file.size) return 'Invalid file';
  if (!ALLOWED_MIME[file.type]) return `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF`;
  if (file.size > MAX_FILE_SIZE) return `File too large: ${(file.size/1024/1024).toFixed(1)}MB. Max 10MB`;
  if (file.size === 0) return 'File is empty';
  return null;
}
