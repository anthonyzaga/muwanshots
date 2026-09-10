import { Link } from 'react-router-dom';

export function GalleryHero({ featured }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]">
      <div className="grid lg:grid-cols-5 gap-0">
        <div className="lg:col-span-3 p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
          <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[var(--accent)]">Gallery</p>
          <h1 className="mt-3 font-serif text-[clamp(1.9rem,4vw,3.2rem)] leading-[0.95] tracking-tight">Stories worth<br /><span className="italic font-normal">remembering.</span></h1>
          <p className="mt-4 text-[var(--text-muted)] leading-relaxed max-w-xl text-sm sm:text-base">
            Photography and videography for weddings, Kukyala, graduations, prom, and family milestones across Masaka & Kampala. Crafted with light, warmth and documentary honesty.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/booking" className="inline-flex items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-7 py-3 text-sm font-semibold">Book a Session</Link>
            <Link to="/contact" className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-7 py-3 text-sm font-medium">Talk to us</Link>
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="w-6 h-px bg-[var(--border)]" />
            <span>75 photographs · 6 collections · Cinematic stills</span>
          </div>
        </div>
        {featured && (
          <div className="lg:col-span-2 relative min-h-[280px] lg:min-h-[420px] overflow-hidden">
            <img
              src={featured.src}
              srcSet={featured.srcSet}
              sizes="(max-width: 1024px) 100vw, 40vw"
              width={featured.width}
              height={featured.height}
              alt={featured.alt}
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
              <p className="text-white text-xs tracking-[0.18em] uppercase drop-shadow">Featured · {featured.category}</p>
              <p className="text-white font-serif text-sm mt-1 line-clamp-1 drop-shadow">{featured.alt}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
