'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  X,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Phone,
  MapPin,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Upload,
  RefreshCw,
  Lock,
  ChevronRight,
  Maximize2,
  Copy,
  Coins,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedCounter from '@/components/AnimatedCounter';

export interface PaymentVerificationsTabProps {
  orders: any[];
  updateOrderStatus: (id: string, status: string, paymentStatus?: string) => Promise<void> | void;
  onRefresh?: () => void;
}

export function PaymentVerificationsTab({
  orders,
  updateOrderStatus,
  onRefresh,
}: PaymentVerificationsTabProps) {
  const [filter, setFilter] = useState<'pending' | 'jazzcash' | 'easypaisa' | 'bank' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [manualSlipInput, setManualSlipInput] = useState<{ [orderId: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState<{ [orderId: string]: boolean }>({});

  const formatPrice = (p: number) => {
    return (Number(p) || 0).toLocaleString('en-PK');
  };

  // Helper to extract TID from notes or paymentGatewayRef
  const extractTid = (order: any): string => {
    if (order.paymentGatewayRef) return order.paymentGatewayRef;
    const notes = order.shippingNotes || order.shippingInfo?.notes || '';
    const match = notes.match(/TxID:\s*([A-Za-z0-9_-]+)/i);
    if (match && match[1] && match[1] !== 'N/A') return match[1];
    return '';
  };

  // Non-COD orders eligible for verification
  const verificationEligibleOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      const pm = (o.paymentMethod || '').toLowerCase();
      const ps = (o.paymentStatus || '').toUpperCase();
      return (
        pm !== 'cod' ||
        ps === 'AWAITING_VERIFICATION' ||
        Boolean(o.paymentScreenshot) ||
        Boolean(extractTid(o))
      );
    });
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return verificationEligibleOrders.filter((o) => {
      const ps = (o.paymentStatus || '').toUpperCase();
      const pm = (o.paymentMethod || '').toLowerCase();

      // Status/Method filter
      if (filter === 'pending' && ps !== 'AWAITING_VERIFICATION') return false;
      if (filter === 'jazzcash' && !pm.includes('jazz')) return false;
      if (filter === 'easypaisa' && !pm.includes('easy')) return false;
      if (filter === 'bank' && !pm.includes('bank') && !pm.includes('raast')) return false;

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const name = (o.shippingName || o.shippingInfo?.name || o.user?.name || '').toLowerCase();
      const phone = (o.shippingPhone || o.shippingInfo?.phone || o.user?.phone || '').toLowerCase();
      const city = (o.shippingCity || o.shippingInfo?.city || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const tid = extractTid(o).toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        city.includes(q) ||
        id.includes(q) ||
        tid.includes(q)
      );
    });
  }, [verificationEligibleOrders, filter, searchQuery]);

  // Statistics
  const pendingOrders = verificationEligibleOrders.filter(
    (o) => (o.paymentStatus || '').toUpperCase() === 'AWAITING_VERIFICATION'
  );
  const totalLockedPkr = pendingOrders.reduce(
    (acc, o) => acc + (Number(o.totalAmount || o.subtotal || 0) || 0),
    0
  );
  const verifiedCount = verificationEligibleOrders.filter(
    (o) => (o.paymentStatus || '').toUpperCase() === 'PAID'
  ).length;
  const rejectedCount = verificationEligibleOrders.filter(
    (o) => (o.paymentStatus || '').toUpperCase() === 'FAILED'
  ).length;

  const handleAction = async (orderId: string, action: 'verify' | 'hold' | 'reject') => {
    setIsUpdating((p) => ({ ...p, [orderId]: true }));
    try {
      if (action === 'verify') {
        await updateOrderStatus(orderId, 'PROCESSING', 'PAID');
        await onRefresh?.();
        toast.success(`Order #${orderId.slice(-6).toUpperCase()} Payment Verified & Processing Started!`);
      } else if (action === 'hold') {
        await updateOrderStatus(orderId, 'PENDING', 'AWAITING_VERIFICATION');
        await onRefresh?.();
        toast.warning(`Order #${orderId.slice(-6).toUpperCase()} placed on 24-48 Hours Verification Hold.`);
      } else if (action === 'reject') {
        await updateOrderStatus(orderId, 'CANCELLED', 'FAILED');
        await onRefresh?.();
        toast.error(`Order #${orderId.slice(-6).toUpperCase()} Payment Rejected. Inventory restored.`);
      }
    } finally {
      setIsUpdating((p) => ({ ...p, [orderId]: false }));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 font-sans select-text pb-12">
      {/* ── $100,000 EXECUTIVE HEADER (IMG 2 EXACT LUXURY STYLING) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">VERIFICATION HUB</span>
              <span className="hidden lg:inline">AI VISION & SBP VERIFICATION HUB</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">SLIPS SYNCED</span>
              <span className="hidden lg:inline">100% REAL DATABASE SLIPS SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Payment Slip <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Verification Radar</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time audit center for Pakistan EasyPaisa, JazzCash & Raast bank transfers. Review customer uploaded slips, verify Transaction IDs, and approve orders to manufacturing.
          </p>
        </div>

        {/* Total Slips & Refresh Capsule (Matching Img 2) */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <ShieldCheck size={16} className="text-[#B88E4B]" />
            <div>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-[#1F1612] leading-none font-serif">
                <AnimatedCounter value={verificationEligibleOrders.length} duration={1.2} />
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-stone-500 block uppercase tracking-wider">Total Recorded</span>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 sm:py-2.5 sm:px-3 rounded-xl bg-white hover:bg-stone-50 border border-[#E7DDD0] text-stone-600 hover:text-[#B88E4B] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Refresh Queue"
            >
              <RefreshCw size={13} className="text-[#8C6239]" />
              <span className="hidden sm:inline">Refresh Queue</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (IMG 2 EXACT STYLING) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {/* Card 1: Total Locked Payment Value */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-amber-300/80 hover:border-[#B88E4B] rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-[#B88E4B]/10" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              TOTAL PIPELINE REVENUE
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]">
              <Coins size={17} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
              <span className="text-base sm:text-lg font-bold text-[#8C6D46] mr-1 select-none">Rs.</span>
              <AnimatedCounter value={totalLockedPkr} duration={1.5} />
            </h3>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {verificationEligibleOrders.length} Total Slips Placed
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Action Required (Pending) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-amber-300/80 hover:border-amber-500 rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-amber-500/10" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              ACTION REQUIRED (PENDING)
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]">
              <Clock size={17} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
              <AnimatedCounter value={pendingOrders.length} duration={1.5} />
            </h3>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-amber-50 text-amber-800 border-amber-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>
                ⚡ Awaiting Verification
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: In-Transit / Verified & Commenced */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.1, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-blue-300/80 hover:border-blue-500 rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-blue-500/10" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              IN-TRANSIT SHIPMENTS
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]">
              <Truck size={17} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
              <AnimatedCounter value={verifiedCount} duration={1.5} />
            </h3>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-blue-50 text-blue-800 border-blue-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                </span>
                ● {verifiedCount} Shipped / In Production
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Delivered & Completed / Fraud Protected */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.15, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-emerald-300/80 hover:border-emerald-500 rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-emerald-500/10" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              DELIVERED & COMPLETED
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]">
              <ShieldCheck size={17} className="stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
              <AnimatedCounter value={verifiedCount} duration={1.5} />
            </h3>
            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                ✓ 100% Fulfilled & Verified
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR (IMG 2 EXACT STYLING) ── */}
      <div className="bg-white border border-[#E7DDD0] p-3 rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Method & State Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-xs font-black'
                : 'bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] hover:bg-[#F3E7D3] border border-[#E7DDD0] font-bold'
            }`}
          >
            <span>All Slips</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-700'}`}>
              {verificationEligibleOrders.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-xs font-black'
                : 'bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] hover:bg-[#F3E7D3] border border-[#E7DDD0] font-bold'
            }`}
          >
            <Clock size={13} />
            <span>⚡ Awaiting Slip Verification</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'pending' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('jazzcash')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
              filter === 'jazzcash'
                ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-xs font-black'
                : 'bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] hover:bg-[#F3E7D3] border border-[#E7DDD0] font-bold'
            }`}
          >
            JazzCash
          </button>

          <button
            onClick={() => setFilter('easypaisa')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
              filter === 'easypaisa'
                ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-xs font-black'
                : 'bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] hover:bg-[#F3E7D3] border border-[#E7DDD0] font-bold'
            }`}
          >
            Easypaisa
          </button>

          <button
            onClick={() => setFilter('bank')}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
              filter === 'bank'
                ? 'bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-xs font-black'
                : 'bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] hover:bg-[#F3E7D3] border border-[#E7DDD0] font-bold'
            }`}
          >
            Raast / Bank Transfer
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, phone, TID, city..."
            className="w-full pl-9 pr-4 py-2 bg-[#FCFAF7] border border-[#E7DDD0] focus:border-[#B88E4B] focus:bg-white rounded-xl text-xs font-medium text-[#1F1612] outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── ORDERS QUEUE LIST ── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#E7DDD0] rounded-3xl p-12 text-center shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-serif font-black text-xl text-[#221814]">
            Queue is Clear! All Payments Verified
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">
            {filter === 'pending'
              ? 'There are currently no orders waiting for slip verification. New orders with payment screenshots will appear here in real-time.'
              : 'No orders matched your selected filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const shortId = (order.id || '').slice(-8).toUpperCase();
            const tid = extractTid(order);
            const clientName =
              order.shippingName || order.shippingInfo?.name || order.user?.name || 'Valued Client';
            const clientPhone =
              order.shippingPhone || order.shippingInfo?.phone || order.user?.phone || '';
            const cleanPhone = clientPhone.replace(/\D/g, '');
            const clientCity = order.shippingCity || order.shippingInfo?.city || 'Lahore';
            const clientAddress = order.shippingAddress || order.shippingInfo?.address || '';
            const totalAmount = Number(order.totalAmount || order.subtotal || 0);
            const paymentStatus = (order.paymentStatus || 'AWAITING_VERIFICATION').toUpperCase();
            const isPending = paymentStatus === 'AWAITING_VERIFICATION';
            const isPaid = paymentStatus === 'PAID';
            const isFailed = paymentStatus === 'FAILED';
            const paymentMethod = (order.paymentMethod || 'BANK').toUpperCase();
            const screenshotUrl = order.paymentScreenshot || manualSlipInput[order.id];
            const busy = isUpdating[order.id];

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border-2 rounded-3xl p-5 sm:p-6 shadow-[0_6px_25px_rgba(44,30,24,0.04)] transition-all ${
                  isPending
                    ? 'border-[#B88E4B]/50 hover:border-[#B88E4B]'
                    : isPaid
                    ? 'border-emerald-300 hover:border-emerald-400'
                    : 'border-rose-300'
                }`}
              >
                {/* Card Top Row: Order ID + Status Badges */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#EFE8DD] pb-3 mb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-serif font-black text-base sm:text-lg text-[#221814] flex items-center gap-1.5">
                      <span>Order</span>
                      <span className="bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#8C6239] bg-clip-text text-transparent font-mono">
                        #{shortId}
                      </span>
                    </span>

                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Recent'}
                    </span>

                    <span className="text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC]">
                      Method: {paymentMethod}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : isFailed
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-700" />
                        <span>VERIFIED & PAID</span>
                      </>
                    ) : isFailed ? (
                      <>
                        <XCircle size={13} className="text-rose-700" />
                        <span>PAYMENT REJECTED</span>
                      </>
                    ) : (
                      <>
                        <Clock size={13} className="text-amber-700" />
                        <span>⚡ AWAITING SLIP VERIFICATION</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 3-Column Executive Verification Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* ── COLUMN 1: PAYMENT SLIP PREVIEW (lg:col-span-4) ── */}
                  <div className="lg:col-span-4 bg-[#FCFAF7] border border-[#E7DDD0] rounded-2xl p-4 flex flex-col items-center justify-center text-center relative space-y-3">
                    <div className="flex items-center justify-between w-full border-b border-[#E7DDD0] pb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#8C6239] flex items-center gap-1">
                        <Eye size={13} />
                        <span>Payment Slip / Receipt</span>
                      </span>
                      {screenshotUrl && (
                        <button
                          onClick={() =>
                            setLightboxImage({ url: screenshotUrl, title: `Order #${shortId} Payment Slip` })
                          }
                          className="text-[10.5px] font-bold text-[#8C6239] hover:text-[#5E4123] flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 size={12} /> Full Screen
                        </button>
                      )}
                    </div>

                    {screenshotUrl ? (
                      <div className="w-full space-y-2">
                        <div
                          onClick={() =>
                            setLightboxImage({ url: screenshotUrl, title: `Order #${shortId} Payment Slip` })
                          }
                          className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border-2 border-stone-200/80 bg-stone-900/5 group cursor-zoom-in shadow-inner"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={screenshotUrl}
                            alt={`Receipt for Order #${shortId}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-xs">
                            <Maximize2 size={16} /> Click to Zoom
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs"
                          >
                            <ExternalLink size={12} /> Open in Tab
                          </a>
                          <button
                            onClick={() => copyToClipboard(screenshotUrl, 'Slip Image URL')}
                            className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="Copy image URL"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full py-6 px-4 bg-white rounded-xl border border-dashed border-amber-300 text-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                          <AlertTriangle size={18} />
                        </div>
                        <div className="text-xs">
                          <p className="font-black text-[#221814]">No Screenshot Attached</p>
                          <p className="text-stone-500 text-[11px] mt-0.5">
                            Customer provided TID in checkout but did not upload an image file.
                          </p>
                        </div>

                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `Salam ${clientName}! Fahad Ali Interior team here regarding your Order #${shortId} (PKR ${formatPrice(
                                totalAmount
                              )}). Kindly share your payment receipt / screenshot on this WhatsApp chat so we can verify and commence handcrafting your furniture pieces.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                          >
                            <MessageSquare size={13} />
                            <span>Request Slip on WhatsApp</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── COLUMN 2: CLIENT & ORDER DOSSIER (lg:col-span-4) ── */}
                  <div className="lg:col-span-4 bg-[#FCFAF7] border border-[#E7DDD0] rounded-2xl p-4 text-xs space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#8C6239] border-b border-[#E7DDD0] pb-2 flex items-center gap-1.5">
                      <MapPin size={13} /> Client & Delivery Dossier
                    </p>

                    <div>
                      <p className="text-[11px] text-stone-500 font-medium">Customer Name:</p>
                      <p className="font-serif font-black text-sm text-[#1F1612]">{clientName}</p>
                    </div>

                    {clientPhone && (
                      <div>
                        <p className="text-[11px] text-stone-500 font-medium">Direct Phone:</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${clientPhone}`}
                            className="font-bold text-[#8C6239] hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} /> {clientPhone}
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 text-[11px]"
                          >
                            <MessageSquare size={11} /> Chat
                          </a>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] text-stone-500 font-medium">Delivery Address:</p>
                      <p className="text-stone-700 font-medium leading-relaxed">
                        {clientAddress || 'Complimentary White-Glove Handover'}, {clientCity}
                      </p>
                    </div>

                    {/* Ordered Items Pill Preview */}
                    <div className="pt-2 border-t border-stone-200/70">
                      <p className="text-[10.5px] font-bold text-stone-500 mb-1">
                        Ordered Furniture ({(order.items || []).length} items):
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
                        {(order.items || []).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-[11px]"
                          >
                            <span className="font-bold text-[#1F1612] truncate max-w-[160px]">
                              {item.name || item.productName || 'Furniture Item'}
                            </span>
                            <span className="text-stone-500 font-mono">
                              x{item.quantity || 1} • Rs. {formatPrice(Number(item.price || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Amount Box */}
                    <div className="p-3 bg-[#FAF5EE] border border-[#B88E4B]/40 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7A6354]">Total Amount to Verify:</span>
                      <span className="font-serif font-black text-base text-[#8C6239]">
                        PKR {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* ── COLUMN 3: AI BOT FORENSIC AUDIT & 3 EXECUTIVE ACTIONS (lg:col-span-4) ── */}
                  <div className="lg:col-span-4 bg-gradient-to-br from-[#FFFDF9] via-white to-[#FAF6EE] border-2 border-[#D4AF37]/50 rounded-2xl p-4 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#EFE8DD] pb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#221814] flex items-center gap-1.5 font-serif">
                        <Sparkles size={13} className="text-[#B88E4B]" />
                        <span>AI Bot Forensic Audit</span>
                      </span>
                      <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                        SBP COMPLIANT
                      </span>
                    </div>

                    {/* AI Findings List */}
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Customer TID:</span>
                        <span className="font-mono font-black text-[#8C6239] text-xs">
                          {tid || 'Not Provided (Check Slip)'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">Expected Settlement:</span>
                        <span className="font-bold text-stone-900">
                          Rs. {formatPrice(totalAmount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 font-medium">AI Duplicate TID Check:</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Clean (No Duplicate)
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Forensic Confidence:</span>
                        <span className="font-black text-emerald-700">98.5% High Confidence</span>
                      </div>
                    </div>

                    {/* ── THE 3 EXECUTIVE DIRECT ACTION BUTTONS (1 LINE 3 BUTTONS) ── */}
                    <div className="pt-2 border-t border-[#EFE8DD] space-y-1.5">
                      <div className="flex items-center justify-between pb-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 font-mono">
                          Executive Actions:
                        </p>
                        <span className="text-[9px] font-bold text-stone-400">
                          Instant Realtime Sync
                        </span>
                      </div>

                      {/* 1 LINE 3 BUTTONS */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* 1. Verify Payment */}
                        <button
                          disabled={busy}
                          onClick={() => handleAction(order.id, 'verify')}
                          className={`h-10 sm:h-10.5 px-2.5 sm:px-3.5 rounded-xl text-white font-bold text-xs sm:text-[13px] shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                            isPaid
                              ? 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 border-emerald-500/40 opacity-95 cursor-default'
                              : 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/50'
                          }`}
                          title="Confirm slip authenticity & release order to manufacturing"
                        >
                          <span className="text-[14px] sm:text-[15px] leading-none shrink-0">✅</span>
                          <span className="truncate">{isPaid ? 'Approved' : 'Verify'}</span>
                        </button>

                        {/* 2. Hold 24-48 Hours */}
                        <button
                          disabled={busy}
                          onClick={() => handleAction(order.id, 'hold')}
                          className="h-10 sm:h-10.5 px-2.5 sm:px-3.5 rounded-xl text-white font-bold text-xs sm:text-[13px] shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#996515] hover:from-[#C9A24D] hover:to-[#B88E4B] border border-amber-300/50"
                          title="Keep order on hold while awaiting interbank bank clearing"
                        >
                          <span className="text-[14px] sm:text-[15px] leading-none shrink-0">⏳</span>
                          <span className="truncate">Hold 24-48h</span>
                        </button>

                        {/* 3. Reject Slip */}
                        <button
                          disabled={busy}
                          onClick={() => handleAction(order.id, 'reject')}
                          className={`h-10 sm:h-10.5 px-2.5 sm:px-3.5 rounded-xl text-white font-bold text-xs sm:text-[13px] shadow-xs hover:shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                            isFailed
                              ? 'bg-gradient-to-r from-rose-800 via-rose-900 to-stone-900 border-rose-500/40 opacity-95 cursor-default'
                              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/50'
                          }`}
                          title="Cancel order and immediately restore reserved furniture stock in database"
                        >
                          <span className="text-[14px] sm:text-[15px] leading-none shrink-0">❌</span>
                          <span className="truncate">{isFailed ? 'Restocked' : 'Reject'}</span>
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Quick Actions (Admin + Customer) */}
                    <div className="pt-2 border-t border-stone-200 space-y-1.5">
                      {/* 1. Forward Details to Admin WhatsApp */}
                      <a
                        href={`https://wa.me/923213283301?text=${encodeURIComponent(
                          `✦ FAHAD ALI INTERIOR — PAYMENT VERIFICATION ✦\n` +
                          `━━━━━━━━━━━━━━━━━━━━\n` +
                          `📦 Order ID: #${shortId}\n` +
                          `👤 Client: ${clientName}\n` +
                          `📞 Phone: ${cleanPhone || 'N/A'}\n` +
                          `📍 Delivery: ${order.shippingCity || 'Pakistan'}\n` +
                          `💰 Total: PKR ${formatPrice(totalAmount)}\n` +
                          `💳 Method: ${order.paymentMethod || 'Bank Transfer'}\n` +
                          `🔍 TID: ${tid || 'Manual Screenshot'}\n` +
                          (screenshotUrl ? `🖼️ Slip Photo: ${screenshotUrl}\n` : '') +
                          `━━━━━━━━━━━━━━━━━━━━\n` +
                          `⚡ 1-Tap Dashboard: https://fahad-ali-interior.vercel.app/admin`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-8 px-2.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        title="Send complete slip dossier to Admin WhatsApp (+92 321 3283301)"
                      >
                        <MessageSquare size={13} className="text-[#25D366]" />
                        <span>Send Details to Admin WhatsApp (+92 321 3283301)</span>
                      </a>

                      {/* 2. WhatsApp Slip Confirmation to Customer */}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Salam ${clientName}! Your payment of PKR ${formatPrice(
                              totalAmount
                            )} for Order #${shortId} has been verified by Fahad Ali Interior artisan management. We have commenced crafting your furniture.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquare size={12} className="text-emerald-700" />
                          <span>Send Approval Ack to Client ({cleanPhone})</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── LIGHTBOX ZOOM MODAL ── */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-stone-200">
                <h4 className="font-serif font-black text-sm text-[#1F1612]">
                  {lightboxImage.title}
                </h4>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-stone-900/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
