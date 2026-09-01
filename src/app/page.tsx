import StoreShell from '@/components/layout/StoreShell';
import HomePageInteractive from './HomePageInteractive';
import { getHomePageData } from '@/lib/home-page-data';

export const revalidate = 120;

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
