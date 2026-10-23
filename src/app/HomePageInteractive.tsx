/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { logger } from '@/lib/logger';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { apiFetchJson } from '@/lib/api-client';
import HomeSignatureCategories from '@/components/HomeSignatureCategories';
import ModernLuxuryHero from '@/components/ModernLuxuryHero';

const TestimonialsSection = dynamic(
  () => import('@/components/TestimonialsSection'),
  {
    ssr: false,
    loading: () => <div className="min-h-[300px] w-full bg-[#FAF6F0]" />,
  }
);

function LazyTestimonials({ reviews, initialReviews }: { reviews: any[]; initialReviews?: any[] }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px 0px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[300px]">
      {shouldLoad ? (
        <TestimonialsSection reviews={reviews.length > 0 ? reviews : initialReviews} />
      ) : (
        <div className="min-h-[300px] w-full bg-[#FAF6F0]" />
      )}
    </div>
  );
}

const CATEGORIES = [
  { name: 'Living Room' },
  { name: 'Bedroom' },
  { name: 'Dining Room' },
  { name: 'Office' },
  { name: 'Sofas' },
  { name: 'Coffee Tables' }, // Center Tables & Coffee Tables
  { name: 'TV Units' },
  { name: 'Storage' },
  { name: 'Outdoor' },
  { name: 'Accessories' },
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
  const [categoriesList, setCategoriesList] = useState<any[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );
  const [reviewsList, setReviewsList] = useState<any[]>(
    initialReviews && initialReviews.length > 0 ? initialReviews : []
  );
  const [productsList, setProductsList] = useState<any[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : []
  );

  useEffect(() => {
    // If products are already populated, skip re-fetching
    if (productsList.length > 0) {
      return;
    }
    const loadHomeBundle = async () => {
      try {
        const data = await apiFetchJson<any>('/api/public/home-bundle');
        if (data) {
          if (data.categories && data.categories.length > 0) setCategoriesList(data.categories);
          if (data.reviews && Array.isArray(data.reviews)) setReviewsList(data.reviews);
          if (data.products && Array.isArray(data.products) && data.products.length > 0) setProductsList(data.products);
        }
      } catch (err) {
        logger.error('Failed to load home bundle:', err);
      }
    };
    loadHomeBundle();
  }, [productsList.length]);

  return (
    <div className="contents">
      {/* ── 100% SAME AS MOCKUP LUXURY HERO SECTION (DESKTOP + MOBILE) ── */}
      <ModernLuxuryHero />

      {/* ── SIGNATURE & CATEGORIES (INSTANT SSR WITH 60FPS SCROLLSPY STICKY PILLS) ── */}
      <HomeSignatureCategories
        products={productsList}
        categories={categoriesList}
      />

      {/* ── 3D COVERFLOW LUXURY TESTIMONIALS SECTION (DEFERRED ON INTERSECTION FOR 0ms TBT) ── */}
      <LazyTestimonials reviews={reviewsList} initialReviews={initialReviews} />
    </div>
  );
}
