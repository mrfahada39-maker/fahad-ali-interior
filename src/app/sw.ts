import {
  type PrecacheEntry,
  Serwist,
  type SerwistGlobalConfig,
  NetworkOnly,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    // 1. ALL API routes MUST ALWAYS be NetworkOnly — never cache live store / admin / auth API data!
    {
      matcher({ url }) {
        return url.pathname.startsWith('/api/');
      },
      handler: new NetworkOnly(),
    },
    // 2. Admin dashboard pages must ALWAYS be NetworkOnly
    {
      matcher({ url }) {
        return url.pathname.startsWith('/admin');
      },
      handler: new NetworkOnly(),
    },
    // 3. Next.js RSC & Navigation Data: NetworkFirst (1s timeout) so live updates show instantly
    {
      matcher({ request, url }) {
        const isRsc = request.headers.get('RSC') === '1';
        return isRsc || url.pathname.startsWith('/_next/data/');
      },
      handler: new NetworkFirst({
        cacheName: 'fahad-rsc-data',
        networkTimeoutSeconds: 1,
      }),
    },
    // 4. HTML document pages (e.g. storefront home page): NetworkFirst so live DB data is always fetched
    {
      matcher({ request }) {
        return request.destination === 'document';
      },
      handler: new NetworkFirst({
        cacheName: 'fahad-pages',
        networkTimeoutSeconds: 2,
      }),
    },
    // 5. Static Next.js Webpack JS chunks: CacheFirst (content-hashed filenames)
    {
      matcher({ url }) {
        return url.pathname.startsWith('/_next/static/');
      },
      handler: new CacheFirst({
        cacheName: 'fahad-static-chunks',
      }),
    },
    // 6. Fonts and Styles
    {
      matcher({ request }) {
        return request.destination === 'font' || request.destination === 'style';
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'fahad-fonts-styles',
      }),
    },
    // 7. Product & Media Images (Cloudinary & Unsplash)
    {
      matcher({ request, url }) {
        return (
          request.destination === 'image' ||
          url.hostname === 'res.cloudinary.com' ||
          url.hostname.includes('unsplash.com')
        );
      },
      handler: new StaleWhileRevalidate({
        cacheName: 'fahad-images',
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline.html',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

