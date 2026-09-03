'use client';

import { useEffect } from 'react';

export default function NetworkWatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOfflineEvent = async () => {
      // Do nothing if already on /offline
      if (window.location.pathname === '/offline') return;

      // Check navigator.onLine first
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // Double check with a quick external ping to prevent false alarms
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 2000);
          await fetch('https://1.1.1.1/cdn-cgi/trace', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal,
          });
          clearTimeout(tid);
          // Ping succeeded -> User is actually online! Do NOT redirect!
          return;
        } catch {
          // Truly offline
          try {
            sessionStorage.setItem('last_online_path', window.location.pathname + window.location.search);
          } catch {}
          window.location.href = '/offline';
        }
      }
    };

    window.addEventListener('offline', handleOfflineEvent);

    return () => {
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, []);

  return null;
}
