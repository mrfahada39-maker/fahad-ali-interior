import type { NextConfig } from 'next';
import path from 'path';
import withPWAInit from 'next-pwa';

const isDev        = process.env.NODE_ENV === 'development';
const isDockerBuild = process.env.DOCKER_BUILD === 'true';

// PWA — disabled in dev, active in production for 0-second offline-first caching
const withPWA = withPWAInit({
  dest:        'public',
  disable:     isDev,
  register:    !isDev,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
  // sw-push.js is our custom push SW — exclude from PWA precache, exclude video media
  exclude: [/sw-push\.js$/, /\.mp4$/i, /\.webm$/i],
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: any }) => request.mode === 'navigate',
      handler:    'NetworkFirst',
      options: {
        cacheName:  'pages-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 2,
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler:    'CacheFirst',
      options: {
        cacheName:  'google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler:    'CacheFirst',
      options: {
        cacheName:  'images',
        expiration: { maxEntries: 1000, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/(?:images\.unsplash\.com|plus\.unsplash\.com|res\.cloudinary\.com)\/.*/i,
      handler:    'CacheFirst',
      options: {
        cacheName:  'remote-cdn-images',
        expiration: { maxEntries: 1000, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/image\?.*/i,
      handler:    'CacheFirst',
      options: {
        cacheName:  'next-image',
        expiration: { maxEntries: 1000, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler:    'CacheFirst',
      options: {
        cacheName:  'next-static',
        expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/v1\/public\/.*/i,
      handler:    'StaleWhileRevalidate',
      options: {
        cacheName:  'public-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/v1\/products.*/i,
      handler:    'StaleWhileRevalidate',
      options: {
        cacheName:  'products-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
  ],
});

// Security headers (CDN/edge layer — CSP is nonce-based in middleware)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
];

function remotePatterns() {
  return [
    { protocol: 'https' as const, hostname: 'res.cloudinary.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: 'plus.unsplash.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: '**.unsplash.com', pathname: '/**' },
    { protocol: 'http' as const, hostname: '**', pathname: '/**' },
    { protocol: 'https' as const, hostname: '**', pathname: '/**' },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress:        true,
  staticPageGenerationTimeout: 300,

  typescript: {
    ignoreBuildErrors: true,
  },

  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', 'sharp', 'nodemailer'],
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  outputFileTracingExcludes: {
    '*': [
      'node_modules/@playwright/**/*',
      'node_modules/playwright/**/*',
      'node_modules/@lhci/**/*',
      'node_modules/jest/**/*',
      'node_modules/@types/**/*',
      'node_modules/typescript/**/*',
      'node_modules/eslint/**/*',
      'node_modules/@eslint/**/*',
      'tests/**/*',
      'docs/**/*',
      'scripts/**/*',
      '**/*.map',
      '**/*.d.ts',
      '**/*.md',
    ],
  },

  experimental: {
    staleTimes: {
      dynamic: 86400, // 24 hours in-memory client router cache (0ms instant page switches)
      static: 86400, // 24 hours in-memory client router cache
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'recharts/es6',
      'sonner',
      'gsap',
      'zustand',
      'clsx',
      'tailwind-merge',
      'isomorphic-dompurify',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'date-fns',
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/C:/pagefile.sys',
          '**/C:/hiberfil.sys',
          '**/C:/swapfile.sys',
          '**/C:/DumpStack.log.tmp',
        ],
      };
    }
    return config;
  },
  images: {
    unoptimized:     false,
    formats:         ['image/avif', 'image/webp'],
    remotePatterns:  remotePatterns(),
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
    deviceSizes:     [390, 640, 750, 828, 1080, 1200, 1920],
    imageSizes:      [16, 32, 48, 64, 96, 128, 256],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source:  '/api/public/home-bundle',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      {
        source:  '/api/v1/public/home-bundle',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      {
        source:  '/api/public/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      {
        source:  '/api/v1/public/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      {
        source:  '/api/products',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      {
        source:  '/api/v1/products',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' }],
      },
      // Static images & assets — 1 year immutable cache in production only
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/images/(.*)',
              headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            {
              source: '/_next/static/(.*)',
              headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
          ]
        : []),
    ];
  },
};

export default withPWA(nextConfig);
