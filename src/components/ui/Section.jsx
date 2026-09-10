export function Section({ children, className = '', id, ...props }) {
  return (
    <section id={id} className={`py-16 sm:py-20 lg:py-24 ${className}`} {...props}>
      {children}
    </section>
  );
}
export function SectionHeading({ eyebrow, title, description, align = 'left', className = '', titleClassName='' }) {
  const isCenter = align === 'center';
  return (
    <div className={`${isCenter ? 'text-center mx-auto' : ''} max-w-3xl ${isCenter ? '' : ''} ${className}`}>
      {eyebrow && (
        <p className="text-xs sm:text-sm font-medium tracking-[0.22em] uppercase text-[var(--accent)] mb-3">
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className={`font-serif font-semibold leading-[0.95] tracking-tight text-[clamp(1.9rem,4vw,3.4rem)] text-[var(--text-primary)] ${titleClassName}`}>
          {title}
        </h2>
      )}
      {description && (
        <p className={`mt-4 text-[var(--text-muted)] leading-relaxed ${isCenter ? 'mx-auto' : ''} max-w-2xl`}>
          {description}
        </p>
      )}
    </div>
  );
}
