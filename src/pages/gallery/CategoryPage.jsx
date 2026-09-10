import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../../components/ui/Container';
import { useDynamicGallery } from '../../hooks/useDynamicGallery';
import { GalleryPills } from '../../components/gallery/GalleryPills';
import { GalleryBreadcrumbs } from '../../components/gallery/GalleryBreadcrumbs';
import { GalleryGrid } from '../../components/gallery/GalleryGrid';
import { GalleryEmptyState } from '../../components/gallery/GalleryEmptyState';
import { GalleryCTA } from '../../components/gallery/GalleryCTA';
import { useSeo } from '../../hooks/useSeo';
import { useLightboxUrl } from '../../hooks/useLightboxUrl';
import Lightbox from '../../components/Lightbox';
import NotFound from '../NotFound';

export default function CategoryPage() {
  const { category } = useParams();
  const { categories, images, albums } = useDynamicGallery();
  const cat = categories.find(c => c.slug === category);
  const catImages = useMemo(() => (cat ? images.filter(i => i.category === cat.slug) : []), [cat, images]);
  const album = cat ? albums.find(a => a.slug === cat.slug) : null;
  const { open, close, navigate, currentIndex } = useLightboxUrl(catImages);
  const lightboxImages = catImages.map(i => ({ src: i.variants?.[1600] || i.variants?.[1200] || i.src, alt: i.alt }));

  useSeo({
    title: cat ? cat.seoTitle : 'Category not found - Muwan Shots',
    description: cat ? cat.seoDescription : 'Category not found',
    canonical: cat ? `${window.location.origin}/gallery/${cat.slug}` : `${window.location.origin}/gallery`,
    ogImage: cat ? (cat.cover || catImages[0]?.src) : null,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${window.location.origin}/` },
        { "@type": "ListItem", "position": 2, "name": "Gallery", "item": `${window.location.origin}/gallery` },
        { "@type": "ListItem", "position": 3, "name": cat.name, "item": `${window.location.origin}/gallery/${cat.slug}` }
      ]
    }
  });

  // Also add ImageGallery JSON-LD
  const imageGalleryLd = cat ? {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": cat.name,
    "description": cat.description,
    "url": `${window.location.origin}/gallery/${cat.slug}`,
    "image": catImages.slice(0, 8).map(i => `${window.location.origin}${i.src}`)
  } : null;

  if (!cat) return <NotFound />;

  return (
    <div className="pb-8">
      <Container className="pt-2">
        <GalleryBreadcrumbs category={cat} />
      </Container>

      <Container className="mt-4">
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            <div className="lg:col-span-3 p-7 sm:p-10">
              <h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-[0.95] tracking-tight">{cat.name}</h1>
              <p className="mt-3 text-[var(--text-muted)] leading-relaxed text-sm sm:text-base">{cat.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] px-3 py-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  {cat.imageCount} photographs
                </span>
                {album && <Link to={`/gallery/${cat.slug}/${album.slug}`} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 font-medium hover:bg-[var(--surface-hover)]">View album →</Link>}
              </div>
              <div className="mt-6">
                <Link to="/booking" className="inline-flex rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">Book {cat.name}</Link>
                <Link to="/gallery" className="ml-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium">All galleries</Link>
              </div>
            </div>
            {cat.cover && (
              <div className="lg:col-span-2 relative min-h-[260px] lg:min-h-[360px] overflow-hidden bg-[var(--bg-soft)]">
                <img
                  src={cat.cover}
                  alt={cat.name}
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
              </div>
            )}
          </div>
        </div>
      </Container>

      <Container className="mt-6">
        <GalleryPills categories={categories} />
      </Container>

      <Container className="mt-8">
        {catImages.length === 0 ? (
          <GalleryEmptyState category={cat} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="font-serif text-lg sm:text-xl">Photographs</h2>
              <span className="text-xs text-[var(--text-muted)]">{catImages.length} images · Click to view</span>
            </div>
            <GalleryGrid images={catImages} onImageClick={open} variant="masonry" />
          </>
        )}
      </Container>

      <Container className="mt-10">
        <GalleryCTA title={`Love ${cat.name.toLowerCase()}?`} subtitle={`Let’s capture your ${cat.name.toLowerCase()} - cinematic, warm and human.`} />
      </Container>

      <Lightbox
        images={lightboxImages}
        currentIndex={currentIndex}
        onClose={close}
        onNavigate={navigate}
      />

      {/* JSON-LD for ImageGallery */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGalleryLd) }} />
    </div>
  );
}
