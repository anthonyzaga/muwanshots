import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/nav/Navbar';
import FAB from '../components/fab/FAB';

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-soft)]">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="font-serif font-semibold tracking-tight text-lg leading-none">MUWAN<br/>SHOTS</div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">Photography &amp; Videography<br/>Masaka &amp; Kampala, Uganda</p>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">Cinematic storytelling for weddings, cultural ceremonies, milestones and everyday beauty.</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--text-primary)] mb-4">Explore</p>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li><a href="/" className="hover:text-[var(--text-primary)]">Home</a></li>
              <li><a href="/gallery" className="hover:text-[var(--text-primary)]">Gallery</a></li>
              <li><a href="/services" className="hover:text-[var(--text-primary)]">Services</a></li>
              <li><a href="/about" className="hover:text-[var(--text-primary)]">About</a></li>
              <li><a href="/contact" className="hover:text-[var(--text-primary)]">Contact</a></li>
              <li><a href="/booking" className="hover:text-[var(--text-primary)]">Book Now</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--text-primary)] mb-4">Services area</p>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>Weddings &amp; Kukyala</li>
              <li>Birthdays &amp; Graduations</li>
              <li>Indoor &amp; Outdoor Shoots</li>
              <li>Corporate &amp; Events</li>
              <li>Portrait &amp; Family</li>
              <li>Cinematic Videography</li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--text-primary)] mb-4">Get in touch</p>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li><a href="tel:+256705405254" className="hover:text-[var(--text-primary)]">+256 705 405 254</a></li>
              <li><a href="mailto:muwanshotsphotography@gmail.com" className="hover:text-[var(--text-primary)] break-all">muwanshotsphotography@gmail.com</a></li>
              <li>Masaka - Kampala, Uganda</li>
              <li className="pt-2 flex gap-3">
                <a href="https://www.instagram.com/muwanshotsphotography/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="underline underline-offset-4">Instagram</a>
                <a href="https://www.tiktok.com/@muwan214" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="underline underline-offset-4">TikTok</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} Muwan Shots Photography. All rights reserved.</p>
          <p>Built with care - Available across Uganda</p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout() {
  const location = useLocation();
  // Safety: clear any leftover Lightbox body lock when navigating between routes
  useEffect(() => {
    document.body.style.overflow = '';
    // ensure scroll to top on route change (gallery was staying at previous scroll)
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FAB />
    </div>
  );
}
