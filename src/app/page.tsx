import { Metadata } from 'next';
import StoreShell from '@/components/StoreShell';
import HomePageInteractive from './HomePageInteractive';
import { getHomePageData } from '@/lib/home-page-data';

// Force real-time dynamic rendering so product additions, deletions, and restores appear in 0ms
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
