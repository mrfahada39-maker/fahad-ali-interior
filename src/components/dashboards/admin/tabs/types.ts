import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, Star, BarChart3, FileText, FolderSync, Settings, Sparkles, Radio } from 'lucide-react';

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

export type AdminBundle = {
  stats: any;
  products: any[] | { products: any[] };
  orders: any[];
  customers: any[];
  messages: any[];
  reviews: any[];
  inquiries: any[];
  siteSettings: any;
  analytics: any;
  account: { name?: string; email?: string; phone?: string };
};
