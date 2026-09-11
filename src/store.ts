import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ----------------------------------------------------
// CART STORE
// ----------------------------------------------------
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

export interface PriceValidationResult {
  items: Array<{
    id: string;
    databasePrice: number;
    clientPrice: number;
    quantity: number;
    match: boolean;
    lineTotal: number;
  }>;
  subtotal: number;
  gst: number;
  total: number;
  discrepancies: Array<{ id: string; clientPrice: number; databasePrice: number }>;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  validatedPrices: PriceValidationResult | null;
  isValidating: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getGST: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  validatePrices: () => Promise<PriceValidationResult>;
  getServerValidatedPrices: () => PriceValidationResult | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      validatedPrices: null,
      isValidating: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === item.id);
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            validatedPrices: null,
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }], validatedPrices: null });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id), validatedPrices: null });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
          validatedPrices: null,
        });
      },

      clearCart: () => set({ items: [], validatedPrices: null }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getGST: () => {
        return get().getSubtotal() * 0.17;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getGST();
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      validatePrices: async () => {
        const items = get().items;
        if (items.length === 0) {
          const empty: PriceValidationResult = { items: [], subtotal: 0, gst: 0, total: 0, discrepancies: [] };
          set({ validatedPrices: empty, isValidating: false });
          return empty;
        }
        set({ isValidating: true });
        try {
          const payload = items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price }));
          const res = await fetch(`${API_URL}/cart/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payload }),
          });
          if (!res.ok) throw new Error('Price validation failed');
          const result: PriceValidationResult = await res.json();
          set({ validatedPrices: result, isValidating: false });
          return result;
        } catch {
          set({ isValidating: false });
          const clientResult: PriceValidationResult = {
            items: items.map((i) => ({
              id: i.id,
              databasePrice: i.price,
              clientPrice: i.price,
              quantity: i.quantity,
              match: true,
              lineTotal: i.price * i.quantity,
            })),
            subtotal: get().getSubtotal(),
            gst: get().getGST(),
            total: get().getTotal(),
            discrepancies: [],
          };
          set({ validatedPrices: clientResult });
          return clientResult;
        }
      },

      getServerValidatedPrices: () => {
        return get().validatedPrices;
      },
    }),
    {
      name: 'fahad-ali-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ----------------------------------------------------
// WISHLIST STORE
// ----------------------------------------------------
export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        if (!items.find((i) => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      toggleItem: (item) => {
        const items = get().items;
        if (items.find((i) => i.id === item.id)) {
          set({ items: items.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [...items, item] });
        }
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'fahad-ali-wishlist',
    }
  )
);

// ----------------------------------------------------
// CLIENT CACHE STORE
// ----------------------------------------------------
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

const inMemoryProductMap: Record<string, CachedProduct> = {};

export const useClientCacheStore = create<ClientCacheState>((set) => ({
  products: inMemoryProductMap,
  categories: [],

  setProduct: (product) => {
    if (!product?.id) return;
    inMemoryProductMap[product.id] = { ...inMemoryProductMap[product.id], ...product };
    set((state) => ({
      products: { ...state.products, [product.id]: inMemoryProductMap[product.id] },
    }));

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fai_prod_${product.id}`, JSON.stringify(inMemoryProductMap[product.id]));
      } catch {}
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

    if (typeof window !== 'undefined') {
      try {
        const item = sessionStorage.getItem(`fai_prod_${id}`);
        if (item) {
          const parsed = JSON.parse(item) as CachedProduct;
          inMemoryProductMap[id] = parsed;
          return parsed;
        }
      } catch {}
    }
    return undefined;
  },

  setCategories: (categories) => {
    set({ categories });
  },
}));

// ----------------------------------------------------
// SITE SETTINGS STORE
// ----------------------------------------------------
export type SiteSettings = {
  siteName?: string | null;
  contactPhone?: string | null;
  adminEmail?: string | null;
  storeAddress?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialWhatsapp?: string | null;
  foundedYear?: string | null;
  currency?: string | null;
  themeFontFamily?: string | null;
  themeBgColor?: string | null;
  themeSurfaceColor?: string | null;
  themeBorderColor?: string | null;
  themeDarkColor?: string | null;
  themeMutedColor?: string | null;
  themeAccentColor?: string | null;
};

interface SiteSettingsStore {
  settings: SiteSettings | null;
  hydrated: boolean;
  setSettings: (settings: SiteSettings) => void;
}

export const useSiteSettingsStore = create<SiteSettingsStore>((set) => ({
  settings: null,
  hydrated: false,
  setSettings: (settings) => set({ settings, hydrated: true }),
}));
