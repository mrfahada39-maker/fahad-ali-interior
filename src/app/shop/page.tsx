import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import HomeSignatureCategories from '@/components/HomeSignatureCategories';
import { getHomePageData } from '@/lib/home-page-data';

// Next.js ISR (Incremental Static Regeneration) — Edge cached on Vercel for instant sub-50ms TTFB
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Signature & Categories | Luxury Furniture Collection',
  description:
    'Browse our Signature & Categories collection of handcrafted solid Sheesham luxury furniture. Premium beds, sofas, dining sets, and wardrobes crafted in Pakistan.',
  alternates: {
    canonical: '/shop',
  },
  openGraph: {
    title: 'Signature & Categories | Fahad Ali Interior',
    description: 'Signature & Categories collection — Beds, Sofas, Dining, Wardrobes.',
    type: 'website',
  },
};

export default async function Shop() {
  const homeData = await getHomePageData();

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans pt-14 sm:pt-16 lg:pt-20">
        <HomeSignatureCategories
          products={homeData?.products || []}
          categories={homeData?.categories || []}
        />
      </main>
    </StoreShell>
  );
}
