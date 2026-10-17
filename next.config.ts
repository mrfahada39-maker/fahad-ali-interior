import type { NextConfig } from 'next';
import path from 'path';
import withSerwistInit from '@serwist/next';

const isDev = process.env.NODE_ENV === 'development';
process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = '1';

// PWA — disabled in dev, active in production for 0-second offline-first caching via Serwist
const withPWA = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: isDev,
  register: !isDev,
  reloadOnOnline: true,
  // sw-push.js is our custom push SW — exclude from PWA precache, exclude video media
  exclude: [/sw-push\.js$/, /\.mp4$/i, /\.webm$/i],
});

// Security headers (CDN/edge layer — CSP is nonce-based in middleware)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',       value: 'on' },
  { key: 'X-Frame-Options',              value: 'DENY' },
  { key: 'X-Content-Type-Options',       value: 'nosniff' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',           value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin-allow-popups' },
  // HSTS: enforce HTTPS for 2 years, include subdomains, allow preload
  { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
];

function remotePatterns() {
  return [
    { protocol: 'https' as const, hostname: 'res.cloudinary.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: 'plus.unsplash.com', pathname: '/**' },
    { protocol: 'https' as const, hostname: '**.unsplash.com', pathname: '/**' },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress:        true,
  staticPageGenerationTimeout: 300,
  httpAgentOptions: {
    keepAlive: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'sharp', 'nodemailer'],
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },

  outputFileTracingExcludes: {
    '*': [
      'node_modules/prisma/**/*',
      'node_modules/@prisma/engines/**/*',
      'node_modules/@playwright/**/*',
      'node_modules/playwright/**/*',
      'node_modules/@lhci/**/*',
      'node_modules/jest/**/*',
      'node_modules/ts-jest/**/*',
      'node_modules/@types/**/*',
      'node_modules/typescript/**/*',
      'node_modules/eslint/**/*',
      'node_modules/@eslint/**/*',
      'node_modules/tsx/**/*',
      'node_modules/esbuild/**/*',
      'node_modules/terser/**/*',
      'tests/**/*',
      'docs/**/*',
      'scripts/**/*',
      'Database/migrations/**/*',
      'Database/seed.ts',
      '**/*.map',
      '**/*.d.ts',
      '**/*.md',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
    ],
  },

  experimental: {
    inlineCss: true,
    staleTimes: {
      dynamic: 30, // 30 seconds for dynamic pages (fresh cart, price, and stock updates)
      static: 600, // 10 minutes (5-30 min window) for static pages
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'recharts/es6',
      'sonner',
      'zustand',
      'clsx',
      'tailwind-merge',
      'isomorphic-dompurify',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slot',
      'class-variance-authority',
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
    qualities:       [60, 75, 85],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/icon',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/shipping',
        destination: '/faq#delivery',
        permanent: true,
      },
      {
        source: '/delivery',
        destination: '/faq#delivery',
        permanent: true,
      },
      {
        source: '/returns',
        destination: '/faq#returns',
        permanent: true,
      },
      {
        source: '/refund',
        destination: '/faq#returns',
        permanent: true,
      },
      {
        source: '/refund-policy',
        destination: '/faq#returns',
        permanent: true,
      },
      {
        source: '/forgot-password',
        destination: '/reset-password',
        permanent: true,
      },
      {
        source: '/journal',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/journal/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ];
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
      // Revalidated caching for unversioned static assets; 1-year immutable only for versioned filenames (.v1, .v2, etc.)
      {
        source:  '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/icons/:name*.v:ver.:ext',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source:  '/images/:name*.v:ver.:ext',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source:  '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/logo.svg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/offline.html',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source:  '/sw-push.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default withPWA(nextConfig);
