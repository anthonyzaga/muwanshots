import { useState, useEffect, useRef, useMemo } from 'react';
import { decode } from 'blurhash';

/**
 * LazyImage - preserves original API (src, alt, className, imgClassName)
 * Extended for optimized gallery: supports srcSet, sizes, width, height, blurHash, placeholder
 * Shows blurhash canvas → shimmer → optimized image with layout stability via width/height
 */
const LazyImage = ({ src, alt, className = '', imgClassName = '', srcSet, sizes, width, height, blurHash, placeholder }) => {
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
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Decode blurHash to data URL for placeholder
  const blurDataUrl = useMemo(() => {
    if (!blurHash) return placeholder || null;
    try {
      const size = 32;
      const pixels = decode(blurHash, size, size);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(size, size);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL();
    } catch {
      return placeholder || null;
    }
  }, [blurHash, placeholder]);

  // Use width/height for aspect ratio container to prevent CLS
  const aspectStyle = width && height ? { aspectRatio: `${width}/${height}` } : undefined;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={aspectStyle}>
      {/* Blur placeholder or shimmer while loading */}
      {!isLoaded && blurDataUrl && (
        <img src={blurDataUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-[12px] scale-105" />
      )}
      {!isLoaded && !blurDataUrl && (
        <div className="absolute inset-0 shimmer" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          width={width}
          height={height}
          decoding="async"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      )}
    </div>
  );
};

export default LazyImage;
