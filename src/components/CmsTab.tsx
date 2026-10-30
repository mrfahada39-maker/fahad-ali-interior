'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderClosed,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  Sparkles,
  Layers,
  Eye,
  Check,
  X,
  Tag,
  Crown,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Search,
  Globe,
  ImageIcon,
  SlidersHorizontal,
  Bookmark,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';
import { resolveImageUrl } from '@/lib/images';
import AnimatedCounter from '@/components/AnimatedCounter';


export default function CmsTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'active' | 'with-items'>('all');
  const [modalActiveTab, setModalActiveTab] = useState<'identity' | 'media' | 'seo'>('identity');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    items: '',
    order: 0,
    isActive: true,
    badge: '',
    slug: '',
  });

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await apiFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        const list = data.data || data;
        setCategories(Array.isArray(list) ? list.sort((a, b) => (a.order || 0) - (b.order || 0)) : []);
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to load categories', e);
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Collection name is required');
      return;
    }
    try {
      const url = '/api/admin/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';
      const body = {
        ...categoryForm,
        id: editingCategoryId || undefined,
        order: Number(categoryForm.order),
      };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCategoryId ? 'Showroom collection updated successfully ✓' : 'New collection published to showroom ✓');
        setEditingCategoryId(null);
        setShowCategoryForm(false);
        setCategoryForm({
          name: '',
          description: '',
          image: '',
          items: '',
          order: 0,
          isActive: true,
          badge: '',
          slug: '',
        });
        loadCategories();
      } else {
        const errorText = await res.text();
        toast.error(`Error: ${errorText || 'Failed to save collection'}`);
      }
    } catch {
      toast.error('An error occurred while saving the collection');
    }
  };

  const handleEditCategory = (c: any) => {
    setEditingCategoryId(c.id);
    setModalActiveTab('identity');
    setShowCategoryForm(true);
    setCategoryForm({
      name: c.name || '',
      description: c.description || '',
      image: c.image || '',
      items: c.items || '',
      order: c.order || 0,
      isActive: c.isActive !== false,
      badge: c.badge || '',
      slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : ''),
    });
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;

    const targetIdx = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    // Create reordered clone
    const reordered = [...categories];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistically update UI immediately
    setCategories(reordered);

    try {
      // Save updated sequential orders (1-based index) for all items
      await Promise.all(
        reordered.map((cat, idx) =>
          apiFetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cat.id, order: idx + 1 }),
          })
        )
      );
      toast.success('Collection sequence updated ✓');
    } catch {
      toast.error('Failed to reorder collections');
      loadCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showroom collection?')) return;

    const previousCategories = [...categories];
    // Immediate optimistic removal from UI
    setCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      const res = await apiFetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Showroom collection removed ✓');
      } else {
        setCategories(previousCategories);
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to delete collection');
      }
    } catch {
      setCategories(previousCategories);
      toast.error('Failed to delete collection');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = categorySearchQuery.toLowerCase();
    const matchesSearch = c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    if (categoryFilter === 'active') return matchesSearch && c.isActive !== false;
    if (categoryFilter === 'with-items') return matchesSearch && (c._count?.products || 0) > 0;
    return matchesSearch;
  });

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.isActive !== false).length;
  const totalProducts = categories.reduce((acc, c) => acc + (c._count?.products || 0), 0);
  const categoriesWithProducts = categories.filter((c) => (c._count?.products || 0) > 0).length;

  const kpis = [
    {
      label: 'SHOWROOM TAXONOMY COLLECTIONS',
      numValue: totalCount,
      sub: '✓ Curated Room Masterpieces',
      icon: FolderClosed,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'ACTIVE ON LIVE STOREFRONT',
      numValue: activeCount,
      sub: '⚡ Synchronized in Navbar',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'CATALOG INVENTORY COUNT',
      numValue: totalProducts,
      sub: '📦 Total Live Masterpieces',
      icon: Layers,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'STOCKED ROOM SECTIONS',
      numValue: categoriesWithProducts,
      suffix: '',
      sub: '🛡ï¸ Cloudinary High-Res CDN',
      icon: Zap,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      
      {/* ── $100,000 EXECUTIVE HEADER (DUAL RESPONSIVE: GRAND ON DESKTOP, COMPACT ON MOBILE) ── */}
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
              <span className="hidden lg:inline">TAXONOMY ARCHITECT & CMS V2.4</span>
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
            Showroom Taxonomy <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Master Collections</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Curate room classifications, royal prestige badges, live product density tracking, and menu navigation sequences.
          </p>
        </div>

        {/* Right Actions Capsule (Matching Img 2, 3, 4) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            type="button"
            onClick={() => {
              loadCategories();
              toast.success('Showroom collections synchronized ✓');
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-[#E7DDD0] text-stone-500 hover:text-[#221814] transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Refresh Collections"
          >
            <RefreshCw size={15} className={loadingCategories ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCategoryId(null);
              setModalActiveTab('identity');
              setCategoryForm({
                name: '',
                description: '',
                image: '',
                items: '',
                order: categories.length,
                isActive: true,
                badge: '',
                slug: '',
              });
              setShowCategoryForm(true);
            }}
            className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] hover:from-[#F5EBDD] hover:to-[#EAD8BF] border border-[#E2D1BC] hover:border-[#B88E4B] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start cursor-pointer transition-all active:scale-98 group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#B88E4B] shrink-0 group-hover:scale-110 transition-transform">
              <Plus size={14} className="stroke-[2.2]" />
            </div>
            <div className="text-left">
              <div className="text-sm sm:text-base font-black text-[#1F1612] leading-none font-serif flex items-center gap-1.5">
                Create Collection
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-stone-500 block uppercase tracking-wider">{categories.length} Taxonomy Suites</span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`bg-gradient-to-br from-white/95 via-[#FCFAF7]/90 to-[#FAF5EE]/95 backdrop-blur-md border rounded-2xl sm:rounded-[22px] p-3 sm:p-4.5 flex flex-col justify-between min-h-[114px] sm:min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            {/* Ambient Liquid Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-10 -right-10 w-24 sm:w-28 h-24 sm:h-28 rounded-full blur-2xl pointer-events-none transition-all duration-500 opacity-90 sm:opacity-60 sm:group-hover:opacity-100 animate-pulse ${kpi.ambientGlow}`} />

            {/* Subtle Liquid Bottom Corner Glow */}
            <div className={`absolute -bottom-8 -left-8 w-20 h-20 rounded-full blur-2xl pointer-events-none opacity-40 sm:group-hover:opacity-75 transition-opacity ${kpi.ambientGlow}`} />

            {/* ── FLOWING LIQUID GRAPH WAVE ANIMATION ── */}
            

            {/* Liquid Sheen Shimmer Reflection Sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

            <div className="flex justify-between items-start relative z-10 gap-1">
              <span className="text-[9px] sm:text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase truncate leading-tight">
                {kpi.label}
              </span>
              {/* 3D Liquid Glass Jewel Orb */}
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
                <kpi.icon size={15} className="sm:w-[17px] sm:h-[17px] stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
                {kpi.suffix ? <span className="text-base font-bold text-[#8C6D46] ml-1">{kpi.suffix}</span> : null}
              </h3>
              <div className="mt-2.5 flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs truncate ${kpi.badgeBg}`}>
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                  </span>
                  <span className="truncate">{kpi.sub}</span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── SHOWROOM TAXONOMIES & MASTER COLLECTIONS GRID ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E7DDD0] rounded-[24px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(44,30,24,0.015)] space-y-4"
      >
        {/* Search & Filter Toolbar */}
        <div className="bg-[#FCFAF7] border border-[#E7DDD0] p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: 'All Collections', count: categories.length },
              { id: 'active', label: 'Active on Storefront', count: activeCount },
              { id: 'with-items', label: 'With Active Inventory' },
            ].map((f) => {
              const isActive = categoryFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-[#E7DDD0] hover:bg-[#FAF5EE]'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="admin-cms-category-search"
              name="categorySearch"
              placeholder="Search showroom collections..."
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E7DDD0] text-[#1F1612] placeholder:text-stone-400 font-bold rounded-xl h-9 pl-9 pr-3 text-xs focus:border-[#B88E4B] outline-none"
            />
          </div>
        </div>

        {/* ── ULTRA-MODERN PREMIUM SHOWROOM COLLECTION CARDS GRID ── */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-[#FCFAF7] border border-[#E7DDD0] rounded-2xl">
            <FolderClosed size={40} className="mx-auto text-[#B88E4B]/40 mb-2" />
            <h4 className="text-base font-black text-[#1F1612] font-serif">No Showroom Collections Found</h4>
            <p className="text-stone-400 text-xs mt-1">Try changing your search term or click &ldquo;Create Collection&rdquo; to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredCategories.map((c, index) => {
              const itemCount = c._count?.products || 0;
              const actualIndex = categories.findIndex((cat) => cat.id === c.id);
              const isFirst = actualIndex <= 0;
              const isLast = actualIndex === -1 || actualIndex >= categories.length - 1;
              const displaySeq = actualIndex !== -1 ? actualIndex + 1 : index + 1;

              return (
                <motion.div
                  key={c.id || index}
                  whileHover={{ y: -3 }}
                  className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B] rounded-[22px] p-5 shadow-[0_4px_20px_rgba(44,30,24,0.02)] hover:shadow-[0_12px_32px_rgba(184,142,75,0.12)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle luxury top gradient bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Bar: Sequence + Reordering Arrows + Storefront Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-stone-100">
                      {/* Sequence Number & Arrows */}
                      <div className="flex items-center gap-1.5 bg-[#FAF5EE] border border-[#E2D1BC] px-2.5 py-1 rounded-xl">
                        <span className="text-[11px] font-mono font-black text-[#8C6239]">
                          #{displaySeq}
                        </span>
                        <div className="flex items-center gap-0.5 border-l border-[#E2D1BC] pl-1.5 ml-0.5">
                          <button
                            onClick={() => handleMoveCategory(c.id, 'up')}
                            disabled={isFirst}
                            className="p-1 rounded hover:bg-[#EBDDC8] disabled:opacity-20 text-stone-600 transition-colors cursor-pointer"
                            title="Move Sequence Up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            onClick={() => handleMoveCategory(c.id, 'down')}
                            disabled={isLast}
                            className="p-1 rounded hover:bg-[#EBDDC8] disabled:opacity-20 text-stone-600 transition-colors cursor-pointer"
                            title="Move Sequence Down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Storefront Active Status */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs ${
                          c.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30'
                            : 'bg-stone-100 text-stone-500 border-stone-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                        <span>{c.isActive !== false ? 'Active on Storefront' : 'Hidden'}</span>
                      </span>
                    </div>

                    {/* Middle: Category Title, Slug, & Real Product Count */}
                    <div className="pt-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[17px] font-black text-[#1F1612] font-serif tracking-tight leading-snug group-hover:text-[#8C6239] transition-colors">
                          {c.name}
                        </h4>

                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black font-mono bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] shrink-0">
                          {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      {/* Storefront Route Anchor */}
                      <div className="inline-flex items-center gap-1.5 text-stone-400 font-mono text-[11px]">
                        <Hash size={11} className="text-[#B88E4B]" />
                        <span>cat-section-{c.slug || c.name?.toLowerCase().replace(/\s+/g, '-')}</span>
                      </div>

                      {/* Real description (only if provided by admin, NO dummy text!) */}
                      {c.description && (
                        <p className="text-stone-600 text-[11.5px] font-medium leading-relaxed pt-1 line-clamp-2">
                          {c.description}
                        </p>
                      )}

                      {/* Real custom badge (only if provided by admin, NO dummy badge!) */}
                      {c.badge && (
                        <div className="pt-1">
                          <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                            {c.badge}
                          </span>
                        </div>
                      )}

                      {/* Real uploaded cover image (only if explicitly uploaded, NO dummy sofa!) */}
                      {c.image && (
                        <div className="mt-2 w-full h-24 rounded-xl overflow-hidden border border-[#E7DDD0]">
                          <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Luxury Action Bar */}
                  <div className="pt-3.5 px-0.5 mt-4 border-t border-stone-100 flex items-center justify-between">
                    <a
                      href={`/#cat-section-${c.slug || c.name?.toLowerCase().replace(/\s+/g, '-')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-black text-[#8C6239] hover:text-[#1F1612] inline-flex items-center gap-1 transition-colors group/link"
                    >
                      <span>View on Storefront</span>
                      <ExternalLink size={11} className="text-[#B88E4B] group-hover/link:translate-x-0.5 transition-transform" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditCategory(c)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FAF5EE] to-[#F3E7D3] hover:from-[#B88E4B] hover:to-[#996515] text-[#8C6239] hover:text-white border border-[#E2D1BC] font-black text-[10.5px] shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                      >
                        <Edit2 size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-1.5 rounded-xl bg-[#FAF5EE] hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E2D1BC] hover:border-rose-200 transition-colors cursor-pointer"
                        title="Delete Collection"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── ADVANCED DUAL-PANE SHOWROOM COLLECTION EDITOR MODAL ($100K ARCHITECTURE) ── */}
      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white border-2 border-[#B88E4B]/50 rounded-[20px] sm:rounded-[28px] shadow-[0_25px_70px_rgba(44,30,24,0.35)] relative overflow-hidden my-auto max-h-[94vh] sm:max-h-[92vh] flex flex-col"
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              {/* Modal Executive Header */}
              <div className="p-3.5 sm:p-6 border-b border-[#E7DDD0] flex items-center justify-between bg-gradient-to-r from-white via-[#FCFAF7] to-white shrink-0 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] shadow-2xs shrink-0">
                    <FolderClosed size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-lg font-black text-[#221814] font-serif flex items-center gap-1.5 sm:gap-2 truncate">
                      <Sparkles size={14} className="text-[#B88E4B] shrink-0" />
                      <span>{editingCategoryId ? 'Edit Collection' : 'Create Collection'}</span>
                      <span className="hidden sm:inline font-serif font-black">{editingCategoryId ? 'Showroom' : 'Masterpiece'}</span>
                    </h3>
                    <p className="text-stone-400 text-[10.5px] sm:text-xs font-medium mt-0.5 truncate">
                      <span className="sm:hidden">Taxonomy, branding &amp; live shop routing</span>
                      <span className="hidden sm:inline">Configure taxonomy metadata, visual branding presets, and live shop routing</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Modal Body: Split Dual Pane Workspace */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
                
                {/* ── LEFT PANE: CONFIGURATION CONTROLS (7 Cols) ── */}
                <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
                  
                  {/* Modal Sub-Tabs */}
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-[#FCFAF7] border border-[#E7DDD0] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl">
                    {[
                      { id: 'identity', short: '1. Identity', label: '1. Identity & Badges', icon: Tag },
                      { id: 'media', short: '2. Media', label: '2. High-Res Media', icon: ImageIcon },
                      { id: 'seo', short: '3. Details', label: '3. Description & Routing', icon: Globe },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setModalActiveTab(tab.id as any)}
                        className={`flex-1 py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg sm:rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                          modalActiveTab === tab.id
                            ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs'
                            : 'text-stone-500 hover:text-[#1F1612]'
                        }`}
                      >
                        <tab.icon size={11} className="shrink-0 sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                          <span className="sm:hidden">{tab.short}</span>
                          <span className="hidden sm:inline">{tab.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: IDENTITY & BADGES */}
                  {modalActiveTab === 'identity' && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="fai-cmstab-field-2" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Collection Title
                        </label>
                        <input id="fai-cmstab-field-2" name="fai_cmstab_field_2"
                          placeholder="e.g. Royal Living Room Sofas"
                          value={categoryForm.name ?? ''}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                              slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                            })
                          }
                          className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-black rounded-xl h-10 px-3.5 text-xs focus:border-[#B88E4B] outline-none shadow-2xs"
                        />
                      </div>

                      {/* Custom Badge Tag Section */}
                      <div className="space-y-2 bg-[#FCFAF7] border border-[#E7DDD0] p-3 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <label htmlFor="fai-cmstab-field-3" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                            <Tag size={12} className="text-[#B88E4B]" />
                            <span>
                              <span className="sm:hidden">Badge Tag (Optional)</span>
                              <span className="hidden sm:inline">Custom Badge Tag (Optional)</span>
                            </span>
                          </label>
                          {categoryForm.badge && (
                            <button
                              type="button"
                              onClick={() => setCategoryForm({ ...categoryForm, badge: '' })}
                              className="text-[10px] text-stone-400 hover:text-rose-600 font-bold cursor-pointer transition-colors"
                            >
                              Clear Tag
                            </button>
                          )}
                        </div>

                        {/* Custom Input */}
                        <div className="relative">
                          <input id="fai-cmstab-field-3" name="fai_cmstab_field_3"
                            placeholder="e.g. Featured Collection, Flagship, New..."
                            value={categoryForm.badge ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, badge: e.target.value })}
                            className="w-full bg-white border border-[#E7DDD0] text-[#1F1612] font-black rounded-xl h-10 px-3 text-xs focus:border-[#B88E4B] outline-none shadow-2xs placeholder:text-stone-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="fai-cmstab-field-4" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                            <span className="sm:hidden">Item Count Override (Optional)</span>
                            <span className="hidden sm:inline">Item Count Label Override (Optional)</span>
                          </label>
                          <input id="fai-cmstab-field-4" name="fai_cmstab_field_4"
                            placeholder="e.g. 3 Products (empty = auto)"
                            value={categoryForm.items ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, items: e.target.value })}
                            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-mono font-bold rounded-xl h-10 px-3 text-xs focus:border-[#B88E4B] outline-none shadow-2xs"
                          />
                        </div>

                        <div className="p-2.5 bg-[#FAF5EE] border border-[#E2D1BC] rounded-2xl flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <Crown size={15} className="text-[#B88E4B]" />
                            <div>
                              <p className="text-[11px] font-black text-[#1F1612]">Showroom Menu</p>
                              <p className="text-[9px] text-stone-500">Visible in catalog navbar</p>
                            </div>
                          </div>
                          <input id="fai-cmstab-field-5" name="fai_cmstab_field_5"
                            type="checkbox"
                            checked={categoryForm.isActive}
                            onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                            className="w-4 h-4 accent-[#B88E4B] rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: HIGH-RES MEDIA */}
                  {modalActiveTab === 'media' && (
                    <div className="space-y-4">
                      <div className="bg-[#FCFAF7] border border-[#E7DDD0] p-3 sm:p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label htmlFor="fai-cmstab-field-6" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                            <ImageIcon size={12} className="text-[#B88E4B]" />
                            <span>Upload Real Cover Image via Cloudinary</span>
                          </label>
                          {categoryForm.image && (
                            <button
                              type="button"
                              onClick={() => setCategoryForm((prev) => ({ ...prev, image: '' }))}
                              className="text-[10.5px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>

                        <CloudinaryImageUpload
                          folder="fahad-ali-interior/categories"
                          onUploadSuccess={(url) => setCategoryForm((prev) => ({ ...prev, image: url }))}
                        />

                        <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                            Or Direct Image URL
                          </label>
                          <input id="fai-cmstab-field-6" name="fai_cmstab_field_6"
                            placeholder="https://res.cloudinary.com/... or paste image URL"
                            value={categoryForm.image ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                            className="w-full bg-white border border-[#E7DDD0] text-[#1F1612] rounded-xl h-10 px-3.5 text-xs focus:border-[#B88E4B] outline-none shadow-2xs"
                          />
                        </div>

                        {categoryForm.image && (
                          <div className="pt-2">
                            <span className="text-[10px] font-black text-[#8C6239] uppercase tracking-wider block mb-1.5">
                              Current Uploaded Cover:
                            </span>
                            <div className="relative aspect-[16/9] w-full max-h-48 rounded-xl overflow-hidden border border-[#E7DDD0]">
                              <img src={categoryForm.image} alt="Cover preview" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DESCRIPTION & SEO */}
                  {modalActiveTab === 'seo' && (
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="fai-cmstab-field-7" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          <span className="sm:hidden">Craftsmanship Description</span>
                          <span className="hidden sm:inline">Architectural Craftsmanship Description</span>
                        </label>
                        <textarea id="fai-cmstab-field-7" name="fai_cmstab_field_7"
                          placeholder="Describe the room ambiance, wood seasoning heritage, bespoke joinery, and styling suggestions..."
                          value={categoryForm.description ?? ''}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          rows={4}
                          className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-medium rounded-xl p-3 text-xs focus:border-[#B88E4B] outline-none shadow-2xs leading-relaxed"
                        />
                      </div>

                      <div>
                        <label htmlFor="fai-cmstab-field-8" className="text-[10px] sm:text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Storefront Destination URL Slug
                        </label>
                        <div className="flex items-center bg-[#FCFAF7] border border-[#E7DDD0] rounded-xl overflow-hidden h-10 px-3 shadow-2xs">
                          <span className="text-stone-400 font-mono text-[10.5px] sm:text-xs select-none shrink-0">/#cat-section-</span>
                          <input id="fai-cmstab-field-8" name="fai_cmstab_field_8"
                            placeholder="royal-living-room"
                            value={categoryForm.slug ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                            className="bg-transparent text-[#1F1612] font-mono font-bold text-xs focus:outline-none flex-1 min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── RIGHT PANE: REAL-TIME LIVE CARD PREVIEW (5 Cols) ── */}
                <div className="lg:col-span-5 bg-[#FAF5EE]/70 border-2 border-dashed border-[#B88E4B]/40 p-3 sm:p-5 rounded-[20px] sm:rounded-[24px] space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6239] flex items-center gap-1.5">
                      <Eye size={12} className="text-[#B88E4B]" /> LIVE CARD PREVIEW
                    </span>
                    <span className="text-[9.5px] font-mono bg-white text-stone-500 px-2 py-0.5 rounded-md border border-[#E2D1BC]">
                      100% Real-Time
                    </span>
                  </div>

                  {/* Clean Card Live Simulation matching real website design */}
                  <div className="bg-white border border-[#E7DDD0] rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-md space-y-3 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-[#8C6239] bg-[#FAF5EE] border border-[#E2D1BC]">
                        #1
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {categoryForm.isActive ? 'Active on Storefront' : 'Hidden'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-sm sm:text-base font-black font-serif text-[#1F1612] truncate">
                          {categoryForm.name || 'Collection Title'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black font-mono bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] shrink-0">
                          {categoryForm.items || (editingCategoryId ? `${categories.find((cat) => cat.id === editingCategoryId)?._count?.products || 0} Products` : '0 Products')}
                        </span>
                      </div>

                      <div className="text-stone-400 font-mono text-[10px] truncate">
                        /#cat-section-{categoryForm.slug || 'slug'}
                      </div>

                      {categoryForm.description && (
                        <p className="text-stone-600 text-[11px] font-medium leading-relaxed pt-1 line-clamp-2">
                          {categoryForm.description}
                        </p>
                      )}

                      {categoryForm.badge && (
                        <div className="pt-1">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                            {categoryForm.badge}
                          </span>
                        </div>
                      )}

                      {categoryForm.image && (
                        <div className="mt-2 w-full h-20 rounded-lg overflow-hidden border border-[#E7DDD0]">
                          <img src={categoryForm.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px]">
                      <span className="text-[#8C6239] font-black flex items-center gap-1">
                        <span>View on Storefront</span>
                        <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>

                  <p className="text-[9.5px] sm:text-[10px] text-stone-400 text-center font-medium">
                    Live preview dynamically updates in real-time.
                  </p>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="p-3 sm:p-5 border-t border-[#E7DDD0] bg-white flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs transition-colors cursor-pointer shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 truncate"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">{editingCategoryId ? 'Save Changes' : 'Publish Collection'}</span>
                    <span className="hidden sm:inline">{editingCategoryId ? 'Save & Apply Collection Changes' : 'Publish Collection to Showroom'}</span>
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
