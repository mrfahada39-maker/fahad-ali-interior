'use client';

import { useWishlistStore } from '@/store/wishlistStore';
import { useMounted } from '@/hooks/use-mounted';

/** Wishlist membership safe for SSR — false until persisted store has hydrated on the client. */
export function useIsInWishlist(productId: string): boolean {
  const mounted = useMounted();
  const inList = useWishlistStore((s) => s.items.some((i) => i.id === productId));
  return mounted && inList;
}
