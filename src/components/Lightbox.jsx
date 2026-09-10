import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.4;

// Color Extraction Utility (Canvas-based) - theme aware
const extractAverageColor = (src, isLight) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 50; 
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      try {
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
        if (isLight) {
          const lr = Math.floor(r * 0.15 + 255 * 0.85);
          const lg = Math.floor(g * 0.15 + 255 * 0.85);
          const lb = Math.floor(b * 0.15 + 255 * 0.85);
          resolve(`radial-gradient(circle at center, rgba(${lr}, ${lg}, ${lb}, 0.96) 0%, rgba(253,252,249,0.98) 100%)`);
        } else {
          const dr = Math.floor(r * 0.3); const dg = Math.floor(g * 0.3); const db = Math.floor(b * 0.3);
          resolve(`radial-gradient(circle at center, rgba(${dr}, ${dg}, ${db}, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)`);
        }
      } catch {
        resolve(isLight ? 'rgba(253,252,249,0.98)' : 'rgba(0,0,0,0.98)');
      }
    };
    img.onerror = () => resolve(isLight ? 'rgba(253,252,249,0.98)' : 'rgba(0,0,0,0.98)');
  });
};

const Lightbox = ({ images = [], currentIndex, onClose, onNavigate }) => {
  const isOpen = currentIndex !== null && currentIndex !== undefined && currentIndex >= 0 && currentIndex < images.length;
  const image = isOpen ? images[currentIndex] : null;
  const { resolved } = useTheme();
  const isLight = resolved === 'light';

  const [bgColor, setBgColor] = useState(isLight ? 'rgba(253,252,249,0.98)' : 'rgba(0,0,0,0.98)');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const dragStart = useRef(null);
  const velocity = useRef({ x: 0, y: 0 });
  const lastMove = useRef(null);

  /* =========================
     ZOOM (CURSOR-AWARE)
  ========================= */
  const zoomAtPoint = useCallback((direction, clientX, clientY) => {
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + direction * ZOOM_STEP));

      if (!containerRef.current) return next;

      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left - rect.width / 2;
      const offsetY = clientY - rect.top - rect.height / 2;

      const scaleRatio = next / prev;

      setPan(p => ({
        x: p.x - offsetX * (scaleRatio - 1),
        y: p.y - offsetY * (scaleRatio - 1)
      }));

      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });

      return next;
    });
  }, []);

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  /* =========================
     WHEEL (NO ERROR)
  ========================= */
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;

    const wheelHandler = (e) => {
      e.preventDefault();
      zoomAtPoint(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    };

    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', wheelHandler);
  }, [isOpen, zoomAtPoint]);

  /* =========================
     DRAG + INERTIA
  ========================= */
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    velocity.current = { x: 0, y: 0 };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newPan = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    };

    if (lastMove.current) {
      velocity.current = {
        x: newPan.x - lastMove.current.x,
        y: newPan.y - lastMove.current.y
      };
    }

    lastMove.current = newPan;
    setPan(newPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    // inertia
    const friction = 0.95;
    const animate = () => {
      velocity.current.x *= friction;
      velocity.current.y *= friction;

      setPan(p => ({
        x: p.x + velocity.current.x,
        y: p.y + velocity.current.y
      }));

      if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  /* =========================
     PINCH ZOOM (MOBILE)
  ========================= */
  const pinchStart = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches);
      pinchStart.current = { dist, zoom };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const newDist = getDistance(e.touches);
      const scale = newDist / pinchStart.current.dist;

      let newZoom = pinchStart.current.zoom * scale;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      setZoom(newZoom);
    }
  };

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const hasPrev = isOpen && currentIndex > 0;
  const hasNext = isOpen && currentIndex < images.length - 1;

  /* =========================
       RESET ON IMAGE CHANGE
    ========================= */
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (image?.src) {
      extractAverageColor(image.src, isLight).then(setBgColor);
    } else {
      setBgColor(isLight ? 'rgba(253,252,249,0.98)' : 'rgba(0,0,0,0.98)');
    }
  }, [currentIndex, image?.src, isLight]);

  /* =========================
      KEYBOARD & FOCUS
   ========================= */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(-1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(1);
    };
    // body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    // focus close button for accessibility
    setTimeout(()=> {
      const btn = containerRef.current?.querySelector('[data-close]');
      btn?.focus();
    }, 50);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, hasPrev, hasNext, onClose, onNavigate]);

  const chromeBg = isLight ? 'bg-white/80 border border-black/10' : 'bg-black/60';
  const chromeText = isLight ? 'text-black' : 'text-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={image?.alt || 'Image viewer'}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onClick={(e)=> { if (e.target===containerRef.current) onClose(); }}
          style={{ 
            background: bgColor,
            cursor: zoom > 1 ? 'grab' : 'default' 
          }}
        >

          {/* Counter */}
          <div className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${chromeBg} ${chromeText}`}>
            {currentIndex + 1} / {images.length}
          </div>

          {/* Toolbar */}
          <div className={`absolute top-4 right-4 flex gap-2 backdrop-blur-md p-2 rounded-xl shadow-lg border ${chromeBg}`}>

            <IconBtn onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))} ariaLabel="Zoom out" isLight={isLight}>
              <ZoomOut size={18} />
            </IconBtn>

            <IconBtn onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))} ariaLabel="Zoom in" isLight={isLight}>
              <ZoomIn size={18} />
            </IconBtn>

            <IconBtn onClick={resetZoom} ariaLabel="Reset zoom" isLight={isLight}>
              <RotateCcw size={18} />
            </IconBtn>

            <IconBtn onClick={onClose} ariaLabel="Close" dataClose isLight={isLight}>
              <X size={18} />
            </IconBtn>

          </div>

          {/* Image */}
          <motion.img
            src={image?.src}
            alt={image?.alt}
            draggable={false}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
            className={`max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl ${isLight ? 'shadow-[0_20px_60px_rgba(0,0,0,0.15)]' : 'shadow-2xl'}`}
          />

          {/* Navigation */}
          {hasPrev && (
            <NavBtn side="left" onClick={() => onNavigate(-1)} isLight={isLight}>
              <ChevronLeft />
            </NavBtn>
          )}

          {hasNext && (
            <NavBtn side="right" onClick={() => onNavigate(1)} isLight={isLight}>
              <ChevronRight />
            </NavBtn>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================
   UI COMPONENTS
========================= */

const IconBtn = ({ children, onClick, ariaLabel, dataClose, isLight }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    data-close={dataClose ? '' : undefined}
    className={`p-2 rounded-lg transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 ${isLight ? 'bg-black/5 hover:bg-black/10 text-black focus-visible:ring-black' : 'bg-white/10 hover:bg-white/20 text-white focus-visible:ring-white'}`}
  >
    {children}
  </button>
);

const NavBtn = ({ children, onClick, side, isLight }) => (
  <button
    onClick={onClick}
    aria-label={side === 'left' ? 'Previous image' : 'Next image'}
    className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-4' : 'right-4'} 
    p-3 rounded-full backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 border shadow-sm ${isLight ? 'bg-white/85 hover:bg-white text-black border-black/10 focus-visible:ring-black' : 'bg-white/10 hover:bg-white/20 text-white border-white/10 focus-visible:ring-white'}`}
  >
    {children}
  </button>
);

export default Lightbox;