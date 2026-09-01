import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

import { useCartStore } from '@/store/cartStore';
import type { CartItem } from '@/store/cartStore';

const initialState = {
  items: [],
  isOpen: false,
  validatedPrices: null,
  isValidating: false,
};

const mockItem: Omit<CartItem, 'quantity'> = {
  id: '1',
  name: 'Test Product',
  price: 1000,
  image: '/test.jpg',
  category: 'test',
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState(initialState);
  });

  it('starts with an empty cart', () => {
    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  it('addItem adds a new item with quantity 1', () => {
    useCartStore.getState().addItem(mockItem);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].name).toBe('Test Product');
  });

  it('addItem increments quantity for an existing item', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem(mockItem);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('addItem can add multiple different items', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem({ ...mockItem, id: '2', name: 'Product 2' });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('removeItem removes an item by id', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem({ ...mockItem, id: '2' });
    useCartStore.getState().removeItem('1');
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });

  it('removeItem does nothing for a non-existent id', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().removeItem('non-existent');
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('updateQuantity changes item quantity', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().updateQuantity('1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('updateQuantity with 0 removes the item', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().updateQuantity('1', 0);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('updateQuantity with a negative number removes the item', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().updateQuantity('1', -1);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('clearCart removes all items', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem({ ...mockItem, id: '2' });
    useCartStore.getState().addItem({ ...mockItem, id: '3' });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('getSubtotal calculates correctly', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem({ ...mockItem, id: '2', price: 500 });
    useCartStore.getState().updateQuantity('2', 3);
    // item 1: 1000 * 1 = 1000, item 2: 500 * 3 = 1500
    expect(useCartStore.getState().getSubtotal()).toBe(2500);
  });

  it('getGST calculates 17% of subtotal', () => {
    useCartStore.getState().addItem({ ...mockItem, price: 1000 });
    useCartStore.getState().addItem({ ...mockItem, id: '2', price: 1000 });
    // subtotal = 2000, gst = 2000 * 0.17 = 340
    expect(useCartStore.getState().getGST()).toBe(340);
  });

  it('getTotal returns subtotal plus GST', () => {
    useCartStore.getState().addItem({ ...mockItem, price: 1000 });
    // subtotal = 1000, gst = 170, total = 1170
    expect(useCartStore.getState().getTotal()).toBe(1170);
  });

  it('getItemCount returns total quantity across all items', () => {
    useCartStore.getState().addItem(mockItem);
    useCartStore.getState().addItem({ ...mockItem, id: '2' });
    useCartStore.getState().updateQuantity('2', 3);
    // item 1: qty 1, item 2: qty 3
    expect(useCartStore.getState().getItemCount()).toBe(4);
  });

  it('openCart sets isOpen to true', () => {
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);
  });

  it('closeCart sets isOpen to false', () => {
    useCartStore.getState().openCart();
    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('toggleCart toggles isOpen state', () => {
    expect(useCartStore.getState().isOpen).toBe(false);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it('validatePrices returns empty result for empty cart', async () => {
    const result = await useCartStore.getState().validatePrices();
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.discrepancies).toEqual([]);
  });
});
