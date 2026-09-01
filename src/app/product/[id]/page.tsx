import { Metadata } from 'next';
import { getProductById } from '@/lib/catalog-api';
import { resolveImageUrl } from '@/lib/images';
import { getSiteUrl } from '@/lib/site-url';
import StoreShell from '@/components/layout/StoreShell';
import ProductPageClient from './ProductPageClient';
import JsonLd from '@/components/JsonLd';
import { headers } from 'next/headers';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) return { title: 'Product Not Found' };
    const imageUrl = resolveImageUrl(product.image, product.category);
    const absoluteImage = imageUrl.startsWith('http') ? imageUrl : `${getSiteUrl()}${imageUrl}`;
    return {
      title: product.name,
      description: product.description || `Buy ${product.name} — handcrafted luxury furniture.`,
      openGraph: {
        title: product.name,
        description: product.description || '',
        images: [{ url: absoluteImage }],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: resolveImageUrl(product.image, product.category),
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'Fahad Ali Interior',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'PKR',
      availability: (product.stockCount ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  } : null;

  return (
    <StoreShell>
      {jsonLd && <JsonLd data={jsonLd} nonce={nonce} />}
      <ProductPageClient initialProduct={product} productId={id} />
    </StoreShell>
  );
}
