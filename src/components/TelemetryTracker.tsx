'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TelemetryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking admin & api routes
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    let isSubscribed = true;

    const runTelemetry = async () => {
      try {
        // Safely get search params without Next.js Suspense requirement
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const params = new URLSearchParams(search);

        // Detect referrer & traffic source
        const referrer = typeof document !== 'undefined' ? document.referrer || '' : '';
        let trafficSource = 'Direct Link';

        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');

        if (utmSource) {
          if (utmSource.includes('instagram')) trafficSource = 'Instagram Ad / Post';
          else if (utmSource.includes('facebook')) trafficSource = 'Facebook Ad';
          else if (utmSource.includes('google')) trafficSource = 'Google Ad';
          else if (utmSource.includes('tiktok')) trafficSource = 'TikTok Ad';
          else if (utmSource.includes('whatsapp')) trafficSource = 'WhatsApp Link';
          else trafficSource = `${utmSource.toUpperCase()} Ad (${utmMedium || 'campaign'})`;
        } else if (referrer) {
          if (referrer.includes('instagram.com')) trafficSource = 'Instagram Organic';
          else if (referrer.includes('facebook.com') || referrer.includes('fb.com')) trafficSource = 'Facebook Organic';
          else if (referrer.includes('google.com') || referrer.includes('google.com.pk')) trafficSource = 'Google Search';
          else if (referrer.includes('tiktok.com')) trafficSource = 'TikTok App';
          else if (referrer.includes('whatsapp.com')) trafficSource = 'WhatsApp Chat';
          else if (referrer.includes('t.co') || referrer.includes('twitter.com') || referrer.includes('x.com')) trafficSource = 'X / Twitter';
          else {
            try {
              const url = new URL(referrer);
              trafficSource = url.hostname.replace('www.', '');
            } catch (e) {
              trafficSource = 'External Link';
            }
          }
        }

        // Detect Device
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
        let device = 'Desktop';
        if (/mobile/i.test(ua)) device = 'Mobile';
        if (/ipad|tablet/i.test(ua)) device = 'Tablet';

        // Detect Browser
        let browser = 'Chrome';
        if (ua.includes('Firefox')) {
          browser = 'Firefox';
        } else if (ua.includes('SamsungBrowser')) {
          browser = 'Samsung Internet';
        } else if (ua.includes('Opera') || ua.includes('OPR')) {
          browser = 'Opera';
        } else if (ua.includes('Edge') || ua.includes('Edg')) {
          browser = 'Edge';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
          browser = 'Safari';
        }

        // Specific detection for Brave browser (which otherwise masquerades as Chrome)
        if (typeof navigator !== 'undefined' && (navigator as any).brave) {
          try {
            const isBrave = await (navigator as any).brave.isBrave();
            if (isBrave) browser = 'Brave';
          } catch (e) {}
        }

        if (!isSubscribed) return;

        // Page & Title
        let pageTitle = typeof document !== 'undefined' ? document.title || 'Fahad Ali Interior' : 'Fahad Ali Interior';
        if (pathname === '/') pageTitle = 'Homepage — Luxury Furniture';
        else if (pathname.startsWith('/shop')) pageTitle = 'Shop Collection';
        else if (pathname.startsWith('/product/')) pageTitle = 'Product Showcase';
        else if (pathname.startsWith('/cart')) pageTitle = 'Shopping Cart';
        else if (pathname.startsWith('/checkout')) pageTitle = 'Checkout & Payment';
        else if (pathname.startsWith('/about')) pageTitle = 'About Our Heritage';
        else if (pathname.startsWith('/contact')) pageTitle = 'Contact Us';

        let actionStatus = 'Browsing';
        if (pathname.includes('cart')) actionStatus = 'Viewing Cart';
        else if (pathname.includes('checkout')) actionStatus = 'Checkout In Progress';
        else if (pathname.startsWith('/product/')) actionStatus = 'Viewing Product Detail';

        // Session ID per browser tab with safe storage fallback
        let sessionId = '';
        try {
          sessionId = sessionStorage.getItem('fa_telemetry_sess_id') || '';
          if (!sessionId) {
            sessionId = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36).slice(-4);
            sessionStorage.setItem('fa_telemetry_sess_id', sessionId);
          }
        } catch (e) {
          sessionId = 'usr_temp_' + Math.random().toString(36).substring(2, 9);
        }

        // Real Client Geolocation Detection (Cached in session)
        let clientCity = 'Lahore';
        let clientCountry = 'Pakistan';
        try {
          const cachedGeo = sessionStorage.getItem('fa_user_geo');
          if (cachedGeo) {
            const parsed = JSON.parse(cachedGeo);
            if (parsed.city) clientCity = parsed.city;
            if (parsed.country) clientCountry = parsed.country;
          }
        } catch (e) {}

        const sendPing = () => {
          if (!isSubscribed) return;
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

          // Check if geo was updated
          try {
            const stored = sessionStorage.getItem('fa_user_geo');
            if (stored) {
              const p = JSON.parse(stored);
              if (p.city) clientCity = p.city;
              if (p.country) clientCountry = p.country;
            }
          } catch (e) {}

          const payload = JSON.stringify({
            sessionId,
            pathname,
            pageTitle,
            actionStatus,
            trafficSource,
            device,
            browser,
            city: clientCity,
            country: clientCountry,
            screen: `${typeof window !== 'undefined' ? window.innerWidth : 1280}x${typeof window !== 'undefined' ? window.innerHeight : 800}`,
          });

          if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon('/api/admin/telemetry', new Blob([payload], { type: 'application/json' }));
          } else {
            fetch('/api/admin/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          }
        };

        // Defer initial telemetry ping until browser main thread is completely idle
        let initialTimer: NodeJS.Timeout | null = null;
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            sendPing();
          }, { timeout: 3000 });
        } else {
          initialTimer = setTimeout(sendPing, 2500);
        }

        // Send heartbeat every 45 seconds only when tab is active
        const interval = setInterval(sendPing, 45000);
        return () => {
          if (initialTimer) clearTimeout(initialTimer);
          clearInterval(interval);
        };
      } catch (err) {
        console.error('TelemetryTracker error:', err);
      }
    };

    let cleanupFn: (() => void) | undefined;
    runTelemetry().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      isSubscribed = false;
      if (cleanupFn) cleanupFn();
    };
  }, [pathname]);

  return null;
}
