import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import content from '../content/content.json';

// Simple in-memory cache to avoid multiple fetches
let cached = null;
let fetching = null;

export function clearSiteSettingsCache() {
  cached = null;
  fetching = null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => cached || {
    site_name: content.brandName || 'Muwan Shots Photography',
    site_tagline: 'Photography & Videography in Masaka & Kampala',
    hero_title: content.hero.title || 'Capturing Moments, Creating Memories.',
    hero_subtitle: content.brandName || 'Muwan Shots Photography',
    hero_description: content.hero.subtitle || 'Professional photography services in Masaka, Uganda.',
    hero_cta_text: content.hero.ctaText || 'Book Now',
    hero_cta_url: content.hero.ctaHref || '/booking',
    hero_image: content.hero.backgroundImage || '/images/hero-bg.jpg',
    about_title: 'We photograph how it felt, not just how it looked.',
    about_description: 'Muwan Shots is a Ugandan studio for people who value presence over pose.',
    contact_title: 'Let’s make something timeless together.',
    contact_description: 'Tell us about your date and occasion.',
    instagram_url: content.contact.instagram || '',
    facebook_url: '',
    tiktok_url: content.contact.tiktok || '',
    youtube_url: '',
    whatsapp_url: content.contact.whatsapp || 'https://wa.me/256705405254',
    email: content.contact.email || '',
    phone: content.contact.phone || '',
    location: content.contact.location || 'Masaka — Kampala, Uganda',
    default_meta_title: 'Muwan Shots Photography — Photography & Videography in Masaka & Kampala',
    default_meta_description: 'Professional photography and videography in Masaka & Kampala, Uganda.',
    og_image: '/logo.jpg',
  });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cached) {
      setSettings(cached);
      setLoading(false);
      return;
    }
    if (fetching) {
      fetching.then(data => {
        if (data) setSettings(data);
        setLoading(false);
      }).catch(() => setLoading(false));
      return;
    }
    fetching = (async () => {
      try {
        const res = await api.getSettings();
        const s = res.settings || {};
        const merged = {
          site_name: s.site_name || content.brandName,
          site_tagline: s.site_tagline || 'Photography & Videography in Masaka & Kampala',
          hero_title: s.hero_title || content.hero.title,
          hero_subtitle: s.hero_subtitle || content.brandName,
          hero_description: s.hero_description || content.hero.subtitle,
          hero_cta_text: s.hero_cta_text || content.hero.ctaText,
          hero_cta_url: s.hero_cta_url || content.hero.ctaHref,
          hero_image: s.hero_image || content.hero.backgroundImage,
          about_title: s.about_title || 'We photograph how it felt, not just how it looked.',
          about_description: s.about_description || 'Muwan Shots is a Ugandan studio for people who value presence over pose.',
          contact_title: s.contact_title || 'Let’s make something timeless together.',
          contact_description: s.contact_description || 'Tell us about your date and occasion.',
          instagram_url: s.instagram_url || content.contact.instagram,
          facebook_url: s.facebook_url || '',
          tiktok_url: s.tiktok_url || content.contact.tiktok,
          youtube_url: s.youtube_url || '',
          whatsapp_url: s.whatsapp_url || content.contact.whatsapp,
          email: s.email || content.contact.email,
          phone: s.phone || content.contact.phone,
          location: s.location || content.contact.location,
          default_meta_title: s.default_meta_title || 'Muwan Shots Photography — Photography & Videography in Masaka & Kampala',
          default_meta_description: s.default_meta_description || 'Professional photography and videography in Masaka & Kampala, Uganda.',
          og_image: s.og_image || '/logo.jpg',
        };
        cached = merged;
        return merged;
      } catch (e) {
        setError(e.message);
        return null;
      }
    })();
    fetching.then(data => {
      if (data) setSettings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Dev observability
  useEffect(() => {
    if (!loading && import.meta.env.DEV) {
      console.debug(`[MuwanShots] Site settings source: ${cached ? 'D1' : 'fallback'}`);
    }
  }, [loading]);

  return { settings, loading, error, isDynamic: !!cached, source: cached ? 'd1' : 'fallback' };
}
