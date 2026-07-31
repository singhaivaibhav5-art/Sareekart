import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Sparkles, Layers, ChevronLeft, ChevronRight, Eye, Move } from 'lucide-react';

interface ZariZoomViewerProps {
  images: string[];
  initialIndex?: number;
  productName: string;
  fabric?: string;
  work?: string;
  onClose: () => void;
}

export const ZariZoomViewer: React.FC<ZariZoomViewerProps> = ({
  images,
  initialIndex = 0,
  productName,
  fabric = 'Pure Silk',
  work = 'Zari Weave',
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGestureHint, setShowGestureHint] = useState(true);

  // Touch gesture refs
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = images[currentIndex] || images[0];

  // Hide gesture hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGestureHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // Reset zoom position when image changes
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  // Clamp position so image doesn't pan out of viewport bounds
  const getClampedPosition = useCallback((newX: number, newY: number, currentScale: number) => {
    if (!containerRef.current || currentScale <= 1) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = (rect.width * (currentScale - 1)) / 2;
    const maxY = (rect.height * (currentScale - 1)) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    };
  }, []);

  // Zoom controls helper
  const handleZoom = (delta: number) => {
    setScale((prevScale) => {
      const nextScale = Math.min(Math.max(1, prevScale + delta), 5);
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((prevPos) => getClampedPosition(prevPos.x, prevPos.y, nextScale));
      }
      return nextScale;
    });
  };

  const handleSetScale = (targetScale: number) => {
    setScale(targetScale);
    if (targetScale === 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      setPosition((prevPos) => getClampedPosition(prevPos.x, prevPos.y, targetScale));
    }
  };

  // Preset hotspots focus (e.g. Zari border, Pallu weave)
  const handleFocusArea = (area: 'border' | 'pallu' | 'center') => {
    setShowGestureHint(false);
    if (!containerRef.current) return;
    const targetScale = 3;
    const rect = containerRef.current.getBoundingClientRect();
    let targetY = 0;
    
    if (area === 'border') {
      targetY = (rect.height * (targetScale - 1)) / 2.5; // shift down to view top border/pallu
    } else if (area === 'pallu') {
      targetY = -(rect.height * (targetScale - 1)) / 2.5; // shift up to view bottom pallu
    }

    setScale(targetScale);
    setPosition(getClampedPosition(0, targetY, targetScale));
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setShowGestureHint(false);
    const zoomDelta = e.deltaY < 0 ? 0.3 : -0.3;
    handleZoom(zoomDelta);
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition(getClampedPosition(newX, newY, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Pinch & Pan
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setShowGestureHint(false);
    if (e.touches.length === 2) {
      // Start Pinch
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Check Double Tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap toggles between 1x and 2.5x
        if (scale > 1) {
          resetZoom();
        } else {
          handleSetScale(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Single Touch Drag
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      // Pinching
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = currentDist / initialPinchDistRef.current;
      const newScale = Math.min(Math.max(1, initialPinchScaleRef.current * ratio), 5);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((prevPos) => getClampedPosition(prevPos.x, prevPos.y, newScale));
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Panning
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPosition(getClampedPosition(newX, newY, scale));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-lg flex flex-col justify-between select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-amber-500/30 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-pink-950 flex items-center justify-center font-bold shadow-md">
            <Sparkles className="w-5 h-5 text-pink-950" />
          </div>
          <div>
            <h3 className="font-serif-royal font-bold text-sm sm:text-base text-amber-200 line-clamp-1">
              {productName}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="bg-amber-900/60 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                {fabric} • {work}
              </span>
              <span className="hidden sm:inline text-slate-400">
                HD Micro-Detail Zari Inspection
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full text-xs font-mono text-amber-300">
            <span>Scale:</span>
            <span className="font-bold">{Math.round(scale * 100)}%</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-pink-900/80 transition border border-slate-700"
            title="Close Zoom"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Floating Gesture Guide Banner */}
        {showGestureHint && (
          <div className="absolute top-4 z-30 bg-pink-950/90 border border-amber-400/50 backdrop-blur-md text-amber-200 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium animate-bounce pointer-events-none">
            <Move className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Pinch with 2 fingers or Double-Tap to Zoom & Pan Zari work</span>
          </div>
        )}

        {/* Scaled Image */}
        <div
          className="transition-transform ease-out duration-75 origin-center max-w-full max-h-full flex items-center justify-center p-2"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          }}
        >
          <img
            src={activeImage}
            alt={productName}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Left / Right Carousel Navigation Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => {
                setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/70 border border-amber-400/30 text-amber-300 hover:bg-pink-950 transition z-20 backdrop-blur shadow-lg"
              title="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/70 border border-amber-400/30 text-amber-300 hover:bg-pink-950 transition z-20 backdrop-blur shadow-lg"
              title="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Quick Zari Focus Presets Bar (Overlay) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-amber-500/40 p-1.5 sm:p-2 rounded-full backdrop-blur-md shadow-2xl">
          <span className="text-[10px] sm:text-xs font-bold text-amber-400 px-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Zari Focus:</span>
          </span>
          <button
            onClick={() => handleFocusArea('pallu')}
            className="bg-pink-900/70 hover:bg-pink-800 text-amber-200 text-[11px] px-2.5 py-1 rounded-full border border-pink-700 transition"
          >
            ✨ Pallu Weave
          </button>
          <button
            onClick={() => handleFocusArea('border')}
            className="bg-pink-900/70 hover:bg-pink-800 text-amber-200 text-[11px] px-2.5 py-1 rounded-full border border-pink-700 transition"
          >
            👑 Zari Border
          </button>
          <button
            onClick={() => handleSetScale(3)}
            className="bg-pink-900/70 hover:bg-pink-800 text-amber-200 text-[11px] px-2.5 py-1 rounded-full border border-pink-700 transition"
          >
            🌸 Motif Close-Up
          </button>
        </div>
      </div>

      {/* Bottom Toolbar & Thumbnails */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-white z-20">
        
        {/* Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-14 rounded-md overflow-hidden border-2 transition shrink-0 ${
                currentIndex === idx
                  ? 'border-amber-400 ring-2 ring-pink-600 scale-105'
                  : 'border-slate-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 p-1 rounded-full shadow-inner">
          <button
            onClick={() => handleZoom(-0.5)}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => handleSetScale(1)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                scale === 1 ? 'bg-amber-400 text-pink-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => handleSetScale(2.5)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                scale === 2.5 ? 'bg-amber-400 text-pink-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              2.5x
            </button>
            <button
              onClick={() => handleSetScale(4)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                scale === 4 ? 'bg-amber-400 text-pink-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              4x
            </button>
          </div>

          <button
            onClick={() => handleZoom(0.5)}
            disabled={scale >= 5}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          <button
            onClick={resetZoom}
            className="p-2 rounded-full hover:bg-pink-900/80 text-amber-300 transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
