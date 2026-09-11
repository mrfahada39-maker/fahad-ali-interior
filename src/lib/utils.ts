import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Consistent PKR price formatting across the storefront. */
export function formatPricePk(amount: number, decimals: 0 | 2 = 0): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimals === 0 ? Math.round(amount) : amount);
}

/** Canonical site origin for SEO (sitemap, robots, JSON-LD, Open Graph). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fahad-ali-interior.vercel.app');
  return raw.replace(/\/$/, '');
}

/** True when local/dev may skip verified-email checks (see SKIP_EMAIL_VERIFICATION + NEXTAUTH_URL). */
export function shouldSkipEmailVerification(): boolean {
  if (process.env.SKIP_EMAIL_VERIFICATION !== 'true') return false;
  if (process.env.NODE_ENV !== 'production') return true;
  const url = process.env.NEXTAUTH_URL ?? '';
  return url.includes('localhost') || url.includes('127.0.0.1');
}

export const DEFAULT_ADMIN_STATS = {
  totalRevenue: 0,
  orderCount: 0,
  userCount: 0,
  productCount: 0,
  pendingOrders: 0,
  processingOrders: 0,
  shippedOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
};

export const DEFAULT_ADMIN_ORDERS: any[] = [];
