import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import HomePageInteractive from './HomePageInteractive';
import { getHomePageData } from '@/lib/home-page-data';

// Next.js ISR (Incremental Static Regeneration) — edge cached for 0ms TTFB
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  // Fetch homepage bundle data on the server with in-memory caching
  const homeData = await getHomePageData();

  return (
    <StoreShell showFooter={true}>
      <link
        rel="preload"
        as="image"
        href="/hero-living-room-img1-4k.webp"
        media="(min-width: 1024px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/hero-living-room-mobile-img1.webp"
        media="(max-width: 1023px)"
        fetchPriority="high"
      />
      <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans">
        <HomePageInteractive 
          initialBanners={homeData?.banners || []}
          initialCategories={homeData?.categories || []}
          initialReviews={homeData?.reviews || []}
          initialProducts={homeData?.products || []}
        />
      </main>
    </StoreShell>
  );
}
