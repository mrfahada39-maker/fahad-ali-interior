/**
 * Server-side API calls via Next.js proxy (same-origin).
 * Avoids direct backend calls that fail during startup timing.
 */
import type { StorefrontProduct } from '@/lib/types/product';
import { db } from '@/lib/db';

type ApiResponseEnvelope<T> = { success: boolean; data?: T; message?: string };

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fahad-ali-interior.vercel.app');
}

export async function proxyFetch<T>(path: string, init?: RequestInit & { revalidate?: number }): Promise<T | null> {
  const { revalidate = 0, ...fetchInit } = init ?? {};
  const url = `${getBaseUrl()}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      ...fetchInit,
      headers: {
        accept: 'application/json',
        ...fetchInit.headers,
      },
      next: { revalidate },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const body = (await res.json()) as ApiResponseEnvelope<T> | T;
    if (body && typeof body === 'object' && 'success' in body) {
      const envelope = body as ApiResponseEnvelope<T>;
      return envelope.success ? (envelope.data ?? null) : null;
    }
    return body as T;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function getStorefrontProducts(limit = 50): Promise<StorefrontProduct[]> {
  const data = await proxyFetch<{ products: StorefrontProduct[] }>(
    `/api/v1/products?limit=${limit}`,
    { revalidate: 300 },
  );

  if (data?.products && data.products.length > 0) {
    return data.products;
  }

  // Fallback directly to PostgreSQL Database
  try {
    const products = await db.product.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return products.map(p => ({
      ...p,
      price: Number(p.price),
    })) as unknown as StorefrontProduct[];
  } catch {
    return [];
  }
}

export async function getProductById(id: string): Promise<StorefrontProduct | null> {
  const data = await proxyFetch<{ product: StorefrontProduct }>(
    `/api/v1/products/${id}`,
    { revalidate: 300 },
  );

  if (data?.product) {
    return data.product;
  }

  // Fallback directly to PostgreSQL Database
  try {
    const product = await db.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) return null;
    return {
      ...product,
      price: Number(product.price),
    } as unknown as StorefrontProduct;
  } catch {
    return null;
  }
}
