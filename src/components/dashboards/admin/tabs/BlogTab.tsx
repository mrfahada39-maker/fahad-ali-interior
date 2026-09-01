'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  User,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  X,
  BookOpen,
  Image as ImageIcon,
  Tag,
  PenTool
} from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface BlogTabProps {
  blogs: any[];
  blogForm: any;
  setBlogForm: React.Dispatch<React.SetStateAction<any>>;
  showAddBlog: boolean;
  setShowAddBlog: (show: boolean) => void;
  saveBlog: () => void;
  deleteBlog: (id: string) => void;
  editBlog: (b: any) => void;
}

export default function BlogTab({
  blogs = [],
  blogForm,
  setBlogForm,
  showAddBlog,
  setShowAddBlog,
  saveBlog,
  deleteBlog,
  editBlog,
}: BlogTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const filteredBlogs = (blogs || []).filter((b: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.slug?.toLowerCase().includes(q) ||
      (b.tags && b.tags.some((t: string) => t.toLowerCase().includes(q)));

    if (filterStatus === 'published') return matchesSearch && b.isActive;
    if (filterStatus === 'draft') return matchesSearch && !b.isActive;
    return matchesSearch;
  });

  const totalCount = blogs.length;
  const publishedCount = blogs.filter((b: any) => b.isActive).length;
  const draftCount = blogs.filter((b: any) => !b.isActive).length;

  const kpis = [
    {
      label: 'TOTAL EDITORIAL ARTICLES',
      numValue: totalCount,
      sub: '✓ Luxury Journal Publications',
      icon: BookOpen,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'LIVE PUBLISHED STORIES',
      numValue: publishedCount,
      sub: '⚡ Active on Storefront',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'DRAFT / IN REVIEW',
      numValue: draftCount,
      sub: draftCount === 0 ? '✓ All Posts Live' : '⚡ Pending Approval',
      icon: Clock,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: draftCount === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: draftCount === 0 ? 'bg-emerald-500' : 'bg-purple-500',
    },
    {
      label: 'EDITORIAL SEO HEALTH',
      numValue: 98.6,
      suffix: '%',
      sub: '⭐ High Google Ranking',
      icon: Sparkles,
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
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">EDITORIAL JOURNAL CMS V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">EDITORIAL ACTIVE</span>
              <span className="hidden lg:inline">LIVE EDITORIAL ENGINE ACTIVE</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Editorial Journal <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Blog CMS</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Publish luxury Sheesham craft stories, architectural guides, and interior design styling trends.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={() => {
              setBlogForm({
                id: '',
                title: '',
                slug: '',
                content: '',
                excerpt: '',
                image: '',
                author: 'Admin',
                isActive: true,
                tags: '',
              });
              setShowAddBlog(true);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Write New Article</span>
            <span className="sm:hidden">New Article</span>
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

      {/* ── LUXURY TOOLBAR & FILTERS ── */}
      <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-3 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All Articles', count: totalCount },
            { id: 'published', label: 'Published & Live', count: publishedCount },
            { id: 'draft', label: 'Drafts', count: draftCount },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs'
                    : 'bg-[#FCFAF7] hover:bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] border border-[#E7DDD0]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E7DDD0] text-[#7A6354]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            placeholder="Search by title, author, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] placeholder:text-stone-400 font-bold rounded-xl h-9.5 pl-9 pr-3 text-xs focus:border-[#B88E4B] outline-none"
          />
        </div>

      </div>

      {/* ── ARTICLES TABLE & GRID VIEW ── */}
      {filteredBlogs.length === 0 ? (
        <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-16 text-center shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-3 text-[#B88E4B]">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-black text-[#221814] font-serif">No Blog Articles Published Yet</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto mt-1">
            Click &ldquo;Write New Article&rdquo; above to create your first luxury furniture and interior design journal post.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7DDD0] rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#E7DDD0] text-[10px] font-black text-[#7A6354] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Article Title & Details</th>
                  <th className="py-3.5 px-3">Author</th>
                  <th className="py-3.5 px-3">Date Published</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredBlogs.map((b: any) => (
                  <tr key={b.id} className="hover:bg-[#FCFAF7] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] shrink-0 font-serif font-black shadow-2xs overflow-hidden">
                          {b.image ? (
                            <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={18} />
                          )}
                        </div>
                        <div>
                          <p className="text-[#1F1612] font-black text-xs font-serif hover:text-[#B88E4B] transition-colors cursor-pointer" onClick={() => editBlog(b)}>
                            {b.title}
                          </p>
                          <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                            /journal/{b.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-stone-600 text-[11px]">
                      {b.author || 'Admin'}
                    </td>

                    <td className="py-3.5 px-3 text-stone-500 font-semibold text-[11px]">
                      {new Date(b.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-3">
                      {b.isActive ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 border border-stone-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                          DRAFT
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => editBlog(b)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF5EE] text-[#8C6239] hover:bg-[#F3E7D3] border border-[#E2D1BC] font-black text-[10.5px] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteBlog(b.id)}
                          className="p-1.5 rounded-xl bg-[#FAF5EE] hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-[#E2D1BC] hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LUXURY ARTICLE CREATOR / EDITOR MODAL ── */}
      <AnimatePresence>
        {showAddBlog && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl bg-white border-2 border-[#B88E4B]/40 rounded-[24px] p-6 space-y-4 shadow-[0_20px_60px_rgba(44,30,24,0.25)] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-serif font-black text-[#221814] text-base flex items-center gap-2">
                    <span className="text-[#B88E4B]">✦</span> {blogForm.id ? 'Edit Journal Article' : 'Compose New Article'}
                  </h4>
                  <p className="text-stone-400 text-xs font-semibold mt-0.5">
                    Share craftsmanship heritage, interior design tips, and furniture styling guides
                  </p>
                </div>
                <button
                  onClick={() => setShowAddBlog(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Fields Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">Article Title</label>
                    <input
                      placeholder="e.g. The Timeless Elegance of Solid Sheesham..."
                      value={blogForm.title}
                      onChange={(e) =>
                        setBlogForm({
                          ...blogForm,
                          title: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                        })
                      }
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-bold rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">URL Slug</label>
                    <input
                      placeholder="e.g. timeless-elegance-sheesham"
                      value={blogForm.slug}
                      onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-mono rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">Cover Image URL</label>
                    <input
                      placeholder="https://images.unsplash.com/..."
                      value={blogForm.image}
                      onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">Tags (Comma Separated)</label>
                    <input
                      placeholder="Sheesham, Luxury Furniture, Interior Design"
                      value={blogForm.tags}
                      onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">Short Summary / Excerpt</label>
                  <textarea
                    placeholder="Brief 1-2 sentence overview of the article..."
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    rows={2}
                    className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-medium rounded-xl p-3 text-xs focus:border-[#B88E4B] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">Full Article Content (Markdown / HTML)</label>
                  <textarea
                    placeholder="Write your story here..."
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    rows={7}
                    className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-medium rounded-xl p-3 text-xs focus:border-[#B88E4B] outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={blogForm.isActive}
                    onChange={(e) => setBlogForm({ ...blogForm, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#B88E4B] rounded"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-black text-[#1F1612] cursor-pointer">
                    Publish immediately to live storefront
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  onClick={() => setShowAddBlog(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBlog}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <PenTool size={13} />
                  <span>{blogForm.id ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
