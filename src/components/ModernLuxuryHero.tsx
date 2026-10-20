'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ModernLuxuryHeroProps {
  onShopClick?: () => void;
}

// Exactly 10 Luxury Categories (Dividers & Dressing removed per user instruction)
const TEN_CATEGORIES = [
  { name: 'Sofas', href: '/#cat-section-living-room', img: '/cat-thumb-sofas-2x.webp' },
  { name: 'L-Shape', href: '/#cat-section-living-room', img: '/cat-thumb-lshape-2x.webp' },
  { name: 'Beds', href: '/#cat-section-bedroom', img: '/cat-thumb-beds-2x.webp' },
  { name: 'Dining', href: '/#cat-section-dining-room', img: '/cat-thumb-dining-2x.webp' },
  { name: 'Coffee Chairs', href: '/#cat-section-coffee-chairs', img: '/cat-thumb-chairs-2x.webp' },
  { name: 'Center Tables', href: '/#cat-section-center-tables', img: '/cat-thumb-centertables-2x.webp' },
  { name: 'Wardrobes', href: '/#cat-section-luxury-wardrobes', img: '/cat-thumb-wardrobes-2x.webp' },
  { name: 'TV Units', href: '/#cat-section-center-tables', img: '/cat-thumb-tvunits-2x.webp' },
  { name: 'Consoles', href: '/#cat-section-center-tables', img: '/cat-thumb-accessories-2x.webp' },
  { name: 'Showcases', href: '/#cat-section-luxury-showcase', img: '/cat-thumb-showcase-2x.webp' },
];

export default function ModernLuxuryHero({ onShopClick }: ModernLuxuryHeroProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Responsive Slider states: Desktop (5 visible at a time) and Mobile (3 visible at a time)
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isDesktopPaused, setIsDesktopPaused] = useState(false);
  const [isMobilePaused, setIsMobilePaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Desktop Slider Auto-play (slides automatically every 3.5s)
  useEffect(() => {
    if (isDesktopPaused) return;
    const timer = setInterval(() => {
      setDesktopIndex((prev) => (prev >= TEN_CATEGORIES.length - 5 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isDesktopPaused]);

  // Mobile Slider Auto-play (slides automatically every 3.2s)
  useEffect(() => {
    if (isMobilePaused) return;
    const timer = setInterval(() => {
      setMobileIndex((prev) => (prev >= TEN_CATEGORIES.length - 3 ? 0 : prev + 1));
    }, 3200);
    return () => clearInterval(timer);
  }, [isMobilePaused]);

  const handleDesktopPrev = () => {
    setDesktopIndex((prev) => (prev <= 0 ? TEN_CATEGORIES.length - 5 : prev - 1));
  };

  const handleDesktopNext = () => {
    setDesktopIndex((prev) => (prev >= TEN_CATEGORIES.length - 5 ? 0 : prev + 1));
  };

  const handleMobilePrev = () => {
    setMobileIndex((prev) => (prev <= 0 ? TEN_CATEGORIES.length - 3 : prev - 1));
  };

  const handleMobileNext = () => {
    setMobileIndex((prev) => (prev >= TEN_CATEGORIES.length - 3 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsMobilePaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handleMobileNext();
      } else {
        handleMobilePrev();
      }
    }
    touchStartX.current = null;
    setTimeout(() => setIsMobilePaused(false), 2000);
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative w-full bg-[#FAF6F0] text-[#1F1A17] overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-8 lg:pb-12">
      {/* Subtle Warm Ivory Ambient Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#F2E5D0]/60 via-[#F7EFE2]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#EFE5D5]/50 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── DESKTOP & TABLET LAYOUT (MATCHES DESKTOP MOCKUP 100%) ── */}
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

          {/* Right Column: Hero Living Room Visual (Matches Image 1 100%) */}
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


        {/* ── DESKTOP CATEGORY SHELF (10 CATEGORIES - 5 VISIBLE SLIDER, MATCHES IMAGE 3) ── */}
        <div 
          className="hidden lg:block w-full mt-6 xl:mt-8"
          onMouseEnter={() => setIsDesktopPaused(true)}
          onMouseLeave={() => setIsDesktopPaused(false)}
        >
          {/* Header Row: Title & Navigation Arrows directly on Warm Skin Background */}
          <div className="flex items-center justify-between mb-4 px-0.5">
            <div>
              <div className="w-8 h-1 bg-[#C59B4B] rounded-full mb-1.5" />
              <h3 className="font-serif font-black text-2xl xl:text-3xl text-[#1F1A17] tracking-tight">
                Shop by Category
              </h3>
            </div>
            
            {/* Desktop Navigation Arrows on Skin Background */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleDesktopPrev}
                aria-label="Previous Category"
                className="w-10 h-10 rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleDesktopNext}
                aria-label="Next Category"
                className="w-10 h-10 rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* 5-Item Viewport Track (Matches Image 3 100%) */}
          <div className="overflow-hidden w-full -mx-2 px-2">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${desktopIndex * 20}%)` }}
            >
              {TEN_CATEGORIES.map((cat) => (
                <div key={cat.name} className="w-1/5 shrink-0 px-2">
                  <Link
                    href={cat.href}
                    onClick={(e) => handleSmoothScroll(e, cat.href)}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-[#EAE1D5] shadow-xs hover:border-[#C59B4B] hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden h-[215px] xl:h-[230px]"
                  >
                    {/* Product Cutout Image (Ultra 4K, Large & Crisp) */}
                    <div className="relative w-full h-32 xl:h-36 flex items-center justify-center mb-1">
                      <Image
                        src={cat.img}
                        alt={cat.name}
                        width={280}
                        height={160}
                        className="max-h-full w-auto object-contain group-hover:scale-108 transition-transform duration-300"
                      />
                    </div>

                    {/* Bottom Title & Circular Arrow */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-[#F3ECE1]">
                      <span className="font-serif font-black text-sm xl:text-base text-[#221814] group-hover:text-[#B88E4B] transition-colors truncate">
                        {cat.name}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-[#FAF5ED] text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white transition-all flex items-center justify-center shadow-2xs shrink-0">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>



        {/* ── MOBILE LAYOUT (MATCHES MOBILE MOCKUP IMG 1 100%) ── */}
        <div className="lg:hidden flex flex-col pt-1">
          
          {/* 1. Full-Width Seamless Hero Scene matching Image 1 (No boxed card, seamless edge-to-edge) */}
          <div className="relative -mx-4 sm:-mx-6 aspect-[16/11.5] xs:aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-[#FAF6F0]">
            {/* Background 4K Living Room Scene */}
            <Image
              src="/hero-living-room-mobile-img1.webp"
              alt="Fahad Ali Interior Luxury Living Room Showcase"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[78%_center] sm:object-center"
            />

            {/* Soft Warm Ivory Gradient Overlay on left to guarantee crystal clear text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0]/95 via-[#FAF6F0]/70 via-55% to-transparent pointer-events-none" />

            {/* Content: Left-Aligned Badge, Heading, Subtitle & Buttons */}
            <div className="relative z-10 h-full flex flex-col justify-between py-3.5 xs:py-4 px-4 sm:px-6 w-[72%] xs:w-[68%] sm:w-[58%] max-w-[270px] sm:max-w-[320px]">
              
              {/* Top: Badge + Headline + Subtitle */}
              <div className="flex flex-col items-start">
                {/* Crown Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3EADB]/90 border border-[#E4D5BE] text-[#9A7030] text-[8.5px] xs:text-[9.5px] font-bold tracking-[0.14em] uppercase shadow-2xs w-fit mb-1.5">
                  <Crown size={11} className="text-[#C59B4B] fill-[#C59B4B]" />
                  <span>PREMIUM FURNITURE COLLECTION</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-serif text-[23px] xs:text-[26px] sm:text-[32px] font-black text-[#1F1A17] leading-[1.08] tracking-tight mb-1">
                  Luxury Furniture <br />
                  <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#A67C37] bg-clip-text text-transparent italic font-normal">
                    for a Better Living
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-[10.5px] xs:text-[11.5px] sm:text-[12.5px] text-[#6B5E55] leading-snug font-normal line-clamp-2">
                  Modern designs, premium quality and handcrafted furniture to transform your home.
                </p>
              </div>

              {/* Bottom: Action Buttons */}
              <div className="flex flex-col items-start gap-2 pt-1">
                {/* Shop Collection Button */}
                <Link
                  href="/#signature-categories"
                  onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
                  className="bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] active:scale-95 text-white font-serif font-bold text-[10.5px] xs:text-[11.5px] px-4 py-2 rounded-full shadow-[0_4px_15px_rgba(184,142,75,0.3)] flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <span>Shop Collection</span>
                  <ArrowRight size={13} />
                </Link>

                {/* Watch 20s Video Button */}
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="flex items-center gap-2 active:scale-95 cursor-pointer text-left w-fit"
                  aria-label="Watch Video"
                >
                  <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-white border border-[#E8DFC8] shadow-2xs flex items-center justify-center text-[#B88E4B] shrink-0">
                    <Play size={11} className="fill-[#B88E4B] ml-0.5" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-[10px] xs:text-[10.5px] text-[#1F1A17] leading-tight">
                      Watch 20s Video
                    </p>
                    <p className="text-[8.5px] xs:text-[9px] text-[#8C7A6D]">
                      Experience Luxury
                    </p>
                  </div>
                </button>
              </div>

            </div>

            {/* 3 Carousel Indicator Dots on bottom right over rug (Matches Image 1 100%) */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full z-10">
              <span className="w-2 h-2 rounded-full bg-[#C59B4B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* 2. Feature Cards Row (Mobile) */}
          <div className="w-full bg-white border border-[#EAE1D5] rounded-2xl p-2.5 shadow-2xs grid grid-cols-4 divide-x divide-[#EFE7DC] text-center mt-3">
            {[
              { icon: ShieldCheck, title: 'Premium', sub: 'Quality' },
              { icon: Truck, title: 'Safe & Fast', sub: 'Delivery' },
              { icon: CreditCard, title: 'Secure', sub: 'Payments' },
              { icon: Headphones, title: '24/7', sub: 'Support' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.sub} className="flex flex-col items-center justify-center px-1">
                  <div className="w-7 h-7 rounded-full bg-[#FAF5ED] flex items-center justify-center text-[#B88E4B] mb-1">
                    <Icon size={14} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9px] font-bold text-[#2C1E18] leading-tight">
                    {item.title} <br /> {item.sub}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3. Shop by Category (10 Categories - 3 on screen auto-sliding slider) */}
          <div 
            className="mt-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Header Row with Arrows */}
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div>
                <div className="w-7 h-0.5 bg-[#C59B4B] mb-1.5" />
                <h3 className="font-serif font-black text-lg text-[#1F1A17] tracking-tight">
                  Shop by Category
                </h3>
              </div>
              
              {/* Mobile Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleMobilePrev}
                  aria-label="Previous Category"
                  className="w-8 h-8 rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] flex items-center justify-center active:scale-95 shadow-xs cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleMobileNext}
                  aria-label="Next Category"
                  className="w-8 h-8 rounded-full bg-white border border-[#E2D2BC] text-[#8C7A6D] flex items-center justify-center active:scale-95 shadow-xs cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 3-Item Viewport Track on Mobile */}
            <div className="overflow-hidden w-full -mx-1 px-1">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${mobileIndex * (100 / 3)}%)` }}
              >
                {TEN_CATEGORIES.map((cat) => (
                  <div key={cat.name} className="w-1/3 shrink-0 px-1">
                    <Link
                      href={cat.href}
                      onClick={(e) => handleSmoothScroll(e, cat.href)}
                      className="flex flex-col justify-between p-2.5 rounded-2xl bg-white border border-[#EAE1D5] shadow-xs hover:border-[#C59B4B] active:scale-98 transition-all h-[130px]"
                    >
                      <div className="relative w-full h-16 flex items-center justify-center mb-1">
                        <Image
                          src={cat.img}
                          alt={cat.name}
                          width={140}
                          height={75}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#F3ECE1]">
                        <span className="font-serif font-bold text-[10.5px] text-[#221814] truncate">
                          {cat.name}
                        </span>
                        <div className="w-4 h-4 rounded-full bg-[#FAF5ED] text-[#B88E4B] flex items-center justify-center text-[9px] shrink-0">
                          →
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Pill Dots for Mobile */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: TEN_CATEGORIES.length - 2 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === mobileIndex ? 'w-5 bg-[#B88E4B]' : 'w-1.5 bg-[#E2D6C6]'
                  }`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── SHOWROOM VIDEO MODAL ── */}
      {videoModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <button
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Video"
            >
              <X size={20} />
            </button>
            <div className="aspect-video w-full bg-[#1A110B] flex items-center justify-center">
              <video
                src="https://res.cloudinary.com/dfd8rzojj/video/upload/q_auto,vc_h264/v1784920251/fahad-ali-interior/brand/fahad-ali-hero.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
