import StoreShell from '@/components/layout/StoreShell';
import HomePageInteractive from './HomePageInteractive';
import { getHomePageData } from '@/lib/home-page-data';

// Next.js ISR (Incremental Static Regeneration) — edge cached for 0ms TTFB
export const revalidate = 300;

export default async function HomePage() {
  // Fetch homepage bundle data on the server with in-memory caching
  const homeData = await getHomePageData();

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans overflow-x-hidden">
        <HomePageInteractive 
          initialBanners={homeData?.banners || []}
          initialCategories={homeData?.categories || []}
          initialReviews={homeData?.reviews || []}
          initialBlogs={[]}
        />
      </main>
    </StoreShell>
  );
}
