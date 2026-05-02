import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage — only starts loading when near the viewport.
 * Shows a shimmer skeleton while loading, then fades in.
 */
const LazyImage = ({ src, alt, className = '', imgClassName = '' }) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // only trigger once
        }
      },
      {
        rootMargin: '200px', // start loading 200px before it enters view
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Shimmer skeleton — shown until image is fully loaded */}
      {!isLoaded && (
        <div className="absolute inset-0 shimmer" />
      )}

      {/* Only render <img> once in view to prevent early network requests */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
};

export default LazyImage;
