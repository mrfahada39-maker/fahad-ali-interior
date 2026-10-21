'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Crown, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Headphones, 
  Play, 
  ArrowRight, 
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { BUSINESS_CONTACT } from '@/lib/contact-config';

interface ModernLuxuryHeroProps {
  onShopClick?: () => void;
}

// Exactly 10 Luxury Categories matching screenshot images
const TEN_CATEGORIES = [
  { name: 'L-Shape', href: '/#signature-categories', img: '/cat-thumb-lshape-2x.webp' },
  { name: 'Beds', href: '/#signature-categories', img: '/cat-thumb-beds-2x.webp' },
  { name: 'Dining', href: '/#signature-categories', img: '/cat-thumb-dining-2x.webp' },
  { name: 'Coffee Chairs', href: '/#signature-categories', img: '/cat-thumb-chairs-2x.webp' },
  { name: 'Center Tables', href: '/#signature-categories', img: '/cat-thumb-centertables-2x.webp' },
  { name: 'Sofas', href: '/#signature-categories', img: '/cat-thumb-sofas-2x.webp' },
  { name: 'Wardrobes', href: '/#signature-categories', img: '/cat-thumb-wardrobes-2x.webp' },
  { name: 'TV Units', href: '/#signature-categories', img: '/cat-thumb-tvunits-2x.webp' },
  { name: 'Consoles', href: '/#signature-categories', img: '/cat-thumb-accessories-2x.webp' },
  { name: 'Showcases', href: '/#signature-categories', img: '/cat-thumb-showcase-2x.webp' },
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

  // Single unified slider controller with hydration grace period (keeps main thread idle during initial load)
  useEffect(() => {
    if (isPaused) return;

    let timer: NodeJS.Timeout | null = null;
    const delayTimer = setTimeout(() => {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      }, isDesktop ? 4000 : 3600);
    }, 1500);

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
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const whatsappVideoTourUrl = `https://wa.me/${BUSINESS_CONTACT.whatsapp}?text=${encodeURIComponent(
    'Assalam-o-Alaikum Fahad Ali Interior! I would like to request a 20-second live showroom video walkthrough of your latest luxury furniture commissions.'
  )}`;

  return (
    <div className="relative w-full bg-[#FAF6F0] text-[#1F1A17] overflow-hidden pt-[76px] sm:pt-20 lg:pt-28 pb-4 lg:pb-12">
      {/* Subtle Warm Ivory Ambient Background Gradients (Desktop Hardware Optimized) */}
      <div className="hidden sm:block absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#F2E5D0]/60 via-[#F7EFE2]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#EFE5D5]/50 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── DESKTOP & TABLET HERO (MATCHES USER SCREENSHOT 1 100%) ── */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-center pt-2 pb-4">
          
          {/* Left Column: Headlines, Trust Badges, Buttons */}
          <div className="col-span-6 2xl:col-span-5 flex flex-col items-start pr-2">
            
            {/* 1. Crown Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3EADB] border border-[#E4D5BE] text-[#9A7030] text-[11px] font-bold tracking-[0.18em] uppercase shadow-2xs mb-4">
              <Crown size={14} className="text-[#C59B4B] fill-[#C59B4B]" />
              <span>PREMIUM FURNITURE COLLECTION</span>
            </div>

            {/* 2. Main Title */}
            <h1 className="font-serif text-[48px] xl:text-[58px] 2xl:text-[66px] font-black text-[#1F1A17] leading-[1.06] tracking-tight mb-4">
              Luxury Furniture <br />
              <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#A67C37] bg-clip-text text-transparent italic font-normal">
                for Modern Living
              </span>
            </h1>

            {/* 3. Subtitle */}
            <p className="text-[15px] xl:text-[16px] text-[#6B5E55] leading-relaxed max-w-xl font-normal mb-6">
              Transform your home with premium furniture crafted for comfort, style and timeless elegance.
            </p>

            {/* 4. Trust Badges Row */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-xl mb-7">
              {[
                { icon: ShieldCheck, label: 'Premium Quality' },
                { icon: Truck, label: 'Safe & Fast Delivery' },
                { icon: CreditCard, label: 'Secure Payments' },
                { icon: Headphones, label: '24/7 Support' }
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div 
                    key={badge.label}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/95 border border-[#EAE1D5] shadow-[0_2px_10px_rgba(44,30,24,0.03)] text-center transition-transform hover:-translate-y-0.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#B88E4B] mb-1.5">
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                    <span className="text-[10.5px] font-bold text-[#2C1E18] leading-tight">
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 5. CTAs: Shop Collection + Watch Video */}
            <div className="flex items-center gap-5">
              <Link
                href="/#signature-categories"
                onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
                className="bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] hover:brightness-110 text-white font-serif font-bold text-sm xl:text-base px-8 py-3.5 rounded-full shadow-[0_8px_25px_rgba(184,142,75,0.3)] flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Shop Collection</span>
                <ArrowRight size={16} />
              </Link>

              <button
                type="button"
                onClick={() => setVideoModalOpen(true)}
                className="flex items-center gap-3 group cursor-pointer"
                aria-label="Watch Showroom Video"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-[#E8DFC8] shadow-md flex items-center justify-center text-[#B88E4B] group-hover:scale-110 group-hover:bg-[#FAF5ED] transition-all">
                  <Play size={16} className="fill-[#B88E4B] ml-0.5" />
                </div>
                <div className="text-left">
                  <p className="font-serif font-bold text-xs xl:text-sm text-[#1F1A17] group-hover:text-[#B88E4B] transition-colors">
                    Watch 20s Video
                  </p>
                  <p className="text-[11px] text-[#8C7A6D] font-medium">
                    Experience Luxury
                  </p>
                </div>
              </button>
            </div>

          </div>

          {/* Right Column: Hero Living Room Visual (Matches User Screenshot 1 100%) */}
          <div className="col-span-6 2xl:col-span-7 relative flex justify-end items-center">
            <div className="relative w-full aspect-[4/3] max-w-[760px] 2xl:max-w-[820px] rounded-[32px] overflow-hidden shadow-[0_20px_55px_rgba(44,30,24,0.08)] border border-[#E8DEC9] bg-[#FAF6F0]">
              <Image
                src="/hero-living-room-img1-4k.webp"
                alt="Fahad Ali Interior Luxury Living Room Showcase"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center transform hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ── MOBILE HERO (MATCHES DESIGN COMPACTLY WITH ZERO PRELOAD OVERHEAD) ── */}
        <div className="lg:hidden flex flex-col pt-1">
          {/* Mobile Living Room Banner */}
          <div className="relative -mx-4 sm:-mx-6 aspect-[16/9.2] overflow-hidden bg-[#FAF6F0] rounded-b-3xl">
            <Image
              src="/hero-living-room-mobile-img1.webp"
              alt="Fahad Ali Interior Luxury Living Room Showcase"
              fill
              sizes="100vw"
              className="object-cover object-[78%_center] sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0]/95 via-[#FAF6F0]/70 via-55% to-transparent pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col justify-center py-3 px-4 w-[75%] max-w-[280px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3EADB]/95 border border-[#E4D5BE] text-[#8C6222] text-[9.5px] font-black tracking-[0.14em] uppercase shadow-xs w-fit mb-1.5">
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
                  className="flex items-center justify-center gap-1.5 bg-white/95 border border-[#E8DFC8] min-h-[44px] px-4 py-2.5 rounded-full text-xs font-bold text-[#1F1A17] shadow-xs active:scale-95 cursor-pointer"
                  aria-label="Watch 20s Video"
                >
                  <Play size={11} className="fill-[#B88E4B] text-[#B88E4B]" />
                  <span>20s Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Feature Badges on Mobile */}
          <div className="w-full bg-white border border-[#EAE1D5] rounded-xl p-2 shadow-2xs grid grid-cols-4 divide-x divide-[#EFE7DC] text-center mt-2.5">
            {[
              { icon: ShieldCheck, title: 'Premium', sub: 'Quality' },
              { icon: Truck, title: 'Safe & Fast', sub: 'Delivery' },
              { icon: CreditCard, title: 'Secure', sub: 'Payments' },
              { icon: Headphones, title: '24/7', sub: 'Support' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.sub} className="flex flex-col items-center justify-center px-1">
                  <div className="w-5 h-5 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#B88E4B] mb-0.5">
                    <Icon size={12} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9.5px] font-bold text-[#2C1E18] leading-tight">
                    {item.title} <br /> {item.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SHOP BY CATEGORY SHELF (MATCHES USER SCREENSHOT 2 100%) ── */}
        <div 
          className="w-[calc(100%+1.5rem)] -mx-3 sm:w-full sm:mx-0 mt-6 xl:mt-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header Row: Title & Navigation Arrows */}
          <div className="flex items-center justify-between mb-3 px-2 sm:px-0">
            <div>
              <div className="w-8 h-1 bg-[#C59B4B] rounded-full mb-1.5" />
              <h3 className="font-serif font-black text-xl sm:text-2xl xl:text-3xl text-[#1F1A17] tracking-tight">
                Shop by Category
              </h3>
            </div>
            
            {/* Navigation Arrows (WCAG 44px Compliant on Mobile) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Category"
                className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Category"
                className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          {/* Sliding Category Track (Maximized Width, Minimal Side Gutters) */}
          <div data-scroll-container="horizontal" className="overflow-hidden w-full">
            <div 
              className="flex transition-transform duration-300 ease-out will-change-transform"
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
                    onClick={(e) => handleSmoothScroll(e, cat.href)}
                    className="group relative flex flex-col justify-between p-1.5 sm:p-2.5 rounded-[18px] sm:rounded-2xl bg-white border border-[#EAE1D5] shadow-xs hover:border-[#C59B4B] hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden aspect-[1.12/1] sm:aspect-[1.2/1] xl:aspect-[1.24/1]"
                  >
                    {/* Furniture Cutout Image (Wide Landscape Swatch, Snug Fit Without Dead Space) */}
                    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center p-0">
                      <Image
                        src={cat.img}
                        alt={cat.name}
                        width={280}
                        height={160}
                        className="max-h-full w-full object-contain group-hover:scale-106 transition-transform duration-300"
                      />
                    </div>

                    {/* Bottom Title & Circular Arrow */}
                    <div className="flex items-center justify-between pt-1 sm:pt-1.5 border-t border-[#F3ECE1] shrink-0 mt-0.5 px-0.5">
                      <span className="font-serif font-black text-[10.5px] xs:text-[11px] sm:text-xs xl:text-sm text-[#221814] group-hover:text-[#B88E4B] transition-colors truncate">
                        {cat.name}
                      </span>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FAF5ED] text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white transition-all flex items-center justify-center shadow-2xs shrink-0 ml-1">
                        <ArrowRight size={10} className="sm:hidden" />
                        <ArrowRight size={12} className="hidden sm:block" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator matching Image 1 */}
          <div className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to category slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === currentIndex ? 'w-6 bg-[#A68254]' : 'w-1.5 bg-[#E2D2BC]'
                }`}
              />
            ))}
          </div>

        </div>

      </div>

      {/* ── SHOWROOM VIDEO / CONCIERGE WALKTHROUGH MODAL ── */}
      {videoModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-2xl bg-[#1A110B] rounded-3xl overflow-hidden shadow-2xl border border-amber-300/30 p-6 sm:p-8 text-white text-center">
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Modal"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto mb-4">
              <Play size={28} className="fill-amber-300 ml-0.5" />
            </div>

            <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#FAF6F0] mb-2">
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
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare size={16} />
                <span>Request Live WhatsApp Video Tour</span>
              </a>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-serif uppercase tracking-wider rounded-xl transition-all"
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
