import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle } from 'lucide-react';
import content from '../../content/content.json';
import { ThemeToggle } from '../ui/ThemeToggle';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

const links = [
  { name: 'Home', to: '/' },
  { name: 'Gallery', to: '/gallery' },
  { name: 'Services', to: '/services' },
  { name: 'About', to: '/about' },
  { name: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // body lock + focus trap
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // focus first link after frame
      setTimeout(() => drawerRef.current?.querySelector('a,button')?.focus(), 50);
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 border-b ${isScrolled ? 'bg-[var(--bg)]/85 backdrop-blur-xl border-[var(--border)] shadow-sm py-3' : 'bg-transparent border-transparent py-4 sm:py-5'}`}
        role="banner"
      >
        <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Muwan Shots home">
            <img src="/logo-light.png" alt="Muwan Shots" className={`object-contain transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-10'} hidden dark:block`} />
            <img src="/logo-dark.png" alt="" aria-hidden className={`object-contain transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-10'} block dark:hidden`} />
            <span className="hidden sm:block font-serif font-semibold tracking-tight text-[15px] leading-none text-[var(--text-primary)]">MUWAN<br/>SHOTS</span>
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
            {links.map(l => {
              const isGallery = l.to === '/gallery';
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => {
                    const active = isActive || (isGallery && location.pathname.startsWith('/gallery'));
                    return `px-3.5 py-2 rounded-full text-[13px] font-medium tracking-wide transition-colors ${active ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`;
                  }}
                >
                  {l.name.toUpperCase()}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center">
              <ThemeToggle variant="compact" />
            </div>
            <Link
              to="/booking"
              className="hidden lg:inline-flex items-center gap-2 bg-[var(--text-primary)] text-[var(--bg)] h-10 px-6 rounded-full text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} aria-hidden /> Book Now
            </Link>
            {/* external WhatsApp fallback small */}
            <a href={content.contact.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="hidden lg:inline-flex w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] items-center justify-center hover:bg-[var(--surface-hover)] lg:hidden">
              <MessageCircle size={16} />
            </a>
            <button
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
              aria-controls="mobile-drawer"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.div
              id="mobile-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={prefersReduced ? { duration: 0.01 } : { type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-[100dvh] w-[88vw] max-w-[380px] bg-[var(--bg)] border-l border-[var(--border)] z-40 lg:hidden flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <span className="font-serif font-semibold tracking-tight">MUWAN SHOTS</span>
                <button ref={closeBtnRef} onClick={() => setOpen(false)} aria-label="Close menu" className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] inline-flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-8">
                <nav aria-label="Mobile" className="flex flex-col gap-1">
                  {links.map((l, i) => {
                    const isGallery = l.to === '/gallery';
                    return (
                    <motion.div key={l.to} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: prefersReduced ? 0 : 0.05 + i * 0.04 }}>
                      <NavLink
                        to={l.to}
                        end={l.to === '/'}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) => {
                          const active = isActive || (isGallery && location.pathname.startsWith('/gallery'));
                          return `flex items-center justify-between py-3.5 text-[1.35rem] font-serif tracking-tight border-b border-[var(--border)] ${active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`;
                        }}
                      >
                        {({ isActive: navActive }) => {
                          const active = navActive || (isGallery && location.pathname.startsWith('/gallery'));
                          return (<><span>{l.name}</span>{active && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}</>);
                        }}
                      </NavLink>
                    </motion.div>
                  )})}
                </nav>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-xs tracking-[0.16em] uppercase text-[var(--text-muted)] font-medium">Theme</span>
                  <ThemeToggle variant="segmented" />
                </div>
                <div className="mt-8">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">Photography &amp; videography for weddings, celebrations and meaningful occasions in Masaka &amp; Kampala.</p>
                  <div className="mt-6 flex gap-3 text-xs text-[var(--text-secondary)]">
                    <a href={`tel:${content.contact.phone}`} className="underline underline-offset-4">{content.contact.phone}</a>
                    <a href={`mailto:${content.contact.email}`} className="underline underline-offset-4 truncate">{content.contact.email}</a>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]/50">
                <Link to="/booking" onClick={() => setOpen(false)} className="w-full inline-flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--bg)] h-12 rounded-full font-semibold">
                  <MessageCircle size={18} /> Book Your Date
                </Link>
                <a href={content.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 w-full inline-flex items-center justify-center gap-2 h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm">
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* spacer */}
      <div aria-hidden className="h-[64px] sm:h-[72px]" />
    </>
  );
}
export default Navbar;
