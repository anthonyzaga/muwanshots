import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Camera, Video, Sparkles, Heart, Users, MapPin, Phone, Mail } from 'lucide-react';
import content from '../content/content.json';
import { categories as galleryCategories, images as galleryImages } from '../content/gallery';
import Container from '../components/ui/Container';
import { Section, SectionHeading } from '../components/ui/Section';
import { Card } from '../components/ui/Card';
import LazyImage from '../components/LazyImage';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSiteSettings } from '../hooks/useSiteSettings';

function useFeatured() {
  return useMemo(() => {
    const picks = [];
    const withImages = galleryCategories.filter(c=>c.imageCount>0).slice(0,6);
    for (const cat of withImages) {
      const img = galleryImages.find(i=>i.category===cat.slug);
      if (img) picks.push({ ...img, category: cat.name, catId: cat.slug });
    }
    return picks;
  }, []);
}

function Hero() {
  const prefersReduced = usePrefersReducedMotion();
  const { settings } = useSiteSettings();
  // Split hero_title like "Capturing Moments, Creating Memories." into lines
  const titleParts = (settings.hero_title || content.hero.title || 'Capturing Moments, Creating Memories.').split(',').map(s => s.trim());
  return (
    <section className="relative min-h-[88svh] sm:min-h-[92svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={settings.hero_image || content.hero.backgroundImage} alt="" aria-hidden className="h-full w-full object-cover" fetchPriority="high" decoding="sync" />
        {/* adaptive overlay for light/dark */}
        <div className="absolute inset-0 bg-[var(--bg)]/10 dark:bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent dark:from-black dark:via-black/30 dark:to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent dark:from-black/50" />
      </div>
      <Container wide className="relative z-10 w-full">
        <div className="max-w-3xl">
          <motion.p
            initial={prefersReduced ? false : { opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5 text-xs tracking-[0.18em] uppercase text-white"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            {settings.hero_subtitle || content.hero.title?.split(',')[0] || 'Masaka • Kampala • Uganda'}
          </motion.p>
          <motion.h1
            initial={prefersReduced ? false : { opacity:0, y:18 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.08 }}
            className="mt-5 font-serif font-semibold leading-[0.9] tracking-tight text-white text-[clamp(2.4rem,6vw,4.8rem)]"
          >
            {titleParts[0] ? <>{titleParts[0]},<br/></> : null}<span className="italic font-normal text-white/90">{titleParts[1] || 'Creating Memories.'}</span>
          </motion.h1>
          <motion.p
            initial={prefersReduced ? false : { opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6, delay:0.16 }}
            className="mt-5 max-w-xl text-[15px] sm:text-lg leading-relaxed text-white/80"
          >
            {settings.hero_description || content.hero.subtitle}
          </motion.p>
          <motion.div
            initial={prefersReduced ? false : { opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6, delay:0.24 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link to={settings.hero_cta_url || '/booking'} className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors">
              {settings.hero_cta_text || 'Book Your Date'} <ArrowRight size={16} />
            </Link>
            <Link to="/gallery" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border border-white/30 text-white font-medium backdrop-blur bg-white/10 hover:bg-white/15 transition-colors">
              Explore Gallery
            </Link>
          </motion.div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5">Weddings</span>
            <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5">Kukyala</span>
            <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5">Graduations</span>
            <span className="rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5">Portraits</span>
          </div>
        </div>
      </Container>
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:1, duration:0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hidden sm:flex flex-col items-center gap-2"
        aria-hidden
      >
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <motion.span animate={{ y:[0,6,0] }} transition={{ repeat:Infinity, duration:1.8 }}><ChevronDown size={18} /></motion.span>
      </motion.div>
    </section>
  );
}

function FeaturedWork() {
  const featured = useFeatured();
  return (
    <Section>
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <SectionHeading eyebrow="Featured Work" title="Stories we’ve recently told" description="A small selection across weddings, kukyala, prom and cultural celebrations. Every frame is crafted to feel timeless." />
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:gap-3 transition-all">View full gallery <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 auto-rows-[280px] sm:auto-rows-[360px]">
          <div className="sm:col-span-7 relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] group">
            <LazyImage src={featured[0]?.src} srcSet={featured[0]?.srcSet} sizes="(max-width:640px) 100vw, 60vw" width={featured[0]?.width} height={featured[0]?.height} blurHash={featured[0]?.blurHash} alt={featured[0]?.alt || ''} className="h-full w-full" imgClassName="group-hover:scale-[1.03] transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6">
              <p className="text-xs tracking-[0.16em] uppercase text-white/70">{featured[0]?.category}</p>
              <h3 className="font-serif text-xl text-white">Elegance in natural light</h3>
            </div>
          </div>
          <div className="sm:col-span-5 flex flex-col gap-4 sm:gap-5">
            <div className="flex-1 relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] group">
              <LazyImage src={featured[1]?.src} srcSet={featured[1]?.srcSet} sizes="30vw" width={featured[1]?.width} height={featured[1]?.height} blurHash={featured[1]?.blurHash} alt={featured[1]?.alt || ''} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 p-5"><p className="text-xs uppercase tracking-wide text-white/70">{featured[1]?.category}</p><p className="font-serif text-white">Studio portraits, refined</p></div>
            </div>
            <div className="flex-1 relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] group">
              <LazyImage src={featured[2]?.src} srcSet={featured[2]?.srcSet} sizes="30vw" width={featured[2]?.width} height={featured[2]?.height} blurHash={featured[2]?.blurHash} alt={featured[2]?.alt || ''} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 p-5"><p className="text-xs uppercase tracking-wide text-white/70">{featured[2]?.category}</p><p className="font-serif text-white">Love, beautifully held</p></div>
            </div>
          </div>
          <div className="sm:col-span-5 relative overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
            <LazyImage src={featured[3]?.src} srcSet={featured[3]?.srcSet} sizes="30vw" width={featured[3]?.width} height={featured[3]?.height} blurHash={featured[3]?.blurHash} alt={featured[3]?.alt || ''} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 p-5"><p className="text-xs uppercase tracking-wide text-white/70">{featured[3]?.category}</p><p className="font-serif text-white">Cultural heritage in colour</p></div>
          </div>
          <div className="sm:col-span-7 relative overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
            <LazyImage src={featured[4]?.src} srcSet={featured[4]?.srcSet} sizes="60vw" width={featured[4]?.width} height={featured[4]?.height} blurHash={featured[4]?.blurHash} alt={featured[4]?.alt || ''} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 p-6"><p className="text-xs uppercase tracking-wide text-white/70">{featured[4]?.category}</p><p className="font-serif text-white">Milestones worth framing</p></div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ExploreCategories() {
  const cats = galleryCategories.filter(c=>c.imageCount>0);
  const empty = galleryCategories.filter(c=>c.imageCount===0);
  return (
    <Section className="bg-[var(--bg-soft)] border-y border-[var(--border)]">
      <Container>
        <SectionHeading eyebrow="Explore Categories" title="Find the story you’re looking for" description="Browse by occasion. Each category leads to a curated collection - deep gallery coming in Part 2." align="left" />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cats.map(cat => {
            const coverImg = galleryImages.find(i=>i.category===cat.slug);
            return (
            <Link key={cat.id} to="/gallery" className="group relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors">
              <div className="aspect-[4/3] overflow-hidden">
                <LazyImage src={coverImg?.src} srcSet={coverImg?.srcSet} sizes="(max-width:640px) 100vw, 33vw" width={coverImg?.width} height={coverImg?.height} blurHash={coverImg?.blurHash} alt={coverImg?.alt} className="h-full w-full" imgClassName="group-hover:scale-[1.04] transition-transform duration-700" />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg leading-tight">{cat.name}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{cat.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">Explore <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
              </div>
            </Link>
          )})}
        </div>
        {empty.length>0 && <div className="mt-6 flex flex-wrap gap-2">{empty.map(c => (<span key={c.id} className="rounded-full border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium opacity-60">{c.name} - soon</span>))}</div>}
      </Container>
    </Section>
  );
}

function ServicesPreview() {
  const services = [
    { title:'Wedding Photography', desc:'From intimate vows to grand receptions - emotion, light and detail preserved.', icon: Heart },
    { title:'Event Photography', desc:'Birthdays, graduations, kukyala and corporate gatherings covered with care.', icon: Users },
    { title:'Portrait & Studio', desc:'Indoor excellence - headshots, family, baby and maternity in refined light.', icon: Camera },
    { title:'Cinematic Videography', desc:'Movement, sound and story - films that feel as good as they look.', icon: Video },
  ];
  return (
    <Section>
      <Container>
        <SectionHeading eyebrow="Services" title="Photography + Videography" description="Choose what you need - stills, motion, or both. Every service is tailored to your occasion." />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(s => (
            <Card key={s.title} hover className="p-6 sm:p-7">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] inline-flex items-center justify-center"><s.icon size={18} /></div>
              <h3 className="mt-4 font-serif text-lg leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{s.desc}</p>
              <Link to="/services" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium">Learn more <ArrowRight size={14} /></Link>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium hover:bg-[var(--surface-hover)]">Explore all services <ArrowRight size={16} /></Link>
        </div>
      </Container>
    </Section>
  );
}

function Story() {
  const storyImg = galleryImages.find(i=>i.category==='kukyala') || galleryImages[0];
  const { settings } = useSiteSettings();
  return (
    <Section className="bg-[var(--bg-soft)] border-y border-[var(--border)]">
      <Container>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] aspect-[4/3] lg:aspect-[4/3.2]">
            <LazyImage src={storyImg?.src} srcSet={storyImg?.srcSet} width={storyImg?.width} height={storyImg?.height} blurHash={storyImg?.blurHash} alt="Muwan Shots story" className="h-full w-full" />
            <div className="absolute bottom-4 left-4 rounded-full bg-white text-black px-4 py-2 text-xs font-semibold shadow">Masaka • Kampala</div>
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] uppercase font-medium text-[var(--accent)]">Our Approach</p>
            <h2 className="mt-2 font-serif text-[clamp(1.7rem,3.5vw,2.6rem)] leading-[0.95] tracking-tight">{settings.about_title || 'We photograph how it felt, not just how it looked.'}</h2>
            <p className="mt-4 text-[var(--text-muted)] leading-relaxed">{settings.about_description || 'Muwan Shots is a Ugandan studio for people who value presence over pose. We balance editorial direction with documentary honesty - so your gallery feels calm, warm and true.'}</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-3"><Sparkles size={16} className="text-[var(--accent)] mt-0.5" /> Light-led, skin-tone true, gently cinematic.</li>
              <li className="flex gap-3"><Heart size={16} className="text-[var(--accent)] mt-0.5" /> People-first - relaxed, respectful, unhurried.</li>
              <li className="flex gap-3"><MapPin size={16} className="text-[var(--accent)] mt-0.5" /> At home in studios, gardens, chapels and family compounds across Central Uganda.</li>
            </ul>
            <div className="mt-8 flex gap-3">
              <Link to="/about" className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-3 text-sm font-semibold">Our story</Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium">Talk to us</Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function SelectedWork() {
  const imgs = galleryImages.slice(0,8);
  return (
    <Section>
      <Container>
        <div className="flex items-end justify-between gap-6 mb-8">
          <SectionHeading eyebrow="Selected Work" title="A quiet editorial selection" />
          <Link to="/gallery" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium">All work <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {imgs.map((img,i)=> (
            <div key={img.id} className={`relative overflow-hidden rounded-2xl border border-[var(--border)] ${i%3===0 ? 'aspect-[3/4]' : 'aspect-square'}`}>
              <LazyImage src={img.src} srcSet={img.srcSet} sizes="(max-width:640px) 50vw, 25vw" width={img.width} height={img.height} blurHash={img.blurHash} alt={img.alt} className="h-full w-full" />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Process() {
  const steps = [
    { n:'01', t:'Enquire', d:'Share your date, occasion and vision on WhatsApp or our booking form.' },
    { n:'02', t:'Plan', d:'We confirm coverage, location and light - simple, clear, no surprises.' },
    { n:'03', t:'Create', d:'On the day we direct gently and document honestly - you enjoy the moment.' },
    { n:'04', t:'Deliver', d:'A curated, colour-true gallery and films ready to share and print.' },
  ];
  return (
    <Section className="bg-[var(--bg-soft)] border-y border-[var(--border)]">
      <Container>
        <SectionHeading eyebrow="Process" title="Calm from enquiry to delivery" align="center" className="mx-auto text-center" />
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(s=>(
            <Card key={s.n} className="p-6">
              <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">{s.n}</p>
              <h3 className="mt-2 font-serif text-lg">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{s.d}</p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function BookingCTA() {
  const ctaBg = galleryImages.find(i=>i.category==='weddings') || galleryImages[0];
  const { settings } = useSiteSettings();
  return (
    <Section>
      <Container>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)]">
          <div className="absolute inset-0">
            <img src={ctaBg?.src} srcSet={ctaBg?.srcSet} sizes="100vw" width={ctaBg?.width} height={ctaBg?.height} alt="" aria-hidden className="h-full w-full object-cover opacity-[0.08] dark:opacity-[0.14]" />
          </div>
          <div className="relative grid lg:grid-cols-2 gap-8 p-7 sm:p-10 lg:p-12 items-center">
            <div>
              <p className="text-xs tracking-[0.22em] uppercase font-semibold text-[var(--accent)]">Bookings</p>
              <h2 className="mt-2 font-serif text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-tight">{settings.contact_title || 'Let’s make something timeless together.'}</h2>
              <p className="mt-3 text-[var(--text-muted)] leading-relaxed">{settings.contact_description || 'Tell us about your date and occasion. We’ll reply on WhatsApp with availability and next steps - typically within an hour.'}</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <Link to={settings.hero_cta_url || '/booking'} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-8 h-12 font-semibold w-full sm:w-auto">{settings.hero_cta_text || 'Book Your Date'} <ArrowRight size={16} /></Link>
              <a href={settings.whatsapp_url || content.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 h-11 text-sm font-medium w-full sm:w-auto">Chat on WhatsApp</a>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Phone size={12} /> {settings.phone || content.contact.phone} • {settings.location || content.contact.location}</p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ContactTease() {
  const { settings } = useSiteSettings();
  return (
    <Section className="!pt-0">
      <Container>
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-6 flex gap-4">
            <span className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] inline-flex items-center justify-center shrink-0"><Phone size={16} /></span>
            <div><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Call / WhatsApp</p><a href={`tel:${settings.phone || content.contact.phone}`} className="font-medium hover:underline">{settings.phone || content.contact.phone}</a><p className="text-xs text-[var(--text-muted)] mt-1">Tap to call • WhatsApp for bookings</p></div>
          </Card>
          <Card className="p-6 flex gap-4">
            <span className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] inline-flex items-center justify-center shrink-0"><Mail size={16} /></span>
            <div><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Email</p><a href={`mailto:${settings.email || content.contact.email}`} className="font-medium hover:underline break-all">{settings.email || content.contact.email}</a><p className="text-xs text-[var(--text-muted)] mt-1">We reply promptly</p></div>
          </Card>
          <Card className="p-6 flex gap-4">
            <span className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] inline-flex items-center justify-center shrink-0"><MapPin size={16} /></span>
            <div><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Location</p><p className="font-medium">{settings.location || content.contact.location}</p><p className="text-xs text-[var(--text-muted)] mt-1">Studio + on-location across Central Uganda</p></div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}

export default function Home() {
  const { settings } = useSiteSettings();
  useDocumentTitle(settings.default_meta_title || 'Muwan Shots - Photography & Videography in Masaka & Kampala', settings.default_meta_description || 'Cinematic photography and videography for weddings, kukyala, birthdays, graduations and meaningful occasions in Masaka & Kampala, Uganda.');
  return (
    <>
      <Hero />
      <FeaturedWork />
      <ExploreCategories />
      <ServicesPreview />
      <Story />
      <SelectedWork />
      <Process />
      <BookingCTA />
      <ContactTease />
    </>
  );
}
