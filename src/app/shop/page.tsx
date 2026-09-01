import { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import { getStorefrontProducts } from '@/lib/catalog-api';
import ShopPage from './ShopPage';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shop | Fahad Ali Interior — Luxury Furniture Collection',
  description:
    'Browse our collection of handcrafted luxury furniture. Premium beds, sofas, dining sets, and wardrobes crafted in Pakistan.',
  openGraph: {
    title: 'Shop | Fahad Ali Interior',
    description: 'Handcrafted luxury furniture collection — Beds, Sofas, Dining, Wardrobes.',
    type: 'website',
  },
};

export default async function Shop(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await (props.searchParams ?? Promise.resolve({}));
  const searchParams = resolved as Record<string, string | undefined>;
  const initialProducts = await getStorefrontProducts(100);
  return (
    <StoreShell>
      <ShopPage initialProducts={initialProducts} initialCategory={searchParams.category} />
    </StoreShell>
  );
}
