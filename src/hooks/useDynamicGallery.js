import { useEffect, useState } from 'react';
import { categories as staticCategories, images as staticImages, albums as staticAlbums } from '../content/gallery';

export function useDynamicGallery() {
  const [categories, setCategories] = useState(staticCategories);
  const [images, setImages] = useState(staticImages);
  const [albums, setAlbums] = useState(staticAlbums);
  const [loading, setLoading] = useState(true);
  const [isDynamic, setIsDynamic] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [catRes, photoRes, albumRes] = await Promise.all([
          fetch('/api/categories', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/photos', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/albums', { credentials: 'include' }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (cancelled) return;

        // Only switch to dynamic if API returns non-empty published data
        // This preserves existing visual design while enabling CMS
        if (catRes?.categories && catRes.categories.length > 0) {
          // Map API categories to gallery shape (keep static cover fallback if needed)
          const apiCats = catRes.categories.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            description: c.description || '',
            cover: c.cover_media_id ? (photoRes?.photos?.find(p => p.id === c.cover_media_id)?.image_url || null) : null,
            imageCount: 0, // will be computed from photos
            imageIds: [],
            is_published: c.is_published,
            sort_order: c.sort_order,
            seoTitle: `${c.name} — Muwan Shots`,
            seoDescription: c.description || '',
          }));
          // If API photos also available, compute imageCounts and map
          if (photoRes?.photos && photoRes.photos.length > 0) {
            const apiImages = photoRes.photos.map(p => {
              // Build srcSet from variants if available, else fallback to single image_url
              const variants = p.variants || { original: p.image_url, 1200: p.image_url };
              const variantEntries = Object.entries(variants).filter(([k]) => k !== 'original');
              const srcSet = variantEntries.length > 0
                ? variantEntries.map(([w, url]) => `${url} ${w}w`).join(', ')
                : p.image_url;
              // Use width/height from API if available, else fallback
              const width = p.width || 1600;
              const height = p.height || Math.round(width * 0.75);
              return {
                id: p.id,
                hash: p.id.slice(0, 8),
                hash8: p.id.slice(0, 8),
                original: p.r2_key,
                src: p.image_url,
                srcSet: srcSet,
                variants: variants,
                width: width,
                height: height,
                blurHash: p.blurHash || null,
                alt: p.alt_text || p.title || 'Photograph by Muwan Shots',
                category: p.category_slug || p.category_id || 'uncategorized',
                album: p.category_id,
                is_published: p.is_published,
                processing_status: p.processing_status || 'ready',
              };
            });
            // Recompute counts from actual photos
            for (const cat of apiCats) {
              const catPhotos = apiImages.filter(img => {
                // Try to match via category_id or slug
                const photo = photoRes.photos.find(pp => pp.id === img.id);
                return photo?.category_slug === cat.slug || photo?.category_id === cat.id;
              });
              cat.imageCount = catPhotos.length;
              cat.imageIds = catPhotos.map(p => p.id);
              if (!cat.cover && catPhotos[0]) cat.cover = catPhotos[0].src;
            }
            // Only use dynamic if we have at least some photos
            if (apiImages.length > 0) {
              setCategories(apiCats.filter(c => c.is_published || c.imageCount > 0));
              setImages(apiImages);
              setIsDynamic(true);
            }
          } else {
            // Categories only, no photos yet — still use dynamic categories but keep static images fallback
            setCategories(apiCats);
            setIsDynamic(true);
          }

          if (albumRes?.albums && albumRes.albums.length > 0) {
            setAlbums(albumRes.albums.map(a => ({
              id: a.id,
              slug: a.slug,
              name: a.name,
              title: a.name,
              category: a.slug, // fallback
              description: a.description || '',
              cover: a.cover_media_id ? (photoRes?.photos?.find(p => p.id === a.cover_media_id)?.image_url || null) : null,
              imageIds: [],
              is_published: a.is_published,
            })));
          }
        }
      } catch {
        // Keep static fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Dev observability: log source once
  useEffect(() => {
    if (!loading && import.meta.env.DEV) {
      console.debug(`[MuwanShots] CMS source: ${isDynamic ? 'D1+R2' : 'fallback (static)'} — ${categories.length} categories, ${images.length} photos`);
    }
  }, [loading, isDynamic, categories.length, images.length]);

  return { categories, images, albums, loading, isDynamic, source: isDynamic ? 'd1' : 'fallback' };
}
