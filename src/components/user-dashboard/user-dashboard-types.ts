import type React from 'react';
import type { Session } from 'next-auth';

export interface UserStatsData {
  totalSpent: number;
  totalOrders: number;
  completedOrders: number;
  activeTickets: number;
  loyaltyPoints: number;
  wishlistCount: number;
  [key: string]: unknown;
}

export interface UserProfileData {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  image?: string | null;
  role?: string;
  twoFactorEnabled?: boolean;
  emailNotif?: boolean;
  pushNotif?: boolean;
  orderNotif?: boolean;
  promoNotif?: boolean;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export interface UserAddressRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
  [key: string]: unknown;
}

export interface UserReviewRecord {
  id: string;
  productId?: string;
  rating: number;
  comment?: string | null;
  image?: string | null;
  status?: string;
  createdAt?: string | Date;
  product?: {
    id?: string;
    name?: string;
    image?: string;
    category?: string;
    price?: number;
  };
  [key: string]: unknown;
}

export interface UserOrderItem {
  id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  title?: string;
  price?: number;
  quantity?: number;
  image?: string;
  product?: {
    id?: string;
    name?: string;
    image?: string;
    category?: string;
    price?: number;
  };
  [key: string]: unknown;
}

export interface DashboardOrderRecord {
  id: string;
  totalAmount?: number;
  subtotal?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingInfo?: { name?: string; email?: string; phone?: string; address?: string; city?: string };
  user?: { name?: string; email?: string; phone?: string };
  createdAt?: string | Date;
  items?: UserOrderItem[];
  [key: string]: unknown;
}

export interface UserWishlistItemRecord {
  id: string;
  productId?: string;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  material?: string;
  dimensions?: string;
  stockCount?: number;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    image?: string;
    category?: string;
    material?: string;
    dimensions?: string;
  };
  [key: string]: unknown;
}

export interface UserMessageRecord {
  id?: string;
  sender?: string;
  role?: string;
  text?: string;
  content?: string;
  createdAt?: string | Date;
  timestamp?: string | Date;
  [key: string]: unknown;
}

export interface DashboardKpiItem {
  label: string;
  numValue: number | string;
  prefix: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  iconBg: string;
  ambientGlow: string;
  cardGlow: string;
  badgeBg: string;
  dotColor: string;
}

export type SafeUserSession = Session | null;
