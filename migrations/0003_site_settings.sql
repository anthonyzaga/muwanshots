-- Site settings for homepage CMS and global site content

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Seed safe defaults (only if not exists)
INSERT OR IGNORE INTO site_settings (id, setting_key, setting_value, setting_type) VALUES
('set_site_name', 'site_name', 'Muwan Shots Photography', 'text'),
('set_site_tagline', 'site_tagline', 'Photography & Videography in Masaka & Kampala', 'text'),
('set_hero_title', 'hero_title', 'Capturing Moments, Creating Memories.', 'text'),
('set_hero_subtitle', 'hero_subtitle', 'Masaka • Kampala • Uganda', 'text'),
('set_hero_description', 'hero_description', 'Professional photography and videography for weddings, traditional ceremonies, celebrations, corporate events and meaningful milestones — cinematic, warm and human.', 'text'),
('set_hero_cta_text', 'hero_cta_text', 'Book Your Date', 'text'),
('set_hero_cta_url', 'hero_cta_url', '/booking', 'text'),
('set_hero_image', 'hero_image', '/images/hero-bg.jpg', 'image'),
('set_about_title', 'about_title', 'We photograph how it felt, not just how it looked.', 'text'),
('set_about_description', 'about_description', 'Muwan Shots is a Ugandan studio for people who value presence over pose. We balance editorial direction with documentary honesty — so your gallery feels calm, warm and true.', 'text'),
('set_contact_title', 'contact_title', 'Let’s make something timeless together.', 'text'),
('set_contact_description', 'contact_description', 'Tell us about your date and occasion. We’ll reply on WhatsApp with availability and next steps — typically within an hour.', 'text'),
('set_instagram_url', 'instagram_url', 'https://www.instagram.com/muwanshotsphotography/', 'url'),
('set_facebook_url', 'facebook_url', '', 'url'),
('set_tiktok_url', 'tiktok_url', 'https://www.tiktok.com/@muwan214', 'url'),
('set_youtube_url', 'youtube_url', '', 'url'),
('set_whatsapp_url', 'whatsapp_url', 'https://wa.me/256705405254', 'url'),
('set_email', 'email', 'muwanshotsphotography@gmail.com', 'text'),
('set_phone', 'phone', '+256705405254', 'text'),
('set_location', 'location', 'Masaka — Kampala, Uganda', 'text'),
('set_default_meta_title', 'default_meta_title', 'Muwan Shots Photography — Photography & Videography in Masaka & Kampala', 'text'),
('set_default_meta_description', 'default_meta_description', 'Professional photography and videography in Masaka & Kampala, Uganda. Weddings, kukyala, graduations, birthdays, corporate and cinematic storytelling.', 'text'),
('set_og_image', 'og_image', '/logo.jpg', 'image');
