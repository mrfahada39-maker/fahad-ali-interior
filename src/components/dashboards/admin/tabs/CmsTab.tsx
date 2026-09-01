'use client';

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
  Bookmark
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';
import { resolveImageUrl } from '@/lib/images';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const COLLECTION_BADGES = [
  '👑 Royal Heritage',
  '✦ Living Room Flagship',
  '💎 Master Bedroom Suite',
  '✨ Imperial Dining',
  '📺 Modern Media & LED Walls',
  '⚡ Luxury TV Consoles & Racks',
  '🚪 Royal Walk-In Wardrobes',
  '🛋️ Bespoke Lounge',
  '💼 Executive Study & Office',
  '🪵 Seasoned Sheesham',
];

const PRESET_COLLECTION_IMAGES = [
  { label: 'Living Room Chesterfield', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000' },
  { label: 'Royal Bed Chambers', url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000' },
  { label: 'Imperial Dining Suite', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1000' },
  { label: 'LED Media Wall & Racks', url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=1000' },
  { label: 'Walk-In Wardrobe', url: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?q=80&w=1000' },
  { label: 'Artisan Coffee Lounge', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000' },
  { label: 'Executive Sheesham Desk', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1000' },
];

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
    badge: '👑 Royal Heritage',
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
      console.error('Failed to load categories', e);
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
          badge: '👑 Royal Heritage',
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
      badge: c.badge || '👑 Royal Heritage',
      slug: c.slug || (c.name ? c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : ''),
    });
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIdx];

    const currentOrder = currentCat.order || index;
    const targetOrder = targetCat.order || targetIdx;

    try {
      await apiFetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentCat, order: targetOrder }),
      });
      await apiFetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetCat, order: currentOrder }),
      });
      toast.success('Collection sequence updated ✓');
      loadCategories();
    } catch {
      toast.error('Failed to reorder collections');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showroom collection?')) return;
    try {
      const res = await apiFetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Showroom collection removed ✓');
        loadCategories();
      }
    } catch {
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
      label: 'PRESTIGE HERITAGE BADGES',
      numValue: 6,
      sub: '👑 Royal Collection Classifications',
      icon: Crown,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'VISUAL ASSET OPTIMIZATION',
      numValue: 100,
      suffix: '%',
      sub: '🛡️ Cloudinary High-Res CDN',
      icon: ShieldCheck,
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

        {/* Right Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={() => {
              loadCategories();
              toast.success('Showroom collections synchronized ✓');
            }}
            className="p-2.5 rounded-xl bg-white border border-[#E7DDD0] text-stone-500 hover:text-[#221814] transition-colors cursor-pointer shadow-2xs"
            title="Refresh Collections"
          >
            <RefreshCw size={15} className={loadingCategories ? 'animate-spin' : ''} />
          </button>

          <button
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
                badge: '👑 Royal Heritage',
                slug: '',
              });
              setShowCategoryForm(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus size={14} />
            <span className="uppercase text-[11px] tracking-wider">Create Collection</span>
          </button>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
                {kpi.label}
              </span>
              {/* 3D Glass Jewel Orb */}
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
                <kpi.icon size={17} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
                {kpi.suffix ? <span className="text-base font-bold text-[#8C6D46] ml-1">{kpi.suffix}</span> : null}
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
              const catImg = resolveImageUrl(c.image);
              const itemCount = c._count?.products || 0;
              const displayCount = c.items || (itemCount > 0 ? `${itemCount} Masterpieces` : 'Available');

              return (
                <motion.div
                  key={c.id || index}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B] rounded-[24px] p-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.02)] hover:shadow-[0_12px_35px_rgba(184,142,75,0.14)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle luxury top gradient bar on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top: Image Thumbnail Frame with Frosted Floating Controls */}
                  <div className="relative aspect-[16/9] w-full rounded-[18px] overflow-hidden bg-[#FAF5EE] border border-[#E7DDD0]/80 shadow-2xs">
                    {catImg ? (
                      <img
                        src={catImg}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#B88E4B] font-serif font-black text-3xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3]">
                        {c.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Dark subtle gradient bottom vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Floating Top Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/65 backdrop-blur-md text-amber-300 border border-white/20 shadow-sm">
                        {c.badge || '👑 Royal Heritage'}
                      </span>
                    </div>

                    {/* Floating Sequence & Reordering Controls */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/65 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black text-amber-300">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveCategory(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-20 text-white transition-colors cursor-pointer"
                        title="Move Sequence Up"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMoveCategory(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1 rounded-lg hover:bg-white/20 disabled:opacity-20 text-white transition-colors cursor-pointer"
                        title="Move Sequence Down"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Collection Metadata & Typography */}
                  <div className="pt-3.5 px-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-[15px] font-black text-[#1F1612] font-serif tracking-tight leading-tight group-hover:text-[#8C6239] transition-colors">
                          {c.name}
                        </h4>
                        <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                          /shop?category={c.slug || c.name?.toLowerCase().replace(/\s+/g, '-')}
                        </p>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] shrink-0 shadow-2xs">
                        {displayCount}
                      </span>
                    </div>

                    <p className="text-stone-500 text-[11px] font-medium line-clamp-2 leading-relaxed min-h-[32px]">
                      {c.description || 'Curated handcrafted solid Sheesham furniture collections built by master artisans in Lahore.'}
                    </p>

                    {/* Modern Micro-Metrics Density Bar */}
                    <div className="bg-[#FCFAF7] border border-[#E7DDD0] p-2 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="font-black text-[#7A6354] uppercase tracking-wider">Catalog Allocation</span>
                        <span className="font-mono font-bold text-[#8C6239]">
                          {Math.min(100, Math.max(15, (itemCount || 10) * 4))}% Coverage
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E7DDD0]/60 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(15, (itemCount || 10) * 4))}%` }}
                          className="h-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Luxury Action Bar */}
                  <div className="pt-3 px-1 mt-2 border-t border-neutral-100 flex items-center justify-between">
                    <a
                      href={`/shop?category=${encodeURIComponent(c.name || '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-black text-stone-500 hover:text-[#1F1612] inline-flex items-center gap-1 transition-colors group/link"
                    >
                      <span>View Live Shop</span>
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white border-2 border-[#B88E4B]/50 rounded-[28px] shadow-[0_25px_70px_rgba(44,30,24,0.35)] relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              {/* Modal Executive Header */}
              <div className="p-5 sm:p-6 border-b border-[#E7DDD0] flex items-center justify-between bg-gradient-to-r from-white via-[#FCFAF7] to-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] shadow-2xs">
                    <FolderClosed size={20} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#221814] font-serif flex items-center gap-2">
                      <span className="text-[#B88E4B]">✦</span> {editingCategoryId ? 'Edit Showroom Collection' : 'Create Masterpiece Collection'}
                    </h3>
                    <p className="text-stone-400 text-xs font-semibold mt-0.5">
                      Configure taxonomy metadata, visual branding presets, and live shop routing
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body: Split Dual Pane Workspace */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── LEFT PANE: CONFIGURATION CONTROLS (7 Cols) ── */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Modal Sub-Tabs */}
                  <div className="flex items-center gap-1.5 bg-[#FCFAF7] border border-[#E7DDD0] p-1.5 rounded-2xl">
                    {[
                      { id: 'identity', label: '1. Identity & Badges', icon: Tag },
                      { id: 'media', label: '2. High-Res Media', icon: ImageIcon },
                      { id: 'seo', label: '3. Description & Routing', icon: Globe },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setModalActiveTab(tab.id as any)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          modalActiveTab === tab.id
                            ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs'
                            : 'text-stone-500 hover:text-[#1F1612]'
                        }`}
                      >
                        <tab.icon size={12} />
                        <span className="text-[11px] truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: IDENTITY & BADGES */}
                  {modalActiveTab === 'identity' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Collection Title
                        </label>
                        <input
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

                      {/* Custom Badge Tag Section with Direct Input & Quick Pills */}
                      <div className="space-y-2 bg-[#FCFAF7] border border-[#E7DDD0] p-3 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                            <Tag size={12} className="text-[#B88E4B]" />
                            <span>Custom Badge Tag (Type Anything or Click Below)</span>
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
                          <input
                            placeholder="Type custom badge e.g. 📺 Modern Media & LED Walls..."
                            value={categoryForm.badge ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, badge: e.target.value })}
                            className="w-full bg-white border border-[#E7DDD0] text-[#1F1612] font-black rounded-xl h-10 px-3 text-xs focus:border-[#B88E4B] outline-none shadow-2xs placeholder:text-stone-400"
                          />
                        </div>

                        {/* 1-Click Quick Suggestion Pills */}
                        <div className="pt-1">
                          <span className="text-[9.5px] font-bold text-stone-400 block mb-1.5 uppercase tracking-wider">
                            Popular Luxury Badge Suggestions:
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                            {COLLECTION_BADGES.map((badge) => {
                              const isSelected = categoryForm.badge === badge;
                              return (
                                <button
                                  key={badge}
                                  type="button"
                                  onClick={() => setCategoryForm({ ...categoryForm, badge })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                                    isSelected
                                      ? 'bg-[#B88E4B] text-white border-[#B88E4B] shadow-2xs scale-102'
                                      : 'bg-white text-stone-600 border-[#E7DDD0] hover:border-[#B88E4B] hover:bg-[#FAF5EE]'
                                  }`}
                                >
                                  {badge}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                            Item Count Display Label
                          </label>
                          <input
                            placeholder="e.g. 25 Masterpieces or 10 Items"
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
                          <input
                            type="checkbox"
                            checked={categoryForm.isActive}
                            onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                            className="w-4 h-4 accent-[#B88E4B] rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: HIGH-RES MEDIA & PRESETS */}
                  {modalActiveTab === 'media' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Collection Cover Image URL
                        </label>
                        <input
                          placeholder="https://images.unsplash.com/..."
                          value={categoryForm.image ?? ''}
                          onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                          className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] rounded-xl h-10 px-3.5 text-xs focus:border-[#B88E4B] outline-none shadow-2xs mb-2"
                        />
                        <CloudinaryImageUpload
                          folder="fahad-ali-categories"
                          onUploadSuccess={(url) => setCategoryForm((prev) => ({ ...prev, image: url }))}
                        />
                      </div>

                      {/* 1-Click Curated Presets Picker */}
                      <div>
                        <label className="text-[10px] font-black text-[#8C6239] uppercase tracking-wider block mb-2 flex items-center gap-1">
                          <Sparkles size={11} className="text-[#B88E4B]" /> 1-Click Curated Luxury Presets
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {PRESET_COLLECTION_IMAGES.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setCategoryForm({ ...categoryForm, image: preset.url })}
                              className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#E7DDD0] hover:border-[#B88E4B] transition-all group cursor-pointer"
                            >
                              <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                                <span className="text-[8.5px] font-black text-white truncate drop-shadow">{preset.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DESCRIPTION & SEO */}
                  {modalActiveTab === 'seo' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Architectural Craftsmanship Description
                        </label>
                        <textarea
                          placeholder="Describe the room ambiance, wood seasoning heritage, bespoke joinery, and styling suggestions..."
                          value={categoryForm.description ?? ''}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          rows={4}
                          className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-medium rounded-xl p-3 text-xs focus:border-[#B88E4B] outline-none shadow-2xs leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
                          Storefront Destination URL Slug
                        </label>
                        <div className="flex items-center bg-[#FCFAF7] border border-[#E7DDD0] rounded-xl overflow-hidden h-10 px-3 shadow-2xs">
                          <span className="text-stone-400 font-mono text-xs select-none">/shop?category=</span>
                          <input
                            placeholder="royal-living-room"
                            value={categoryForm.slug ?? ''}
                            onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                            className="bg-transparent text-[#1F1612] font-mono font-bold text-xs focus:outline-none flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ── RIGHT PANE: REAL-TIME LIVE CARD PREVIEW (5 Cols) ── */}
                <div className="lg:col-span-5 bg-[#FAF5EE]/70 border-2 border-dashed border-[#B88E4B]/40 p-4 sm:p-5 rounded-[24px] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6239] flex items-center gap-1.5">
                      <Eye size={12} className="text-[#B88E4B]" /> LIVE CARD PREVIEW
                    </span>
                    <span className="text-[9.5px] font-mono bg-white text-stone-500 px-2 py-0.5 rounded-md border border-[#E2D1BC]">
                      100% Real-Time
                    </span>
                  </div>

                  {/* Masterpiece Card Live Simulation */}
                  <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-3 shadow-md space-y-2.5">
                    <div className="relative aspect-[16/9] w-full rounded-[16px] overflow-hidden bg-[#FAF5EE] border border-[#E7DDD0]/80">
                      {categoryForm.image ? (
                        <img src={resolveImageUrl(categoryForm.image)} alt={categoryForm.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#B88E4B] font-serif font-black text-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3]">
                          {categoryForm.name?.slice(0, 2).toUpperCase() || '✦'}
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-amber-300 border border-white/20 shadow-xs">
                          {categoryForm.badge || '👑 Royal Heritage'}
                        </span>
                      </div>
                    </div>

                    <div className="px-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-sm font-black font-serif text-[#1F1612] truncate">
                          {categoryForm.name || 'Collection Title'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC] shrink-0">
                          {categoryForm.items || '25 Items'}
                        </span>
                      </div>

                      <p className="text-stone-500 text-[10.5px] font-medium line-clamp-2 min-h-[28px]">
                        {categoryForm.description || 'Curated handcrafted solid Sheesham furniture collections built by master artisans in Lahore.'}
                      </p>

                      <div className="bg-[#FCFAF7] border border-[#E7DDD0] p-1.5 rounded-xl space-y-0.5">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-bold text-stone-400">Catalog Allocation</span>
                          <span className="font-mono font-bold text-[#8C6239]">40% Coverage</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-[#E7DDD0]/60 overflow-hidden">
                          <div className="h-full w-[40%] bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] rounded-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 text-[10px]">
                        <span className="text-[#8C6239] font-black flex items-center gap-1">
                          <span>View Live Shop</span>
                          <ExternalLink size={10} />
                        </span>
                        <span className="font-mono text-stone-400">/shop?category={categoryForm.slug || 'category'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 text-center font-medium">
                    This is how your collection appears across the luxury catalog grid.
                  </p>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-[#E7DDD0] bg-white flex items-center justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  <span>{editingCategoryId ? 'Save & Apply Collection Changes' : 'Publish Collection to Showroom'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
