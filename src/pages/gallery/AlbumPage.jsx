import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../../components/ui/Container';
import { useDynamicGallery } from '../../hooks/useDynamicGallery';
import { GalleryBreadcrumbs } from '../../components/gallery/GalleryBreadcrumbs';
import { GalleryGrid } from '../../components/gallery/GalleryGrid';
import { GalleryCTA } from '../../components/gallery/GalleryCTA';
import { useSeo } from '../../hooks/useSeo';
import { useLightboxUrl } from '../../hooks/useLightboxUrl';
import Lightbox from '../../components/Lightbox';
import NotFound from '../NotFound';

export default function AlbumPage() {
  const { category, album: albumSlug } = useParams();
  const { categories, images, albums } = useDynamicGallery();
  const cat = categories.find(c => c.slug === category);
  const album = albums.find(a => a.slug === albumSlug && a.category === category);
  const albumImages = useMemo(() => (album ? images.filter(i => album.imageIds.includes(i.id)) : []), [album, images]);
  const { open, close, navigate, currentIndex } = useLightboxUrl(albumImages);
  const lightboxImages = albumImages.map(i => ({ src: i.variants?.[1600] || i.variants?.[1200] || i.src, alt: i.alt }));

  useSeo({
    title: cat && album ? `${album.title} - ${cat.name} - Muwan Shots` : 'Album not found - Muwan Shots',
    description: album ? (album.description || cat?.description) : 'Album not found',
    canonical: cat && album ? `${window.location.origin}/gallery/${cat.slug}/${album.slug}` : `${window.location.origin}/gallery`,
    ogImage: album ? (album.cover || albumImages[0]?.src) : null,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${window.location.origin}/` },
        { "@type": "ListItem", "position": 2, "name": "Gallery", "item": `${window.location.origin}/gallery` },
        { "@type": "ListItem", "position": 3, "name": cat.name, "item": `${window.location.origin}/gallery/${cat.slug}` },
        { "@type": "ListItem", "position": 4, "name": album.title, "item": `${window.location.origin}/gallery/${cat.slug}/${album.slug}` }
      ]
    }
  });

  if (!cat || !album) return <NotFound />;

  return (
    <div className="pb-8">
      <Container className="pt-2">
        <GalleryBreadcrumbs category={cat} album={album} />
      </Container>

      <Container className="mt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[var(--accent)]">{cat.name}</p>
            <h1 className="mt-2 font-serif text-[clamp(1.6rem,4vw,2.6rem)] leading-[0.95] tracking-tight">{album.title}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)] max-w-xl">{album.description}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[var(--bg-soft)] border border-[var(--border)] px-4 py-2 text-xs font-medium shrink-0">{albumImages.length} photographs</span>
        </div>
      </Container>

      <Container className="mt-8">
        {/* Editorial grid: use editorial variant for album to create premium hierarchy */}
        <GalleryGrid images={albumImages} onImageClick={open} variant="editorial" />
      </Container>

      <Container className="mt-10">
        <div className="flex flex-wrap gap-3">
          <Link to={`/gallery/${cat.slug}`} className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium">← Back to {cat.name}</Link>
          <Link to="/booking" className="inline-flex rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">Book this style</Link>
        </div>
      </Container>

      <Container className="mt-10">
        <GalleryCTA title="Inspired by this collection?" subtitle={`We’ll craft a ${cat.name.toLowerCase()} story that feels like yours.`} />
      </Container>

      <Lightbox images={lightboxImages} currentIndex={currentIndex} onClose={close} onNavigate={navigate} />
    </div>
  );
}
