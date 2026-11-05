'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Play, 
  ArrowRight, 
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { BUSINESS_CONTACT } from '@/lib/contact-config';

interface ModernLuxuryHeroProps {
  onShopClick?: () => void;
}

// Exactly 10 Luxury Categories with precise section targets matching HomeSignatureCategories
const TEN_CATEGORIES = [
  { 
    name: 'L-Shape', 
    targetId: 'cat-section-sofas', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Sofas', 
    href: '/#cat-section-sofas', 
    img: '/cat-thumb-lshape-2x.webp' 
  },
  { 
    name: 'Beds', 
    targetId: 'cat-section-bedroom', 
    fallbackId: 'signature-categories', 
    targetCat: 'Bedroom', 
    href: '/#cat-section-bedroom', 
    img: '/cat-thumb-beds-2x.webp' 
  },
  { 
    name: 'Dining', 
    targetId: 'cat-section-dining-room', 
    fallbackId: 'signature-categories', 
    targetCat: 'Dining Room', 
    href: '/#cat-section-dining-room', 
    img: '/cat-thumb-dining-2x.webp' 
  },
  { 
    name: 'Coffee Chairs', 
    targetId: 'cat-section-coffee-tables', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Coffee Tables', 
    href: '/#cat-section-coffee-tables', 
    img: '/cat-thumb-chairs-2x.webp' 
  },
  { 
    name: 'Center Tables', 
    targetId: 'cat-section-coffee-tables', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Coffee Tables', 
    href: '/#cat-section-coffee-tables', 
    img: '/cat-thumb-centertables-2x.webp' 
  },
  { 
    name: 'Sofas', 
    targetId: 'cat-section-sofas', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Sofas', 
    href: '/#cat-section-sofas', 
    img: '/cat-thumb-sofas-2x.webp' 
  },
  { 
    name: 'Wardrobes', 
    targetId: 'cat-section-storage', 
    fallbackId: 'cat-section-bedroom', 
    targetCat: 'Storage', 
    href: '/#cat-section-storage', 
    img: '/cat-thumb-wardrobes-2x.webp' 
  },
  { 
    name: 'TV Units', 
    targetId: 'cat-section-tv-units', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'TV Units', 
    href: '/#cat-section-tv-units', 
    img: '/cat-thumb-tvunits-2x.webp' 
  },
  { 
    name: 'Consoles', 
    targetId: 'cat-section-accessories', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Accessories', 
    href: '/#cat-section-accessories', 
    img: '/cat-thumb-accessories-2x.webp' 
  },
  { 
    name: 'Showcases', 
    targetId: 'cat-section-storage', 
    fallbackId: 'cat-section-living-room', 
    targetCat: 'Storage', 
    href: '/#cat-section-storage', 
    img: '/cat-thumb-showcase-2x.webp' 
  },
];

export default function ModernLuxuryHero({ onShopClick }: ModernLuxuryHeroProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const touchStartX = useRef<number | null>(null);

  // Viewport detection via matchMedia (zero reflow, no resize storm)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const visibleItems = isDesktop ? 5 : 3;
  const maxIndex = Math.max(0, TEN_CATEGORIES.length - visibleItems);

  // Single unified slider controller with hydration grace period (runs on desktop only to eliminate mobile CPU throttling)
  useEffect(() => {
    if (isPaused || !isDesktop) return;

    let timer: NodeJS.Timeout | null = null;
    const delayTimer = setTimeout(() => {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, 5000);
    }, 6000);

    return () => {
      clearTimeout(delayTimer);
      if (timer) clearInterval(timer);
    };
  }, [isPaused, maxIndex, isDesktop]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    setTimeout(() => setIsPaused(false), 2500);
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (onShopClick) {
      e.preventDefault();
      onShopClick();
      return;
    }
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, cat: typeof TEN_CATEGORIES[0]) => {
    if (onShopClick) {
      e.preventDefault();
      onShopClick();
      return;
    }

    if (typeof window !== 'undefined') {
      const primaryEl = document.getElementById(cat.targetId);
      const fallbackEl = cat.fallbackId ? document.getElementById(cat.fallbackId) : null;
      const target = primaryEl || fallbackEl || document.getElementById('signature-categories');

      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

        // Highlight matching category pill in HomeSignatureCategories
        window.dispatchEvent(
          new CustomEvent('fahad_select_category', {
            detail: { category: cat.targetCat || cat.name },
          })
        );

        if (window.history) {
          window.history.pushState(null, '', `#${target.id}`);
        }
      }
    }
  };

  const whatsappVideoTourUrl = `https://wa.me/${BUSINESS_CONTACT.whatsapp}?text=${encodeURIComponent(
    'Assalam-o-Alaikum Fahad Ali Interior! I would like to request a 20-second live showroom video walkthrough of your latest luxury furniture commissions.'
  )}`;

  return (
    <div className="relative w-full bg-[#FAF6F0] text-[#1F1A17] overflow-hidden pt-[76px] sm:pt-20 lg:pt-22 pb-4 lg:pb-6">
      
      {/* ── LUXURY AMBIENT BACKGROUND GLOW & GEOMETRIC ACCENTS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Luxury Diamond Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#C59B4B_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.09]" />
        
        {/* Animated Luminous Orbs */}
        <div className="absolute -top-24 right-0 w-[650px] h-[650px] bg-gradient-to-bl from-[#EEDDC6]/70 via-[#F7EFE2]/40 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-32 -left-20 w-[550px] h-[550px] bg-gradient-to-tr from-[#EAD6BF]/60 via-[#FAF2E6]/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── DESKTOP & TABLET HERO (ELEGANT 2-COLUMN LUXURY SHOWCASE) ── */}
        <div className="hidden lg:grid grid-cols-12 gap-10 items-center pt-2 pb-6">
          
          {/* Left Column: Headlines, Trust Badges, Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-6 2xl:col-span-5 flex flex-col items-start pr-2"
          >
            
            {/* 1. Animated Crown Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FAF3E8] to-[#F5E8D3] border border-amber-300/80 text-[#8C6222] text-[11px] font-bold tracking-[0.2em] uppercase shadow-[0_2px_12px_rgba(184,142,75,0.12)] mb-5 backdrop-blur-xs"
            >
              <Crown size={14} className="text-[#B88E4B] fill-[#B88E4B] animate-bounce" style={{ animationDuration: '3s' }} />
              <span>HANDCRAFTED BESPOKE COLLECTION</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </motion.div>

            {/* 2. Main Title with Dynamic Gold Shimmer */}
            <h1 className="font-serif text-[48px] xl:text-[58px] 2xl:text-[66px] font-black text-[#1F1A17] leading-[1.04] tracking-tight mb-4">
              Luxury Furniture <br />
              <span className="relative inline-block mt-1">
                <span className="bg-gradient-to-r from-[#B88E4B] via-[#E5C989] to-[#996515] bg-clip-text text-transparent italic font-normal">
                  for Modern Living
                </span>
                {/* Glowing under-line */}
                <span className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-gradient-to-r from-[#B88E4B] via-[#E2C37A] to-transparent rounded-full shadow-[0_0_8px_rgba(184,142,75,0.6)]" />
              </span>
            </h1>

            {/* 3. Subtitle */}
            <p className="text-[15.5px] xl:text-[16.5px] text-[#5C4D44] leading-relaxed max-w-xl font-normal mb-8">
              Transform your sanctuary with 100% seasoned solid Sheesham timber, hand-tufted Italian fabrics, and heirloom architectural joinery handcrafted in Lahore.
            </p>

            {/* Modern CTAs: Shop Collection + Watch Video with Pulse Ripple */}
            <div className="flex items-center gap-5">
              {/* Primary Glowing Button with Shimmer Sweep */}
              <Link
                href="/#signature-categories"
                onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
                className="relative overflow-hidden group bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] hover:brightness-110 active:scale-95 text-white font-serif font-bold text-sm xl:text-base px-8 py-4 rounded-full shadow-[0_8px_28px_rgba(184,142,75,0.35)] flex items-center gap-3 transition-all duration-300 hover:shadow-[0_12px_36px_rgba(184,142,75,0.45)] hover:scale-105 cursor-pointer"
              >
                {/* Light sweep ray animation */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                <span>Shop Collection</span>
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Video Button with Sonar Radar Wave */}
              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="flex items-center gap-3 group cursor-pointer"
                aria-label="Watch Showroom Video"
              >
                <div className="relative">
                  {/* Pulsing Sonar Ring */}
                  <span className="absolute inset-0 rounded-full bg-[#B88E4B]/30 animate-ping opacity-75 pointer-events-none" />
                  <div className="relative w-12 h-12 rounded-full bg-white border border-[#E8DFC8] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center text-[#B88E4B] group-hover:scale-110 group-hover:bg-[#FAF5ED] group-hover:border-[#B88E4B] transition-all duration-300">
                    <Play size={16} className="fill-[#B88E4B] ml-0.5 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-serif font-bold text-xs xl:text-sm text-[#1F1A17] group-hover:text-[#B88E4B] transition-colors leading-tight">
                    Watch 20s Video
                  </p>
                  <p className="text-[11px] text-[#8C7A6D] font-medium leading-none mt-0.5">
                    Experience Atelier Craft
                  </p>
                </div>
              </button>
            </div>

          </motion.div>

          {/* Right Column: Hero Living Room Visual Showcase */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-6 2xl:col-span-7 relative flex justify-end items-center"
          >
            {/* Ambient Background Glow behind image frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C59B4B]/20 via-transparent to-[#9E7333]/15 rounded-[40px] blur-2xl transform scale-102 pointer-events-none" />

            <div className="group relative w-full aspect-[4/3] max-w-[760px] 2xl:max-w-[820px] max-h-[490px] xl:max-h-[520px] rounded-[32px] 2xl:rounded-[38px] overflow-hidden shadow-[0_25px_65px_rgba(44,30,24,0.12)] border-[2px] border-amber-300/60 bg-[#FAF6F0] transition-all duration-500 hover:shadow-[0_30px_80px_rgba(184,142,75,0.22)]">
              
              <Image
                src="/hero-living-room-img1-4k.webp"
                alt="Fahad Ali Interior Luxury Living Room Showcase"
                fill
                priority={false}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center transform group-hover:scale-103 transition-transform duration-1000 ease-out"
              />
              
              {/* Subtle Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none" />

            </div>
          </motion.div>

        </div>

        {/* ── MOBILE HERO (STREAMLINED & ELEGANT FOR TOUCH SCREENS) ── */}
        <div className="lg:hidden flex flex-col pt-1">
          {/* Mobile Living Room Banner */}
          <div className="relative -mx-4 sm:-mx-6 aspect-[16/9.2] overflow-hidden bg-[#FAF6F0] rounded-b-3xl shadow-sm">
            <Image
              src="/hero-living-room-mobile-img1.webp"
              alt="Fahad Ali Interior Luxury Living Room Showcase"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 0px"
              className="object-cover object-[78%_center] sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0]/95 via-[#FAF6F0]/75 via-55% to-transparent pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col justify-center py-3 px-4 w-[75%] max-w-[290px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3EADB]/95 border border-[#E4D5BE] text-[#8C6222] text-[9.5px] font-black tracking-[0.14em] uppercase shadow-2xs w-fit mb-1.5">
                <Crown size={11} className="text-[#B88E4B] fill-[#B88E4B]" />
                <span>PREMIUM COLLECTION</span>
              </div>

              <h1 className="font-serif text-[23px] sm:text-[28px] font-black text-[#1F1A17] leading-[1.08] tracking-tight mb-1.5">
                Luxury Furniture <br />
                <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#A67C37] bg-clip-text text-transparent italic font-black">
                  for Modern Living
                </span>
              </h1>

              <p className="text-[11px] text-[#4A3E36] font-medium leading-snug line-clamp-2 mb-2.5">
                Transform your home with handcrafted solid Sheesham luxury furniture.
              </p>

              <div className="flex items-center gap-2.5 pt-0.5">
                <Link
                  href="/#signature-categories"
                  onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
                  className="bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] active:scale-95 text-white font-serif font-black text-xs min-h-[44px] px-5 py-2.5 rounded-full shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Shop</span>
                  <ArrowRight size={13} />
                </Link>

                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-white/95 border border-[#E8DFC8] min-h-[44px] px-4 py-2.5 rounded-full text-xs font-bold text-[#1F1A17] shadow-2xs active:scale-95 cursor-pointer"
                  aria-label="Watch 20s Video"
                >
                  <Play size={11} className="fill-[#B88E4B] text-[#B88E4B]" />
                  <span>20s Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SHOP BY CATEGORY SHELF (ANIMATED LUXURY SWATCH CAROUSEL) ── */}
        <div 
          className="w-[calc(100%+1.5rem)] -mx-3 sm:w-full sm:mx-0 mt-5 xl:mt-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header Row: Title & Modern Navigation Pill Controls */}
          <div className="flex items-center justify-between mb-3 px-2 sm:px-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-[#B88E4B] to-[#996515] rounded-full" />
              <div>
                <h2 className="font-serif font-black text-xl sm:text-2xl xl:text-3xl text-[#1F1A17] tracking-tight">
                  Shop by Category
                </h2>
                <p className="text-[11px] text-[#7A6354] hidden sm:block">
                  Explore bespoke handcrafted pieces for every corner of your home
                </p>
              </div>
            </div>
            
            {/* Modern Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Category"
                className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-full bg-white hover:bg-[#FAF5ED] border border-[#E2D2BC] hover:border-[#B88E4B] text-[#8C7A6D] hover:text-[#B88E4B] flex items-center justify-center transition-all duration-300 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Category"
                className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-full bg-white hover:bg-[#FAF5ED] border border-[#E2D2BC] hover:border-[#B88E4B] text-[#8C7A6D] hover:text-[#B88E4B] flex items-center justify-center transition-all duration-300 shadow-2xs active:scale-95 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Sliding Category Track */}
          <div data-scroll-container="horizontal" className="overflow-hidden w-full py-1">
            <div 
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / visibleItems)}%)` 
              }}
            >
              {TEN_CATEGORIES.map((cat) => (
                <div 
                  key={cat.name} 
                  className="w-1/3 sm:w-1/4 lg:w-1/5 shrink-0 px-1 sm:px-1.5 lg:px-2"
                >
                  <Link
                    href={cat.href}
                    onClick={(e) => handleCategoryClick(e, cat)}
                    className="group relative flex flex-col justify-between p-2 sm:p-2.5 rounded-[20px] sm:rounded-2xl bg-gradient-to-b from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#EAE1D5] hover:border-[#B88E4B] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(184,142,75,0.16)] transition-all duration-300 cursor-pointer overflow-hidden aspect-[1.12/1] sm:aspect-[1.2/1] xl:aspect-[1.24/1] hover:-translate-y-1"
                  >
                    {/* Top Right Subtle Sparkle on Hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-[#B88E4B]">
                      <Sparkles size={11} />
                    </div>

                    {/* Furniture Cutout Image */}
                    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center p-0">
                      <Image
                        src={cat.img}
                        alt={cat.name}
                        width={280}
                        height={160}
                        className="max-h-full w-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
                      />
                    </div>

                    {/* Bottom Title & Circular Arrow */}
                    <div className="flex items-center justify-between pt-1 sm:pt-1.5 border-t border-[#F3ECE1] shrink-0 mt-0.5 px-0.5">
                      <span className="font-serif font-black text-[10.5px] xs:text-[11px] sm:text-xs xl:text-sm text-[#221814] group-hover:text-[#B88E4B] transition-colors truncate">
                        {cat.name}
                      </span>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FAF5ED] text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xs shrink-0 ml-1">
                        <ArrowRight size={10} className="sm:hidden group-hover:translate-x-0.5 transition-transform" />
                        <ArrowRight size={12} className="hidden sm:block group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div suppressHydrationWarning className="flex items-center justify-center gap-1.5 mt-2.5 sm:mt-3">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to category slide ${i + 1}`}
                className="min-w-[20px] min-h-[20px] flex items-center justify-center cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentIndex ? 'w-7 bg-gradient-to-r from-[#B88E4B] to-[#996515] shadow-[0_0_6px_rgba(184,142,75,0.4)]' : 'w-1.5 bg-[#E2D2BC]'
                  }`}
                />
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* ── SHOWROOM VIDEO / CONCIERGE WALKTHROUGH MODAL ── */}
      {videoModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div className="relative w-full max-w-2xl bg-[#1A110B] rounded-3xl overflow-hidden shadow-2xl border border-amber-300/40 p-6 sm:p-8 text-white text-center">
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Modal"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Play size={28} className="fill-amber-300 ml-0.5" />
            </div>

            <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#FAF6F0] mb-2 tracking-tight">
              Atelier Video Walkthrough
            </h3>
            
            <p className="text-stone-300 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Experience the craftsmanship of our solid Sheesham joinery, kiln-dried timber frames, and hand-tufted Italian velvet upholstery directly from our Lahore workshop.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={whatsappVideoTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setVideoModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-110 active:scale-95 text-white font-serif font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(37,211,102,0.3)] cursor-pointer"
              >
                <MessageSquare size={16} />
                <span>Request Live WhatsApp Video Tour</span>
              </a>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-stone-200 text-xs font-serif uppercase tracking-wider rounded-full transition-all cursor-pointer"
              >
                Back to Showroom
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
