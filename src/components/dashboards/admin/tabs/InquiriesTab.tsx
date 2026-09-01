'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Eye,
  X,
  Compass,
  Sparkles,
  Send,
  ShieldCheck,
  PhoneCall,
  Crown,
  Briefcase
} from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface InquiriesTabProps {
  inquiries: any[];
  updateInquiryStatus: (id: string, status: string) => void;
}

export default function InquiriesTab({ inquiries = [], updateInquiryStatus }: InquiriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedInquiryModal, setSelectedInquiryModal] = useState<any>(null);

  const totalBudgetVal = inquiries.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
  const pendingCount = inquiries.filter((i) => (i.status || '').toLowerCase() === 'pending').length;
  const contactedCount = inquiries.filter((i) => (i.status || '').toLowerCase() === 'contacted').length;
  const reviewedCount = inquiries.filter(
    (i) => (i.status || '').toLowerCase() === 'reviewed' || (i.status || '').toLowerCase() === 'approved'
  ).length;

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus =
      selectedStatusFilter === 'all' || (inq.status || '').toLowerCase() === selectedStatusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      Boolean(inq.roomType && inq.roomType.toLowerCase().includes(q)) ||
      Boolean(inq.description && inq.description.toLowerCase().includes(q)) ||
      Boolean(inq.name && inq.name.toLowerCase().includes(q)) ||
      Boolean(inq.user?.name && inq.user.name.toLowerCase().includes(q)) ||
      Boolean(inq.email && inq.email.toLowerCase().includes(q)) ||
      Boolean(inq.user?.email && inq.user.email.toLowerCase().includes(q)) ||
      Boolean(inq.phone && inq.phone.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const kpis = [
    {
      label: 'TOTAL PIPELINE BUDGET',
      numValue: totalBudgetVal,
      prefix: 'Rs. ',
      sub: 'Est. Project Proposals',
      icon: DollarSign,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'PENDING ACTION REQUIRED',
      numValue: pendingCount,
      sub: pendingCount === 0 ? '✓ All Inquiries Actioned' : '⚡ Awaiting Response',
      icon: Clock,
      color: 'text-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]',
      ambientGlow: 'bg-amber-500/10',
      cardGlow: 'border-amber-300/80 hover:border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]',
      badgeBg: pendingCount === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: pendingCount === 0 ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      label: 'CLIENTS CONTACTED',
      numValue: contactedCount,
      sub: '💬 Consultation in Progress',
      icon: PhoneCall,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'PROPOSALS FINALIZED',
      numValue: reviewedCount,
      sub: '⭐ Approved Transformations',
      icon: ShieldCheck,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
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
              <span className="hidden lg:inline">INTERIOR CONSULTATIONS V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">PROPOSALS SYNCED</span>
              <span className="hidden lg:inline">LIVE CLIENT PROPOSALS SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Design Inquiries <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Consultations Suite</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Custom interior design requests, room transformations, bespoke cabinetry, and architectural project proposals.
          </p>
        </div>

        {/* Right Status Capsule */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center shadow-xs">
              <Compass size={15} />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-black text-[#1F1612] uppercase tracking-wider block">Active Pipeline</span>
              <span className="text-[8.5px] sm:text-[10px] font-bold text-[#8C6239] block">{inquiries.length} Consultations</span>
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
                {kpi.prefix && <span className="text-base sm:text-lg font-bold text-[#8C6D46] mr-1">{kpi.prefix}</span>}
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
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
            { id: 'all', label: 'All Inquiries', count: inquiries.length },
            { id: 'pending', label: 'Pending Review', count: pendingCount },
            { id: 'contacted', label: 'Contacted', count: contactedCount },
            { id: 'reviewed', label: 'Reviewed', count: inquiries.filter((i) => (i.status || '').toLowerCase() === 'reviewed').length },
            { id: 'approved', label: 'Approved', count: inquiries.filter((i) => (i.status || '').toLowerCase() === 'approved').length },
          ].map((tab) => {
            const isActive = selectedStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id)}
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
            placeholder="Search by Room, Client, or Budget..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] placeholder:text-stone-400 font-bold rounded-xl h-9.5 pl-9 pr-3 text-xs focus:border-[#B88E4B] outline-none"
          />
        </div>

      </div>

      {/* ── CONSULTATIONS CARDS GRID ── */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white border border-[#E7DDD0] rounded-[24px] p-16 text-center shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-3 text-[#B88E4B]">
            <Compass size={32} />
          </div>
          <h3 className="text-lg font-black text-[#221814] font-serif">No Design Inquiries Found</h3>
          <p className="text-stone-500 text-xs max-w-md mx-auto mt-1">
            When clients request custom architectural consultations or bespoke interior transformations, their dossiers will appear here live.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredInquiries.map((inq) => {
            const desc = inq.description || '';
            const nameMatch = desc.match(/From:\s*([^(,]+)/i);
            const emailMatch = desc.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            const phoneMatch = desc.match(/(\+?\d[\d\s-]{8,14}\d)/);

            const clientName = inq.name || inq.user?.name || (nameMatch ? nameMatch[1].trim() : 'Valued Client');
            const clientEmail = inq.email || inq.user?.email || (emailMatch ? emailMatch[1].trim() : 'client@fahadali.com');
            const clientPhone = inq.phone || inq.user?.phone || (phoneMatch ? phoneMatch[1].trim() : '');
            const initial = clientName.charAt(0).toUpperCase();

            const whatsappUrl = clientPhone
              ? `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Assalam-o-Alaikum ${clientName}! Regarding your Interior Design Consultation for ${inq.roomType || 'your project'} at Fahad Ali Interior:`
                )}`
              : null;

            return (
              <motion.div
                key={inq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/50 rounded-[22px] p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  
                  {/* Top Row: Room Tag & Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center font-serif font-black text-sm shadow-2xs">
                        {initial}
                      </div>
                      <div>
                        <h4 className="text-[#1F1612] font-black text-sm font-serif leading-none">
                          {clientName}
                        </h4>
                        <p className="text-stone-400 text-[10.5px] font-semibold mt-1">
                          {clientEmail} {clientPhone ? `• ${clientPhone}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      (inq.status || 'pending').toLowerCase() === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : (inq.status || '').toLowerCase() === 'contacted'
                        ? 'bg-blue-50 text-blue-800 border border-blue-300'
                        : (inq.status || '').toLowerCase() === 'reviewed'
                        ? 'bg-purple-50 text-purple-800 border border-purple-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {inq.status || 'Pending'}
                    </span>
                  </div>

                  {/* Room Type Tag & Budget Row */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE] px-2.5 py-0.5 rounded-lg border border-[#E2D1BC] inline-flex items-center gap-1 shadow-2xs">
                        <Briefcase size={11} />
                        {inq.roomType || 'Interior Space Transformation'}
                      </span>

                      <div className="text-right">
                        <span className="text-[9.5px] text-stone-400 font-bold uppercase block leading-none">Est. Budget</span>
                        <span className="text-xs sm:text-sm font-black text-[#1F1612] font-mono">
                          Rs. {formatPrice(inq.budget || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Description Quote Box */}
                    <div className="bg-[#FCFAF7] p-3 rounded-xl border border-[#E7DDD0] text-xs text-[#3E2E25] font-medium leading-relaxed italic line-clamp-3">
                      &ldquo;{inq.description || 'No detailed instructions submitted.'}&rdquo;
                    </div>
                  </div>

                </div>

                {/* Bottom Action Toolbar */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
                  
                  {/* Left WhatsApp & View Button */}
                  <div className="flex items-center gap-1.5">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-black text-[10.5px] flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <MessageSquare size={12} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedInquiryModal(inq)}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF5EE] text-[#8C6239] hover:bg-[#F3E7D3] border border-[#E2D1BC] font-black text-[10.5px] shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye size={12} />
                      <span>View Dossier</span>
                    </button>
                  </div>

                  {/* Right Status Workflow Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateInquiryStatus(inq.id, 'contacted')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                    >
                      Contacted
                    </button>
                    <button
                      onClick={() => updateInquiryStatus(inq.id, 'reviewed')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                    >
                      Reviewed
                    </button>
                    <button
                      onClick={() => updateInquiryStatus(inq.id, 'approved')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Approved
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── 360° PROPOSAL DOSSIER LUXURY MODAL ── */}
      <AnimatePresence>
        {selectedInquiryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white border-2 border-[#B88E4B]/40 rounded-[24px] p-6 space-y-4 shadow-[0_20px_60px_rgba(44,30,24,0.25)] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-serif font-black text-[#221814] text-base flex items-center gap-2">
                    <span className="text-[#B88E4B]">✦</span> Consultation Dossier
                  </h4>
                  <p className="text-stone-400 text-xs font-semibold mt-0.5">
                    {selectedInquiryModal.roomType || 'Interior Space'} Proposal Specification
                  </p>
                </div>
                <button
                  onClick={() => setSelectedInquiryModal(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Client Dossier */}
              <div className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#E7DDD0] space-y-2">
                <p className="font-black text-[10px] uppercase tracking-wider text-[#8C6239]">CLIENT CREDENTIALS</p>
                <p className="text-sm font-black text-[#1F1612] font-serif">
                  {selectedInquiryModal.name || selectedInquiryModal.user?.name || 'Valued Client'}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Mail size={13} className="text-[#B88E4B]" />
                  {selectedInquiryModal.email || selectedInquiryModal.user?.email || 'N/A'}
                </p>
                {selectedInquiryModal.phone && (
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#B88E4B]" />
                    {selectedInquiryModal.phone}
                  </p>
                )}
              </div>

              {/* Project Vision Box */}
              <div className="bg-white p-4 rounded-2xl border border-[#E7DDD0] space-y-1.5">
                <p className="font-black text-[10px] uppercase tracking-wider text-[#8C6239]">PROJECT VISION & REQUIREMENTS</p>
                <p className="text-xs text-[#3E2E25] font-medium leading-relaxed italic">
                  &ldquo;{selectedInquiryModal.description || 'No detailed specifications submitted.'}&rdquo;
                </p>
              </div>

              {/* Budget Total */}
              <div className="bg-[#FAF5EE] p-4 rounded-2xl border border-[#E2D1BC] flex items-center justify-between">
                <span className="text-xs font-black text-[#8C6239] uppercase tracking-wider">Allocated Project Budget</span>
                <span className="text-lg font-black text-[#1F1612] font-mono">
                  Rs. {formatPrice(selectedInquiryModal.budget || 0)}
                </span>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setSelectedInquiryModal(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
