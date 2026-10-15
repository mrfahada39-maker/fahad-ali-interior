import { Suspense } from 'react';
import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import { getStorefrontProducts, getStorefrontCategories } from '@/lib/catalog-api';
import ShopPage from './ShopPage';

// Next.js ISR (Incremental Static Regeneration) — Edge cached on Vercel for instant sub-50ms TTFB
export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Shop — Luxury Furniture Collection',
  description:
    'Browse our collection of handcrafted luxury furniture. Premium beds, sofas, dining sets, and wardrobes crafted in Pakistan.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Shop | Fahad Ali Interior',
    description: 'Handcrafted luxury furniture collection — Beds, Sofas, Dining, Wardrobes.',
    type: 'website',
  },
};

export default async function Shop() {
  const [initialProducts, initialCategories] = await Promise.all([
    getStorefrontProducts(24),
    getStorefrontCategories(),
  ]);

  return (
    <StoreShell>
      <Suspense fallback={<div className="min-h-screen bg-[#FCFAF7] animate-pulse" />}>
        <ShopPage
          initialProducts={initialProducts}
          initialCategories={initialCategories}
        />
      </Suspense>
    </StoreShell>
  );
}
