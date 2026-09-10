import { motion, AnimatePresence } from 'framer-motion';
import { GalleryCard } from './GalleryCard';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

export function GalleryGrid({ images, onImageClick, variant = 'masonry' }) {
  const prefersReduced = usePrefersReducedMotion();

  if (variant === 'masonry') {
    return (
      <motion.div
        layout={!prefersReduced}
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
      >
        <AnimatePresence>
          {images.map((img, i) => (
            <GalleryCard key={img.id} image={img} index={i} onClick={() => onImageClick(img.id)} />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // editorial variant: first image large, rest masonry
  if (variant === 'editorial' && images.length > 0) {
    const [featured, ...rest] = images;
    return (
      <div className="space-y-4">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] group cursor-pointer"
          onClick={() => onImageClick(featured.id)}
        >
          <img
            src={featured.src}
            srcSet={featured.srcSet}
            sizes="(max-width: 1024px) 100vw, 80vw"
            width={featured.width}
            height={featured.height}
            alt={featured.alt}
            loading="eager"
            decoding="async"
            className="w-full h-[58vh] sm:h-[62vh] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <p className="text-white/80 text-xs tracking-[0.18em] uppercase">{featured.category}</p>
            <h3 className="text-white font-serif text-xl sm:text-2xl mt-1 line-clamp-1">{featured.alt}</h3>
          </div>
        </motion.div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {rest.map((img, i) => (
            <GalleryCard key={img.id} image={img} index={i} onClick={() => onImageClick(img.id)} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
