'use client';

import { create } from 'zustand';

export interface CachedProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  isPremium?: boolean;
  description?: string | null;
  material?: string | null;
  avgRating?: number;
  reviewCount?: number;
  stockCount?: number;
  dimensions?: string | null;
  images?: string[];
  features?: string[];
  [key: string]: unknown;
}

interface ClientCacheState {
  products: Record<string, CachedProduct>;
  categories: string[];
  setProduct: (product: CachedProduct) => void;
  setProducts: (products: CachedProduct[]) => void;
  getProduct: (id: string) => CachedProduct | undefined;
  setCategories: (categories: string[]) => void;
}

// In-memory cache for ultra-fast instant lookups across navigation
const inMemoryProductMap: Record<string, CachedProduct> = {};

export const useClientCacheStore = create<ClientCacheState>((set, get) => ({
  products: inMemoryProductMap,
  categories: [],

  setProduct: (product) => {
    if (!product?.id) return;
    inMemoryProductMap[product.id] = { ...inMemoryProductMap[product.id], ...product };
    set((state) => ({
      products: { ...state.products, [product.id]: inMemoryProductMap[product.id] },
    }));

    // Save to sessionStorage for fast recovery during session
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fai_prod_${product.id}`, JSON.stringify(inMemoryProductMap[product.id]));
      } catch {
        // Ignore quota limits
      }
    }
  },

  setProducts: (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    items.forEach((p) => {
      if (p?.id) inMemoryProductMap[p.id] = { ...inMemoryProductMap[p.id], ...p };
    });
    set(() => ({
      products: { ...inMemoryProductMap },
    }));
  },

  getProduct: (id) => {
    if (!id) return undefined;
    if (inMemoryProductMap[id]) return inMemoryProductMap[id];

    // Check sessionStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const item = sessionStorage.getItem(`fai_prod_${id}`);
        if (item) {
          const parsed = JSON.parse(item) as CachedProduct;
          inMemoryProductMap[id] = parsed;
          return parsed;
        }
      } catch {
        // Ignore JSON error
      }
    }
    return undefined;
  },

  setCategories: (categories) => {
    set({ categories });
  },
}));
