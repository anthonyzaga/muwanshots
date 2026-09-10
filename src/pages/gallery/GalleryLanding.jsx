import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/ui/Container';
import { useSeo } from '../../hooks/useSeo';
import { GalleryHero } from '../../components/gallery/GalleryHero';
import { GalleryPills } from '../../components/gallery/GalleryPills';
import { GalleryGrid } from '../../components/gallery/GalleryGrid';
import { GalleryCTA } from '../../components/gallery/GalleryCTA';
import { useLightboxUrl } from '../../hooks/useLightboxUrl';
import Lightbox from '../../components/Lightbox';
import LazyImage from '../../components/LazyImage';
import { useDynamicGallery } from '../../hooks/useDynamicGallery';

function FeaturedAlbums({ categories, images }) {
  const populated = categories.filter(c=>c.imageCount>0);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {populated.map(cat => {
        const cover = images.find(i=>i.id===cat.imageIds[0]) || images.find(i=>i.category===cat.slug);
        const count = cat.imageCount;
        return (
          <Link key={cat.slug} to={`/gallery/${cat.slug}`} className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)]">
            <div className="aspect-[4/3] overflow-hidden relative">
              {cover && <LazyImage src={cover.src} srcSet={cover.srcSet} sizes="(max-width:640px) 100vw, 33vw" width={cover.width} height={cover.height} blurHash={cover.blurHash} alt={cover.alt} className="h-full w-full" imgClassName="group-hover:scale-[1.03] transition-transform duration-700" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-serif text-lg">{cat.name}</h3>
                <p className="text-white/70 text-xs mt-1">{count} photographs · {cat.description.split('-')[0]?.trim()}</p>
              </div>
              <span className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-black inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function GalleryLanding() {
  const { categories, images } = useDynamicGallery();
  const featured = useMemo(() => images.find(i=>i.category==='weddings') || images[0], [images]);
  const selected = useMemo(() => images.slice(0, 12), [images]);
  const { open, close, navigate, currentIndex } = useLightboxUrl(selected);
  const lightboxImages = selected.map(i=>({ src: (images.find(x=>x.id===i.id)?.variants?.[1600] || i.src), alt: i.alt }));

  useSeo({
    title: 'Gallery - Muwan Shots Photography & Videography',
    description: 'Explore weddings, Kukyala, graduations, prom, baby bump and baby shoots - 75 cinematic photographs by Muwan Shots in Masaka & Kampala.',
    canonical: `${window.location.origin}/gallery`,
    ogImage: featured?.src,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${window.location.origin}/` },
        { "@type": "ListItem", "position": 2, "name": "Gallery", "item": `${window.location.origin}/gallery` }
      ]
    }
  });

  return (
    <div className="pb-8">
      <Container className="pt-4 sm:pt-6">
        <GalleryHero featured={featured} />
      </Container>

      <Container className="mt-6">
        <GalleryPills categories={categories} />
      </Container>

      <Container className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight">Collections</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Six curated collections - each a complete story.</p>
          </div>
          <Link to="/booking" className="hidden sm:inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-xs font-medium">Book a Session</Link>
        </div>
        <div className="mt-6">
          <FeaturedAlbums categories={categories} images={images} />
        </div>
      </Container>

      <Container className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-xl sm:text-2xl">Selected photographs</h2>
          <span className="text-xs text-[var(--text-muted)]">{selected.length} of 75</span>
        </div>
        <div className="mt-6">
          <GalleryGrid images={selected} onImageClick={open} variant="masonry" />
        </div>
        <p className="text-center text-xs text-[var(--text-muted)] mt-4">Showing a curated preview - visit a collection for the full set.</p>
      </Container>

      <Container className="mt-10">
        <GalleryCTA />
      </Container>

      {/* Lightbox URL-aware for landing preview */}
      <Lightbox
        images={lightboxImages}
        currentIndex={currentIndex}
        onClose={close}
        onNavigate={navigate}
      />
    </div>
  );
}
