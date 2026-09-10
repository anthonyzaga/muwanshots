export function Card({ children, className='', hover=false, ...props }) {
  return (
    <div className={`rounded-[1.5rem] bg-[var(--surface)] border border-[var(--border)] overflow-hidden ${hover ? 'hover:border-[var(--border-strong)] hover:shadow-sm transition-all' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
export function ImageCard({ src, alt, title, subtitle, meta, className='', aspect='aspect-[4/5]', children, ...props }) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.25rem] bg-[var(--surface)] border border-[var(--border)] ${className}`} {...props}>
      <div className={`relative overflow-hidden ${aspect}`}>
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80" />
        {(title || subtitle) && (
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            {subtitle && <p className="text-[11px] tracking-[0.16em] uppercase text-white/70 mb-1.5">{subtitle}</p>}
            {title && <h3 className="font-serif text-lg sm:text-xl leading-tight text-white">{title}</h3>}
            {meta && <p className="text-xs text-white/60 mt-1">{meta}</p>}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="pt-8 pb-4 sm:pt-12 sm:pb-6">
      {eyebrow && <p className="text-xs tracking-[0.22em] uppercase text-[var(--accent)] font-medium mb-3">{eyebrow}</p>}
      <h1 className="font-serif text-[clamp(2rem,5vw,4rem)] font-semibold tracking-tight leading-[0.9] text-[var(--text-primary)] max-w-3xl">{title}</h1>
      {description && <p className="mt-4 text-[var(--text-muted)] max-w-2xl leading-relaxed text-[15px] sm:text-base">{description}</p>}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
