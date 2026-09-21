'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  RotateCcw,
  Search,
  RefreshCw,
  FolderOpen,
  Armchair,
  ShoppingBag,
  Star,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Badge } from '@/components/badge';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/AnimatedCounter';

type RecycleSection = 'ALL' | 'PRODUCT' | 'CATEGORY' | 'ORDER' | 'REVIEW';

interface RecycleBinItem {
  id: string;
  entityType: 'PRODUCT' | 'CATEGORY' | 'ORDER' | 'REVIEW';
  entityId: string;
  name: string;
  payload: any;
  deletedBy?: string | null;
  deletedAt: string;
}

interface Counts {
  ALL: number;
  PRODUCT: number;
  CATEGORY: number;
  ORDER: number;
  REVIEW: number;
}

const SECTION_CONFIG: Record<
  RecycleSection,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeColor: string }
> = {
  ALL: {
    label: 'All Items',
    icon: Layers,
    color: 'text-[#8C6239]',
    badgeColor: 'bg-[#FAF0E2] text-[#8C6239] border-[#B88E4B]/40',
  },
  PRODUCT: {
    label: 'Products',
    icon: Armchair,
    color: 'text-emerald-700',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CATEGORY: {
    label: 'Categories',
    icon: FolderOpen,
    color: 'text-blue-700',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  ORDER: {
    label: 'Orders',
    icon: ShoppingBag,
    color: 'text-purple-700',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  REVIEW: {
    label: 'Reviews',
    icon: Star,
    color: 'text-amber-600',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export default function RecycleBinTab() {
  const [activeSection, setActiveSection] = useState<RecycleSection>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [counts, setCounts] = useState<Counts>({
    ALL: 0,
    PRODUCT: 0,
    CATEGORY: 0,
    ORDER: 0,
    REVIEW: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'SINGLE' | 'SECTION' | 'ALL';
    itemId?: string;
    itemName?: string;
    section?: RecycleSection;
  }>({ open: false, type: 'SINGLE' });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeSection !== 'ALL') {
        params.set('entityType', activeSection);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/admin/recycle-bin?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();

      if (data && data.success) {
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch {
      toast.error('Failed to load Recycle Bin items');
    } finally {
      setLoading(false);
    }
  }, [activeSection, searchQuery]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRestore = async (item: RecycleBinItem) => {
    setRestoringId(item.id);
    try {
      const res = await fetch('/api/admin/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: item.id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Restored "${item.name}" back to active database!`, {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        });
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setCounts((prev) => {
          const type = item.entityType;
          return {
            ...prev,
            ALL: Math.max(0, prev.ALL - 1),
            [type]: Math.max(0, prev[type] - 1),
          };
        });
      } else {
        toast.error(data.error || 'Failed to restore item');
      }
    } catch {
      toast.error('Network error during restore');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setPurgingId(id);
    try {
      const res = await fetch(`/api/admin/recycle-bin?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Item permanently erased from database');
        setItems((prev) => prev.filter((i) => i.id !== id));
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to delete permanently');
      }
    } catch {
      toast.error('Network error while deleting item');
    } finally {
      setPurgingId(null);
      setConfirmModal({ open: false, type: 'SINGLE' });
    }
  };

  const handleEmpty = async (section?: RecycleSection) => {
    try {
      const targetType = section && section !== 'ALL' ? section : undefined;
      const url = targetType
        ? `/api/admin/recycle-bin?entityType=${targetType}&action=empty`
        : `/api/admin/recycle-bin?all=true`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          targetType
            ? `Emptied ${SECTION_CONFIG[targetType].label} section (${data.deletedCount} items permanently purged)`
            : `Recycle Bin completely emptied (${data.deletedCount} items purged)`
        );
        fetchItems();
      } else {
        toast.error(data.error || 'Failed to empty recycle bin');
      }
    } catch {
      toast.error('Network error while emptying recycle bin');
    } finally {
      setConfirmModal({ open: false, type: 'SINGLE' });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeSection !== 'ALL' && item.entityType !== activeSection) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.entityId?.toLowerCase().includes(q) ||
        item.entityType?.toLowerCase().includes(q)
      );
    });
  }, [items, activeSection, searchQuery]);

  // ── 4 KPI METRIC CARDS (EXACT MATCHING OVERVIEW TAB & IMAGE 2) ──
  const kpis = [
    {
      label: 'TOTAL ARCHIVED ITEMS',
      numValue: counts.ALL,
      prefix: '',
      sub: counts.ALL === 0 ? '0 Items in Period' : `${counts.ALL} Items in Archive`,
      icon: Trash2,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      targetSection: 'ALL' as RecycleSection,
    },
    {
      label: 'DELETED PRODUCTS',
      numValue: counts.PRODUCT,
      prefix: '',
      sub: counts.PRODUCT === 0 ? '0 Delivered / Completed' : `${counts.PRODUCT} Restorable Products`,
      icon: Armchair,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
      targetSection: 'PRODUCT' as RecycleSection,
    },
    {
      label: 'DELETED CATEGORIES',
      numValue: counts.CATEGORY,
      prefix: '',
      sub: counts.CATEGORY === 0 ? 'Live Registered Accounts' : `${counts.CATEGORY} Restorable Categories`,
      icon: FolderOpen,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
      targetSection: 'CATEGORY' as RecycleSection,
    },
    {
      label: 'DELETED ORDERS & REVIEWS',
      numValue: counts.ORDER + counts.REVIEW,
      prefix: '',
      sub: (counts.ORDER + counts.REVIEW) === 0 ? '100% In-Stock Database' : `${counts.ORDER + counts.REVIEW} Archived Records`,
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      targetSection: 'ORDER' as RecycleSection,
    },
  ];

  return (
    <div className="space-y-4 font-sans text-[#18110D]">
      {/* ── LUXURY HEADER (MATCHES PRODUCTS & OVERVIEW TABS EXACTLY) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-4 sm:p-5 lg:p-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs font-serif">
              <Sparkles size={9} className="text-[#B88E4B]" />
              DATABASE SEPARATION ARCHIVE
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              ACTIVE TABLES 100% CLEAN
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#221814] tracking-tight font-serif">
            Recycle Bin <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Archive Manager</span>
          </h1>
          <p className="text-stone-500 text-xs font-medium mt-0.5 max-w-xl">
            Deleted items are safely stored in separate sections away from your active database. Your live tables stay 100% clean and match the website 1-to-1.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E7DDD0]/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems()}
            disabled={loading}
            className="bg-white hover:bg-[#FAF5EE] border-[#D9C4AC] text-[#1F1612] text-xs font-bold shadow-2xs rounded-full px-3.5 h-[36px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {counts.ALL > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setConfirmModal({
                  open: true,
                  type: activeSection === 'ALL' ? 'ALL' : 'SECTION',
                  section: activeSection,
                })
              }
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-full px-3.5 h-[36px] shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {activeSection === 'ALL' ? 'Empty All Bin' : `Empty ${SECTION_CONFIG[activeSection].label}`}
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (EXACT MATCHING OVERVIEW TAB & IMAGE 2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setActiveSection(kpi.targetSection)}
            className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
                {kpi.label}
              </span>
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-108 ${kpi.iconBg}`}>
                <kpi.icon size={17} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#221814] tracking-tight leading-none flex items-baseline font-sans">
                {kpi.prefix && <span className="text-lg sm:text-xl font-bold mr-1 text-[#8C6239]">{kpi.prefix}</span>}
                <AnimatedCounter value={kpi.numValue} duration={1.2} />
              </h3>

              <div className="mt-2.5 flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${kpi.badgeBg}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                  </span>
                  {kpi.sub}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── SECTION TABS (LUXURY CREAM PILLS, ZERO MIXING) ── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#E7DDD0] shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
        {(Object.keys(SECTION_CONFIG) as RecycleSection[]).map((sectionKey) => {
          const cfg = SECTION_CONFIG[sectionKey];
          const Icon = cfg.icon;
          const count = counts[sectionKey] || 0;
          const isActive = activeSection === sectionKey;

          return (
            <button
              key={sectionKey}
              onClick={() => setActiveSection(sectionKey)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/40 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF5EE] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#8C6239]' : 'text-stone-500'}`} />
              <span>{cfg.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? 'bg-[#B88E4B] text-white'
                    : count > 0
                    ? 'bg-stone-200 text-stone-700'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH BAR (LUXURY STYLING) ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search within ${SECTION_CONFIG[activeSection].label.toLowerCase()}...`}
          className="h-[40px] w-full bg-white border border-[#D9C4AC] rounded-full pl-10 pr-4 text-xs font-semibold text-[#18110D] focus:outline-none focus:border-[#B88E4B] focus:ring-2 focus:ring-[#B88E4B]/20 placeholder:text-stone-400 shadow-xs"
        />
      </div>

      {/* ── ITEMS CONTAINER ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E7DDD0] rounded-[22px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#B88E4B]" />
            <p className="text-xs font-bold text-stone-600">Scanning Recycle Bin sections...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* ── LUXURY PRISTINE EMPTY STATE (WARM CREAM/WHITE) ── */
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-[#E7DDD0] rounded-[22px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] text-center">
            <div className="p-3.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mb-3 shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1F1612] mb-1">
              {searchQuery
                ? 'No items matched your search query'
                : `No Deleted Items in ${SECTION_CONFIG[activeSection].label}`}
            </h3>
            <p className="text-xs text-stone-500 max-w-md">
              {searchQuery
                ? 'Try a different search keyword or switch to another section.'
                : 'Your database in this section is 100% clean and pristine. Any items you delete will appear safely here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const cfg = SECTION_CONFIG[item.entityType] || SECTION_CONFIG.ALL;
                const Icon = cfg.icon;
                const payload = item.payload || {};
                const isRestoring = restoringId === item.id;
                const isPurging = purgingId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/50 hover:shadow-[0_8px_25px_rgba(184,142,75,0.08)] transition-all gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail / Entity Icon */}
                      <div className="relative w-14 h-14 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {payload.image ? (
                          <img
                            src={payload.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className={`w-6 h-6 ${cfg.color}`} />
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-[#1F1612] font-serif group-hover:text-[#8C6239] transition-colors">
                            {item.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border shadow-2xs ${cfg.badgeColor}`}
                          >
                            {item.entityType}
                          </span>
                          {payload.price && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.price))}
                            </span>
                          )}
                          {payload.totalAmount && (
                            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.totalAmount))}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 line-clamp-1 max-w-xl">
                          {payload.description ||
                            (payload.category && `Category: ${payload.category}`) ||
                            (payload.shippingAddress && `Ship to: ${payload.shippingCity || 'Pakistan'}`) ||
                            'Archived snapshot available'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {new Date(item.deletedAt).toLocaleString('en-PK', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          {item.deletedBy && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" />
                              Deleted by: {item.deletedBy}
                            </span>
                          )}
                          <span className="font-mono text-stone-400">ID: {item.entityId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRestore(item)}
                        disabled={isRestoring || isPurging}
                        className="bg-[#FAF5EE] hover:bg-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/40 hover:border-[#B88E4B] text-xs font-bold rounded-full px-3.5 h-[34px] shadow-2xs"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRestoring ? 'animate-spin' : ''}`} />
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setConfirmModal({
                            open: true,
                            type: 'SINGLE',
                            itemId: item.id,
                            itemName: item.name,
                          })
                        }
                        disabled={isRestoring || isPurging}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-full px-3 h-[34px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete Forever
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION MODAL (MATCHES LUXURY LIGHT MODAL DESIGN) ── */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[22px] bg-white border border-[#E7DDD0] shadow-[0_20px_60px_rgba(44,30,24,0.2)] space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1F1612]">
                    {confirmModal.type === 'SINGLE'
                      ? 'Permanently Delete Item?'
                      : confirmModal.type === 'SECTION'
                      ? `Empty ${SECTION_CONFIG[confirmModal.section || 'ALL'].label}?`
                      : 'Empty Entire Recycle Bin?'}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {confirmModal.type === 'SINGLE' ? (
                      <>
                        Are you sure you want to permanently delete{' '}
                        <strong className="text-[#1F1612]">"{confirmModal.itemName}"</strong>? This
                        action cannot be undone and the record will be erased forever from the database.
                      </>
                    ) : confirmModal.type === 'SECTION' ? (
                      <>
                        Are you sure you want to permanently purge all items in the{' '}
                        <strong className="text-[#1F1612]">
                          {SECTION_CONFIG[confirmModal.section || 'ALL'].label}
                        </strong>{' '}
                        section? This cannot be undone.
                      </>
                    ) : (
                      <>
                        Are you sure you want to completely empty all items from the Recycle Bin? All
                        sections will be permanently erased.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModal({ open: false, type: 'SINGLE' })}
                  className="border-[#D9C4AC] text-stone-700 hover:bg-[#FAF5EE] rounded-full text-xs font-semibold px-4 h-[36px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirmModal.type === 'SINGLE' && confirmModal.itemId) {
                      handlePermanentDelete(confirmModal.itemId);
                    } else if (confirmModal.type === 'SECTION') {
                      handleEmpty(confirmModal.section);
                    } else {
                      handleEmpty();
                    }
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold px-4 h-[36px] shadow-xs"
                >
                  Confirm & Delete Forever
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
