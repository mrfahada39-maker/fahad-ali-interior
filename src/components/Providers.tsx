'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import { useSiteSettingsStore, SiteSettings } from '@/store/siteSettingsStore';
import { useClientCacheStore } from '@/store/clientCacheStore';
import TelemetryTracker from '@/components/TelemetryTracker';

interface ProvidersProps {
  children: ReactNode;
  initialSettings?: SiteSettings | null;
}

export default function Providers({ children, initialSettings }: ProvidersProps) {
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

  useEffect(() => {
    if (!initialSettings && !settings) {
      fetch('/api/public/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data) setSiteSettings(data);
        })
        .catch(() => {});
    }
  }, [initialSettings, settings, setSiteSettings]);

  // Lightweight passive cache hydration (Non-blocking idle fetch)
  useEffect(() => {
    const idlePreload = () => {
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
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(idlePreload, { timeout: 3000 });
      } else {
        setTimeout(idlePreload, 2000);
      }
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
        link.onload = function() { (this as HTMLLinkElement).media = 'all'; };
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.themeFontFamily)}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
      root.style.setProperty('--font-theme-custom', `'${settings.themeFontFamily}', system-ui, -apple-system, sans-serif`);
    }
  }, [settings]);

  return (
    <SessionProvider>
      <TelemetryTracker />
      {children}
    </SessionProvider>
  );
}
