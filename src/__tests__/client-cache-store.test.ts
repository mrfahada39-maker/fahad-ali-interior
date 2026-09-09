import { describe, it, expect, beforeEach } from '@jest/globals';
import { useClientCacheStore, CachedProduct } from '@/store/clientCacheStore';

describe('Client Cache Zustand Store (Offline Product Cache)', () => {
  beforeEach(() => {
    useClientCacheStore.setState({ products: {}, categories: [] });
  });

  const mockProduct: CachedProduct = {
    id: 'prod-001',
    name: 'Royal Chiniot Sheesham Bed',
    price: 385000,
    category: 'Beds',
    image: 'https://images.unsplash.com/photo-1505693416388',
    isPremium: true,
  };

  it('stores and retrieves a single product by ID', () => {
    useClientCacheStore.getState().setProduct(mockProduct);
    const retrieved = useClientCacheStore.getState().getProduct('prod-001');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Royal Chiniot Sheesham Bed');
    expect(retrieved?.price).toBe(385000);
    expect(retrieved?.isPremium).toBe(true);
  });

  it('bulk stores products with setProducts', () => {
    const products: CachedProduct[] = [
      mockProduct,
      {
        id: 'prod-002',
        name: 'Velvet Chesterfield Sofa',
        price: 245000,
        category: 'Sofas',
        image: 'https://images.unsplash.com/photo-1555041469',
      },
    ];

    useClientCacheStore.getState().setProducts(products);
    const state = useClientCacheStore.getState();

    expect(Object.keys(state.products)).toHaveLength(2);
    expect(state.getProduct('prod-002')?.name).toBe('Velvet Chesterfield Sofa');
  });

  it('returns undefined for non-existent product IDs', () => {
    const res = useClientCacheStore.getState().getProduct('non-existent-id');
    expect(res).toBeUndefined();
  });

  it('manages category list correctly', () => {
    const categories = ['Beds', 'Sofas', 'Dining', 'Wardrobes'];
    useClientCacheStore.getState().setCategories(categories);
    expect(useClientCacheStore.getState().categories).toEqual(categories);
  });
});
