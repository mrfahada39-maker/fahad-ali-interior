'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NetworkWatcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      if (window.location.pathname !== '/offline') {
        try {
          sessionStorage.setItem('last_online_path', window.location.pathname + window.location.search);
        } catch {}
        window.location.href = '/offline';
      }
    };

    // Initial check on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine && window.location.pathname !== '/offline') {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [pathname, router]);

  return null;
}
