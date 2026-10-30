/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Heart, User, MapPin, MessageCircle, Settings, Shield,
  Package, Star, Sparkles, Home, Crown, Clock, Phone, Truck, Lock,
  MessageSquare, ShieldCheck, ClipboardList, Coins, CheckCircle2, PhoneCall,
} from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';

export const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Bespoke Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Haute Wishlist', icon: Heart },
  { id: 'concierge', label: 'VIP Concierge', icon: MessageCircle },
  { id: 'reviews', label: 'My Reviews', icon: Star },
  { id: 'addresses', label: 'Residences', icon: MapPin },
  { id: 'profile', label: 'Client Profile', icon: User },
  { id: 'security', label: 'Security & 2FA', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

const KPI_THEMES = {
  amber: {
    color: 'text-[#B88E4B]',
    iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
    ambientGlow: 'bg-[#B88E4B]/10',
    cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
    dotColor: 'bg-amber-500',
  },
  amberEmeraldBadge: {
    color: 'text-[#B88E4B]',
    iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
    ambientGlow: 'bg-[#B88E4B]/10',
    cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  },
  blue: {
    color: 'text-blue-600',
    iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
    ambientGlow: 'bg-blue-500/10',
    cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
    dotColor: 'bg-blue-500',
  },
  purple: {
    color: 'text-purple-600',
    iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
    ambientGlow: 'bg-purple-500/10',
    cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
    dotColor: 'bg-purple-500',
  },
  emerald: {
    color: 'text-emerald-600',
    iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
    ambientGlow: 'bg-emerald-500/10',
    cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
  },
};

function kpi(
  label: string,
  numValue: number | string,
  prefix: string,
  sub: string,
  icon: any,
  theme: keyof typeof KPI_THEMES
) {
  return { label, numValue, prefix, sub, icon, ...KPI_THEMES[theme] };
}

export function buildDashboardKpis({
  totalSpentCalculated,
  totalOrdersCount,
  deliveredCount,
  orders,
  mergedWishlist,
  stats,
  myReviews,
  addresses,
}: {
  totalSpentCalculated: number;
  totalOrdersCount: number;
  deliveredCount: number;
  orders: any[];
  mergedWishlist: any[];
  stats: any;
  myReviews: any[];
  addresses: any[];
}) {
  const approvedReviewsCount = myReviews.filter((r) => (r.status || '').toLowerCase() === 'approved').length;
  const pendingReviewsCount = myReviews.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length;
  const userAvgRating =
    myReviews.length > 0
      ? (myReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / myReviews.length).toFixed(1)
      : '5.0';

  const activeCommissions = (orders || []).filter((o) => {
    const s = String(o?.status || '').toUpperCase();
    return s !== 'DELIVERED' && s !== 'CANCELLED';
  }).length;

  return {
    overviewKpis: [
      kpi('TOTAL EXPENDITURE', totalSpentCalculated, 'Rs. ', totalOrdersCount === 0 ? 'No commissions yet' : `${totalOrdersCount} Bespoke Orders`, Coins, 'amberEmeraldBadge'),
      kpi('MY ORDERS', totalOrdersCount, '', `${deliveredCount} Delivered Pieces`, ClipboardList, 'blue'),
      kpi('HAUTE WISHLIST', mergedWishlist.length, '', 'Curated Private Pieces', Heart, 'purple'),
      kpi('VIP LOYALTY POINTS', stats?.loyaltyPoints ?? Math.floor(totalSpentCalculated / 1000), '', totalSpentCalculated > 50000 ? 'Gold VIP Tier' : 'VIP Patron Tier', Crown, 'emerald'),
    ],
    ordersKpis: [
      kpi('TOTAL COMMISSION SPEND', totalSpentCalculated, 'Rs. ', `${totalOrdersCount} Orders in Period`, Coins, 'amberEmeraldBadge'),
      kpi('ACTIVE COMMISSIONS', activeCommissions, '', 'In Artisan Production', ClipboardList, 'blue'),
      kpi('COMPLETED PATRONAGE', deliveredCount, '', '100% Quality Inspected', CheckCircle2, 'purple'),
      kpi('WHITE-GLOVE LOGISTICS', 'Insured', '', 'Zero-Damage Protection', Truck, 'emerald'),
    ],
    wishlistKpis: [
      kpi('CURATED LIVING PIECES', mergedWishlist.length, '', 'Haute Private Collection', Heart, 'amber'),
      kpi('PORTFOLIO VALUE', mergedWishlist.reduce((sum, item) => sum + (Number(item.product?.price) || 0), 0), 'Rs. ', 'Estimated Asset Worth', Coins, 'blue'),
      kpi('TIMBER SPECIFICATION', 'Solid Sheesham', '', 'Lifetime Seasoning Guarantee', ShieldCheck, 'emerald'),
      kpi('VIP ALLOCATION', 'Instant Reserve', '', 'Priority Workshop Queue', Package, 'purple'),
    ],
    conciergeKpis: [
      kpi('ATELIER RESPONSE TIME', '< 2 Minutes', '', 'Direct Master Desk', Clock, 'emerald'),
      kpi('MASTER ARTISAN', 'Fahad Ali Suite', '', 'Architectural Lead', Crown, 'amber'),
      kpi('ENCRYPTED PROTOCOL', '256-Bit TLS', '', 'Private Concierge Guard', ShieldCheck, 'purple'),
      kpi('CONSULTATION STATUS', 'Live Channel', '', 'Audio, Video & Notes', PhoneCall, 'blue'),
    ],
    reviewsKpis: [
      kpi('VERIFIED PATRON REVIEWS', myReviews.length, '', myReviews.length === 0 ? 'No reviews submitted' : `${myReviews.length} Testimonials Shared`, Star, 'amber'),
      kpi('AVERAGE SATISFACTION', `${userAvgRating} ★`, '', 'Excellence Experience Grade', Crown, 'blue'),
      kpi('LOYALTY REWARDS', myReviews.length * 300, '+ ', 'Atelier Privilege Points', Coins, 'purple'),
      kpi('ATELIER STATUS', approvedReviewsCount > 0 ? `${approvedReviewsCount} Live` : pendingReviewsCount > 0 ? `${pendingReviewsCount} Pending` : 'Verified Patron', '', pendingReviewsCount > 0 ? `${pendingReviewsCount} Under Verification` : 'All Reviews Verified', CheckCircle2, 'emerald'),
    ],
    addressesKpis: [
      kpi('REGISTERED HAVENS', addresses.length, '', 'Verified VIP Locations', Home, 'amber'),
      kpi('PRIMARY DISPATCH CITY', addresses[0]?.city || (addresses.length > 0 ? 'Verified' : 'Not Registered'), '', 'Default Installation Hub', MapPin, 'emerald'),
      kpi('LOGISTICS COVERAGE', 'All Pakistan', '', 'White-Glove Delivery Fleet', Truck, 'blue'),
      kpi('TRANSIT PROTOCOL', '100% Insured', '', 'Zero-Damage Warranty', ShieldCheck, 'purple'),
    ],
    profileKpis: [
      kpi('MEMBERSHIP TIER', totalSpentCalculated > 200000 ? 'Diamond 👑' : totalSpentCalculated > 50000 ? 'Gold 👑' : 'VIP Patron 👑', '', 'Verified Patron Account', Crown, 'amber'),
      kpi('PATRONAGE SENIORITY', `Since ${new Date().getFullYear()}`, '', 'Registered VIP Account', Clock, 'purple'),
      kpi('COMMISSION PRIORITY', 'Standard VIP', '', 'Dedicated Artisan Line', Sparkles, 'emerald'),
      kpi('ACCOUNT SECURITY', 'Protected', '', 'Encrypted Cloud Sync', ShieldCheck, 'blue'),
    ],
    securityKpis: [
      kpi('SECURITY SHIELD', 'Enterprise 🛡️', '', 'Zero Vulnerabilities Detected', ShieldCheck, 'emerald'),
      kpi('ACTIVE SESSIONS', 1, '', 'Current Device Logged-In', Lock, 'blue'),
      kpi('2FA AUTHENTICATION', 'Hardware TOTP', '', 'Google / Apple Authenticator', Phone, 'purple'),
      kpi('AUDIT LOGGING', '100% Real-Time', '', 'Immutable Access Guard', CheckCircle2, 'amber'),
    ],
    settingsKpis: [
      kpi('DEFAULT CURRENCY', 'PKR (Rs.)', '', 'National Currency Standard', Coins, 'amber'),
      kpi('VIP DROP ALERTS', 'Enabled 🔔', '', 'Instant In-App Alerts', Sparkles, 'emerald'),
      kpi('CONCIERGE ROUTING', 'Priority VIP Desk', '', 'Dedicated Artisan Channel', MessageSquare, 'purple'),
      kpi('PLATFORM BUILD', 'Suite v2.4', '', '100% Production Ready', Settings, 'blue'),
    ],
  };
}

export function renderKpiGrid(kpis: any[]) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 shrink-0">
      {kpis.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className={`bg-gradient-to-br from-white/95 via-[#FCFAF7]/90 to-[#FAF5EE]/95 backdrop-blur-md border rounded-2xl sm:rounded-[22px] p-3 sm:p-4.5 flex flex-col justify-between min-h-[114px] sm:min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${item.cardGlow}`}
        >
          <div className={`absolute -top-10 -right-10 w-24 sm:w-28 h-24 sm:h-28 rounded-full blur-2xl pointer-events-none transition-all duration-500 opacity-90 sm:opacity-60 sm:group-hover:opacity-100 animate-pulse ${item.ambientGlow}`} />
          <div className={`absolute -bottom-8 -left-8 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-40 sm:group-hover:opacity-75 transition-opacity ${item.ambientGlow}`} />

          <div className="flex justify-between items-start relative z-10 gap-1">
            <span className="text-[9px] sm:text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase truncate leading-tight">
              {item.label}
            </span>
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${item.iconBg}`}>
              <item.icon size={15} className="sm:w-[17px] sm:h-[17px] stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-1.5 sm:mt-2 relative z-10">
            <h3 className="text-[17px] sm:text-[26px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline flex-wrap">
              {item.prefix ? (
                <span className="text-[11px] sm:text-base font-bold text-[#8C6D46] mr-0.5 sm:mr-1 select-none">{item.prefix}</span>
              ) : null}
              {typeof item.numValue === 'number' ? (
                <AnimatedCounter value={item.numValue} duration={1.5} />
              ) : (
                <span>{item.numValue}</span>
              )}
            </h3>
            <div className="mt-2.5 flex items-center">
              <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border shadow-2xs truncate ${item.badgeBg}`}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.dotColor} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${item.dotColor}`} />
                </span>
                <span className="truncate">{item.sub}</span>
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function renderHeaderBanner(
  tagShort: string,
  tagFull: string,
  liveTagShort: string,
  liveTagFull: string,
  titlePrefix: string,
  titleAccent: string,
  subtitle: string,
  actionButton?: React.ReactNode
) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
    >
      <div className="relative z-10 w-full lg:w-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
            <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
            <span className="lg:hidden">{tagShort}</span>
            <span className="hidden lg:inline">{tagFull}</span>
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
            </span>
            <span className="lg:hidden tracking-wide">{liveTagShort}</span>
            <span className="hidden lg:inline tracking-wide">{liveTagFull}</span>
          </span>
        </div>
        <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
          <span className="sm:hidden">
            {titlePrefix.replace(/^Fahad Ali Interior\s*—?\s*/i, '')} <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">{titleAccent.replace(/^—\s*/, '')}</span>
          </span>
          <span className="hidden sm:inline">
            {titlePrefix} <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">{titleAccent}</span>
          </span>
        </h1>
        <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">{subtitle}</p>
      </div>
      {actionButton && (
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          {actionButton}
        </div>
      )}
    </motion.div>
  );
}
