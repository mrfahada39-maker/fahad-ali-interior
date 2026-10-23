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
  { name: 'Living Room', count: 1, items: '1 Masterpiece', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg' },
  { name: 'Bedroom', count: 2, items: '2 Masterpieces', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg' },
  { name: 'Dining Room', count: 2, items: '2 Masterpieces', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg' },
  { name: 'Office', count: 1, items: '1 Masterpiece', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sofas', count: 1, items: '1 Masterpiece', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Coffee Tables', count: 2, items: '2 Masterpieces', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg' }, // Center Tables & Coffee Tables
  { name: 'TV Units', count: 1, items: '1 Masterpiece', image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Storage', count: 3, items: '3 Masterpieces', image: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto:good,w_500/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg' },
  { name: 'Outdoor', count: 0, items: 'Bespoke Collection', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Accessories', count: 0, items: 'Bespoke Collection', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80' },
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
