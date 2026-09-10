import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';

export function GalleryPills({ categories }) {
  const { category: activeSlug } = useParams();
  const scrollRef = useRef(null);
  const visible = categories.filter(c => !c.empty); // hide empty per spec

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[var(--bg)] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[var(--bg)] to-transparent z-10" />
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1 scroll-smooth"
        role="tablist"
        aria-label="Gallery categories"
      >
        <Link
          to="/gallery"
          role="tab"
          aria-selected={!activeSlug}
          aria-current={!activeSlug ? 'page' : undefined}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium tracking-wide border transition-colors ${!activeSlug ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}
        >
          ALL
        </Link>
        {visible.map(cat => (
          <Link
            key={cat.slug}
            to={`/gallery/${cat.slug}`}
            role="tab"
            aria-selected={activeSlug === cat.slug}
            aria-current={activeSlug === cat.slug ? 'page' : undefined}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium tracking-wide border transition-colors ${activeSlug === cat.slug ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}
          >
            {cat.name.toUpperCase()}
            <span className={`text-[10px] min-w-5 h-5 flex items-center justify-center rounded-full px-1 ${activeSlug === cat.slug ? 'bg-white/20' : 'bg-[var(--bg-soft)] border border-[var(--border)]'}`}>{cat.imageCount}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
