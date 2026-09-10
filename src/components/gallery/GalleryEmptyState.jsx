import { Link } from 'react-router-dom';
import { Camera, ArrowRight } from 'lucide-react';

export function GalleryEmptyState({ category }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center">
        <Camera size={18} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="mt-4 font-serif text-xl">More moments are coming soon.</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
        {category ? `${category.name} - ${category.description}` : 'This collection is being curated.'} Check back soon or get in touch with Muwan Shots for your event.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link to="/booking" className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">Book a Session <ArrowRight size={14} /></Link>
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium">Contact Us</Link>
      </div>
    </div>
  );
}
