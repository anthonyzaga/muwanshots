import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone, ArrowUp, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import content from '../../content/content.json';

export function FAB() {
  const [searchParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isLightboxOpen = searchParams.has('photo');
  if (isLightboxOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2 items-end"
          >
            <a
              href={`tel:${content.contact.phone}`}
              aria-label={`Call ${content.contact.phone}`}
              className="inline-flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-4 py-3 shadow-lg hover:bg-[var(--surface-hover)] text-sm font-medium"
            >
              <span className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg)] inline-flex items-center justify-center shrink-0"><Phone size={16} /></span>
              Call
            </a>
            {showTop && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Scroll to top"
                className="inline-flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-full px-4 py-3 shadow-lg hover:bg-[var(--surface-hover)] text-sm font-medium"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg)] inline-flex items-center justify-center shrink-0"><ArrowUp size={16} /></span>
                Top
              </button>
            )}
            <a
              href={content.contact.whatsapp}
              target="_blank" rel="noopener noreferrer"
              aria-label="Book via WhatsApp"
              className="inline-flex items-center gap-3 bg-[#25D366] text-white rounded-full px-4 py-3 shadow-lg hover:brightness-95 text-sm font-semibold"
            >
              <span className="w-8 h-8 rounded-full bg-white text-[#25D366] inline-flex items-center justify-center shrink-0"><MessageCircle size={16} /></span>
              WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main fab */}
      <div className="flex items-center gap-2">
        {showTop && !expanded && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            className="hidden sm:inline-flex w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] items-center justify-center shadow-lg hover:bg-[var(--surface-hover)]"
          >
            <ArrowUp size={18} />
          </button>
        )}
        <motion.button
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Close actions' : 'Open WhatsApp and call actions'}
          whileTap={{ scale: 0.96 }}
          className={`inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 font-semibold shadow-xl transition-colors ${expanded ? 'bg-[var(--text-primary)] text-[var(--bg)]' : 'bg-[#25D366] text-white hover:brightness-95'}`}
        >
          {expanded ? <X size={18} /> : <MessageCircle size={18} />}
          <span className="text-sm">{expanded ? 'Close' : 'Book Now'}</span>
        </motion.button>
      </div>
    </div>
  );
}
export default FAB;
