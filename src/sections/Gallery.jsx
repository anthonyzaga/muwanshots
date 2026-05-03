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
      <div className="container mx-auto px-4">

        {/* Categories */}
        <div className="relative mt-10">

          {/* Fade edges (premium look) */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-luxury-black to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-luxury-black to-transparent z-10" />

          {/* Scroll container */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-2 py-2">

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
          flex-shrink-0 px-6 py-3 rounded-full text-sm tracking-wide uppercase transition-all duration-300
          ${activeCategory === cat.id
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'}
        `}
              >
                {cat.title}
              </button>
            ))}

          </div>
        </div>

        {/*  MASONRY GRID */}
        <motion.div
          layout
          className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4"
        >
          <AnimatePresence>
            {activeImages.map((image, index) => {
              // Random heights for natural gallery feel
              const sizes = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[1/1]'];
              const randomSize = sizes[index % sizes.length];

              return (
                <motion.div
                  key={image.src}
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className={`break-inside-avoid overflow-hidden rounded-xl cursor-pointer group ${randomSize}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-xl">

                    {/* Image */}
                    <LazyImage
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white text-xs tracking-widest border border-white/40 px-4 py-1 rounded-full backdrop-blur-md">
                        VIEW
                      </span>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Lightbox */}
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