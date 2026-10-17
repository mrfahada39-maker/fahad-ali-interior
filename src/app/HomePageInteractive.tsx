/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
} from 'lucide-react';
import { apiFetchJson } from '@/lib/api-client';
import { CLOUDINARY_ASSETS } from '@/lib/cloudinary-assets';
import ShopPage from '@/app/shop/ShopPage';
import dynamic from 'next/dynamic';

const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), {
  ssr: false,
});

const CATEGORIES = [
  { name: 'Living Room', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg' },
  { name: 'Bedroom', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg' },
  { name: 'Dining Room', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg' },
  { name: 'Coffee Chairs', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg' },
  { name: 'Center Tables', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg' },
  { name: 'Luxury Showcase', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg' },
  { name: 'Luxury Wardrobes', count: 0, items: 'View Collection', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg' },
];

const REVIEWS: any[] = [];

interface HomePageInteractiveProps {
  initialBanners?: any[];
  initialCategories?: any[];
  initialReviews?: any[];
  initialProducts?: any[];
}

export default function HomePageInteractive({
  initialCategories = CATEGORIES,
  initialReviews = REVIEWS,
  initialProducts = [],
}: HomePageInteractiveProps) {
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );
  const [reviewsList, setReviewsList] = useState<any[]>(
    initialReviews && initialReviews.length > 0 ? initialReviews : []
  );
  const [productsList, setProductsList] = useState<any[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : []
  );
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mountVideo, setMountVideo] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // ── Defer heavy video stream until genuine user interaction so initial load has 0ms video TBT ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth <= 768;
      if (mobile) setIsMobileViewport(true);

      const conn = (navigator as any)?.connection;
      const isSlowConn = conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === '3g';
      if (isSlowConn) return;

      let mounted = false;
      const triggerVideo = () => {
        if (!mounted) {
          mounted = true;
          setIsMobileViewport(window.innerWidth <= 768);
          setMountVideo(true);
        }
      };

      window.addEventListener('scroll', triggerVideo, { once: true, passive: true });
      window.addEventListener('pointermove', triggerVideo, { once: true, passive: true });
      window.addEventListener('touchstart', triggerVideo, { once: true, passive: true });
      window.addEventListener('keydown', triggerVideo, { once: true, passive: true });

      return () => {
        window.removeEventListener('scroll', triggerVideo);
        window.removeEventListener('pointermove', triggerVideo);
        window.removeEventListener('touchstart', triggerVideo);
        window.removeEventListener('keydown', triggerVideo);
      };
    }
  }, []);

  // ── Smart Viewport Observer: Pause video when scrolled down to eliminate lag on Infinix/Tecno ──
  useEffect(() => {
    if (!mountVideo) return;
    const el = heroSectionRef.current;
    if (!el || typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return;

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (heroVideoRef.current?.paused) heroVideoRef.current.play().catch(() => {});
        } else {
          if (heroVideoRef.current && !heroVideoRef.current.paused) heroVideoRef.current.pause();
        }
      },
      { threshold: 0.0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [mountVideo]);

  useEffect(() => {
    // Zero-network overhead: Skip client-side re-fetching when server already provided products or categories
    if ((initialProducts && initialProducts.length > 0) || (initialCategories && initialCategories.length > 0)) {
      return;
    }
    const loadHomeBundle = async () => {
      try {
        const data = await apiFetchJson<any>('/api/public/home-bundle');
        if (data) {
          if (data.categories && data.categories.length > 0) setCategoriesList(data.categories);
          if (data.reviews && Array.isArray(data.reviews)) setReviewsList(data.reviews);
          if (data.products && Array.isArray(data.products) && productsList.length === 0) setProductsList(data.products);
        }
      } catch (err) {
        logger.error('Failed to load home bundle:', err);
      }
    };
    loadHomeBundle();
  }, [initialCategories, initialReviews, initialProducts, productsList.length]);

  return (
    <div className="contents">

      {/* ── FULL SCREEN LUXURY HERO VIDEO SECTION (100SVH ON ALL MOBILE & DESKTOP) ── */}
      <section ref={heroSectionRef} className="gsap-hero-section relative w-full h-[100svh] min-h-[100svh] overflow-hidden bg-[#1A110B] flex items-center justify-center text-center">
        {/* Background Parallax & Video Container */}
        <div className="gsap-hero-bg absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {/* Instant SSR Responsive LCP Poster Image (Native Media Queries — Zero Double-Download) priority sizes="100vw" */}
          <picture className="absolute inset-0 w-full h-full pointer-events-none">
            <source media="(max-width: 768px)" srcSet={CLOUDINARY_ASSETS.heroMobilePoster} />
            <source media="(min-width: 769px)" srcSet={CLOUDINARY_ASSETS.heroDesktopPoster} />

            <img
              src={CLOUDINARY_ASSETS.heroMobilePoster}
              alt="Fahad Ali Interior Royal Luxury Showcase"
              fetchPriority="high"
              style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%' }}
              className="w-full h-full object-cover object-center pointer-events-none"
              loading="eager"
              decoding="sync"
            />
          </picture>

          {/* CINEMATIC LUXURY VIDEO (Device-Isolated: Mobile ONLY renders Mobile Stream, Desktop ONLY renders Desktop Stream) */}
          {mountVideo && (
            <video
              key={isMobileViewport ? 'hero-mobile' : 'hero-desktop'}
              ref={heroVideoRef}
              autoPlay
              loop
              muted
              playsInline
              crossOrigin="anonymous"
              poster={isMobileViewport ? CLOUDINARY_ASSETS.heroMobilePoster : CLOUDINARY_ASSETS.heroDesktopPoster}
              preload={isMobileViewport ? 'none' : 'metadata'}
              disablePictureInPicture
              disableRemotePlayback
              onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); setVideoLoaded(true); }}
              onPlaying={() => setVideoLoaded(true)}
              onCanPlay={() => setVideoLoaded(true)}
              aria-label="Fahad Ali Interior Luxury Showcase Video"
              style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%', willChange: 'opacity', transform: 'translateZ(0)' }}
              className={`absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-[1] transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Native Media-Query Video Sources — Hardware Selected by OS Viewport */}
              <source 
                media="(max-width: 768px)"
                src={CLOUDINARY_ASSETS.heroMobileVideo} 
                type="video/mp4" 
              />
              <source 
                media="(min-width: 769px)"
                src={CLOUDINARY_ASSETS.heroDesktopVideo} 
                type="video/mp4" 
              />
              <source 
                src={isMobileViewport ? CLOUDINARY_ASSETS.heroMobileVideo : CLOUDINARY_ASSETS.heroDesktopVideo} 
                type="video/mp4" 
              />
              <track kind="captions" srcLang="en" label="English" default />
            </video>
          )}

          {/* Subtle Crystal Clear Lightweight Vignette & Contrast Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/60 pointer-events-none z-[2]" />

          {/* Ambient Warm Center Glow — GPU Native Radial Gradient (Zero Lag on Low-End Chips) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.18)_0%,transparent_65%)] pointer-events-none z-[2]" />
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

          {/* Action Buttons (Original Styling Restored 100%) */}
          <div className="gsap-hero-cta flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none px-4 sm:px-0">
            <Link
              href="/shop"
              prefetch={false}
              className="gsap-hero-magnetic w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] hover:brightness-110 text-white border border-white/20 font-black text-xs sm:text-sm px-8 py-3.5 sm:py-4 rounded-xl tracking-widest uppercase transition-all duration-300 shadow-xl flex items-center justify-center gap-3 cursor-pointer will-change-transform active:scale-95"
            >
              <span>EXPLORE COLLECTION</span>
              <span className="text-sm">→</span>
            </Link>
            <Link
              href="/shop/categories"
              prefetch={false}
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

        {/* Seamless Soft Blend Transition to Categories Section (Zero Black Gap) */}
        <div className="absolute -bottom-1 inset-x-0 h-16 bg-gradient-to-t from-[#FCFAF7] via-[#FCFAF7]/30 to-transparent pointer-events-none z-10" />
      </section>

      {/* ── HANDCRAFTED & MASTERPIECES SECTION (FULL INTERACTIVE CATALOG SHOWCASE) ── */}
      <Suspense fallback={<div className="min-h-[600px] bg-[#FCFAF7]" />}>
        <ShopPage
          embedded={true}
          initialProducts={productsList}
          initialCategories={['All', ...categoriesList.map((c: any) => c.name)]}
        />
      </Suspense>

      {/* ── 3D COVERFLOW LUXURY TESTIMONIALS SECTION (Hydrated on scroll/interaction for 0ms initial TBT) ── */}
      {mountVideo && (
        <TestimonialsSection reviews={reviewsList.length > 0 ? reviewsList : initialReviews} />
      )}

    </div>
  );
}
