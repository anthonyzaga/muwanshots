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
              className="text-sm font-medium hover:text-white transition-colors text-luxury-silver uppercase tracking-widest"
            >
              {link.name}
            </motion.a>
          ))}
          <motion.a
            href={content.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="btn-primary flex items-center gap-2"
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[70px] bg-luxury-black z-40 md:hidden flex flex-col items-center justify-center space-y-8 p-6"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-serif text-white hover:text-luxury-gold transition-colors"
              >
                {link.name}
              </a>
            ))}
            <a
              href={content.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center"
            >
              Book Now
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
