import StoreShell from '@/components/layout/StoreShell';
import Image from 'next/image';
import Link from 'next/link';
import { getHomePageData } from '@/lib/home-page-data';
import { resolveImageUrl, LOCAL_IMAGES } from '@/lib/images';

export const revalidate = 60;
export const metadata = {
  title: 'Categories | Fahad Ali Interior',
};

const fallbackCategories = [
  { name: 'Luxury Sofas', count: 0, image: LOCAL_IMAGES.sofa, description: '' },
  { name: 'Beds', count: 0, image: LOCAL_IMAGES.bed, description: '' },
  { name: 'Dining Sets', count: 0, image: LOCAL_IMAGES.dining, description: '' },
  { name: 'Coffee Tables', count: 0, image: LOCAL_IMAGES.sofa, description: '' },
  { name: 'TV Units', count: 0, image: LOCAL_IMAGES.sofa, description: '' },
  { name: 'Decor', count: 0, image: LOCAL_IMAGES.sofa, description: '' },
  { name: 'Storage', count: 0, image: LOCAL_IMAGES.wardrobe, description: '' },
  { name: 'Office Furniture', count: 0, image: LOCAL_IMAGES.sofa, description: '' },
];

export default async function CategoriesPage() {
  const { categories } = await getHomePageData();
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;

  return (
    <StoreShell>
      <main className="min-h-screen bg-theme-bg font-sans pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-theme-muted mb-12">
            <Link href="/" prefetch={true} className="hover:text-theme-dark transition-colors">Home</Link>
            <span>&gt;</span>
            <span className="text-theme-dark font-medium">Categories</span>
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl text-theme-dark mb-4">Categories</h1>
            <p className="text-theme-muted text-sm">Discover our wide range of luxury furniture</p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {displayCategories.map((cat, i) => {
              const imgSrc = resolveImageUrl(cat.image, cat.name, 1000);
              const itemCount = cat.count > 0 ? `${cat.count} Items` : '';
              return (
                <Link
                  key={i}
                  href={`/shop?category=${encodeURIComponent(cat.name)}`}
                  prefetch={true}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-theme-border/30"
                >
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-multiply"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="font-serif text-lg mb-1 drop-shadow-md">{cat.name}</h3>
                    {itemCount && <p className="text-[11px] uppercase tracking-wider font-medium opacity-90 drop-shadow-md">{itemCount}</p>}
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </main>
    </StoreShell>
  );
}
