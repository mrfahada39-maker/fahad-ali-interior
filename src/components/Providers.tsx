/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSiteSettingsStore, useClientCacheStore, type SiteSettings } from '@/store';
const TelemetryTracker = dynamic(() => import('@/components/TelemetryTracker'), { ssr: false });
const NetworkWatcher = dynamic(() => import('@/components/NetworkWatcher'), { ssr: false });
const Toaster = dynamic(() => import('sonner').then((m) => m.Toaster), { ssr: false });

interface ProvidersProps {
  children: ReactNode;
  initialSettings?: SiteSettings | null;
}

export default function Providers({ children, initialSettings }: ProvidersProps) {
  const [interactive, setInteractive] = useState(false);
  const setSiteSettings = useSiteSettingsStore((s) => s.setSettings);
  const settings = useSiteSettingsStore((s) => s.settings);
  const setCachedProducts = useClientCacheStore((s) => s.setProducts);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (initialSettings && !hasInitialized.current) {
      hasInitialized.current = true;
      setSiteSettings(initialSettings);
    }
  }, [initialSettings, setSiteSettings]);

  // Activate non-critical background services (Toaster, SW, product cache) on first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let triggered = false;
    const onFirstInteraction = () => {
      if (triggered) return;
      triggered = true;
      setInteractive(true);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw-push.js').then((reg) => {
          reg.update().catch(() => {});
        }).catch(() => {});
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.update().catch(() => {}));
        }).catch(() => {});
      }

      if (!initialSettings && !useSiteSettingsStore.getState().settings) {
        fetch('/api/public/settings')
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error && (data.siteName || data.id)) setSiteSettings(data);
          })
          .catch(() => {});
      }

      fetch('/api/v1/products')
        .then((res) => res.json())
        .then((body) => {
          const items = body?.data || body?.products || (Array.isArray(body) ? body : []);
          if (items && items.length > 0) {
            setCachedProducts(items);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
    };
  }, [initialSettings, setSiteSettings, setCachedProducts]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.themeBgColor) root.style.setProperty('--theme-bg', settings.themeBgColor);
    if (settings.themeSurfaceColor) root.style.setProperty('--theme-surface', settings.themeSurfaceColor);
    if (settings.themeDarkColor) root.style.setProperty('--theme-dark', settings.themeDarkColor);
    if (settings.themeAccentColor) root.style.setProperty('--theme-accent', settings.themeAccentColor);
    if (settings.themeMutedColor) {
      const color = settings.themeMutedColor === '#7D746B' ? '#54473B' : settings.themeMutedColor;
      root.style.setProperty('--theme-muted', color);
    } else {
      root.style.setProperty('--theme-muted', '#54473B');
    }
    if (settings.themeBorderColor) root.style.setProperty('--theme-border', settings.themeBorderColor);

    if (settings.themeFontFamily && settings.themeFontFamily !== 'Playfair Display' && settings.themeFontFamily !== 'Inter') {
      const fontId = `google-font-${settings.themeFontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.media = 'print';
        link.onload = function(this: any) { this.media = 'all'; };
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.themeFontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
      root.style.setProperty('--font-theme-custom', `'${settings.themeFontFamily}', system-ui, -apple-system, sans-serif`);
    }
  }, [settings]);

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {interactive && <TelemetryTracker />}
      {interactive && <NetworkWatcher />}
      {interactive && (
        <Toaster
          position="top-right"
          closeButton
          richColors={false}
          duration={3500}
        />
      )}
      {children}
    </SessionProvider>
  );
}
