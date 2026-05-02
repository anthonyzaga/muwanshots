import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

const Lightbox = ({ images = [], currentIndex, onClose, onNavigate }) => {
  const isOpen = currentIndex !== null && currentIndex !== undefined;
  const image = isOpen ? images[currentIndex] : null;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const dragStart = useRef(null);
  const imgRef = useRef(null);

  // Reset zoom & pan on image change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsLoaded(false);
  }, [currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      switch (e.key) {
        case 'Escape':     onClose(); break;
        case 'ArrowLeft':  onNavigate(-1); break;
        case 'ArrowRight': onNavigate(1); break;
        case '+': case '=': handleZoom(1); break;
        case '-':           handleZoom(-1); break;
        case '0':           resetZoom(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, currentIndex, zoom]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleZoom = useCallback((direction) => {
    setZoom(prev => {
      const next = prev + direction * ZOOM_STEP;
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      if (clamped === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return clamped;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const direction = e.deltaY < 0 ? 1 : -1;
    handleZoom(direction);
  }, [handleZoom]);

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  }, [zoom, resetZoom]);

  // Drag to pan (only when zoomed in)
  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Touch drag to pan
  const handleTouchStart = useCallback((e) => {
    if (zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e) => {
    if (!dragStart.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - dragStart.current.x, y: touch.clientY - dragStart.current.y });
  }, []);

  const hasPrev = isOpen && currentIndex > 0;
  const hasNext = isOpen && currentIndex < images.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {/* ── Top toolbar ── */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            {/* Image counter */}
            <span className="text-white/60 text-sm tracking-widest">
              {currentIndex + 1} / {images.length}
            </span>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <ToolBtn onClick={() => handleZoom(-1)} disabled={zoom <= MIN_ZOOM} title="Zoom out (-)">
                <ZoomOut size={18} />
              </ToolBtn>

              <button
                onClick={resetZoom}
                className="px-3 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all tabular-nums min-w-[52px] text-center"
                title="Reset zoom (0)"
              >
                {Math.round(zoom * 100)}%
              </button>

              <ToolBtn onClick={() => handleZoom(1)} disabled={zoom >= MAX_ZOOM} title="Zoom in (+)">
                <ZoomIn size={18} />
              </ToolBtn>

              {zoom > 1 && (
                <ToolBtn onClick={resetZoom} title="Reset (0)">
                  <RotateCcw size={18} />
                </ToolBtn>
              )}
            </div>

            {/* Close */}
            <ToolBtn onClick={onClose} title="Close (Esc)">
              <X size={20} />
            </ToolBtn>
          </div>

          {/* ── Image ── */}
          <div
            className="relative flex items-center justify-center w-full h-full px-16 py-20"
            onClick={(e) => {
              // Close only on direct backdrop click, not on controls
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              key={image?.src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative select-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Shimmer while loading */}
              {!isLoaded && (
                <div className="shimmer rounded-lg" style={{ width: 600, height: 400, maxWidth: '80vw', maxHeight: '70vh' }} />
              )}
              <img
                ref={imgRef}
                src={image?.src}
                alt={image?.alt}
                onLoad={() => setIsLoaded(true)}
                draggable={false}
                className={`rounded-lg shadow-2xl transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  maxWidth: 'min(90vw, 1200px)',
                  maxHeight: 'calc(100vh - 140px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </motion.div>
          </div>

          {/* ── Prev button ── */}
          <NavBtn
            direction="left"
            onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
            disabled={!hasPrev}
          >
            <ChevronLeft size={28} />
          </NavBtn>

          {/* ── Next button ── */}
          <NavBtn
            direction="right"
            onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
            disabled={!hasNext}
          >
            <ChevronRight size={28} />
          </NavBtn>

          {/* ── Bottom caption ── */}
          <div className="absolute bottom-0 left-0 right-0 py-4 text-center bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white/60 text-sm tracking-widest uppercase">{image?.alt}</p>
            <p className="text-white/30 text-xs mt-1">Double-click to zoom · Scroll to zoom · Drag to pan</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Small reusable toolbar button ── */
const ToolBtn = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      disabled
        ? 'text-white/20 cursor-not-allowed'
        : 'text-white/70 hover:text-white bg-white/10 hover:bg-white/20'
    }`}
  >
    {children}
  </button>
);

/* ── Prev / Next navigation button ── */
const NavBtn = ({ direction, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`absolute top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-200 ${
      direction === 'left' ? 'left-3' : 'right-3'
    } ${
      disabled
        ? 'text-white/15 bg-white/5 cursor-not-allowed'
        : 'text-white bg-white/15 hover:bg-white/30 active:scale-95'
    }`}
  >
    {children}
  </button>
);

export default Lightbox;
