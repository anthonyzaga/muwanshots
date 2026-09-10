import { motion } from 'framer-motion';
import LazyImage from '../LazyImage';

export function GalleryCard({ image, onClick, index }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, delay: index * 0.02 }}
      className="break-inside-avoid mb-4 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)]">
        <LazyImage
          src={image.src}
          srcSet={image.srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          width={image.width}
          height={image.height}
          blurHash={image.blurHash}
          alt={image.alt}
          className="w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {/* hover caption - desktop only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-end p-4">
          <span className="text-white text-xs tracking-wide font-medium line-clamp-1">{image.alt}</span>
        </div>
        {/* subtle hover arrow */}
        <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-black hidden sm:inline-flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 shadow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </span>
      </div>
    </motion.div>
  );
}
