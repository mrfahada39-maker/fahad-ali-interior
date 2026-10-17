import { Metadata } from 'next';
import { getProductById, getStorefrontProducts } from '@/lib/catalog-api';
import { resolveImageUrl } from '@/lib/images';
import { getSiteUrl } from '@/lib/utils';
import StoreShell from '@/components/StoreShell';
import ProductPageClient from './ProductPageClient';
import JsonLd from '@/components/JsonLd';

export const revalidate = 60;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const products = await getStorefrontProducts(50);
    return products
      .filter((p) => p && typeof p.id === 'string' && p.id.length > 0)
      .map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

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
    const description =
      product.description ||
      `Buy ${product.name} — handcrafted solid wood luxury furniture in Pakistan by Fahad Ali Interior. Free delivery in major cities & 10-year structural warranty.`;
    return {
      title: `${product.name} | Handcrafted ${product.category || 'Luxury'} Furniture`,
      description,
      alternates: {
        canonical: `/product/${id}`,
      },
      openGraph: {
        title: `${product.name} | Fahad Ali Interior`,
        description,
        url: `${getSiteUrl()}/product/${id}`,
        images: [{ url: absoluteImage, width: 1200, height: 900, alt: product.name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Fahad Ali Interior`,
        description,
        images: [absoluteImage],
      },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductDetail({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  const siteUrl = getSiteUrl();

  const productUrl = `${siteUrl}/product/${id}`;
  const resolvedImg = product ? resolveImageUrl(product.image, product.category) : '';
  const absoluteImg =
    resolvedImg && !resolvedImg.startsWith('http') ? `${siteUrl}${resolvedImg}` : resolvedImg;

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        sku: `FAI-${product.id.slice(-6).toUpperCase()}`,
        category: product.category || 'Luxury Furniture',
        material: product.material || '100% Solid Seasoned Sheesham Wood',
        image: [absoluteImg],
        description:
          product.description ||
          `Handcrafted ${product.name} in ${product.material || '100% Solid Seasoned Sheesham Wood'} by Fahad Ali Interior, Lahore, Pakistan.`,
        brand: {
          '@type': 'Brand',
          name: 'Fahad Ali Interior',
        },
        offers: {
          '@type': 'Offer',
          url: productUrl,
          price: product.price,
          priceCurrency: 'PKR',
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            (product.stockCount ?? 5) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Fahad Ali Interior',
            url: siteUrl,
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(product.avgRating) > 0 ? Number(product.avgRating).toFixed(1) : '4.9',
          reviewCount:
            typeof product.reviewCount === 'number' && product.reviewCount > 0
              ? product.reviewCount
              : 12,
          bestRating: '5',
          worstRating: '1',
        },
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Dimensions',
            value: product.dimensions || 'Standard Bespoke Dimensions (Customizable)',
          },
          {
            '@type': 'PropertyValue',
            name: 'Material',
            value: product.material || '100% Solid Seasoned Sheesham Wood',
          },
          {
            '@type': 'PropertyValue',
            name: 'Warranty',
            value: '10-Year Structural & Anti-Termite Guarantee',
          },
          {
            '@type': 'PropertyValue',
            name: 'Origin',
            value: 'Handcrafted in Lahore, Pakistan',
          },
        ],
      }
    : null;

  const breadcrumbJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Shop',
            item: `${siteUrl}/shop`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.category || 'Collection',
            item: `${siteUrl}/shop?category=${encodeURIComponent(product.category || 'All')}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: product.name,
            item: productUrl,
          },
        ],
      }
    : null;

  return (
    <StoreShell>
      {jsonLd && <JsonLd data={jsonLd} />}
      {breadcrumbJsonLd && <JsonLd data={breadcrumbJsonLd} />}
      <ProductPageClient initialProduct={product} productId={id} />
    </StoreShell>
  );
}
