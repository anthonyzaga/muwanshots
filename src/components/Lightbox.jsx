import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.4;

const Lightbox = ({ images = [], currentIndex, onClose, onNavigate }) => {
  const isOpen = currentIndex !== null && currentIndex !== undefined;
  const image = isOpen ? images[currentIndex] : null;

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

  /* =========================
     RESET ON IMAGE CHANGE
  ========================= */
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  const hasPrev = isOpen && currentIndex > 0;
  const hasNext = isOpen && currentIndex < images.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
        >

          {/* Toolbar */}
          <div className="absolute top-4 right-4 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-xl shadow-lg">

            <IconBtn onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>
              <ZoomOut size={18} />
            </IconBtn>

            <IconBtn onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>
              <ZoomIn size={18} />
            </IconBtn>

            <IconBtn onClick={resetZoom}>
              <RotateCcw size={18} />
            </IconBtn>

            <IconBtn onClick={onClose}>
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
            className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl"
          />

          {/* Navigation */}
          {hasPrev && (
            <NavBtn side="left" onClick={() => onNavigate(-1)}>
              <ChevronLeft />
            </NavBtn>
          )}

          {hasNext && (
            <NavBtn side="right" onClick={() => onNavigate(1)}>
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

const IconBtn = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
  >
    {children}
  </button>
);

const NavBtn = ({ children, onClick, side }) => (
  <button
    onClick={onClick}
    className={`absolute top-1/2 -translate-y-1/2 ${side === 'left' ? 'left-4' : 'right-4'} 
    p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md`}
  >
    {children}
  </button>
);

export default Lightbox;