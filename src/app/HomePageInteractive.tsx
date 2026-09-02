'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { apiFetchJson } from '@/lib/api-client';
import dynamic from 'next/dynamic';
import { resolveImageUrl } from '@/lib/images';
import { CLOUDINARY_ASSETS } from '@/lib/cloudinary-assets';

const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), {
  ssr: false,
});

const CATEGORIES = [
  { name: 'Living Room', items: '25 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg' },
  { name: 'Bedroom', items: '18 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg' },
  { name: 'Dining Room', items: '16 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg' },
  { name: 'Coffee Chairs', items: '12 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg' },
  { name: 'Luxury Showcase', items: '14 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg' },
  { name: 'Luxury Wardrobes', items: '12 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg' },
  { name: 'Center Tables', items: '20 Items Available', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg' },
];

const REVIEWS = [
  { 
    id: 'rev-1',
    name: 'Ayesha Khan', 
    location: 'Lahore, Pakistan', 
    text: '"The solid Sheesham wood quality is exceptional and the design completely transformed my living room. Highly recommended!"', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=webp&q=65&w=90', 
    rating: 5,
    productName: 'Royal Sovereign Sheesham Sofa',
    productCategory: 'Living Room Couture',
    productPrice: 'PKR 185,000',
    productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?fm=webp&q=65&w=360'
  },
  { 
    id: 'rev-2',
    name: 'Bilal Ahmed', 
    location: 'Karachi, Pakistan', 
    text: '"Fast nationwide delivery, immaculate gold inlay finishes and amazing customer service. Will definitely order again!"', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=webp&q=65&w=90', 
    rating: 5,
    productName: 'Imperial Solid Sheesham King Bed',
    productCategory: 'Master Bedroom Suite',
    productPrice: 'PKR 240,000',
    productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fm=webp&q=65&w=360'
  },
  { 
    id: 'rev-3',
    name: 'Sara Malik', 
    location: 'Islamabad, Pakistan', 
    text: '"Finally found handcrafted furniture that is both comfortable and modern. The marble center table is a true centerpiece!"', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fm=webp&q=65&w=90', 
    rating: 5,
    productName: 'Royal Carved Marble Center Table',
    productCategory: 'Luxury Dining & Living',
    productPrice: 'PKR 95,000',
    productImage: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?fm=webp&q=65&w=360'
  },
];

interface HomePageInteractiveProps {
  initialBanners?: any[];
  initialCategories?: any[];
  initialReviews?: any[];
  initialBlogs?: any[];
}

export default function HomePageInteractive({
  initialCategories = CATEGORIES,
  initialReviews = REVIEWS,
}: HomePageInteractiveProps) {
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );

  useEffect(() => {
    setIsMounted(true);
    if (mobileVideoRef.current && mobileVideoRef.current.paused) {
      mobileVideoRef.current.play().catch(() => {});
    }
    if (desktopVideoRef.current && desktopVideoRef.current.paused) {
      desktopVideoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const loadHomeBundle = async () => {
      const data = await apiFetchJson<any>('/api/public/home-bundle');
      if (data) {
        if (data.categories && data.categories.length > 0) setCategoriesList(data.categories);
      }
    };
    if (!initialCategories || initialCategories.length === 0) {
      loadHomeBundle();
    }
  }, [initialCategories]);

  return (
    <div className="contents">

      {/* ── FULL SCREEN LUXURY HERO VIDEO SECTION (100SVH ON ALL MOBILE & DESKTOP) ── */}
      <section className="gsap-hero-section relative w-full h-screen h-[100svh] min-h-[100svh] overflow-hidden bg-[#1A110B] flex items-center justify-center text-center">
        {/* Background Parallax & Video Container */}
        <div className="gsap-hero-bg absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Instant SSR Priority Poster (Delivers < 0.4s FCP & LCP) */}
          <div className="block md:hidden absolute inset-0 w-full h-full">
            <Image
              src={CLOUDINARY_ASSETS.heroMobilePoster}
              alt="Fahad Ali Interior Royal Luxury Bedroom Showcase"
              fill
              priority
              unoptimized
              fetchPriority="high"
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="hidden md:block absolute inset-0 w-full h-full">
            <Image
              src={CLOUDINARY_ASSETS.heroDesktopPoster}
              alt="Fahad Ali Interior Royal Luxury Living Room Showcase"
              fill
              priority
              unoptimized
              fetchPriority="high"
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/* CINEMATIC LUXURY VIDEOS (Permanent GPU-Accelerated Hardware Stream) */}
          {/* MOBILE CINEMATIC LUXURY VIDEO */}
          <video
            ref={mobileVideoRef}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            poster={CLOUDINARY_ASSETS.heroMobilePoster}
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={(e) => e.currentTarget.play().catch(() => {})}
            onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
            aria-label="Fahad Ali Interior Luxury Showcase Video"
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center opacity-100 pointer-events-none z-[1]"
          >
            <source src={CLOUDINARY_ASSETS.heroMobileVideo} type="video/mp4" />
            <track kind="captions" srcLang="en" label="English" default />
          </video>

          {/* DESKTOP & TABLET CINEMATIC LUXURY VIDEO */}
          <video
            ref={desktopVideoRef}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            poster={CLOUDINARY_ASSETS.heroDesktopPoster}
            disablePictureInPicture
            disableRemotePlayback
            onLoadedData={(e) => e.currentTarget.play().catch(() => {})}
            onCanPlay={(e) => e.currentTarget.play().catch(() => {})}
            aria-label="Fahad Ali Interior Luxury Showcase Video"
            style={{ willChange: 'transform, opacity', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
            className="hidden md:block absolute inset-0 w-full h-full object-cover object-center opacity-100 pointer-events-none z-[1]"
          >
            <source src={CLOUDINARY_ASSETS.heroDesktopVideo} type="video/mp4" />
            <track kind="captions" srcLang="en" label="English" default />
          </video>

          {/* Subtle Crystal Clear Lightweight Vignette & Contrast Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/60 pointer-events-none z-[2]" />

          {/* Ambient Warm Center Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#C9A96E]/20 rounded-full blur-[120px] pointer-events-none z-[2]" />
        </div>

        {/* Center Editorial Content Overlay */}
        <div className="gsap-hero-content relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-6 pt-24 sm:pt-32 pb-12 flex flex-col items-center justify-center text-center h-full">
          
          {/* Top Sheesham Tagline */}
          <span className="gsap-hero-tagline text-[9px] min-[360px]:text-[10px] sm:text-xs font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase text-[#F3E5AB] mb-2 sm:mb-4 drop-shadow-sm px-2">
            HANDCRAFTED SOLID SHEESHAM
          </span>

          {/* Main Editorial Headline */}
          <h1 
            className="gsap-hero-title font-serif text-[clamp(1.3rem,4.2vw,4.5rem)] font-bold sm:font-normal tracking-wide sm:tracking-wider text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] mb-3 sm:mb-5 uppercase leading-none whitespace-nowrap max-w-full px-1"
          >
            ROYAL LUXURY FURNITURE
          </h1>

          {/* Subtitle / Description */}
          <p className="gsap-hero-subtitle text-xs sm:text-base md:text-xl lg:text-2xl font-serif italic text-[#E6DCCF] drop-shadow-md max-w-xs sm:max-w-3xl mb-8 sm:mb-10 font-light px-2">
            Masterpieces Crafted for Royalty — Comfort Meets Timeless Elegance
          </p>

          {/* Action Buttons */}
          <div className="gsap-hero-cta flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none px-4 sm:px-0">
            <Link
              href="/shop"
              prefetch={true}
              className="gsap-hero-magnetic w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] hover:brightness-110 text-white border border-white/20 font-black text-xs sm:text-sm px-8 py-3.5 sm:py-4 rounded-xl tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-3 cursor-pointer will-change-transform active:scale-95"
            >
              <span>EXPLORE COLLECTION</span>
              <span className="text-sm">→</span>
            </Link>
            <Link
              href="/shop"
              prefetch={true}
              className="gsap-hero-magnetic w-full sm:w-auto bg-white/10 backdrop-blur-md border border-[#E2D1BC]/60 text-[#F3E5AB] hover:bg-white/20 font-black text-xs sm:text-sm px-8 py-3.5 sm:py-4 rounded-xl tracking-widest uppercase transition-all duration-300 flex items-center justify-center cursor-pointer will-change-transform active:scale-95 shadow-md"
            >
              VIEW CATALOG
            </Link>
          </div>
        </div>

        {/* Animated Down Chevron Scroll Indicator */}
        <div className="gsap-hero-chevron absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce pointer-events-none text-[#F3E5AB] drop-shadow-md">
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ── CATEGORIES SECTION (COMPACT SLEEK LUXURY PROPORTIONS) ── */}
      <section className="w-full max-w-[1550px] 2xl:max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 mb-16 relative z-10">
        <div className="gsap-cat-header text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E2D1BC] shadow-xs mb-3.5">
            <span className="text-[#B88E4B] text-sm font-bold">✦</span>
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] text-[#7A6354]">
              HAUTE COUTURE COLLECTIONS
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#221814] tracking-tight leading-tight mb-2">
            Signature <span className="font-serif italic font-normal text-[#C9A24D] mx-2 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Categories</span>
          </h2>
          <div className="flex items-center justify-center gap-3 my-3">
            <div className="h-[1.5px] w-24 sm:w-32 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
            <div className="h-[1.5px] w-24 sm:w-32 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
          </div>
          <p className="text-[#7A6048] text-sm sm:text-base md:text-lg max-w-xl mx-auto font-serif italic">
            100% Solid Seasoned Sheesham masterworks handcrafted for luxury living.
          </p>
        </div>

        {/* Compact Grid Gap */}
        <div className="gsap-cat-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categoriesList.map((cat, i) => (
            <div
              key={cat.name || i}
              className="gsap-cat-card-wrapper"
              style={{ perspective: '1000px' }}
            >
              <Link 
                href={`/shop?category=${encodeURIComponent(cat.name)}`} 
                prefetch={true}
                className="gsap-cat-card group relative aspect-[5/4] rounded-[24px] overflow-hidden bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_16px_40px_rgba(184,142,75,0.22)] border-[1.5px] border-amber-300/80 hover:border-[#B88E4B] transition-all duration-300 block will-change-transform"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Background Image Wrap */}
                <div className="gsap-cat-img-wrap absolute inset-0 overflow-hidden">
                  <Image 
                    src={resolveImageUrl(cat.image, cat.name, 1000)} 
                    alt={cat.name} 
                    fill 
                    unoptimized
                    loading={i < 3 ? 'eager' : 'lazy'}
                    className="gsap-cat-img object-cover will-change-transform transition-transform duration-700 group-hover:scale-106" 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                  />
                </div>

                {/* Ambient Corner Glow on Category Card */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none bg-amber-500/15 opacity-80 z-10" />

                {/* Subtle Light Sweep Luxury Overlay */}
                <div className="gsap-cat-light absolute inset-0 pointer-events-none opacity-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full rotate-45 z-20" />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410]/85 via-[#1C1410]/20 to-transparent transition-opacity duration-300 group-hover:opacity-95 z-10 pointer-events-none" />
                
                {/* Category Card Details */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white z-20 pointer-events-none">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide leading-tight mb-0.5 drop-shadow-md">
                      {cat.name}
                    </h3>
                    <span className="gsap-cat-subtitle text-[10px] uppercase tracking-widest text-[#E6DCCF] font-semibold opacity-90 block">
                      {cat.items || `${cat.count || 0} Items Available`}
                    </span>
                  </div>
                  <div className="gsap-cat-btn w-9 h-9 rounded-xl border border-amber-300/80 flex items-center justify-center bg-[#FAF5EE] text-[#8C6239] group-hover:bg-gradient-to-br group-hover:from-[#B88E4B] group-hover:to-[#996515] group-hover:text-white transition-all duration-300 shadow-[0_3px_10px_rgba(184,142,75,0.25)]">
                    <ChevronRight size={17} className="gsap-cat-arrow stroke-[2.5]" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3D COVERFLOW LUXURY TESTIMONIALS SECTION ── */}
      <TestimonialsSection />

    </div>
  );
}
