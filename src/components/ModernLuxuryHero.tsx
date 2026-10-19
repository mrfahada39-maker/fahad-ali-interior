'use client';

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

interface ModernLuxuryHeroProps {
  onShopClick?: () => void;
}

const DESKTOP_SHELF_CATEGORIES = [
  { name: 'Sofas', href: '/#cat-section-living-room', img: '/cat-thumb-sofas-2x.webp' },
  { name: 'Beds', href: '/#cat-section-bedroom', img: '/cat-thumb-beds-2x.webp' },
  { name: 'Dining', href: '/#cat-section-dining-room', img: '/cat-thumb-dining-2x.webp' },
  { name: 'Wardrobes', href: '/#cat-section-luxury-wardrobes', img: '/cat-thumb-wardrobes-2x.webp' },
  { name: 'Chairs', href: '/#cat-section-coffee-chairs', img: '/cat-thumb-chairs-2x.webp' },
  { name: 'Accessories', href: '/#cat-section-center-tables', img: '/cat-thumb-accessories-2x.webp' },
];

const MOBILE_CATEGORIES = [
  { name: 'Sofas', href: '/#cat-section-living-room', img: '/cat-thumb-sofas-2x.webp' },
  { name: 'Beds', href: '/#cat-section-bedroom', img: '/cat-thumb-beds-2x.webp' },
  { name: 'Dining', href: '/#cat-section-dining-room', img: '/cat-thumb-dining-2x.webp' },
  { name: 'Wardrobes', href: '/#cat-section-luxury-wardrobes', img: '/cat-thumb-wardrobes-2x.webp' },
];

export default function ModernLuxuryHero({ onShopClick }: ModernLuxuryHeroProps) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

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

          {/* Right Column: Hero Living Room Visual */}
          <div className="col-span-6 2xl:col-span-7 relative flex justify-end">
            <div className="relative w-full aspect-[16/10] max-w-[800px] rounded-[32px] overflow-hidden shadow-[0_15px_45px_rgba(44,30,24,0.09)] border border-[#EBE2D5]">
              <Image
                src="/hero-living-room-showcase.webp"
                alt="Fahad Ali Interior Luxury Living Room Showcase"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center transform hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

        </div>


        {/* ── DESKTOP FLOATING CATEGORY SHELF (MATCHES DESKTOP MOCKUP 100%) ── */}
        <div className="hidden lg:block w-full mt-4 bg-white/95 border border-[#EBE1D3] rounded-[28px] p-3.5 xl:p-4 shadow-[0_12px_40px_rgba(44,30,24,0.06)]">
          <div className="grid grid-cols-6 gap-3">
            {DESKTOP_SHELF_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={(e) => handleSmoothScroll(e, cat.href)}
                className="group relative flex flex-col justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DC] hover:border-[#C59B4B] hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Product Cutout Image */}
                <div className="relative w-full h-16 xl:h-20 flex items-center justify-center mb-2">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    width={180}
                    height={90}
                    className="max-h-full w-auto object-contain group-hover:scale-108 transition-transform duration-300"
                  />
                </div>

                {/* Bottom Title & Circular Arrow */}
                <div className="flex items-center justify-between pt-1 border-t border-[#EFE8DC]/80">
                  <span className="font-serif font-black text-xs xl:text-sm text-[#221814] group-hover:text-[#B88E4B] transition-colors">
                    {cat.name}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white border border-[#E5DACB] text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white transition-all flex items-center justify-center shadow-2xs">
                    <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>



        {/* ── MOBILE LAYOUT (MATCHES MOBILE MOCKUP IMG 1 100%) ── */}
        <div className="lg:hidden flex flex-col gap-4 pt-1">
          
          {/* 1. Crown Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EADB] border border-[#E4D5BE] text-[#9A7030] text-[10px] font-bold tracking-[0.16em] uppercase shadow-2xs w-fit">
            <Crown size={12} className="text-[#C59B4B] fill-[#C59B4B]" />
            <span>PREMIUM FURNITURE COLLECTION</span>
          </div>

          {/* 2. Mobile Main Headline */}
          <h1 className="font-serif text-[32px] sm:text-[40px] font-black text-[#1F1A17] leading-[1.08] tracking-tight">
            Luxury Furniture <br />
            <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#A67C37] bg-clip-text text-transparent italic font-normal">
              for a Better Living
            </span>
          </h1>

          {/* 3. Subtitle */}
          <p className="text-[13px] text-[#6B5E55] leading-relaxed font-normal">
            Modern designs, premium quality and handcrafted furniture to transform your home.
          </p>

          {/* 4. Action Row */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/#signature-categories"
              onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
              className="bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] active:scale-95 text-white font-serif font-bold text-xs px-5 py-3 rounded-full shadow-[0_6px_20px_rgba(184,142,75,0.3)] flex items-center gap-2 cursor-pointer"
            >
              <span>Shop Collection</span>
              <ArrowRight size={14} />
            </Link>

            <button
              onClick={() => setVideoModalOpen(true)}
              className="flex items-center gap-2 active:scale-95 cursor-pointer"
              aria-label="Watch Video"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E8DFC8] shadow-sm flex items-center justify-center text-[#B88E4B]">
                <Play size={14} className="fill-[#B88E4B] ml-0.5" />
              </div>
              <div className="text-left">
                <p className="font-serif font-bold text-[11px] text-[#1F1A17] leading-tight">
                  Watch 30s Video
                </p>
                <p className="text-[9.5px] text-[#8C7A6D]">
                  Experience Luxury
                </p>
              </div>
            </button>
          </div>

          {/* 5. Mobile Living Room Image Container with Dots */}
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-sm border border-[#EBE2D5] mt-1">
            <Image
              src="/hero-living-room-showcase.webp"
              alt="Luxury Living Room"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* 3 Carousel Indicator Dots on bottom right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#C59B4B]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            </div>
          </div>

          {/* 6. Feature Cards Row (Mobile) */}
          <div className="w-full bg-white border border-[#EAE1D5] rounded-2xl p-2.5 shadow-2xs grid grid-cols-4 divide-x divide-[#EFE7DC] text-center mt-1">
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

          {/* 7. Shop by Category (Mobile Section matching Mockup) */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="w-6 h-0.5 bg-[#C59B4B] mb-1" />
                <h3 className="font-serif font-black text-lg text-[#1F1A17]">
                  Shop by Category
                </h3>
              </div>
              <Link
                href="/#signature-categories"
                onClick={(e) => handleSmoothScroll(e, '/#signature-categories')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A67C37] hover:underline"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* 4 Category Cards Grid on Mobile (Matches Mockup 4 in a row) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
              {MOBILE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={(e) => handleSmoothScroll(e, cat.href)}
                  className="flex flex-col justify-between p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border border-[#EAE1D5] shadow-2xs hover:border-[#C59B4B] active:scale-98 transition-all"
                >
                  <div className="relative w-full h-10 sm:h-14 flex items-center justify-center mb-1">
                    <Image
                      src={cat.img}
                      alt={cat.name}
                      width={100}
                      height={50}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#F3ECE1]">
                    <span className="font-serif font-bold text-[9px] sm:text-xs text-[#221814] truncate">
                      {cat.name}
                    </span>
                    <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-[#FAF5ED] text-[#B88E4B] flex items-center justify-center text-[7px] sm:text-[10px] shrink-0">
                      →
                    </div>
                  </div>
                </Link>
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
