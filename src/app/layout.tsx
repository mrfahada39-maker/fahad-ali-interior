import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { unstable_cache } from "next/cache";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { db } from "@/lib/db";

const getCachedSettings = unstable_cache(
  async () => {
    try {
      return await db.settings.findFirst();
    } catch (e) {
      console.error('Failed to load site settings:', e);
      return null;
    }
  },
  ['global-settings'],
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
    "Handcrafted luxury furniture from Lahore, Pakistan. Premium beds, sofas, dining sets, and wardrobes.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lahore",
    addressCountry: "PK",
  },
  areaServed: "PK",
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
    "Handcrafted luxury furniture from Lahore, Pakistan. Premium beds, sofas, dining sets, and wardrobes crafted by master artisans. Where heritage meets contemporary design.",
  keywords: [
    "luxury furniture", "Pakistan", "Lahore", "handcrafted",
    "Sheesham wood", "interior design", "beds", "sofas", "dining", "wardrobes",
  ],
  // ── PWA manifest & icons ────────────────────────────────────────────────
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/fahad-ali-interior/assets/fahad_ali_logo.svg", type: "image/svg+xml" }, { url: "/logo.svg" }],
    apple: "https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/fahad-ali-interior/assets/fahad_ali_logo.svg",
    shortcut: "https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/fahad-ali-interior/assets/fahad_ali_logo.svg",
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
    images: [{ url: "/logo.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fahad Ali Interior | Luxury Pakistani Furniture",
    description: "Handcrafted luxury furniture from Lahore, Pakistan.",
  },
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} antialiased bg-theme-bg text-theme-dark`}
      >
        <JsonLd data={organizationJsonLd} />
        <Providers initialSettings={settings}>{children}</Providers>
        {process.env.VERCEL && <SpeedInsights />}
      </body>
    </html>
  );
}
