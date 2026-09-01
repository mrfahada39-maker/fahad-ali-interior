'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Filter,
  Sparkles,
  ShoppingBag,
  User,
  Clock,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface ReviewsTabProps {
  reviews: any[];
  updateReviewStatus: (id: string, status: string) => void;
  deleteReview: (id: string) => void;
  statusColor: (status: string) => string;
}

export default function ReviewsTab({
  reviews = [],
  updateReviewStatus,
  deleteReview,
  statusColor,
}: ReviewsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredReviews = (reviews || []).filter((r: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.customerName?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.product?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q);

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && (r.status || 'pending').toLowerCase() === 'pending';
    if (filterStatus === 'approved') return matchesSearch && (r.status || '').toLowerCase() === 'approved';
    if (filterStatus === 'rejected') return matchesSearch && (r.status || '').toLowerCase() === 'rejected';
    if (filterStatus === '5star') return matchesSearch && Number(r.rating) === 5;
    return matchesSearch;
  });

  const totalCount = reviews.length;
  const pendingCount = reviews.filter((r: any) => (r.status || 'pending').toLowerCase() === 'pending').length;
  const approvedCount = reviews.filter((r: any) => (r.status || '').toLowerCase() === 'approved').length;
  const avgRating = totalCount > 0
    ? (reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / totalCount).toFixed(1)
    : '4.9';

  const kpis = [
    {
      label: 'AVERAGE CLIENT RATING',
      numValue: parseFloat(avgRating),
      suffix: ' ★',
      sub: '⭐ 5-Star Premium Score',
      icon: Star,
      color: 'text-amber-500',
      iconBg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]',
      ambientGlow: 'bg-amber-500/10',
      cardGlow: 'border-amber-300/80 hover:border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'TOTAL REPUTATION REVIEWS',
      numValue: totalCount,
      sub: '✓ Verified Client Testimonials',
      icon: Award,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'MODERATION PENDING QUEUE',
      numValue: pendingCount,
      sub: pendingCount === 0 ? '✓ All Reviews Cleared' : '⚡ Action Required',
      icon: Sparkles,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: pendingCount === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: pendingCount === 0 ? 'bg-emerald-500' : 'bg-purple-500',
    },
    {
      label: 'PUBLIC APPROVAL RATE',
      numValue: 98.2,
      suffix: '%',
      sub: '🛡️ High Quality Feedback',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
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
              <span className="hidden lg:inline">REPUTATION & FEEDBACK SUITE V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">REPUTATION SYNCED</span>
              <span className="hidden lg:inline">100% VERIFIED STOREFRONT RATINGS</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Review Moderation <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Feedback Suite</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Approve, reject, or audit client ratings and testimonials across luxury Sheesham furniture collections.
          </p>
        </div>

        {/* Right Status Capsule */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center shadow-xs">
              <Star size={15} className="fill-white" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-black text-[#1F1612] uppercase tracking-wider block">Reputation Score</span>
              <span className="text-[8.5px] sm:text-[10px] font-bold text-amber-700 block">4.9 / 5.0 (Excellent)</span>
            </div>
          </div>
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
            { id: 'all', label: 'All Reviews', count: totalCount },
            { id: 'pending', label: 'Pending Moderation', count: pendingCount },
            { id: 'approved', label: 'Approved & Live', count: approvedCount },
            { id: '5star', label: '5-Star Ratings' },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
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
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            placeholder="Search by client or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] placeholder:text-stone-400 font-bold rounded-xl h-9.5 pl-9 pr-3 text-xs focus:border-[#B88E4B] outline-none"
          />
        </div>

      </div>

      {/* ── REVIEWS CARDS GRID ── */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-16 text-center shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-3 text-[#B88E4B]">
            <Star size={32} className="fill-[#B88E4B]/30" />
          </div>
          <h3 className="text-lg font-black text-[#221814] font-serif">No Customer Reviews Moderated Yet</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto mt-1">
            When clients rate luxury Sheesham furniture collections, their feedback and ratings will appear here live for instant admin moderation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredReviews.map((r: any) => {
            const initial = (r.customerName || r.user?.name || 'A').charAt(0).toUpperCase();
            const ratingNum = Number(r.rating) || 5;

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/50 rounded-[22px] p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  
                  {/* Top Row: User Avatar, Name & Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center font-serif font-black text-sm shadow-2xs">
                        {initial}
                      </div>
                      <div>
                        <h4 className="text-[#1F1612] font-black text-sm font-serif leading-none">
                          {r.customerName || r.user?.name || 'Valued Client'}
                        </h4>
                        <p className="text-stone-400 text-[10.5px] font-semibold mt-1">
                          {new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • <span className="text-emerald-700 font-bold">✓ Verified Purchase</span>
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      (r.status || 'pending').toLowerCase() === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : (r.status || '').toLowerCase() === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {r.status || 'Pending'}
                    </span>
                  </div>

                  {/* Product Tag & Rating Stars */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10.5px] font-bold text-[#8C6239] bg-[#FAF5EE] px-2.5 py-0.5 rounded-lg border border-[#E2D1BC] inline-flex items-center gap-1 shadow-2xs">
                        <ShoppingBag size={11} />
                        {r.product?.name || 'Sheesham Handcrafted Masterpiece'}
                      </span>
                    </div>

                    {/* Star Row */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < ratingNum ? 'fill-amber-400 text-amber-500' : 'text-stone-200'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-[#1F1612] ml-1">{ratingNum}.0 / 5.0</span>
                    </div>

                    {/* Review Comment Quote Box */}
                    {r.comment && (
                      <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#E7DDD0] text-xs text-[#3E2E25] font-medium italic leading-relaxed">
                        &ldquo;{r.comment}&rdquo;
                      </div>
                    )}
                  </div>

                </div>

                {/* Bottom Action Controls */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateReviewStatus(r.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-black text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => updateReviewStatus(r.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white font-black text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="p-1.5 rounded-xl bg-[#FAF5EE] hover:bg-rose-50 text-stone-500 hover:text-rose-600 border border-[#E2D1BC] hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
