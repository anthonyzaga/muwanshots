import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import content from '../content/content.json';
import Lightbox from '../components/Lightbox';
import LazyImage from '../components/LazyImage';

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState(content.gallery.categories[0].id);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const categories = content.gallery.categories;
  const activeImages = categories.find(cat => cat.id === activeCategory)?.images || [];

  return (
    <section id="gallery" className="py-24 bg-luxury-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Our Masterpieces
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full border transition-all duration-300 text-sm tracking-widest uppercase ${
                  activeCategory === cat.id
                    ? 'bg-white text-luxury-black border-white'
                    : 'bg-transparent text-luxury-silver border-white/20 hover:border-white'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {activeImages.map((image, index) => (
              <motion.div
                key={image.src}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="relative aspect-[4/5] overflow-hidden rounded-2xl cursor-pointer group"
                onClick={() => setSelectedIndex(index)}
              >
                <LazyImage
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-luxury-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white border border-white/40 px-6 py-2 rounded-full backdrop-blur-sm text-sm uppercase tracking-widest">
                    View Image
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <Lightbox
        images={activeImages}
        currentIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={(dir) =>
          setSelectedIndex(prev =>
            Math.min(activeImages.length - 1, Math.max(0, prev + dir))
          )
        }
      />
    </section>
  );
};

export default Gallery;
