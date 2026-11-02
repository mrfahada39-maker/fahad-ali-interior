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

  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });
  const hasDraggedRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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

  // Build the complete 5-6 picture gallery
  // Uses all real uploaded product images first, supplemented with 100% reliable local high-res angles
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
        setZoomLevel((prev) => Math.min(3, prev + 0.5));
      } else if (e.key === '-') {
        setZoomLevel((prev) => {
          const next = Math.max(1, prev - 0.5);
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

  // Mouse wheel zoom in/out with passive: false to allow e.preventDefault() without console warnings
  useEffect(() => {
    if (!isOpen) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
      } else {
        setZoomLevel((prev) => {
          const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
      }
    };

    stage.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheelNative);
    };
  }, [isOpen]);

  // Click to toggle zoom: 1x -> 2x -> 1x (ignoring drag releases)
  const handleImageClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Mouse drag panning when zoomed in
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
    setPanPosition({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Swipe for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
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
        {/* Left: Close Button + Title (Matches Facebook top-left) */}
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
            onClick={() => setZoomLevel((prev) => Math.min(3, Number((prev + 0.5).toFixed(1))))}
            disabled={zoomLevel >= 3}
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
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
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

        {/* CENTER PRODUCT IMAGE */}
        <div 
          onClick={handleImageClick}
          className="relative max-w-[92vw] max-h-[75vh] flex items-center justify-center transition-transform duration-150 ease-out will-change-transform z-10"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
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

        {/* Subtle Hint on First View */}
        {zoomLevel === 1 && (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <span className="bg-black/70 backdrop-blur-md text-stone-300 text-[11px] font-medium px-4 py-1.5 rounded-full border border-white/15 shadow-lg flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#C59B4B]" />
              <span>Scroll wheel or click to zoom in</span>
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
                    // Fallback to local sofa thumb if an external asset ever fails
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
