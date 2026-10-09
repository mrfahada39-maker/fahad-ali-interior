import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, Star, BarChart3, FileText, FolderSync, Settings, Sparkles, Radio, Trash2 } from 'lucide-react';

export const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ai-control-center', label: 'AI Control Radar', icon: Radio },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'ai-chatbot', label: 'AI Chatbot', icon: Sparkles },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'cms', label: 'CMS / Banner', icon: FolderSync },
  { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border border-purple-200',
  delivered: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  contacted: 'bg-blue-100 text-blue-700 border border-blue-200',
  reviewed: 'bg-green-100 text-green-700 border border-green-200',
};

export const PIE_COLORS = ['#B08552', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];

export const STORE_SETTINGS_KEYS = [
  'siteName',
  'adminEmail',
  'contactPhone',
  'storeAddress',
  'foundedYear',
  'socialInstagram',
  'socialFacebook',
  'socialWhatsapp',
  'bankName',
  'accountTitle',
  'accountNumber',
  'iban',
  'jazzcashNumber',
  'easypaisaNumber',
  'themeFontFamily',
  'themeBgColor',
  'themeSurfaceColor',
  'themeBorderColor',
  'themeDarkColor',
  'themeMutedColor',
  'themeAccentColor',
] as const;

export interface AdminProductSummary {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  images?: string[];
  stockCount?: number;
  stock?: number;
  isPremium?: boolean;
  material?: string | null;
  dimensions?: string | null;
  description?: string | null;
  createdAt?: string | Date;
  [key: string]: any;
}

export interface AdminOrderSummary {
  id?: string;
  orderNumber?: string;
  shippingName?: string | null;
  shippingEmail?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | { fullName?: string; email?: string; phone?: string; address?: string; street?: string; city?: string; province?: string } | null;
  shippingInfo?: { name?: string; email?: string; phone?: string; address?: string; city?: string; province?: string } | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  city?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  totalAmount?: any;
  subtotal?: any;
  discount?: any;
  status?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  createdAt?: string | Date | null;
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  items?: Array<{ id?: string; name?: string; price?: any; quantity?: number; image?: string }> | null;
  [key: string]: any;
}

export interface AdminCustomerSummary {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string | Date;
  [key: string]: any;
}

export interface AdminMessageSummary {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string | Date;
  [key: string]: any;
}

export interface AdminInquirySummary {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  roomType?: string;
  budget?: number;
  message?: string;
  status?: string;
  createdAt?: string | Date;
  [key: string]: any;
}

export interface AdminSiteSettings {
  siteName?: string;
  adminEmail?: string;
  contactPhone?: string;
  storeAddress?: string;
  foundedYear?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialWhatsapp?: string;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  [key: string]: any;
}

export type AdminBundle = {
  stats: Record<string, any>;
  products: AdminProductSummary[] | { products: AdminProductSummary[] };
  orders: AdminOrderSummary[];
  customers: AdminCustomerSummary[];
  users?: AdminCustomerSummary[];
  messages: AdminMessageSummary[];
  reviews: any[];
  inquiries: AdminInquirySummary[];
  siteSettings: AdminSiteSettings;
  analytics: Record<string, any>;
  account: { name?: string; email?: string; phone?: string };
};
