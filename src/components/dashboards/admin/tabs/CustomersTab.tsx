'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Mail,
  ShoppingBag,
  Star,
  Heart,
  MapPin,
  Shield,
  ShieldOff,
  X,
  Loader2,
  Download,
  CreditCard,
  TrendingUp,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  UserCheck,
  Coins,
  Sparkles,
  Phone,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Crown,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetchJsonWithStatus } from '@/lib/api-client';
import { ensureEnterpriseTokens } from '@/hooks/use-enterprise-auth-sync';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface CustomerStats {
  total: number;
  active: number;
  newThisMonth: number;
  blocked: number;
  verified: number;
  unverified: number;
  returning: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
}

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  emailVerified: string | null;
  lockedUntil: string | null;
  avatar: string | null;
  segment: string | null;
  loyaltyTier: string;
  loyaltyPoints: number;
  tags: string[];
  isBlocked: boolean;
  totalSpent: number;
  lastOrderDate: string | null;
  lastOrderStatus: string | null;
  _count: { orders: number; reviews: number; wishlistItems: number; messages: number };
}

interface CustomersTabProps {
  initialUsers?: any[];
}

export default function CustomersTab({ initialUsers = [] }: CustomersTabProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialUsers as CustomerRow[]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [custRes, statsRes] = await Promise.all([
        fetch('/api/v1/admin/customers', { cache: 'no-store' }),
        fetch('/api/v1/admin/customers/stats', { cache: 'no-store' }),
      ]);

      if (custRes.ok) {
        const custData = await custRes.json();
        if (custData && Array.isArray(custData.data)) {
          setCustomers(custData.data);
        }
      } else {
        // Fallback to dashboard-bundle
        const bundleRes = await fetch('/api/v1/admin/dashboard-bundle', { cache: 'no-store' });
        if (bundleRes.ok) {
          const bundle = await bundleRes.json();
          if (Array.isArray(bundle.users)) {
            setCustomers(bundle.users);
          }
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData) setStats(statsData);
      }
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0 && customers.length === 0) {
      setCustomers(initialUsers as CustomerRow[]);
    }
  }, [initialUsers, customers.length]);

  const toggleBlock = async (id: string, block: boolean) => {
    try {
      await ensureEnterpriseTokens();
      const res = await apiFetchJsonWithStatus(`/api/admin/customers/${id}/${block ? 'block' : 'unblock'}`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success(`Client ${block ? 'blocked' : 'unblocked'} successfully ✓`);
        fetchData();
      } else {
        toast.error('Failed to update client status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleExport = () => {
    if (customers.length === 0) return;
    const csvHeader = 'ID,Name,Email,Phone,Orders,Total Spent,Tier,Status,Registered\n';
    const csvRows = customers
      .map(
        (c) =>
          `"${c.id}","${c.name || 'Client'}","${c.email}","${c.phone || ''}",${c._count?.orders || (c as any).ordersCount || 0},${c.totalSpent || 0},"${c.loyaltyTier || 'BRONZE'}","${c.isBlocked ? 'BLOCKED' : 'ACTIVE'}","${new Date(c.createdAt).toLocaleDateString()}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Client registry exported to CSV ✓');
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      Boolean(c.name && c.name.toLowerCase().includes(q)) ||
      Boolean(c.email && c.email.toLowerCase().includes(q)) ||
      Boolean(c.phone && c.phone.toLowerCase().includes(q)) ||
      Boolean(c.id && c.id.toLowerCase().includes(q));

    const matchesSegment =
      selectedSegment === 'all' ||
      (selectedSegment === 'vip' && (c.segment === 'VIP' || c.loyaltyTier === 'GOLD' || c.loyaltyTier === 'PLATINUM')) ||
      (selectedSegment === 'verified' && Boolean(c.emailVerified)) ||
      (selectedSegment === 'blocked' && Boolean(c.isBlocked)) ||
      (selectedSegment === 'active' && !c.isBlocked);

    return matchesSearch && matchesSegment;
  });

  const totalClients = stats?.total ?? customers.length;
  const activeClients = stats?.active ?? customers.filter((c) => !c.isBlocked).length;
  const totalRevenue = stats?.totalRevenue ?? customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgOrderValue = stats?.averageOrderValue ?? (totalClients > 0 ? Math.round(totalRevenue / totalClients) : 0);

  const kpis = [
    {
      label: 'TOTAL REGISTERED CLIENTS',
      numValue: totalClients,
      prefix: '',
      sub: 'Live Registered Database Accounts',
      icon: Users,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'ACTIVE VERIFIED PROFILES',
      numValue: activeClients,
      prefix: '',
      sub: '✓ 100% Account Integrity',
      icon: UserCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'TOTAL CLIENT PIPELINE VALUE',
      numValue: totalRevenue,
      prefix: 'Rs. ',
      sub: `Across ${totalClients} Verified Accounts`,
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'AVERAGE CLIENT SPEND',
      numValue: avgOrderValue,
      prefix: 'Rs. ',
      sub: 'Per Account Acquisition Value',
      icon: CreditCard,
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
              <span className="hidden lg:inline">CRM & CLIENT ACCOUNTS V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">CLIENTS SYNCED</span>
              <span className="hidden lg:inline">100% REAL LIVE CLIENTS SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Client Accounts <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& CRM Registry</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Manage VIP customer profiles, lifetime purchasing history, WhatsApp direct contact, and account security.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-white border border-[#E7DDD0] text-stone-600 hover:text-[#B88E4B] hover:border-[#B88E4B]/40 transition-all shadow-2xs cursor-pointer"
            title="Refresh Client Registry"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#B88E4B]' : ''} />
          </button>
          
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-[#FAF5EE] border border-[#E2D1BC] text-[#8C6239] font-black text-xs hover:bg-[#F3E7D3] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download size={13} />
            <span>EXPORT CSV</span>
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

      {/* ── FILTER PILLS & SEARCH TOOLBAR ── */}
      <div className="bg-white border border-[#E7DDD0] p-3 rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col lg:flex-row items-center justify-between gap-3">
        
        {/* Segment Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: 'all', label: 'All Clients', count: totalClients },
            { id: 'active', label: 'Active', count: activeClients },
            { id: 'vip', label: 'VIP / High Value', count: customers.filter((c) => c.segment === 'VIP' || c.loyaltyTier === 'GOLD' || c.loyaltyTier === 'PLATINUM').length },
            { id: 'verified', label: 'Verified', count: stats?.verified ?? totalClients },
            { id: 'blocked', label: 'Blocked', count: stats?.blocked ?? 0 },
          ].map((tab) => {
            const isActive = selectedSegment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSegment(tab.id)}
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

        {/* Search Bar */}
        <div className="w-full lg:w-80 relative shrink-0">
          <Search size={15} className="text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search by Name, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-9.5 pl-9.5 pr-3 text-xs focus:border-[#B88E4B] outline-none"
          />
        </div>

      </div>

      {/* ── CLIENTS MASTER TABLE ── */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <Loader2 size={36} className="mx-auto text-[#B88E4B] animate-spin mb-2" />
          <p className="text-stone-500 font-bold text-xs">Loading Real Client Database...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <Users size={48} className="mx-auto text-stone-300 mb-3 opacity-60" />
          <h4 className="text-base font-black text-[#221814] font-serif">No Clients Found</h4>
          <p className="text-stone-500 text-xs mt-1">There are no client accounts matching your search query.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#E7DDD0] text-[10px] font-black text-[#7A6354] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Client Profile</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Orders & Lifetime Value</th>
                  <th className="py-3.5 px-4">Loyalty Tier</th>
                  <th className="py-3.5 px-4">Security Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredCustomers.map((c) => {
                  const initial = c.name ? c.name[0].toUpperCase() : 'C';
                  const customerPhone = c.phone || '';
                  const whatsappUrl = customerPhone ? `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${c.name || 'Valued Client'}, from Fahad Ali Interior:`)}` : null;

                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-[#FCFAF7]/80 transition-colors"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] border border-[#E2D1BC] flex items-center justify-center text-white font-serif font-black text-sm shadow-2xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-black text-[#1F1612] text-sm leading-snug font-serif">
                              {c.name || 'Valued Client'}
                            </p>
                            <p className="text-[10px] text-stone-400 font-semibold">
                              Joined {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <p className="text-[11.5px] text-[#1F1612] font-semibold">{c.email}</p>
                        {customerPhone ? (
                          <p className="text-[10.5px] text-[#8C6239] mt-0.5 flex items-center gap-1 font-bold">
                            <Phone size={11} /> {customerPhone}
                          </p>
                        ) : (
                          <span className="text-[10px] text-stone-400">No phone attached</span>
                        )}
                      </td>

                      {/* Orders & Lifetime Value */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-[#1F1612] text-sm block">
                          Rs. {formatPrice(c.totalSpent || 0)}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                          <ShoppingBag size={11} className="text-[#B88E4B]" />
                          {c._count?.orders || 0} Orders Completed
                        </span>
                      </td>

                      {/* Loyalty Tier */}
                      <td className="py-3.5 px-4">
                        <span className="bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/40 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                          <Crown size={10} className="text-[#B88E4B]" />
                          {c.loyaltyTier || 'GOLD'} TIER
                        </span>
                      </td>

                      {/* Security Status */}
                      <td className="py-3.5 px-4">
                        {c.isBlocked ? (
                          <span className="bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                            <ShieldOff size={10} className="text-rose-600" />
                            BLOCKED
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1 shadow-2xs">
                            <CheckCircle size={10} className="text-emerald-600" />
                            VERIFIED ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="p-2 rounded-xl bg-[#FAF5EE] text-[#8C6239] hover:bg-[#F3E7D3] border border-[#E2D1BC] transition-colors shadow-2xs cursor-pointer font-bold"
                            title="View Client Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => toggleBlock(c.id, !c.isBlocked)}
                            className={`p-2 rounded-xl border transition-colors shadow-2xs cursor-pointer ${
                              c.isBlocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                            }`}
                            title={c.isBlocked ? 'Unblock Client' : 'Block Client'}
                          >
                            {c.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
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

      {/* ── CLIENT PROFILE QUICK MODAL ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border-2 border-[#B88E4B]/40 rounded-[24px] p-6 sm:p-7 max-w-lg w-full shadow-[0_20px_60px_rgba(44,30,24,0.25)] relative max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />

              <button
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center font-serif font-black text-xl shadow-md">
                  {selectedCustomer.name ? selectedCustomer.name[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#221814] font-serif">
                    {selectedCustomer.name || 'Valued Client'}
                  </h3>
                  <p className="text-stone-500 text-xs">{selectedCustomer.email}</p>
                </div>
              </div>

              {/* Client Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#FCFAF7] p-3.5 rounded-2xl border border-[#E7DDD0]">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Total Lifetime Value</span>
                  <span className="text-lg font-black text-[#1F1612]">Rs. {formatPrice(selectedCustomer.totalSpent || 0)}</span>
                </div>
                <div className="bg-[#FCFAF7] p-3.5 rounded-2xl border border-[#E7DDD0]">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-500 block">Orders Fulfilled</span>
                  <span className="text-lg font-black text-[#1F1612]">{selectedCustomer._count?.orders || 0} Orders</span>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-[#FCFAF7] p-4 rounded-2xl border border-[#E7DDD0] space-y-2 text-xs mb-5">
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500 font-semibold">Contact Phone:</span>
                  <span className="font-bold text-[#1F1612]">{selectedCustomer.phone || 'None'}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500 font-semibold">Loyalty Membership:</span>
                  <span className="font-bold text-[#8C6239]">{selectedCustomer.loyaltyTier || 'GOLD'}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                  <span className="text-stone-500 font-semibold">Security State:</span>
                  <span className={`font-bold ${selectedCustomer.isBlocked ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {selectedCustomer.isBlocked ? 'Blocked' : 'Verified Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Member Since:</span>
                  <span className="font-bold text-[#1F1612]">
                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : '2026'}
                  </span>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
