import { describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('zustand/middleware', () => ({
  persist: (config: unknown) => config,
}));

import { useWishlistStore } from '@/store/wishlistStore';
import type { WishlistItem } from '@/store/wishlistStore';

const mockItem: WishlistItem = {
  id: '1',
  name: 'Test Product',
  price: 1000,
  image: '/test.jpg',
  category: 'test',
};

describe('wishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('starts with an empty wishlist', () => {
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('addItem adds a new item', () => {
    useWishlistStore.getState().addItem(mockItem);
    const { items } = useWishlistStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(mockItem);
  });

  it('addItem does not duplicate an existing item', () => {
    useWishlistStore.getState().addItem(mockItem);
    useWishlistStore.getState().addItem(mockItem);
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });

  it('removeItem removes an item by id', () => {
    useWishlistStore.getState().addItem(mockItem);
    useWishlistStore.getState().addItem({ ...mockItem, id: '2' });
    useWishlistStore.getState().removeItem('1');
    const { items } = useWishlistStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('2');
  });

  it('removeItem does nothing for a non-existent id', () => {
    useWishlistStore.getState().addItem(mockItem);
    useWishlistStore.getState().removeItem('non-existent');
    expect(useWishlistStore.getState().items).toHaveLength(1);
  });

  it('toggleItem adds an item when not in wishlist', () => {
    useWishlistStore.getState().toggleItem(mockItem);
    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useWishlistStore.getState().items[0].id).toBe('1');
  });

  it('toggleItem removes an item when already in wishlist', () => {
    useWishlistStore.getState().toggleItem(mockItem);
    useWishlistStore.getState().toggleItem(mockItem);
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it('isInWishlist returns true for an item in the wishlist', () => {
    useWishlistStore.getState().addItem(mockItem);
    expect(useWishlistStore.getState().isInWishlist('1')).toBe(true);
  });

  it('isInWishlist returns false for an item not in the wishlist', () => {
    expect(useWishlistStore.getState().isInWishlist('1')).toBe(false);
  });

  it('clearWishlist removes all items', () => {
    useWishlistStore.getState().addItem(mockItem);
    useWishlistStore.getState().addItem({ ...mockItem, id: '2' });
    useWishlistStore.getState().addItem({ ...mockItem, id: '3' });
    useWishlistStore.getState().clearWishlist();
    expect(useWishlistStore.getState().items).toEqual([]);
  });
});
