import ReactDOM from 'react-dom';
import StoreShell from '@/components/StoreShell';
import HomePageInteractive from './HomePageInteractive';
import { getHomePageData } from '@/lib/home-page-data';
import { CLOUDINARY_ASSETS } from '@/lib/cloudinary-assets';

// Next.js ISR (Incremental Static Regeneration) — edge cached for 0ms TTFB
export const revalidate = 300;

export default async function HomePage() {
  // Preload LCP hero poster images into initial HTML stream for instant 0ms download
  ReactDOM.preload(CLOUDINARY_ASSETS.heroMobilePoster, { as: 'image', fetchPriority: 'high' });
  ReactDOM.preload(CLOUDINARY_ASSETS.heroDesktopPoster, { as: 'image', fetchPriority: 'high' });

  // Fetch homepage bundle data on the server with in-memory caching
  const homeData = await getHomePageData();

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FCFAF7] text-[#221814] font-sans overflow-x-hidden">
        <HomePageInteractive 
          initialBanners={homeData?.banners || []}
          initialCategories={homeData?.categories || []}
          initialReviews={homeData?.reviews || []}
        />
      </main>
    </StoreShell>
  );
}
