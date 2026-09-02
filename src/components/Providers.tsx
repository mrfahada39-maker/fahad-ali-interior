'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteSettingsStore, SiteSettings } from '@/store/siteSettingsStore';
import { useClientCacheStore } from '@/store/clientCacheStore';
import TelemetryTracker from '@/components/TelemetryTracker';
import { CLOUDINARY_ASSETS } from '@/lib/cloudinary-assets';

interface ProvidersProps {
  children: ReactNode;
  initialSettings?: SiteSettings | null;
}

const CRITICAL_PREFETCH_ROUTES = [
  '/shop',
  '/shop/categories',
  '/cart',
  '/checkout',
  '/contact',
  '/faq',
  '/about',
];

const CRITICAL_PRELOAD_IMAGES = [
  CLOUDINARY_ASSETS.logo,
  CLOUDINARY_ASSETS.heroDesktopPoster,
  CLOUDINARY_ASSETS.heroMobilePoster,
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595514535415-eb942f2ed805?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80',
];

export default function Providers({ children, initialSettings }: ProvidersProps) {
  const router = useRouter();
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

  // ── Ultra-Fast Zero-Latency Global Pre-warmer ────────────────────────────
  useEffect(() => {
    const prewarm = () => {
      // 1. Preload key routes in Next.js router cache
      CRITICAL_PREFETCH_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {}
      });

      // 2. Pre-cache live products in memory
      fetch('/api/v1/products')
        .then((res) => res.json())
        .then((body) => {
          const items = body?.data || body?.products || (Array.isArray(body) ? body : []);
          if (items && items.length > 0) {
            setCachedProducts(items);
            // Preload product detail routes & image assets
            items.forEach((p: any) => {
              if (p?.id) router.prefetch(`/product/${p.id}`);
              if (p?.image) {
                const img = new window.Image();
                img.src = p.image;
              }
            });
          }
        })
        .catch(() => {});

      // 3. Preload all core images into browser disk/memory cache
      CRITICAL_PRELOAD_IMAGES.forEach((src) => {
        try {
          const img = new window.Image();
          img.src = src;
        } catch {}
      });
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prewarm, { timeout: 200 });
      } else {
        setTimeout(prewarm, 100);
      }
    }
  }, [router, setCachedProducts]);

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
