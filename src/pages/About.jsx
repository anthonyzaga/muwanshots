import { Link } from 'react-router-dom';
import { Quote, MapPin, Camera, Heart } from 'lucide-react';
import Container from '../components/ui/Container';
import { PageHeader, Card } from '../components/ui/Card';
import LazyImage from '../components/LazyImage';
import { images as galleryImages } from '../content/gallery';
import content from '../content/content.json';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function About() {
  useDocumentTitle('About - Muwan Shots', 'The Muwan Shots philosophy: cinematic, human photography and videography for weddings and meaningful occasions in Masaka & Kampala.');
  return (
    <>
      <Container>
        <PageHeader eyebrow="About" title="We make photographs that feel like memory." description="Muwan Shots is a Masaka-based studio working across Kampala and Central Uganda - where light, people and occasion meet." />
      </Container>

      <Container>
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] aspect-[4/3]">
            {(() => { const aboutImg = galleryImages.find(i=>i.category==='graduation') || galleryImages[0]; return <LazyImage src={aboutImg?.src} srcSet={aboutImg?.srcSet} width={aboutImg?.width} height={aboutImg?.height} blurHash={aboutImg?.blurHash} alt="Studio portrait" className="h-full w-full" />; })()}
          </div>
          <Card className="p-7 sm:p-8">
            <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">Our Story</p>
            <h2 className="mt-2 font-serif text-2xl leading-tight">Attention to people, respect for moments.</h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
              We started with a simple belief: the best images feel unforced. Whether it’s a church aisle, a family compound during kukyala, a graduation square or a quiet studio session, we look for gesture, light and connection - not just pose.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Our work blends editorial calm with documentary honesty. We direct when helpful, step back when the moment is already perfect, and edit for skin-true colour and timeless warmth.
            </p>
            <div className="mt-6 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] p-4 flex gap-3">
              <Quote size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed italic text-[var(--text-secondary)]">“Photography should let you return to how it felt - the laughter, the light, the people who stood beside you.”</p>
            </div>
          </Card>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card className="p-7">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center"><Camera size={16} /></div>
            <h3 className="mt-3 font-serif text-xl">Photography Philosophy</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Light-led, colour-true, gently directed. We favour real expressions, clean composition and images that print beautifully. Every gallery is curated - not a dump of everything - so your story reads clearly.</p>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li>• Studio control + natural light on location</li>
              <li>• Skin-tone priority, warm editorial palette</li>
              <li>• Curated galleries, print-ready files</li>
            </ul>
          </Card>
          <Card className="p-7">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center"><Heart size={16} /></div>
            <h3 className="mt-3 font-serif text-xl">Videography Philosophy</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">Films that breathe. We capture vows, laughter and ambient sound with unhurried coverage and cinematic pacing - highlights that feel present, not rushed.</p>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li>• Story-led, ceremony audio preserved</li>
              <li>• Colour matched to your stills</li>
              <li>• Highlights + full coverage options</li>
            </ul>
          </Card>
        </div>

        <Card className="mt-6 p-7 sm:p-8">
          <h3 className="font-serif text-xl">Our Approach</h3>
          <div className="mt-5 grid sm:grid-cols-3 gap-6 text-sm">
            <div><p className="font-semibold">1 - Listen</p><p className="text-[var(--text-muted)] mt-1 leading-relaxed">Your occasion, family, venue and must-have moments - we plan around what matters.</p></div>
            <div><p className="font-semibold">2 - Guide, don’t force</p><p className="text-[var(--text-muted)] mt-1 leading-relaxed">Gentle direction for groups, space for candid moments. You’ll feel looked-after, not performed.</p></div>
            <div><p className="font-semibold">3 - Edit with care</p><p className="text-[var(--text-muted)] mt-1 leading-relaxed">Careful colour, consistent tone across stills and films, delivered in a shareable online gallery.</p></div>
          </div>
        </Card>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex gap-3"><MapPin size={18} className="text-[var(--accent)] mt-0.5" /><div><h3 className="font-serif text-lg">Service Area</h3><p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">Based in Masaka, we regularly work in Kampala and across Central Uganda - Entebbe, Mpigi, Mubende and surrounds by arrangement. On-location or studio - we travel to you.</p><p className="mt-3 text-xs text-[var(--text-muted)]">Location: {content.contact.location}</p></div></div>
          </Card>
          <Card className="p-6 bg-[var(--text-primary)] text-[var(--bg)] border-transparent">
            <p className="text-sm font-medium">Ready to talk?</p>
            <p className="text-sm opacity-80 mt-1 leading-relaxed">Share your date and occasion - we’ll reply with availability.</p>
            <Link to="/booking" className="mt-4 inline-flex h-10 px-6 rounded-full bg-[var(--bg)] text-[var(--text-primary)] text-sm font-semibold items-center justify-center">Book your date</Link>
          </Card>
        </div>
      </Container>
      <div className="h-8" />
    </>
  );
}
