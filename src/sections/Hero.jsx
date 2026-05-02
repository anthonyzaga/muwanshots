import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import content from '../content/content.json';

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <img
          src={content.hero.backgroundImage}
          alt="Hero Background"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/60 via-luxury-black/40 to-luxury-black" />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-luxury-gold uppercase tracking-[0.3em] text-sm font-semibold mb-4 block"
          >
            Luxury Photography
          </motion.span>
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 leading-tight">
            {content.hero.title.split(',').map((part, i) => (
              <span key={i} className="block">
                {part}{i === 0 ? ',' : ''}
              </span>
            ))}
          </h1>
          <p className="text-lg md:text-xl text-luxury-silver/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            {content.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href={content.hero.ctaHref} target="_blank" rel="noopener noreferrer" className="btn-primary">
              {content.hero.ctaText}
            </a>
            <a href="#gallery" className="btn-outline">
              Explore Gallery
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white/50"
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
