'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ShoppingBag, 
  Images,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useCartStore } from '@/store';
import { toast } from 'sonner';
import { resolveImageUrl } from '@/lib/images';
import { formatPrice } from '@/lib/pakistan-localization';

export interface LightboxProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  description?: string | null;
  material?: string | null;
}

interface ProductImageLightboxModalProps {
  product: LightboxProduct;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

// 100% verified reliable local & Cloudinary detail photos for 5-6 multi-angle viewing
const RELIABLE_CATEGORY_ANGLES: Record<string, string[]> = {
  'Living Room': [
    '/cat-thumb-sofas-2x.webp',
    '/cat-thumb-lshape-2x.webp',
    '/images/sofa_beige.webp',
    '/hero-living-room-img1-4k.webp',
  ],
  Sofas: [
    '/cat-thumb-sofas-2x.webp',
    '/cat-thumb-lshape-2x.webp',
    '/images/sofa_beige.webp',
    '/hero-living-room-img1-4k.webp',
  ],
  Bedroom: [
    '/cat-thumb-beds-2x.webp',
    '/cat-thumb-wardrobes-2x.webp',
    '/cat-thumb-showcase-2x.webp',
    '/cat-thumb-accessories-2x.webp',
  ],
  Beds: [
    '/cat-thumb-beds-2x.webp',
    '/cat-thumb-wardrobes-2x.webp',
    '/cat-thumb-showcase-2x.webp',
    '/cat-thumb-accessories-2x.webp',
  ],
  'Dining Room': [
    '/cat-thumb-dining-2x.webp',
    '/cat-thumb-centertables-2x.webp',
    '/cat-thumb-chairs-2x.webp',
    '/cat-thumb-showcase-2x.webp',
  ],
  Dining: [
    '/cat-thumb-dining-2x.webp',
    '/cat-thumb-centertables-2x.webp',
    '/cat-thumb-chairs-2x.webp',
    '/cat-thumb-showcase-2x.webp',
  ],
};

const DEFAULT_ANGLES = [
  '/cat-thumb-sofas-2x.webp',
  '/cat-thumb-beds-2x.webp',
  '/cat-thumb-dining-2x.webp',
  '/hero-living-room-img1-4k.webp',
];

export default function ProductImageLightboxModal({
  product,
  isOpen,
  onClose,
  initialIndex = 0,
}: ProductImageLightboxModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Keep latest zoom & pan values in refs for native event listeners without closure lag
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const panPositionRef = useRef(panPosition);
  panPositionRef.current = panPosition;

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  const pinchStartRef = useRef<{
    dist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial index & reset states on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setIsImgLoading(true);
    }
  }, [isOpen, initialIndex]);

  // Reset loading whenever photo index changes
  useEffect(() => {
    setIsImgLoading(true);
  }, [currentIndex]);

  // Lock body scroll when lightbox is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Release dragging if mouse is lifted outside the browser window
  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Build the complete 5-6 picture gallery
  const galleryImages = useMemo(() => {
    const rawList: string[] = [];
    if (product.image) rawList.push(product.image);
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && typeof img === 'string') rawList.push(img);
      }
    }

    const uniqueImages = Array.from(new Set(rawList.filter(Boolean)));

    // Fill up to 5-6 angles using reliable local assets
    const fallbacks = RELIABLE_CATEGORY_ANGLES[product.category] || DEFAULT_ANGLES;
    const finalList = [...uniqueImages];

    for (const fb of fallbacks) {
      if (finalList.length >= 5) break;
      if (!finalList.includes(fb)) {
        finalList.push(fb);
      }
    }

    return finalList.map((img) => resolveImageUrl(img, product.category, 1400, 'good'));
  }, [product.image, product.images, product.category]);

  const totalImages = galleryImages.length;

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev >= totalImages - 1 ? 0 : prev + 1));
  }, [totalImages]);

  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsImgLoading(true);
    setCurrentIndex((prev) => (prev <= 0 ? totalImages - 1 : prev - 1));
  }, [totalImages]);

  // Keyboard navigation: Left/Right arrows, Escape, +/- for zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
      } else if (e.key === '-') {
        setZoomLevel((prev) => {
          const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // ── FOCAL POINT ZOOM TOWARD MOUSE CURSOR (WHEEL EVENT) ──
  // Zooms into wherever the user's cursor is pointing, exactly like a phone gallery!
  useEffect(() => {
    if (!isOpen) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();

      const rect = stage.getBoundingClientRect();
      // Mouse coordinates relative to the center of the viewport
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);

      const currentZoom = zoomLevelRef.current;
      const currentPan = panPositionRef.current;

      const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
      let nextZoom = Number((currentZoom * zoomFactor).toFixed(2));
      nextZoom = Math.min(4, Math.max(1, nextZoom));

      if (nextZoom === 1) {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
        return;
      }

      // Mathematical Focal Point formula:
      // Preserves the invariant image point directly under the mouse pointer
      const ratio = nextZoom / currentZoom;
      const nextPanX = mx - (mx - currentPan.x) * ratio;
      const nextPanY = my - (my - currentPan.y) * ratio;

      // Restrict pan bounds so image stays nicely on screen
      const maxPanX = (rect.width * (nextZoom - 0.4)) / 2;
      const maxPanY = (rect.height * (nextZoom - 0.4)) / 2;

      setZoomLevel(nextZoom);
      setPanPosition({
        x: Math.max(-maxPanX, Math.min(maxPanX, nextPanX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, nextPanY)),
      });
    };

    stage.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheelNative);
    };
  }, [isOpen]);

  // ── CLICK ON ANY DETAIL TO ZOOM DIRECTLY INTO THAT SPOT ──
  // Clicking anywhere zooms into that exact detail; clicking again resets to 1x
  const handleImageClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (zoomLevel > 1) {
      // Already zoomed: reset back to full view
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      // Zoom into the exact spot clicked
      const stage = stageRef.current;
      const targetZoom = 2.5;

      if (!stage) {
        setZoomLevel(targetZoom);
        return;
      }

      const rect = stage.getBoundingClientRect();
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);

      // Shift the clicked spot toward center of view
      const nextPanX = -mx * (targetZoom - 0.7);
      const nextPanY = -my * (targetZoom - 0.7);

      const maxPanX = (rect.width * (targetZoom - 0.4)) / 2;
      const maxPanY = (rect.height * (targetZoom - 0.4)) / 2;

      setZoomLevel(targetZoom);
      setPanPosition({
        x: Math.max(-maxPanX, Math.min(maxPanX, nextPanX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, nextPanY)),
      });
    }
  };

  // ── MOUSE DRAG / PAN LOGIC ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panPosition.x,
      startPanY: panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasDraggedRef.current = true;
    }

    const stage = stageRef.current;
    const rect = stage ? stage.getBoundingClientRect() : { width: 1200, height: 800 };
    const maxPanX = (rect.width * (zoomLevel - 0.2)) / 2;
    const maxPanY = (rect.height * (zoomLevel - 0.2)) / 2;

    const newX = dragStartRef.current.startPanX + deltaX;
    const newY = dragStartRef.current.startPanY + deltaY;

    setPanPosition({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ── TOUCH GESTURES: PINCH-TO-ZOOM + SINGLE FINGER PAN / SWIPE ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch to zoom
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const stage = stageRef.current;
      const rect = stage ? stage.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
      const midX = (t0.clientX + t1.clientX) / 2 - (rect.left + rect.width / 2);
      const midY = (t0.clientY + t1.clientY) / 2 - (rect.top + rect.height / 2);

      pinchStartRef.current = {
        dist,
        initialZoom: zoomLevelRef.current,
        initialPan: { ...panPositionRef.current },
        midpoint: { x: midX, y: midY },
      };
    } else if (e.touches.length === 1) {
      touchStartRef.current = e.touches[0].clientX;
      if (zoomLevelRef.current > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          startPanX: panPositionRef.current.x,
          startPanY: panPositionRef.current.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      // Pinch to zoom centered on touch midpoint
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const scaleDelta = currentDist / pinchStartRef.current.dist;
      let nextZoom = Number((pinchStartRef.current.initialZoom * scaleDelta).toFixed(2));
      nextZoom = Math.min(4, Math.max(1, nextZoom));

      const stage = stageRef.current;
      const rect = stage ? stage.getBoundingClientRect() : { width: 800, height: 600 };

      if (nextZoom === 1) {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      } else {
        const mx = pinchStartRef.current.midpoint.x;
        const my = pinchStartRef.current.midpoint.y;
        const ratio = nextZoom / pinchStartRef.current.initialZoom;
        const nextPanX = mx - (mx - pinchStartRef.current.initialPan.x) * ratio;
        const nextPanY = my - (my - pinchStartRef.current.initialPan.y) * ratio;

        const maxPanX = (rect.width * (nextZoom - 0.3)) / 2;
        const maxPanY = (rect.height * (nextZoom - 0.3)) / 2;

        setZoomLevel(nextZoom);
        setPanPosition({
          x: Math.max(-maxPanX, Math.min(maxPanX, nextPanX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, nextPanY)),
        });
      }
    } else if (e.touches.length === 1 && isDragging && zoomLevelRef.current > 1) {
      // 1 finger pan while zoomed in
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasDraggedRef.current = true;
      }
      const stage = stageRef.current;
      const rect = stage ? stage.getBoundingClientRect() : { width: 800, height: 600 };
      const maxPanX = (rect.width * (zoomLevelRef.current - 0.2)) / 2;
      const maxPanY = (rect.height * (zoomLevelRef.current - 0.2)) / 2;

      setPanPosition({
        x: Math.max(-maxPanX, Math.min(maxPanX, dragStartRef.current.startPanX + deltaX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, dragStartRef.current.startPanY + deltaY)),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchStartRef.current = null;
    setIsDragging(false);

    // If at 1x, handle swipe to next/prev photo
    if (e.changedTouches.length === 1 && zoomLevelRef.current <= 1 && touchStartRef.current !== null) {
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current - touchEnd;
      if (Math.abs(diff) > 45) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    touchStartRef.current = null;
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category || '',
    });
    toast.success(`Added ${product.name} to Cart 🛒`);
  };

  const handleImgError = (failedUrl: string) => {
    if (failedUrl) {
      setImgErrors((prev) => ({ ...prev, [failedUrl]: true }));
    }
    setIsImgLoading(false);
  };

  if (!mounted || !isOpen) return null;

  const targetImg = galleryImages[currentIndex] || product.image;
  const currentImg = imgErrors[targetImg]
    ? (product.image && !imgErrors[product.image] ? product.image : '/cat-thumb-sofas-2x.webp')
    : (targetImg || '/cat-thumb-sofas-2x.webp');

  return createPortal(
    <div 
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} Photo Lightbox`}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* ── TOP HEADER (CLOSE BUTTON, TITLE, ZOOM CONTROLS, COUNTER) ── */}
      <div className="relative z-50 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
        {/* Left: Close Button + Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15 shadow-md"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X size={20} />
          </button>

          <div className="hidden xs:block text-left">
            <h3 className="font-serif font-bold text-white text-sm sm:text-base leading-tight truncate max-w-[180px] sm:max-w-md">
              {product.name}
            </h3>
            <p className="text-[11px] text-[#C59B4B] font-semibold uppercase tracking-wider">
              {product.category || 'Handcrafted Luxury'}
            </p>
          </div>
        </div>

        {/* Center: Image Counter (e.g. Photo 2 of 5) */}
        <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/15 text-stone-200 text-xs sm:text-sm font-semibold shadow-xs">
          <Images size={14} className="text-[#C59B4B]" />
          <span>Photo {currentIndex + 1} of {totalImages}</span>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => {
              setZoomLevel((prev) => {
                const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
                if (next === 1) setPanPosition({ x: 0, y: 0 });
                return next;
              });
            }}
            disabled={zoomLevel <= 1}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          {/* Zoom Indicator */}
          <span className="text-white text-xs font-bold w-12 text-center hidden sm:inline-block">
            {Math.round(zoomLevel * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))))}
            disabled={zoomLevel >= 4}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          {/* Reset Zoom */}
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C59B4B] hover:bg-[#B88E4B] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Reset Zoom (0)"
              aria-label="Reset Zoom"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN IMAGE STAGE (INTERACTIVE PAN & ZOOM, SIDE ARROWS) ── */}
      <div 
        ref={stageRef}
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden px-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          touchAction: 'none',
        }}
      >
        {/* SIDE FLOATING PREV ARROW (<) - MATCHES FACEBOOK PHOTO VIEWER */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] min-h-[48px] rounded-full bg-white/15 hover:bg-white/30 active:scale-90 text-white border border-white/25 shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer backdrop-blur-md"
          title="Previous Photo (Left Arrow)"
          aria-label="Previous Photo"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>

        {/* SIDE FLOATING NEXT ARROW (>) - MATCHES FACEBOOK PHOTO VIEWER */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 sm:w-14 sm:h-14 min-w-[48px] min-h-[48px] rounded-full bg-white/15 hover:bg-white/30 active:scale-90 text-white border border-white/25 shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer backdrop-blur-md"
          title="Next Photo (Right Arrow)"
          aria-label="Next Photo"
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>

        {/* CENTER PRODUCT IMAGE WITH FOCAL ZOOM & PANNING */}
        <div 
          onClick={handleImageClick}
          className="relative max-w-[92vw] max-h-[75vh] flex items-center justify-center will-change-transform z-10 select-none"
          style={{
            transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
        >
          {/* High-res Loading Spinner */}
          {isImgLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 min-h-[200px]">
              <Loader2 size={36} className="text-[#C59B4B] animate-spin drop-shadow-md" />
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentImg}
            src={currentImg}
            alt={`${product.name} — Photo ${currentIndex + 1}`}
            draggable={false}
            onLoad={() => setIsImgLoading(false)}
            onError={() => handleImgError(targetImg)}
            className={`max-w-[88vw] max-h-[70vh] sm:max-h-[75vh] w-auto h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none pointer-events-none rounded-xl transition-opacity duration-200 ${
              isImgLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>

        {/* Interactive Helper Hint */}
        {zoomLevel === 1 ? (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <span className="bg-black/75 backdrop-blur-md text-stone-300 text-[11px] font-medium px-4 py-1.5 rounded-full border border-white/15 shadow-lg flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#C59B4B]" />
              <span>Click or scroll anywhere to zoom into that detail</span>
            </span>
          </div>
        ) : (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <span className="bg-black/75 backdrop-blur-md text-stone-300 text-[11px] font-medium px-4 py-1.5 rounded-full border border-white/15 shadow-lg flex items-center gap-1.5">
              <span>Drag to move • Click or double-click to reset view</span>
            </span>
          </div>
        )}
      </div>

      {/* ── BOTTOM THUMBNAILS STRIP & QUICK ACTIONS ── */}
      <div className="relative z-50 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Price Details */}
        <div className="hidden sm:flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block leading-none mb-1">
              Price
            </span>
            <span className="text-xl font-black text-white font-sans tracking-tight">
              Rs. {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Center: Horizontal Thumbnail Strip (Shows all 5-6 photos with direct fast loading) */}
        <div 
          data-scroll-container="horizontal"
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto max-w-[92vw] sm:max-w-[60vw] py-1 px-2 scrollbar-hide"
        >
          {galleryImages.map((thumbUrl, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={thumbUrl + idx}
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                  setCurrentIndex(idx);
                }}
                className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer bg-stone-900 ${
                  isActive
                    ? 'ring-2 ring-[#C59B4B] scale-110 shadow-[0_0_14px_rgba(197,155,75,0.8)] opacity-100'
                    : 'opacity-50 hover:opacity-100 ring-1 ring-white/20'
                }`}
                aria-label={`View Photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="eager"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/cat-thumb-sofas-2x.webp';
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Right: Add to Cart Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-2.5 sm:py-3 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
