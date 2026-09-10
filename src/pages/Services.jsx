import { Link } from 'react-router-dom';
import { Camera, Video, Heart, Users, GraduationCap, Cake, Building2, Baby, Aperture, Film } from 'lucide-react';
import Container from '../components/ui/Container';
import { PageHeader, Card } from '../components/ui/Card';
import LazyImage from '../components/LazyImage';
import { images as galleryImages } from '../content/gallery';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const services = [
  { icon: Heart, title: 'Wedding Photography', desc: 'Editorial direction + documentary candids. From preparations to reception - light, emotion and detail.', cat: 'weddings' },
  { icon: Users, title: 'Kukyala & Introduction', desc: 'Honouring tradition with warm, respectful coverage of your cultural milestone.', cat: 'kukyala' },
  { icon: GraduationCap, title: 'Graduation', desc: 'Celebrate achievement with clean, confident portraits and family moments.', cat: 'graduation' },
  { icon: Cake, title: 'Birthdays & Celebrations', desc: 'Joyful, human coverage for first birthdays, milestones and parties.', cat: 'birthday' },
  { icon: Building2, title: 'Corporate & Events', desc: 'Professional, on-brand imagery for launches, conferences and team moments.', cat: 'others' },
  { icon: Aperture, title: 'Indoor & Portrait Studio', desc: 'Headshots, family, maternity and baby - studio light crafted for skin and mood.', cat: 'indoor' },
  { icon: Camera, title: 'Outdoor & Lifestyle', desc: 'Golden-hour, gardens, lakesides - natural settings that breathe.', cat: 'outdoor' },
  { icon: Baby, title: 'Baby & Family', desc: 'Tender sessions for newborns, bumps and family bonds at home or studio.', cat: 'baby' },
];

const videoServices = [
  { icon: Film, title: 'Wedding Films', desc: 'Cinematic highlights and full-day coverage - vows, sound and atmosphere.' },
  { icon: Video, title: 'Event Videography', desc: 'Corporate, cultural and private events captured with movement and music.' },
  { icon: Aperture, title: 'Cinematic Coverage', desc: 'Slow motion, drone where appropriate, colour-true editing - story-led.' },
];

function ServiceCard({ s, idx }) {
  // Map old cat ids like 'baby' -> 'baby-shoots'
  const catMap = { baby: 'baby-shoots', 'baby-bump': 'baby-bump', outdoor: 'outdoor', indoor: 'indoor', headshots: 'headshots', others: 'others', weddings: 'weddings', kukyala: 'kukyala', graduation: 'graduation', birthday: 'birthday' };
  const slug = catMap[s.cat] || s.cat;
  const galleryImg = galleryImages.find(i=>i.category===slug) || galleryImages[idx % galleryImages.length];
  return (
    <Card hover className="overflow-hidden flex flex-col">
      <div className="aspect-[4/3] overflow-hidden relative">
        <LazyImage src={galleryImg?.src} srcSet={galleryImg?.srcSet} sizes="25vw" width={galleryImg?.width} height={galleryImg?.height} blurHash={galleryImg?.blurHash} alt={s.title} className="h-full w-full" />
        <div className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/90 text-black inline-flex items-center justify-center shadow"><s.icon size={16} /></div>
      </div>
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <h3 className="font-serif text-lg leading-tight">{s.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)] flex-1">{s.desc}</p>
        <div className="mt-4 flex gap-2">
          <Link to="/booking" className="text-sm font-medium underline underline-offset-4">Book</Link>
          <span className="text-[var(--border-strong)]">•</span>
          <Link to="/gallery" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">View gallery</Link>
        </div>
      </div>
    </Card>
  );
}

export default function Services() {
  useDocumentTitle('Services - Muwan Shots', 'Photography and videography services: weddings, kukyala, graduations, birthdays, corporate, portraits and cinematic films - Masaka & Kampala.');
  return (
    <>
      <Container>
        <PageHeader eyebrow="Services" title="Photography + Videography, tailored to your occasion." description="Choose stills, motion, or both. We adapt coverage to your timeline, venue and story - no packages forced, no hidden fees." />
        <div className="mt-3 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
            <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">How we work</p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>• Consult on WhatsApp - date, venue, coverage needs.</li>
              <li>• Clear scope: hours, deliverables, turnaround shared upfront.</li>
              <li>• On the day: calm direction + documentary eye.</li>
              <li>• Delivery: curated gallery + films, ready to share and print.</li>
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--accent)]/20 bg-[var(--accent)]/10 p-6">
            <p className="font-serif text-lg">Not sure what you need?</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Tell us your occasion and we’ll recommend coverage.</p>
            <Link to="/booking" className="mt-4 inline-flex h-10 px-6 rounded-full bg-[var(--text-primary)] text-[var(--bg)] text-sm font-semibold items-center justify-center">Get recommendation</Link>
          </div>
        </div>
      </Container>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 mt-10">
        <h2 className="font-serif text-2xl tracking-tight">Photography</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s,i)=> <ServiceCard key={s.title} s={s} idx={i} />)}
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 mt-12">
        <h2 className="font-serif text-2xl tracking-tight">Videography</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl">Films are story-led - ceremony audio, ambient sound, music and colour that matches your stills.</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {videoServices.map(v=>(
            <Card key={v.title} className="p-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center"><v.icon size={18} /></div>
              <h3 className="mt-3 font-serif text-lg">{v.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{v.desc}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-6 p-6 sm:p-7 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <p className="font-medium">Bundle: Photography + Videography</p>
            <p className="text-sm text-[var(--text-muted)]">One team, one visual language - stills and films that match.</p>
          </div>
          <Link to="/booking" className="inline-flex h-11 px-7 rounded-full bg-[var(--accent)] text-white font-semibold items-center justify-center shrink-0">Enquire for bundle</Link>
        </Card>
      </div>

      <Container className="mt-10 pb-8">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-soft)] p-6 sm:p-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <p className="text-sm text-[var(--text-secondary)]">Pricing is tailored to hours, location and deliverables. Share your date for a clear quote.</p>
          <Link to="/booking" className="inline-flex h-11 px-7 rounded-full bg-[var(--text-primary)] text-[var(--bg)] font-semibold items-center justify-center shrink-0">Check availability</Link>
        </div>
      </Container>
    </>
  );
}
