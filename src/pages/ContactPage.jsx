import { Phone, Mail, MapPin, MessageCircle, Music, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../components/ui/Container';
import { PageHeader, Card } from '../components/ui/Card';
import content from '../content/content.json';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function ContactPage() {
  useDocumentTitle('Contact - Muwan Shots', 'Contact Muwan Shots in Masaka & Kampala: phone, WhatsApp, email and social. Let\'s plan your shoot.');
  const c = content.contact;
  return (
    <>
      <Container>
        <PageHeader eyebrow="Contact" title="We’d love to hear about your occasion." description="Reach us on WhatsApp for the fastest response - or call, email or message on social. We typically reply within an hour." />
      </Container>

      <Container>
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-6 sm:p-7 lg:col-span-2">
            <h2 className="font-serif text-xl">Get in touch</h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <a href={`tel:${c.phone}`} className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] transition-colors">
                <span className="w-10 h-10 rounded-xl bg-[var(--text-primary)] text-[var(--bg)] inline-flex items-center justify-center shrink-0"><Phone size={16} /></span>
                <span><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Phone</p><p className="font-medium">{c.phone}</p><p className="text-xs text-[var(--text-muted)]">Tap to call</p></span>
              </a>
              <a href={c.whatsapp} target="_blank" rel="noopener noreferrer" className="flex gap-4 p-4 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/10 hover:bg-[#25D366]/15 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-[#25D366] text-white inline-flex items-center justify-center shrink-0"><MessageCircle size={16} /></span>
                <span><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">WhatsApp</p><p className="font-medium">Chat on WhatsApp</p><p className="text-xs text-[var(--text-muted)]">Fastest for bookings</p></span>
              </a>
              <a href={`mailto:${c.email}`} className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] hover:bg-[var(--surface-hover)] transition-colors">
                <span className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] inline-flex items-center justify-center shrink-0"><Mail size={16} /></span>
                <span className="min-w-0"><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Email</p><p className="font-medium break-all text-sm">{c.email}</p></span>
              </a>
              <div className="flex gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]">
                <span className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] inline-flex items-center justify-center shrink-0"><MapPin size={16} /></span>
                <span><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Location</p><p className="font-medium">{c.location}</p><p className="text-xs text-[var(--text-muted)]">Studio + on-location</p></span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> Instagram
              </a>
              <a href={c.tiktok} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium">
                <Music size={16} /> TikTok
              </a>
            </div>
          </Card>

          <Card className="p-6 sm:p-7 bg-[var(--text-primary)] text-[var(--bg)] border-transparent flex flex-col">
            <h3 className="font-serif text-xl">Book your session</h3>
            <p className="mt-2 text-sm opacity-80 leading-relaxed">Share date, location and occasion - we’ll confirm availability on WhatsApp.</p>
            <div className="mt-6 space-y-3">
              <Link to="/booking" className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-[var(--bg)] text-[var(--text-primary)] font-semibold">Go to booking form <ArrowRight size={16} /></Link>
              <a href={c.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full border border-white/20 text-white font-medium">Message on WhatsApp</a>
            </div>
            <p className="mt-6 text-xs opacity-60">No call centre - you’ll speak directly with Muwan.</p>
          </Card>
        </div>

        {/* Static map placeholder - no invented address */}
        <Card className="mt-5 overflow-hidden">
          <div className="aspect-[16/7] sm:aspect-[16/6] bg-[var(--bg-soft)] relative flex items-center justify-center">
            <div className="text-center px-6">
              <MapPin size={24} className="mx-auto text-[var(--accent)]" />
              <p className="mt-2 font-medium">{c.location}</p>
              <p className="text-sm text-[var(--text-muted)]">Available for on-location shoots across the area.</p>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(c.location)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-medium">Open in Maps</a>
            </div>
          </div>
        </Card>
      </Container>
      <div className="h-8" />
    </>
  );
}
