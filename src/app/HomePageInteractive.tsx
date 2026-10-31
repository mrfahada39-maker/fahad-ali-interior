'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { apiFetchJson } from '@/lib/api-client';
import HomeSignatureCategories from '@/components/home/HomeSignatureCategories';
import ModernLuxuryHero from '@/components/home/ModernLuxuryHero';
import type { StorefrontProduct } from '@/lib/types';
import type { TestimonialReviewItem } from '@/components/home/TestimonialsSection';

export interface InteractiveCategory {
  id?: string;
  name: string;
  image?: string;
  count?: number;
  items?: string;
  [key: string]: unknown;
}

const TestimonialsSection = dynamic(
  () => import('@/components/home/TestimonialsSection'),
  {
    ssr: false,
    loading: () => <div className="min-h-[300px] w-full bg-[#FAF6F0]" />,
  }
);

function LazyTestimonials({ reviews }: { reviews: TestimonialReviewItem[] }) {
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
    <div ref={ref}>
      {shouldLoad ? (
        <TestimonialsSection reviews={reviews} />
      ) : (
        <div className="min-h-[300px] w-full bg-[#FAF6F0]" />
      )}
    </div>
  );
}

const CATEGORIES: InteractiveCategory[] = [
  { name: 'Living Room' },
  { name: 'Bedroom' },
  { name: 'Dining' },
  { name: 'Center Tables' },
  { name: 'Office' },
  { name: 'TV Units' },
  { name: 'Storage' },
  { name: 'Outdoor' },
  { name: 'Accessories' },
];

const REVIEWS: TestimonialReviewItem[] = [];

interface HomePageInteractiveProps {
  initialBanners?: unknown[];
  initialCategories?: InteractiveCategory[];
  initialReviews?: TestimonialReviewItem[];
  initialProducts?: StorefrontProduct[];
}

export default function HomePageInteractive({
  initialCategories = CATEGORIES,
  initialReviews = REVIEWS,
  initialProducts = [],
}: HomePageInteractiveProps) {
  const [categoriesList, setCategoriesList] = useState<InteractiveCategory[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES
  );
  const [reviewsList, setReviewsList] = useState<TestimonialReviewItem[]>(
    initialReviews && initialReviews.length > 0 ? initialReviews : []
  );
  const [productsList, setProductsList] = useState<StorefrontProduct[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : []
  );

  useEffect(() => {
    setProductsList(initialProducts || []);
  }, [initialProducts]);

  useEffect(() => {
    setCategoriesList(initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES);
  }, [initialCategories]);

  useEffect(() => {
    const handleCatalogUpdated = () => {
      apiFetchJson<{ products?: StorefrontProduct[]; categories?: InteractiveCategory[]; reviews?: TestimonialReviewItem[] }>('/api/public/home-bundle').then((data) => {
        if (data?.products && Array.isArray(data.products)) setProductsList(data.products);
        if (data?.categories && Array.isArray(data.categories)) setCategoriesList(data.categories);
        if (data?.reviews && Array.isArray(data.reviews)) setReviewsList(data.reviews);
      }).catch(() => {});
    };

    window.addEventListener('fahad_catalog_updated', handleCatalogUpdated);
    window.addEventListener('storage', handleCatalogUpdated);
    return () => {
      window.removeEventListener('fahad_catalog_updated', handleCatalogUpdated);
      window.removeEventListener('storage', handleCatalogUpdated);
    };
  }, []);

  return (
    <>
      <ModernLuxuryHero />
      <HomeSignatureCategories categories={categoriesList} products={productsList} />
      <LazyTestimonials reviews={reviewsList} />
    </>
  );
}
