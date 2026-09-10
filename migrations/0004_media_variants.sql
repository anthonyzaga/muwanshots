-- Phase 3.1 — Production media hardening

-- Add processing status to photos (safe fallback: ready for existing rows)
ALTER TABLE photos ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE photos ADD COLUMN processing_error TEXT;
ALTER TABLE photos ADD COLUMN processed_at TEXT;
ALTER TABLE photos ADD COLUMN width INTEGER;
ALTER TABLE photos ADD COLUMN height INTEGER;
ALTER TABLE photos ADD COLUMN file_size INTEGER;
ALTER TABLE photos ADD COLUMN original_r2_key TEXT;

-- Update existing photos to mark as ready (they are either static fallback or already optimized)
UPDATE photos SET processing_status = 'ready' WHERE processing_status IS NULL OR processing_status = '';

CREATE INDEX IF NOT EXISTS idx_photos_processing_status ON photos(processing_status);

-- Media variants: responsive WebP/AVIF per photo, stored in R2, immutable URLs
CREATE TABLE IF NOT EXISTS media_variants (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  variant_name TEXT NOT NULL, -- 480, 768, 1200, 1600, original
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  format TEXT NOT NULL, -- webp, avif, jpg
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_variants_photo_variant ON media_variants(photo_id, variant_name);
CREATE INDEX IF NOT EXISTS idx_media_variants_photo_id ON media_variants(photo_id);
CREATE INDEX IF NOT EXISTS idx_media_variants_variant_name ON media_variants(variant_name);
