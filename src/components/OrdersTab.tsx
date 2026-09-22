'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Truck,
  Eye,
  X,
  Sparkles,
  Coins,
  ShieldCheck,
  Printer
} from 'lucide-react';
import AnimatedCounter from '@/components/AnimatedCounter';
import LuxurySelect from '@/components/LuxurySelect';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface OrdersTabProps {
  orders: any[];
  updateOrderStatus: (id: string, status: string) => void;
}

export default function OrdersTab({ orders, updateOrderStatus }: OrdersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  const getStatusBadge = (s: string) => {
    const st = (s || '').toLowerCase();
    switch (st) {
      case 'pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'PENDING',
        };
      case 'processing':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          label: 'PROCESSING',
        };
      case 'shipped':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          dot: 'bg-purple-500',
          label: 'SHIPPED',
        };
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'DELIVERED',
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          label: 'CANCELLED',
        };
      default:
        return {
          bg: 'bg-stone-50 text-stone-700 border-stone-300',
          dot: 'bg-stone-500',
          label: (s || 'UNKNOWN').toUpperCase(),
        };
    }
  };

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => (o.status || '').toLowerCase() === 'pending').length,
    processing: orders.filter((o) => (o.status || '').toLowerCase() === 'processing').length,
    shipped: orders.filter((o) => (o.status || '').toLowerCase() === 'shipped').length,
    delivered: orders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length,
    cancelled: orders.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length,
  };

  const totalOrderRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatusFilter === 'all' || (o.status || '').toLowerCase() === selectedStatusFilter;
    const rawQ = searchQuery.trim();
    if (!rawQ) return matchesStatus;

    const q = rawQ.toLowerCase();
    const cleanQ = q.replace(/^[#\s]+/, ''); // remove leading # or spaces
    const digitsQ = q.replace(/\D/g, ''); // phone numbers, price digits

    // Match Order ID (full or short 8 chars)
    const orderId = String(o.id || '').toLowerCase();
    const shortId = orderId.slice(-8);
    const matchesId =
      orderId.includes(q) ||
      (cleanQ.length > 0 && (orderId.includes(cleanQ) || shortId.includes(cleanQ)));

    // Match Customer Name
    const customerName = String(
      o.user?.name || o.shippingName || o.shippingInfo?.name || o.name || ''
    ).toLowerCase();
    const matchesName = customerName.includes(q) || (cleanQ.length > 0 && customerName.includes(cleanQ));

    // Match Customer Email
    const customerEmail = String(
      o.user?.email || o.shippingEmail || o.shippingInfo?.email || o.email || ''
    ).toLowerCase();
    const matchesEmail = customerEmail.includes(q) || (cleanQ.length > 0 && customerEmail.includes(cleanQ));

    // Match Phone (exact substring or digits match)
    const rawPhone = String(
      o.user?.phone || o.shippingPhone || o.shippingInfo?.phone || o.phone || ''
    );
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const matchesPhone =
      (rawPhone.length > 0 && rawPhone.toLowerCase().includes(q)) ||
      (digitsQ.length >= 3 && phoneDigits.includes(digitsQ));

    // Match Destination (address, city, province)
    const destination = `${o.shippingAddress || o.shippingInfo?.address || ''} ${o.shippingCity || o.shippingInfo?.city || ''} ${o.shippingProvince || o.shippingInfo?.province || ''}`.toLowerCase();
    const matchesDestination = destination.includes(q) || (cleanQ.length > 0 && destination.includes(cleanQ));

    // Match Ordered Items
    const matchesItems = Boolean(
      Array.isArray(o.items) &&
      o.items.some((it: any) => {
        const title = String(it.productName || it.name || it.title || it.product?.name || '').toLowerCase();
        return title.includes(q) || (cleanQ.length > 0 && title.includes(cleanQ));
      })
    );

    // Match Status Text
    const statusText = String(o.status || '').toLowerCase();
    const matchesStatusText = statusText.includes(q);

    // Match Amount
    const amountStr = String(o.totalAmount || '');
    const matchesAmount = digitsQ.length >= 3 && amountStr.includes(digitsQ);

    const matchesSearch =
      matchesId ||
      matchesName ||
      matchesEmail ||
      matchesPhone ||
      matchesDestination ||
      matchesItems ||
      matchesStatusText ||
      matchesAmount;

    return matchesStatus && matchesSearch;
  });

  const kpis = [
    {
      label: 'TOTAL PIPELINE REVENUE',
      numValue: totalOrderRevenue,
      prefix: 'Rs. ',
      sub: `${orders.length} Total Orders Placed`,
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'ACTION REQUIRED (PENDING)',
      numValue: statusCounts.pending,
      prefix: '',
      sub: statusCounts.pending === 0 ? '✓ All Orders Processed' : '⚡ Awaiting Verification',
      icon: Clock,
      color: 'text-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]',
      ambientGlow: 'bg-amber-500/10',
      cardGlow: 'border-amber-300/80 hover:border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]',
      badgeBg: statusCounts.pending === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: statusCounts.pending === 0 ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      label: 'IN-TRANSIT SHIPMENTS',
      numValue: statusCounts.shipped + statusCounts.processing,
      prefix: '',
      sub: `${statusCounts.shipped} Shipped / ${statusCounts.processing} In Production`,
      icon: Truck,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'DELIVERED & COMPLETED',
      numValue: statusCounts.delivered,
      prefix: '',
      sub: '✓ 100% Fulfilled & Verified',
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
              <span className="hidden lg:inline">FULFILLMENT REGISTRY V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">ORDERS SYNCED</span>
              <span className="hidden lg:inline">100% REAL DATABASE ORDERS SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Fulfillment <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Order Management</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time fulfillment stages, customer WhatsApp hotline, payment validation, and invoice generation.
          </p>
        </div>

        {/* Total Orders Pill */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
            <ShoppingBag size={16} className="text-[#B88E4B]" />
            <div>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-[#1F1612] leading-none font-serif">
                <AnimatedCounter value={orders.length} duration={1.2} />
              </div>
              <span className="text-[8.5px] sm:text-[9.5px] font-bold text-stone-500 block uppercase tracking-wider">Total Recorded</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION) ── */}
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
                {kpi.prefix ? (
                  <span className="text-base sm:text-lg font-bold text-[#8C6D46] mr-1 select-none">{kpi.prefix}</span>
                ) : null}
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

      {/* ── STATUS FILTER PILLS & SEARCH TOOLBAR ── */}
      <div className="bg-white border border-[#E7DDD0] p-3 rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: 'all', label: 'All Orders', count: statusCounts.all },
            { id: 'pending', label: 'Pending', count: statusCounts.pending },
            { id: 'processing', label: 'Processing', count: statusCounts.processing },
            { id: 'shipped', label: 'Shipped', count: statusCounts.shipped },
            { id: 'delivered', label: 'Delivered', count: statusCounts.delivered },
            { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
          ].map((tab) => {
            const isActive = selectedStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-xs'
                    : 'bg-[#FCFAF7] border border-[#E7DDD0] text-stone-600 hover:text-[#221814] hover:border-[#B88E4B]/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white text-stone-500 border border-stone-200'
                }`}>
                  <AnimatedCounter value={tab.count} duration={1.2} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Field Robust Search Bar */}
        <div className="w-full lg:w-80 relative shrink-0">
          <Search size={15} className="text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="admin-orders-search"
            name="orderSearch"
            placeholder="Search Order ID, Client, Email, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-9.5 pl-9.5 pr-8 text-xs focus:border-[#B88E4B] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

      </div>

      {/* ── ORDERS MASTER TABLE ── */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <ShoppingBag size={48} className="mx-auto text-stone-300 mb-3 opacity-60" />
          <h4 className="text-base font-black text-[#221814] font-serif">No Orders Found</h4>
          <p className="text-stone-500 text-xs mt-1">There are no orders matching the search or status filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#E7DDD0] text-[10px] font-black text-[#7A6354] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Order Reference</th>
                  <th className="py-3.5 px-4">Client & Contact Details</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Fulfillment Action</th>
                  <th className="py-3.5 px-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredOrders.map((o) => {
                  const customerName = o.user?.name || o.shippingName || o.shippingInfo?.name || 'Verified Client';
                  const customerEmail = o.user?.email || o.shippingEmail || o.shippingInfo?.email || 'client@fahadali.com';
                  const customerPhone = o.user?.phone || o.shippingPhone || o.shippingInfo?.phone || '';
                  const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
                  const shortId = o.id ? o.id.slice(-8).toUpperCase() : 'ORDER';
                  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${customerName}, regarding your Order #${shortId} from Fahad Ali Interior:`)}` : null;
                  const badge = getStatusBadge(o.status);

                  return (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-[#FCFAF7]/80 transition-colors"
                    >
                      {/* Order Ref */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-black text-xs text-[#1F1612] bg-[#FAF7F2] border border-[#E7DDD0] px-2.5 py-1 rounded-lg">
                          #{shortId}
                        </span>
                        <span className="block text-[10px] font-semibold text-stone-400 mt-1">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Live'}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <p className="font-black text-[#1F1612] text-sm leading-snug font-serif">{customerName}</p>
                        <p className="text-[11px] text-stone-500 font-medium">{customerEmail}</p>
                        {customerPhone && (
                          <p className="text-[10.5px] text-[#8C6239] mt-0.5 flex items-center gap-1 font-bold">
                            <Phone size={11} /> {customerPhone}
                          </p>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-[#1F1612] text-sm sm:text-base">
                          Rs. {formatPrice(Number(o.totalAmount) || 0)}
                        </span>
                        <span className="block text-[10px] font-semibold text-stone-400">
                          {o.items?.length || 1} Item(s)
                        </span>
                      </td>

                      {/* Current Status Pill */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-2xs inline-flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Fulfillment Status Selector (Custom Luxury Select Opening UPWARD) */}
                      <td className="py-3.5 px-4">
                        <LuxurySelect
                          value={(o.status || '').toLowerCase()}
                          onChange={(val) => updateOrderStatus(o.id, val)}
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' },
                          ]}
                          menuClassName="min-w-[150px]"
                          direction="up"
                        />
                      </td>

                      {/* Quick Actions (In-Admin Slip & WhatsApp Only - No Redirect!) */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                              title="Chat with Client on WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FAF0E2] via-[#F8EBD8] to-[#F3E2CB] text-[#7A4B1A] hover:text-[#4A2D0D] hover:border-[#B88E4B] border border-[#B88E4B]/40 transition-all shadow-2xs flex items-center gap-1.5 font-bold text-xs cursor-pointer group"
                            title="View & Print Official Order Slip"
                          >
                            <Printer size={13} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                            <span>Order Slip</span>
                          </button>
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="p-2 rounded-xl bg-[#FAF5EE] text-[#8C6239] hover:bg-[#F3E7D3] border border-[#E2D1BC] transition-colors shadow-2xs cursor-pointer font-bold"
                            title="Quick View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXECUTIVE IN-ADMIN ORDER SLIP MODAL (NO REDIRECT TO APP!) ── */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border-2 border-[#B88E4B]/40 rounded-[24px] p-6 sm:p-7 max-w-xl w-full shadow-[0_20px_60px_rgba(44,30,24,0.25)] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>

              {/* Order Slip Header */}
              <div className="mb-5 pb-4 border-b border-[#EFE8DD]">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6239] bg-[#FAF5EE] border border-[#E2D1BC] px-2.5 py-0.5 rounded-full">
                    Official Executive Order Slip
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${getStatusBadge(selectedOrderDetails.status).bg}`}>
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#221814] font-serif flex items-center gap-2">
                  <span>Order</span>
                  <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent">
                    #{selectedOrderDetails.id?.slice(-8).toUpperCase()}
                  </span>
                </h3>
                <p className="text-stone-500 text-xs mt-0.5">
                  Placed on {selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Live Database'}
                </p>
              </div>

              {/* Client Destination & Contact */}
              <div className="mb-5 bg-[#FCFAF7] p-4 rounded-2xl border border-[#E7DDD0] text-xs space-y-1.5">
                <p className="font-black text-[#221814] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-serif border-b border-stone-200/70 pb-2">
                  <MapPin size={14} className="text-[#B88E4B]" /> Client Delivery Destination
                </p>
                <p className="font-black text-[#1F1612] text-sm">
                  {selectedOrderDetails.shippingName || selectedOrderDetails.shippingInfo?.name || selectedOrderDetails.user?.name || 'Valued Client'}
                </p>
                {(selectedOrderDetails.shippingPhone || selectedOrderDetails.shippingInfo?.phone || selectedOrderDetails.user?.phone) && (
                  <p className="text-[#8C6239] font-bold flex items-center gap-1.5">
                    <Phone size={12} /> {selectedOrderDetails.shippingPhone || selectedOrderDetails.shippingInfo?.phone || selectedOrderDetails.user?.phone}
                  </p>
                )}
                {(selectedOrderDetails.shippingEmail || selectedOrderDetails.shippingInfo?.email || selectedOrderDetails.user?.email) && (
                  <p className="text-stone-500 font-medium">
                    {selectedOrderDetails.shippingEmail || selectedOrderDetails.shippingInfo?.email || selectedOrderDetails.user?.email}
                  </p>
                )}
                <p className="text-stone-700 pt-0.5">
                  {selectedOrderDetails.shippingAddress || selectedOrderDetails.shippingInfo?.address || 'Standard Delivery Address'}
                </p>
                <p className="text-stone-900 font-bold">
                  {[selectedOrderDetails.shippingCity || selectedOrderDetails.shippingInfo?.city, selectedOrderDetails.shippingProvince || selectedOrderDetails.shippingInfo?.province].filter(Boolean).join(', ') || 'Pakistan'}
                </p>
              </div>

              {/* Ordered Items Table */}
              <div className="space-y-2 mb-5 bg-[#FCFAF7] p-4 rounded-2xl border border-[#E7DDD0]">
                <p className="text-xs font-black text-[#221814] uppercase tracking-wider font-serif border-b border-stone-200/70 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#B88E4B]">✦</span> Ordered Furniture Masterpieces
                  </span>
                  <span className="text-stone-400 font-sans font-bold">
                    ({(selectedOrderDetails.items || []).length} items)
                  </span>
                </p>
                {(selectedOrderDetails.items || []).length === 0 ? (
                  <div className="py-2.5 text-xs text-stone-600 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#1F1612]">Custom Bespoke Furniture Commission</p>
                      <p className="text-stone-500 text-[10.5px]">Qty: 1</p>
                    </div>
                    <p className="font-black text-[#1F1612]">
                      Rs. {formatPrice(Number(selectedOrderDetails.totalAmount) || 0)}
                    </p>
                  </div>
                ) : (
                  (selectedOrderDetails.items || []).map((item: any, idx: number) => {
                    const price = Number(item.unitPrice || item.price || 0);
                    const qty = Number(item.quantity || 1);
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-stone-200/50 last:border-0">
                        <div>
                          <p className="font-bold text-[#1F1612]">{item.productName || item.name || item.title || item.product?.name || 'Furniture Item'}</p>
                          <p className="text-stone-500 text-[10.5px]">Qty: {qty} • Rs. {formatPrice(price)} each</p>
                        </div>
                        <p className="font-black text-[#1F1612]">
                          Rs. {formatPrice(price * qty)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Settlement Summary */}
              <div className="mb-5 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC8] space-y-2 text-xs">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Catalogue Subtotal</span>
                  <span className="font-bold text-[#1F1612]">
                    Rs. {formatPrice(Number(selectedOrderDetails.subtotal || selectedOrderDetails.totalAmount || 0))}
                  </span>
                </div>
                {Number(selectedOrderDetails.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Royal Discount Applied</span>
                    <span className="font-bold">- Rs. {formatPrice(Number(selectedOrderDetails.discount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>White-Glove Nationwide Delivery</span>
                  <span className="font-bold text-emerald-700">COMPLIMENTARY (FREE)</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-[#E8DFC8]">
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-600">Total Settlement</span>
                  <span className="text-xl sm:text-2xl font-black text-[#8C6239] font-serif">
                    Rs. {formatPrice(Number(selectedOrderDetails.totalAmount || 0))}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Payment: <strong className="text-stone-800 uppercase">{selectedOrderDetails.paymentMethod?.replace('_', ' ') || 'COD'}</strong></span>
                  <span>Payment Status: <strong className="text-stone-800 uppercase">{selectedOrderDetails.paymentStatus || 'Pending'}</strong></span>
                </div>
              </div>

              {/* In-Admin Actions (NO APP REDIRECT!) */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                {(() => {
                  const phone = selectedOrderDetails.shippingPhone || selectedOrderDetails.shippingInfo?.phone || selectedOrderDetails.user?.phone;
                  const name = selectedOrderDetails.shippingName || selectedOrderDetails.shippingInfo?.name || selectedOrderDetails.user?.name || 'Customer';
                  if (!phone) return null;
                  const cleanPhone = phone.replace(/\D/g, '');
                  const message = encodeURIComponent(`Hi ${name}! Here is your official order slip summary for Order #${selectedOrderDetails.id?.slice(-8).toUpperCase()} from Fahad Ali Interior:\nTotal: Rs. ${formatPrice(selectedOrderDetails.totalAmount || 0)}\nStatus: ${selectedOrderDetails.status}`);
                  return (
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${message}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      title="Send Slip to Customer on WhatsApp"
                    >
                      <MessageSquare size={13} />
                      <span>WhatsApp Slip</span>
                    </a>
                  );
                })()}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] hover:brightness-110 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  title="Print Official Order Slip"
                >
                  <Printer size={14} />
                  <span>Print Slip</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
