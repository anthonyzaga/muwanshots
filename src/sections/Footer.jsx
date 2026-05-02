import React from 'react';
import content from '../content/content.json';

const Footer = () => {
  return (
    <footer className="py-12 bg-luxury-black border-t border-white/5">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-2xl font-serif font-bold text-white tracking-tighter">
          {content.brandName.toUpperCase()}
        </div>
        
        <p className="text-luxury-silver/40 text-sm font-light">
          {content.footer.copyright}
        </p>

        <div className="flex gap-6">
          <a href="#home" className="text-luxury-silver/60 hover:text-white text-xs uppercase tracking-widest transition-colors">Home</a>
          <a href="#gallery" className="text-luxury-silver/60 hover:text-white text-xs uppercase tracking-widest transition-colors">Gallery</a>
          <a href="#contact" className="text-luxury-silver/60 hover:text-white text-xs uppercase tracking-widest transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
