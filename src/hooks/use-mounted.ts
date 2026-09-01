'use client';

import { useEffect, useState } from 'react';

/** True after client mount — use before reading localStorage/persisted zustand state in SSR trees. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
