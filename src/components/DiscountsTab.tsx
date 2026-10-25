'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Percent,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Edit2,
  Trash2,
  Share2,
  Crown,
  Zap,
  ShoppingBag,
  Coins,
  Calendar,
  X,
  Shuffle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import AnimatedCounter from '@/components/AnimatedCounter';

export interface CouponItem {
  id: string;
  code: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  isExpired: boolean;
  isMaxedOut: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalSavingsGranted: number;
}

// ── Curated Promotional Templates ──
const PROMO_TEMPLATES = [
  {
    title: 'New Client Welcome',
    subtitle: '10% OFF First Order',
    code: 'WELCOME10',
    discount: 10,
    discountType: 'PERCENTAGE' as const,
    minOrderAmount: 50000,
    maxUses: 200,
    badge: 'High Conversion',
    icon: Sparkles,
    gradient: 'from-amber-500/10 via-amber-100/40 to-white',
    border: 'border-amber-300/80',
    textGradient: 'from-amber-800 to-amber-950',
  },
  {
    title: 'Eid Festive Season',
    subtitle: '20% OFF Master Living',
    code: 'EID2026',
    discount: 20,
    discountType: 'PERCENTAGE' as const,
    minOrderAmount: 100000,
    maxUses: 100,
    badge: 'Seasonal Campaign',
    icon: Crown,
    gradient: 'from-emerald-500/10 via-emerald-100/40 to-white',
    border: 'border-emerald-300/80',
    textGradient: 'from-emerald-800 to-emerald-950',
  },
  {
    title: 'Royal Luxury Voucher',
    subtitle: 'Flat PKR 50,000 OFF',
    code: 'ROYAL50K',
    discount: 50000,
    discountType: 'FIXED' as const,
    minOrderAmount: 350000,
    maxUses: 50,
    badge: 'High-Ticket Suite',
    icon: Coins,
    gradient: 'from-purple-500/10 via-purple-100/40 to-white',
    border: 'border-purple-300/80',
    textGradient: 'from-purple-800 to-purple-950',
  },
  {
    title: 'Weekend Flash VIP',
    subtitle: 'Flat PKR 15,000 OFF',
    code: 'VIPFLASH',
    discount: 15000,
    discountType: 'FIXED' as const,
    minOrderAmount: 150000,
    maxUses: 75,
    badge: 'Limited Time',
    icon: Zap,
    gradient: 'from-blue-500/10 via-blue-100/40 to-white',
    border: 'border-blue-300/80',
    textGradient: 'from-blue-800 to-blue-950',
  },
];

export default function DiscountsTab() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [stats, setStats] = useState<CouponStats>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalSavingsGranted: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'expired' | 'percentage' | 'fixed'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formDiscount, setFormDiscount] = useState<number | string>(10);
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formMinOrder, setFormMinOrder] = useState<number | string>(0);
  const [formMaxUses, setFormMaxUses] = useState<number | string>(0);
  const [formHasExpiry, setFormHasExpiry] = useState(false);
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // ── Fetch Coupons ──
  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          setCoupons(data.coupons || []);
          if (data.stats) setStats(data.stats);
        }
      } else {
        toast.error('Failed to load discount coupons');
      }
    } catch {
      toast.error('Network error loading discount coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // ── One-Click Copy Code ──
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied to clipboard! 📋`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Share Coupon on WhatsApp ──
  const handleShareWhatsApp = (coupon: CouponItem) => {
    const discountText =
      coupon.discountType === 'PERCENTAGE'
        ? `${coupon.discount}% OFF`
        : `Flat PKR ${coupon.discount.toLocaleString()} OFF`;
    const minText =
      coupon.minOrderAmount > 0
        ? `on minimum purchase of PKR ${coupon.minOrderAmount.toLocaleString()}`
        : 'with no minimum order requirement';

    const message = `🏛️ *FAHAD ALI INTERIOR — EXCLUSIVE PRIVILEGE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Valued Client, unlock an exclusive *${discountText}* ${minText}.

🎟️ *Privilege Coupon Code:* \`${coupon.code}\`
✨ Valid for online orders & showroom consultations.
🌐 Shop now: https://fahadali.pk

_Luxury Living Redefined._`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // ── Instant Toggle Active Status ──
  const handleToggleActive = async (coupon: CouponItem) => {
    const nextState = !coupon.isActive;
    // Optimistic Update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextState } : c))
    );

    try {
      const res = await apiFetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: nextState }),
      });
      if (res.ok) {
        toast.success(
          nextState
            ? `Coupon "${coupon.code}" is now Active on storefront ✓`
            : `Coupon "${coupon.code}" has been Paused`
        );
      } else {
        loadCoupons();
        toast.error('Failed to update coupon status');
      }
    } catch {
      loadCoupons();
      toast.error('Network error updating coupon status');
    }
  };

  // ── Delete Coupon ──
  const handleDeleteCoupon = async (coupon: CouponItem) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        toast.success(`Coupon "${coupon.code}" removed successfully`);
        loadCoupons();
      } else {
        toast.error('Failed to delete coupon');
      }
    } catch {
      toast.error('Network error deleting coupon');
    }
  };

  // ── Open Modal for Create or Edit ──
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormCode('');
    setFormDiscount(10);
    setFormDiscountType('PERCENTAGE');
    setFormMinOrder(0);
    setFormMaxUses(0);
    setFormHasExpiry(false);
    setFormExpiresAt('');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingId(coupon.id);
    setFormCode(coupon.code);
    setFormDiscount(coupon.discount);
    setFormDiscountType(coupon.discountType);
    setFormMinOrder(coupon.minOrderAmount);
    setFormMaxUses(coupon.maxUses);
    setFormHasExpiry(Boolean(coupon.expiresAt));
    setFormExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setFormIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleApplyTemplate = (tmpl: (typeof PROMO_TEMPLATES)[0]) => {
    setEditingId(null);
    setFormCode(tmpl.code);
    setFormDiscount(tmpl.discount);
    setFormDiscountType(tmpl.discountType);
    setFormMinOrder(tmpl.minOrderAmount);
    setFormMaxUses(tmpl.maxUses);
    setFormHasExpiry(false);
    setFormExpiresAt('');
    setFormIsActive(true);
    setShowModal(true);
    toast.success(`Template "${tmpl.title}" loaded! You can tweak and save it.`);
  };

  // ── Random Code Generator ──
  const handleGenerateRandomCode = () => {
    const prefixes = ['ROYAL', 'FAHAD', 'LUXURY', 'ELITE', 'PRESTIGE', 'INTERIOR'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const suffix = formDiscountType === 'PERCENTAGE' ? `${formDiscount}` : 'PKR';
    setFormCode(`${prefix}-${suffix}${randomNum}`);
  };

  // ── Submit Create / Update ──
  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    const discountVal = Number(formDiscount);
    if (isNaN(discountVal) || discountVal <= 0) {
      toast.error('Please enter a valid positive discount value');
      return;
    }

    if (formDiscountType === 'PERCENTAGE' && (discountVal < 1 || discountVal > 100)) {
      toast.error('Percentage discount must be between 1% and 100%');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingId || undefined,
        code: formCode.trim().toUpperCase(),
        discount: discountVal,
        discountType: formDiscountType,
        minOrderAmount: Number(formMinOrder) || 0,
        maxUses: Number(formMaxUses) || 0,
        expiresAt: formHasExpiry && formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: formIsActive,
      };

      const res = await apiFetch('/api/admin/coupons', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        toast.success(
          editingId
            ? `Coupon "${payload.code}" updated successfully ✓`
            : `Coupon "${payload.code}" created and live! 🎉`
        );
        setShowModal(false);
        loadCoupons();
      } else {
        toast.error(data?.error || 'Failed to save coupon');
      }
    } catch {
      toast.error('Network error saving coupon');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter & Search Logic ──
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.discount.toString().includes(q) ||
        (c.minOrderAmount && c.minOrderAmount.toString().includes(q));

      if (!matchesSearch) return false;

      if (filterType === 'active') return c.isActive && !c.isExpired && !c.isMaxedOut;
      if (filterType === 'expired') return c.isExpired || c.isMaxedOut;
      if (filterType === 'percentage') return c.discountType === 'PERCENTAGE';
      if (filterType === 'fixed') return c.discountType === 'FIXED';

      return true;
    });
  }, [coupons, searchQuery, filterType]);

  // ── KPI Metric Cards ──
  const kpis = [
    {
      label: 'TOTAL DISCOUNTS CREATED',
      value: stats.totalCoupons,
      sub: '✓ Promotional Architecture',
      icon: Tag,
      color: 'text-[#B88E4B]',
      iconBg:
        'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      cardGlow:
        'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
    },
    {
      label: 'ACTIVE ON STOREFRONT',
      value: stats.activeCoupons,
      sub: '⚡ Live Checkout Redemptions',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg:
        'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      cardGlow:
        'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
    },
    {
      label: 'TOTAL CLIENT USES',
      value: stats.totalRedemptions,
      sub: '🎯 Customer Orders Redeemed',
      icon: TrendingUp,
      color: 'text-purple-600',
      iconBg:
        'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      cardGlow:
        'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
    },
    {
      label: 'ESTIMATED CLIENT SAVINGS',
      value: stats.totalSavingsGranted,
      prefix: 'PKR ',
      sub: '💰 Loyalty Value Delivered',
      icon: Coins,
      color: 'text-blue-600',
      iconBg:
        'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      cardGlow:
        'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* ── $100,000 EXECUTIVE HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Crown size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">DISCOUNT ARCHITECT &amp; PROMO ENGINE V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">STOREFRONT SYNCED</span>
              <span className="hidden lg:inline">LIVE STOREFRONT SYNCHRONIZED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Discounts &amp; Promotion{' '}
            <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">
              Engine
            </span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Manage promotional coupon codes, percentage sales, flat PKR vouchers, cart thresholds, and customer discount rules.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={() => {
              loadCoupons();
              toast.success('Discounts and coupons synchronized ✓');
            }}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-[#E7DDD0] text-stone-500 hover:text-[#221814] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh Discounts"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white text-xs font-bold tracking-wide shadow-[0_4px_16px_rgba(184,142,75,0.35)] hover:shadow-[0_6px_20px_rgba(184,142,75,0.5)] hover:brightness-105 active:scale-98 transition-all cursor-pointer"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Create Coupon Code</span>
          </button>
        </div>
      </motion.div>

      {/* ── 4 EXECUTIVE METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative overflow-hidden rounded-2xl bg-white border p-3.5 sm:p-4 transition-all duration-300 ${kpi.cardGlow}`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-stone-400 tracking-wider uppercase block">
                {kpi.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${kpi.iconBg}`}
              >
                <kpi.icon size={15} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1F1612] tracking-tight font-serif">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix || ''} />
            </div>

            <p className="text-[10px] sm:text-[11px] font-semibold text-stone-500 mt-1 flex items-center gap-1">
              {kpi.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── ONE-CLICK PROMOTIONAL CAMPAIGN TEMPLATES ── */}
      <div className="bg-white/95 border border-[#E7DDD0] rounded-2xl p-4 shadow-[0_4px_20px_rgba(44,30,24,0.02)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B88E4B] animate-pulse" />
            <h3 className="font-serif font-black text-xs sm:text-sm text-[#1F1612] tracking-wide uppercase">
              Quick Launch Promotional Templates (1-Click Setup)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-stone-400 hidden sm:inline">
            Pre-configured Luxury Furniture Campaigns
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PROMO_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl border p-3 bg-gradient-to-br ${tmpl.gradient} ${tmpl.border} flex flex-col justify-between group hover:shadow-md transition-all`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/80 border border-stone-200/80 px-2 py-0.5 rounded-full text-stone-700">
                    {tmpl.badge}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-white/90 border border-stone-200/70 flex items-center justify-center text-amber-700">
                    <tmpl.icon size={12} />
                  </div>
                </div>

                <h4 className="font-bold text-xs sm:text-sm text-[#1F1612]">{tmpl.title}</h4>
                <p className="text-[11px] font-medium text-stone-600 mt-0.5">{tmpl.subtitle}</p>

                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-stone-300/80 text-[#8C6239]">
                    {tmpl.code}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    Min PKR {(tmpl.minOrderAmount / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="mt-2.5 w-full py-1.5 rounded-lg bg-white hover:bg-[#FAF5EE] border border-stone-300/80 text-stone-700 hover:text-[#1F1612] text-[10.5px] font-bold tracking-wide flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Use Template</span>
                <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-[#E7DDD0] p-2.5 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code (e.g. WELCOME10, EID2026, 50000)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] text-xs font-medium text-[#1F1612] focus:outline-none focus:border-[#B88E4B] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide shrink-0 pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Coupons' },
              { id: 'active', label: 'Active Live' },
              { id: 'percentage', label: 'Percentage (%)' },
              { id: 'fixed', label: 'Fixed PKR' },
              { id: 'expired', label: 'Expired / Cap' },
            ] as const
          ).map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#221814] text-[#F5D77F] shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-[#E7DDD0]/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COUPONS CARDS GRID ── */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#E7DDD0] rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-[#B88E4B] flex items-center justify-center mx-auto shadow-xs">
            <Tag size={24} />
          </div>
          <h3 className="font-serif font-black text-base sm:text-lg text-[#1F1612]">
            {searchQuery ? 'No coupons matched your search' : 'No promotional coupons created yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or reset the filter pills to see all available promotional coupons.'
              : 'Create your first discount coupon code or apply one of the pre-configured luxury campaign templates above.'}
          </p>
          <div className="pt-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white text-xs font-bold shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              + Create First Coupon
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCoupons.map((coupon) => {
            const isPercent = coupon.discountType === 'PERCENTAGE';
            const isUsable = coupon.isActive && !coupon.isExpired && !coupon.isMaxedOut;

            return (
              <motion.div
                key={coupon.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-200 group hover:shadow-md ${
                  isUsable ? 'border-[#E7DDD0] hover:border-[#B88E4B]' : 'border-stone-200 opacity-80'
                }`}
              >
                {/* Visual Luxury Voucher Accent Header */}
                <div
                  className={`h-2.5 w-full bg-gradient-to-r ${
                    isPercent
                      ? 'from-emerald-500 via-teal-500 to-emerald-700'
                      : 'from-[#B88E4B] via-[#D4AF37] to-[#8C6239]'
                  }`}
                />

                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Bar: Discount Badge + Active Switch */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isPercent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          {isPercent ? `${coupon.discount}% OFF` : `PKR ${coupon.discount.toLocaleString()} OFF`}
                        </span>

                        <span
                          className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            coupon.isExpired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : coupon.isMaxedOut
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : coupon.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {coupon.isExpired
                            ? 'Expired'
                            : coupon.isMaxedOut
                            ? 'Max Uses Reached'
                            : coupon.isActive
                            ? '● Live Active'
                            : 'Paused'}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-stone-400 mt-1 block">
                        {isPercent ? 'Percentage Cart Deduction' : 'Flat PKR Cash Deduction'}
                      </span>
                    </div>

                    {/* Instant Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(coupon)}
                      title={coupon.isActive ? 'Click to Pause' : 'Click to Activate'}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        coupon.isActive ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          coupon.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Coupon Code Punch Ticket Box */}
                  <div className="bg-[#FAF7F2] border border-[#E7DDD0] rounded-xl p-2.5 flex items-center justify-between gap-2 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#E7DDD0] flex items-center justify-center text-[#8C6239] shrink-0 shadow-2xs">
                        <Tag size={14} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">
                          Client Coupon Code
                        </span>
                        <span className="font-mono font-black text-sm text-[#1F1612] tracking-wider">
                          {coupon.code}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DDD0] hover:border-[#B88E4B] text-stone-600 hover:text-[#1F1612] text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rules Breakdown */}
                  <div className="space-y-1.5 text-xs text-stone-600 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 flex items-center gap-1">
                        <ShoppingBag size={11} /> Minimum Order
                      </span>
                      <strong className="font-mono text-[#1F1612]">
                        {coupon.minOrderAmount > 0
                          ? `PKR ${coupon.minOrderAmount.toLocaleString()}`
                          : 'No Minimum'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-400 flex items-center gap-1">
                        <Calendar size={11} /> Expiration
                      </span>
                      <strong
                        className={`font-medium ${
                          coupon.isExpired ? 'text-rose-600 font-bold' : 'text-[#1F1612]'
                        }`}
                      >
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('en-PK', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No Expiry (Lifetime)'}
                      </strong>
                    </div>

                    {/* Usage Progress */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-stone-400">Redemption Usage</span>
                        <span className="font-mono font-bold text-stone-700">
                          {coupon.usedCount} used {coupon.maxUses > 0 ? `/ ${coupon.maxUses} max` : '(Unlimited)'}
                        </span>
                      </div>
                      {coupon.maxUses > 0 && (
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              coupon.isMaxedOut
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-[#B88E4B] to-[#5A3A1A]'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((coupon.usedCount / coupon.maxUses) * 100))}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="pt-2 border-t border-[#E7DDD0]/70 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(coupon)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Share offer via WhatsApp"
                    >
                      <Share2 size={11} />
                      <span>WhatsApp Share</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(coupon)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT COUPON MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-[#E7DDD0] max-w-xl w-full shadow-2xl overflow-hidden relative"
            >
              {/* Modal Gold Gradient Top Bar */}
              <div className="h-2 w-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239]" />

              <div className="p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E7DDD0]">
                  <div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] flex items-center gap-1">
                      <Crown size={11} className="text-[#B88E4B]" />
                      Promotion Architect
                    </span>
                    <h3 className="font-serif font-black text-lg sm:text-xl text-[#1F1612]">
                      {editingId ? 'Edit Discount Coupon' : 'Create New Coupon Code'}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmitCoupon} className="space-y-4">
                  {/* Coupon Code Input + Random Generator */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider flex items-center justify-between">
                      <span>Coupon Code</span>
                      <button
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="text-[11px] text-[#8C6239] hover:text-[#5A3A1A] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Shuffle size={11} /> Generate Code
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        placeholder="e.g. WELCOME10, EID2026, ROYAL50K"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] font-mono text-sm font-black text-[#1F1612] tracking-wider uppercase focus:outline-none focus:border-[#B88E4B]"
                      />
                    </div>
                  </div>

                  {/* Discount Type: Segmented Switch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider block">
                      Discount Calculation Model
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1.5 rounded-xl border border-[#E7DDD0]">
                      <button
                        type="button"
                        onClick={() => setFormDiscountType('PERCENTAGE')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          formDiscountType === 'PERCENTAGE'
                            ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Percent size={13} className="text-emerald-600" />
                        <span>Percentage (%) Off</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormDiscountType('FIXED')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          formDiscountType === 'FIXED'
                            ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Coins size={13} className="text-[#8C6239]" />
                        <span>Fixed Amount (PKR)</span>
                      </button>
                    </div>
                  </div>

                  {/* Discount Value & Minimum Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider block">
                        {formDiscountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (PKR)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={formDiscountType === 'PERCENTAGE' ? 100 : 10000000}
                        value={formDiscount}
                        onChange={(e) => setFormDiscount(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] font-mono text-sm font-bold text-[#1F1612] focus:outline-none focus:border-[#B88E4B]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider block">
                        Minimum Cart Value (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={formMinOrder}
                        onChange={(e) => setFormMinOrder(e.target.value)}
                        placeholder="0 for no minimum"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] font-mono text-sm font-bold text-[#1F1612] focus:outline-none focus:border-[#B88E4B]"
                      />
                    </div>
                  </div>

                  {/* Usage Limit & Expiration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider block">
                        Total Usage Limit
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formMaxUses}
                        onChange={(e) => setFormMaxUses(e.target.value)}
                        placeholder="0 for unlimited redemptions"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] font-mono text-sm font-bold text-[#1F1612] focus:outline-none focus:border-[#B88E4B]"
                      />
                      <span className="text-[10px] text-stone-400">0 = Unlimited redemptions allowed</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1F1612] uppercase tracking-wider">
                          Expiration Date
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormHasExpiry(!formHasExpiry)}
                          className="text-[10.5px] font-bold text-[#8C6239] cursor-pointer"
                        >
                          {formHasExpiry ? 'Set Lifetime' : 'Set Expiry Date'}
                        </button>
                      </div>

                      {formHasExpiry ? (
                        <input
                          type="date"
                          value={formExpiresAt}
                          onChange={(e) => setFormExpiresAt(e.target.value)}
                          required={formHasExpiry}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] text-xs font-mono font-bold text-[#1F1612] focus:outline-none focus:border-[#B88E4B]"
                        />
                      ) : (
                        <div className="w-full px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Lifetime Validity (No Expiration)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0]">
                    <div>
                      <span className="text-xs font-bold text-[#1F1612] block">Enable Coupon on Storefront</span>
                      <span className="text-[10.5px] text-stone-500">
                        When enabled, customers can apply this code during checkout.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formIsActive ? 'bg-emerald-600' : 'bg-stone-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          formIsActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Live Ticket Preview */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400 block">
                      Live Customer Preview Ticket:
                    </span>
                    <div className="rounded-xl border border-dashed border-[#B88E4B] bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] text-white flex items-center justify-center font-bold">
                          {formDiscountType === 'PERCENTAGE' ? '%' : '₨'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-[#1F1612]">
                              {formCode || 'ENTER_CODE'}
                            </span>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {formDiscountType === 'PERCENTAGE'
                                ? `${formDiscount || 0}% OFF`
                                : `PKR ${Number(formDiscount || 0).toLocaleString()} OFF`}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500">
                            {Number(formMinOrder) > 0
                              ? `Min order PKR ${Number(formMinOrder).toLocaleString()}`
                              : 'No minimum order required'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10.5px] font-bold text-[#8C6239]">Store Valid ✓</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E7DDD0]">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E7DDD0] text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white text-xs font-bold tracking-wide shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          <span>{editingId ? 'Update Coupon' : 'Publish Coupon'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
