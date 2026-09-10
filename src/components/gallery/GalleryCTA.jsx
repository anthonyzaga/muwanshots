import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function GalleryCTA({ title = "Planning something worth remembering?", subtitle = "Let's capture it - warm, cinematic, and true to how it felt.", primaryTo = "/booking", primaryLabel = "Book a Session" }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div>
        <h3 className="font-serif text-lg sm:text-xl">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
      </div>
      <div className="flex gap-3 shrink-0">
        <Link to={primaryTo} className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">{primaryLabel} <ArrowRight size={14} /></Link>
        <a href="https://wa.me/256705405254" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-6 py-3 text-sm font-medium">WhatsApp Us</a>
      </div>
    </div>
  );
}
