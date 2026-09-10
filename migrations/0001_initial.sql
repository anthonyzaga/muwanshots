-- Muwan Shots CMS — Initial Schema (Cloudflare D1)
-- Compatible with SQLite / D1

PRAGMA foreign_keys = ON;

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Categories (dynamic)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_media_id TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (cover_media_id) REFERENCES photos(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_published ON categories(is_published);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Photos (metadata, file in R2)
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  category_id TEXT,
  r2_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_category_id ON photos(category_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_published ON photos(is_published);
CREATE INDEX IF NOT EXISTS idx_photos_is_featured ON photos(is_featured);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos(sort_order);

-- Albums
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_media_id TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (cover_media_id) REFERENCES photos(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);
CREATE INDEX IF NOT EXISTS idx_albums_is_published ON albums(is_published);
CREATE INDEX IF NOT EXISTS idx_albums_sort_order ON albums(sort_order);

-- Album_Photos (many-to-many, no duplicate files)
CREATE TABLE IF NOT EXISTS album_photos (
  album_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (album_id, photo_id),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo_id ON album_photos(photo_id);
