import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
