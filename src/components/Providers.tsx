/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { useSiteSettingsStore, useClientCacheStore, type SiteSettings } from '@/store';
import TelemetryTracker from '@/components/TelemetryTracker';

import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('sonner').then((m) => m.Toaster), { ssr: false });

import NetworkWatcher from '@/components/NetworkWatcher';

interface ProvidersProps {
  children: ReactNode;
  initialSettings?: SiteSettings | null;
}

export default function Providers({ children, initialSettings }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const setSiteSettings = useSiteSettingsStore((s) => s.setSettings);
  const settings = useSiteSettingsStore((s) => s.settings);
  const setCachedProducts = useClientCacheStore((s) => s.setProducts);
  const hasInitialized = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialSettings && !hasInitialized.current) {
      hasInitialized.current = true;
      setSiteSettings(initialSettings);
    }

    // Register Service Worker after initial load settles to avoid main-thread TBT during first 4 seconds
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const swTimer = setTimeout(() => {
        navigator.serviceWorker.register('/sw-push.js').catch(() => {});
      }, 4500);
      return () => clearTimeout(swTimer);
    }
  }, [initialSettings, setSiteSettings]);

  useEffect(() => {
    if (!initialSettings && !settings) {
      const settingsTimer = setTimeout(() => {
        fetch('/api/public/settings')
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error && (data.siteName || data.id)) setSiteSettings(data);
          })
          .catch(() => {});
      }, 2000);
      return () => clearTimeout(settingsTimer);
    }
  }, [initialSettings, settings, setSiteSettings]);

  // Lightweight passive cache hydration (Triggered on first user interaction or after 6s quiet window)
  useEffect(() => {
    let hydrated = false;
    const idlePreload = () => {
      if (hydrated) return;
      hydrated = true;
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

    if (typeof window !== 'undefined') {
      const timer = setTimeout(idlePreload, 6000);
      window.addEventListener('pointerdown', idlePreload, { once: true, passive: true });
      window.addEventListener('keydown', idlePreload, { once: true, passive: true });
      return () => {
        clearTimeout(timer);
        window.removeEventListener('pointerdown', idlePreload);
        window.removeEventListener('keydown', idlePreload);
      };
    }
  }, [setCachedProducts]);

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
    <SessionProvider>
      <TelemetryTracker />
      <NetworkWatcher />
      {mounted && (
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
