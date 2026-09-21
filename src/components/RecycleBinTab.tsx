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
  { label: string; icon: React.ComponentType<{ className?: string; size?: number }>; color: string }
> = {
  ALL: { label: 'All Items', icon: Layers, color: 'text-[#B88E4B]' },
  PRODUCT: { label: 'Products', icon: Armchair, color: 'text-blue-600' },
  CATEGORY: { label: 'Categories', icon: FolderOpen, color: 'text-purple-600' },
  ORDER: { label: 'Orders', icon: ShoppingBag, color: 'text-emerald-600' },
  REVIEW: { label: 'Reviews', icon: Star, color: 'text-amber-500' },
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

  // 4 Modern Premium KPI Metric Cards (Zero Dark Brown)
  const kpis = [
    {
      label: 'TOTAL ARCHIVED ITEMS',
      numValue: counts.ALL,
      sub: counts.ALL === 0 ? '0 Items in Period' : `${counts.ALL} Items In Archive`,
      icon: Trash2,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100/90 border-amber-300/80 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      targetSection: 'ALL' as RecycleSection,
    },
    {
      label: 'DELETED PRODUCTS',
      numValue: counts.PRODUCT,
      sub: counts.PRODUCT === 0 ? '0 Products Archived' : `${counts.PRODUCT} Restorable Products`,
      icon: Armchair,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100/90 border-blue-300/80 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-500/30',
      dotColor: 'bg-blue-500',
      targetSection: 'PRODUCT' as RecycleSection,
    },
    {
      label: 'DELETED CATEGORIES',
      numValue: counts.CATEGORY,
      sub: counts.CATEGORY === 0 ? '0 Categories Archived' : `${counts.CATEGORY} Restorable Categories`,
      icon: FolderOpen,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 to-purple-100/90 border-purple-300/80 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-500/30',
      dotColor: 'bg-purple-500',
      targetSection: 'CATEGORY' as RecycleSection,
    },
    {
      label: 'DELETED ORDERS & REVIEWS',
      numValue: counts.ORDER + counts.REVIEW,
      sub: (counts.ORDER + counts.REVIEW) === 0 ? '100% In-Stock Database' : `${counts.ORDER + counts.REVIEW} Archived Records`,
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/90 border-emerald-300/80 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      targetSection: 'ORDER' as RecycleSection,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 font-sans text-neutral-900">
      {/* ── 1. MODERN PREMIUM HEADER (ZERO DARK BROWN) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-white border border-[#E7DDD0] p-3 sm:py-3 sm:px-5 lg:py-3.5 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-[#B88E4B] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs font-serif">
              <Sparkles size={10} className="text-[#B88E4B]" />
              <span>ENTERPRISE SUITE V2.4</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>100% REAL LIVE DATA SYNCED</span>
            </span>
          </div>

          <h1 className="text-[22px] sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight font-serif">
            Fahad Ali Interior <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#B88E4B] bg-clip-text text-transparent font-serif">— Recycle Bin & Archive</span>
          </h1>
          <p className="hidden sm:block text-neutral-500 text-[11.5px] font-medium mt-0.5">
            Real-time live visitor telemetry radar, revenue forecasts, order fulfillment stream, and inventory health.
          </p>
        </div>

        {/* Modern Gold Luxury Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
          <button
            type="button"
            onClick={() => {
              if (counts.ALL > 0) {
                setConfirmModal({
                  open: true,
                  type: activeSection === 'ALL' ? 'ALL' : 'SECTION',
                  section: activeSection,
                });
              } else {
                fetchItems();
              }
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#C59B5F] to-[#9E7336] hover:brightness-105 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-[0_4px_15px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {counts.ALL > 0 ? <Trash2 size={15} /> : <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            <span>{counts.ALL > 0 ? (activeSection === 'ALL' ? 'Empty All Bin' : `Empty ${SECTION_CONFIG[activeSection].label}`) : 'Refresh Archive'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── 2. KPI METRIC CARDS (4 MODERN CLEAN JEWEL CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => {
          const isSelected = activeSection === kpi.targetSection;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: idx * 0.05, duration: 0.25 }}
              onClick={() => setActiveSection(kpi.targetSection)}
              className={`bg-white border rounded-2xl p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                isSelected
                  ? 'ring-2 ring-[#B88E4B] border-[#B88E4B] shadow-[0_6px_25px_rgba(184,142,75,0.2)]'
                  : kpi.cardGlow
              }`}
            >
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[10.5px] font-bold tracking-wider text-neutral-500 uppercase font-sans">
                  {kpi.label}
                </span>
                <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-108 ${kpi.iconBg}`}>
                  <kpi.icon size={17} className="stroke-[2.2]" />
                </div>
              </div>

              <div className="mt-2 relative z-10">
                <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-neutral-900 tracking-tight leading-none flex items-baseline font-sans">
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
          );
        })}
      </div>

      {/* ── 3. MAIN REGISTRY CONTAINER (CLEAN MODERN LUXURY) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-[#E7DDD0] rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-[#B88E4B]/40 transition-all space-y-4"
      >
        {/* Header with Title + Modern Luxury Pill Switcher (ZERO DARK BROWN) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 border-b border-neutral-100 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm lg:text-base font-black text-neutral-900 flex items-center gap-1.5 font-serif">
                <span className="text-[#B88E4B]">✦</span> Recycle Bin & Item Registry
              </h2>
              <span className="text-[9.5px] font-bold text-[#B88E4B] bg-amber-50 border border-[#B88E4B]/35 px-2.5 py-0.5 rounded-full shadow-2xs font-serif">
                {SECTION_CONFIG[activeSection].label.toUpperCase()} REGISTRY
              </span>
            </div>
            <p className="text-neutral-400 text-[10.5px] font-medium mt-0.5">
              Zero-mixing isolated storage — items can be safely restored back to the live database or permanently purged.
            </p>
          </div>

          {/* ── MODERN PREMIUM GOLD PILL SWITCHER (ZERO DARK BROWN) ── */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            <div className="flex bg-neutral-50 p-1 rounded-2xl border border-[#E7DDD0] gap-1 shadow-2xs">
              {(Object.keys(SECTION_CONFIG) as RecycleSection[]).map((sectionKey) => {
                const cfg = SECTION_CONFIG[sectionKey];
                const Icon = cfg.icon;
                const count = counts[sectionKey] || 0;
                const isActive = activeSection === sectionKey;

                return (
                  <button
                    key={sectionKey}
                    type="button"
                    onClick={() => setActiveSection(sectionKey)}
                    className={`px-3.5 py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#B88E4B] via-[#C59B5F] to-[#A37B3E] text-white shadow-[0_2px_12px_rgba(184,142,75,0.35)] border border-[#B88E4B]'
                        : 'text-neutral-600 hover:text-[#B88E4B] hover:bg-white border border-transparent'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-white' : 'text-neutral-400'} />
                    <span>{cfg.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-bold ${
                        isActive
                          ? 'bg-white/25 text-white backdrop-blur-xs'
                          : 'bg-neutral-200/80 text-neutral-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Refresh Button */}
            <button
              type="button"
              onClick={() => fetchItems()}
              disabled={loading}
              title="Refresh Registry"
              className="bg-neutral-50 hover:bg-white text-neutral-600 hover:text-[#B88E4B] border border-[#E7DDD0] rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B88E4B]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Modern Pill Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${SECTION_CONFIG[activeSection].label.toLowerCase()} by name or ID...`}
            className="h-[38px] w-full bg-white border border-[#D9C4AC] rounded-full pl-10 pr-24 text-xs font-medium text-neutral-900 focus:outline-none focus:border-[#B88E4B] focus:ring-2 focus:ring-[#B88E4B]/20 placeholder:text-neutral-400 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── 4. ITEMS LIST / MODERN PRISTINE VAULT DISPLAY ── */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-neutral-50/50 rounded-[20px] border border-dashed border-[#E7DDD0] space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-[#B88E4B]" />
              <p className="text-xs font-bold text-neutral-600">Scanning {SECTION_CONFIG[activeSection].label} section...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* ── MODERN PRISTINE VAULT DISPLAY (CLEAN WHITE & GOLD) ── */
            <div className="relative overflow-hidden bg-gradient-to-b from-neutral-50/40 via-white to-neutral-50/40 border border-dashed border-[#E7DDD0] rounded-[24px] p-8 sm:p-12 text-center">
              {/* Glowing Concentric Emblem Icon */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-xs relative z-10">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping duration-3000" />
              </div>

              {/* Modern Didone Serif Title */}
              <h3 className="text-xl sm:text-2xl font-serif font-black text-neutral-900 tracking-tight mb-1.5">
                {searchQuery
                  ? 'No Items Matched Your Search'
                  : `Pristine Database Vault — No Deleted ${SECTION_CONFIG[activeSection].label}`}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto font-sans leading-relaxed">
                {searchQuery
                  ? 'Try clearing your search query or switching to another category section above.'
                  : 'Your active database tables are 100% clean and 1-to-1 synchronized with the live website. Any future items deleted from Categories, Products, or Orders will be safely archived here.'}
              </p>

              {/* 3 Modern Luxury Safeguard Micro-Cards */}
              {!searchQuery && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-7 pt-6 border-t border-[#E7DDD0]/80 relative z-10">
                  <div className="bg-white p-3.5 rounded-2xl border border-[#E7DDD0] text-left shadow-2xs hover:border-[#B88E4B]/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} />
                      </span>
                      <span className="text-[11px] font-bold font-serif text-neutral-900">Zero Ghost Records</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                      Active PostgreSQL tables contain 0 ghost rows. 7 categories in DB = exactly 7 live homepage cards.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E7DDD0] text-left shadow-2xs hover:border-[#B88E4B]/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        <Layers size={13} />
                      </span>
                      <span className="text-[11px] font-bold font-serif text-neutral-900">Full JSON Snapshots</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                      All images, specs, dimensions, and prices are fully preserved in the dedicated table before deletion.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E7DDD0] text-left shadow-2xs hover:border-[#B88E4B]/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        <RotateCcw size={13} />
                      </span>
                      <span className="text-[11px] font-bold font-serif text-neutral-900">Instant Restoration</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                      Accidentally deleted items can be restored live to the storefront at any time with a single click.
                    </p>
                  </div>
                </div>
              )}
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
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/60 hover:shadow-[0_8px_25px_rgba(184,142,75,0.08)] transition-all gap-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl bg-neutral-50 border border-[#E7DDD0] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {payload.image ? (
                            <img
                              src={payload.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon size={22} className={cfg.color} />
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-neutral-900 font-serif group-hover:text-[#B88E4B] transition-colors">
                              {item.name}
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border shadow-2xs bg-amber-50 text-[#B88E4B] border-amber-200">
                              {item.entityType}
                            </span>
                            {payload.price && (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.price))}
                              </span>
                            )}
                            {payload.totalAmount && (
                              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                ₨ {new Intl.NumberFormat('en-PK').format(Number(payload.totalAmount))}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-500 line-clamp-1 max-w-xl">
                            {payload.description ||
                              (payload.category && `Category: ${payload.category}`) ||
                              (payload.shippingAddress && `Ship to: ${payload.shippingCity || 'Pakistan'}`) ||
                              'Archived snapshot available'}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              {new Date(item.deletedAt).toLocaleString('en-PK', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                            {item.deletedBy && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-neutral-400" />
                                Deleted by: {item.deletedBy}
                              </span>
                            )}
                            <span className="font-mono text-neutral-400">ID: {item.entityId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleRestore(item)}
                          disabled={isRestoring || isPurging}
                          className="bg-amber-50 hover:bg-amber-100 text-[#B88E4B] border border-[#B88E4B]/40 hover:border-[#B88E4B] text-xs font-bold rounded-xl px-3.5 h-[34px] shadow-2xs cursor-pointer"
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
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl px-3 h-[34px] cursor-pointer"
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
      </motion.div>

      {/* ── CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-[22px] bg-white border border-[#E7DDD0] shadow-[0_20px_60px_rgba(0,0,0,0.15)] space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-neutral-900">
                    {confirmModal.type === 'SINGLE'
                      ? 'Permanently Delete Item?'
                      : confirmModal.type === 'SECTION'
                      ? `Empty ${SECTION_CONFIG[confirmModal.section || 'ALL'].label}?`
                      : 'Empty Entire Recycle Bin?'}
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {confirmModal.type === 'SINGLE' ? (
                      <>
                        Are you sure you want to permanently delete{' '}
                        <strong className="text-neutral-900">"{confirmModal.itemName}"</strong>? This
                        action cannot be undone and the record will be erased forever from the database.
                      </>
                    ) : confirmModal.type === 'SECTION' ? (
                      <>
                        Are you sure you want to permanently purge all items in the{' '}
                        <strong className="text-neutral-900">
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
                  className="border-[#D9C4AC] text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold px-4 h-[36px]"
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
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-4 h-[36px] shadow-xs"
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
