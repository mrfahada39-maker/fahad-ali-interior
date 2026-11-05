import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { useCartStore } from '@/store';

describe('FloatingViewCartBar Component & Integration Contracts', () => {
  const rootDir = process.cwd();

  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.setState({ isOpen: false });
  });

  it('provides complete FloatingViewCartBar component file with gold gradient, counter badge, and openCart click action', () => {
    const compPath = path.join(rootDir, 'src/components/shop/FloatingViewCartBar.tsx');
    expect(fs.existsSync(compPath)).toBe(true);

    const compSrc = fs.readFileSync(compPath, 'utf8');
    expect(compSrc).toContain('useCartStore');
    expect(compSrc).toContain('openCart');
    expect(compSrc).toContain('getSubtotal');
    expect(compSrc).toContain('getItemCount');
    expect(compSrc).toContain('View Cart');
    expect(compSrc).toContain('Rs.');
    expect(compSrc).toContain('bottom-2.5');
    expect(compSrc).toContain('bg-gradient-to-r');
  });

  it('integrates FloatingViewCartBar in StoreShell to cover all storefront pages', () => {
    const shellPath = path.join(rootDir, 'src/components/layout/StoreShell.tsx');
    expect(fs.existsSync(shellPath)).toBe(true);

    const shellSrc = fs.readFileSync(shellPath, 'utf8');
    expect(shellSrc).toContain('FloatingViewCartBar');
    expect(shellSrc).toContain('<FloatingViewCartBar />');
  });

  it('calculates live item count and subtotal accurately for dynamic floating bar display', () => {
    const store = useCartStore.getState();
    expect(store.getItemCount()).toBe(0);
    expect(store.getSubtotal()).toBe(0);

    store.addItem({
      id: 'prod_luxury_bed',
      name: 'Royal Bed Set',
      price: 500000,
      image: '/bed.jpg',
      category: 'Bedroom',
    });

    const active = useCartStore.getState();
    expect(active.getItemCount()).toBe(1);
    expect(active.getSubtotal()).toBe(500000);

    // Open cart drawer
    active.openCart();
    expect(useCartStore.getState().isOpen).toBe(true);

    // Close cart drawer
    useCartStore.getState().closeCart();
    expect(useCartStore.getState().isOpen).toBe(false);
  });
});
