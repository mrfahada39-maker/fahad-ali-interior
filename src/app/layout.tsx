import { logger } from '@/lib/logger';
import ReactDOM from 'react-dom';
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { db } from "@/lib/db";

const getCachedSettings = unstable_cache(
  async () => {
    try {
      const s = await db.settings.findFirst();
      if (!s) return null;
      return {
        ...s,
        adminEmail: s.adminEmail?.toLowerCase() === 'mrfahada39@gmail.com' ? 'concierge@fahadali.pk' : s.adminEmail,
      };
    } catch (e) {
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        logger.error('Failed to load site settings:', e);
      }
      return null;
    }
  },
  ['global-settings-v3'],
  { revalidate: 3600, tags: ['settings'] }
);

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  preload: false,
});

const siteUrl = getSiteUrl();

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  name: "Fahad Ali Interior",
  url: siteUrl,
  logo: "https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/fahad-ali-interior/assets/fahad_ali_logo.svg",
  image: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80`,
  description:
    "Handcrafted luxury furniture from Lahore, Pakistan. Premium 100% solid seasoned Sheesham wood beds, L-shape sofas, dining sets, and bespoke wardrobes with a 10-year structural and anti-termite guarantee.",
  telephone: "+92-321-3283301",
  email: "concierge@fahadali.pk",
  priceRange: "PKR 35,000 - PKR 450,000",
  currenciesAccepted: "PKR",
  paymentAccepted: "Cash on Delivery (COD), RAAST Instant Bank Transfer, JazzCash, Easypaisa, Visa, Mastercard",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Main Boulevard, Gulberg III",
    addressLocality: "Lahore",
    addressRegion: "Punjab",
    postalCode: "54660",
    addressCountry: "PK",
  },
  areaServed: [
    { "@type": "City", name: "Lahore" },
    { "@type": "City", name: "Islamabad" },
    { "@type": "City", name: "Rawalpindi" },
    { "@type": "City", name: "Karachi" },
    { "@type": "City", name: "Faisalabad" },
    { "@type": "City", name: "Multan" },
    { "@type": "Country", name: "Pakistan" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "14:00",
      closes: "22:00",
    },
  ],
  sameAs: [
    "https://instagram.com/fahadaliinterior",
    "https://facebook.com/fahadaliinterior",
  ],
};

// Viewport config — theme-color for PWA browser chrome
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#c9a96e" },
    { media: "(prefers-color-scheme: light)", color: "#c9a96e" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Fahad Ali Interior | Luxury Pakistani Furniture",
    template: "%s | Fahad Ali Interior",
  },
  description:
    "Handcrafted luxury furniture from Lahore, Pakistan. Premium solid Sheesham beds, sofas, dining sets, and wardrobes crafted by master artisans.",
  keywords: [
    "luxury furniture", "Pakistan", "Lahore", "handcrafted",
    "Sheesham wood", "interior design", "beds", "sofas", "dining", "wardrobes",
  ],
  // ── PWA manifest & icons (versioned icons enable 1-year immutable CDN caching) ──
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.v1.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.v1.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fahad Ali Interior",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#c9a96e",
    "msapplication-tap-highlight": "no",
  },
  // ── Open Graph ──────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "Fahad Ali Interior",
    title: "Fahad Ali Interior | Luxury Pakistani Furniture",
    description:
      "Handcrafted luxury furniture from Lahore, Pakistan. Where heritage meets contemporary design.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fahad Ali Interior | Luxury Pakistani Furniture",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fahad Ali Interior | Luxury Pakistani Furniture",
    description: "Handcrafted luxury furniture from Lahore, Pakistan.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(siteUrl),
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSettings();
  ReactDOM.preconnect('https://res.cloudinary.com', { crossOrigin: 'anonymous' });
  ReactDOM.preconnect('https://images.unsplash.com', { crossOrigin: 'anonymous' });
  ReactDOM.dnsPrefetch('https://res.cloudinary.com');
  ReactDOM.dnsPrefetch('https://images.unsplash.com');
  ReactDOM.dnsPrefetch('https://fonts.gstatic.com');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={organizationJsonLd} />
      </head>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} antialiased bg-theme-bg text-theme-dark`}
      >
        <Providers initialSettings={settings}>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  );
}
