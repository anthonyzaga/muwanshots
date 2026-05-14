import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle } from 'lucide-react';
import content from '../content/content.json';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = content.navigation;

  return (
    <>
      <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-luxury-black/90 backdrop-blur-lg py-4 shadow-xl' : 'bg-transparent py-6'
        }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <motion.a
          href="#home"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <img
            src="/logo-light.png"
            alt="Muwanshots Photography"
            className={`object-contain transition-all duration-500 drop-shadow-lg ${isScrolled ? 'h-10' : 'h-12'
              }`}
          />
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative text-sm font-medium hover:text-white transition-colors text-luxury-silver uppercase tracking-widest group"
            >
              {link.name}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-luxury-gold transition-all duration-300 group-hover:w-full rounded-full"></span>
            </motion.a>
          ))}
          <motion.a
            href={content.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="btn-primary flex items-center gap-2 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300"
          >
            <MessageCircle size={18} />
            Book Now
          </motion.a>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay & Drawer */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
          
          {/* Side Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[100dvh] w-[80vw] max-w-sm bg-luxury-black/95 backdrop-blur-2xl z-50 md:hidden flex flex-col pt-24 px-8 shadow-2xl border-l border-white/5 overflow-y-auto"
          >
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            <div className="flex flex-col space-y-8 mt-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + (i * 0.1) }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-3xl font-serif text-white hover:text-luxury-gold transition-colors border-b border-white/10 pb-4"
                >
                  {link.name}
                </motion.a>
              ))}
            </div>

            <motion.a
              href={content.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="btn-primary w-full text-center mt-12 py-4 flex items-center justify-center gap-2 mb-10"
            >
              <MessageCircle size={20} />
              Book Now
            </motion.a>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};

export default Navbar;
