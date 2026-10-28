import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import HomeSignatureCategories from '@/components/HomeSignatureCategories';
import { getHomePageData } from '@/lib/home-page-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Luxury Furniture Catalog & Showroom | Fahad Ali Interior',
  description:
    'Explore handcrafted 100% solid kiln-seasoned Sheesham wood furniture sets — Royal Sofa Sets, Chinioti Beds, Dining Tables, Wardrobes, and Center Tables in Lahore, Pakistan.',
  alternates: {
    canonical: '/shop',
  },
};

export default async function ShopCatalogPage() {
  const homeData = await getHomePageData();

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans pt-20 sm:pt-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <h1 className="sr-only">Fahad Ali Interior — Handcrafted Sheesham Furniture Catalog</h1>
        </div>
        <HomeSignatureCategories
          products={homeData?.products || []}
          categories={homeData?.categories || []}
        />
      </main>
    </StoreShell>
  );
}

