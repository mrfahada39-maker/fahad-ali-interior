'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/store';

/** True after client mount — use before reading localStorage/persisted zustand state in SSR trees. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Wishlist membership safe for SSR — false until persisted store has hydrated on the client. */
export function useIsInWishlist(productId: string): boolean {
  const mounted = useMounted();
  const inList = useWishlistStore((s) => s.items.some((i) => i.id === productId));
  return mounted && inList;
}
