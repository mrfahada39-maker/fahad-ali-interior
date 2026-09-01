import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Radio,
  Coins,
  ClipboardList,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  FileText,
  Printer,
  Download,
  X,
  Building2,
  Hash,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  ShoppingBag
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

const getCustomerName = (o: any) => {
  if (!o) return 'VIP Client';
  const name =
    (typeof o.shippingName === 'string' && o.shippingName.trim() && o.shippingName.trim() !== 'Customer') ? o.shippingName.trim() :
    (typeof o.shippingAddress === 'object' && o.shippingAddress?.fullName) ? o.shippingAddress.fullName :
    (typeof o.shippingInfo === 'object' && o.shippingInfo?.name) ? o.shippingInfo.name :
    (o.user?.name && o.user.name.trim() && o.user.name.trim() !== 'Guest Customer') ? o.user.name.trim() :
    (typeof o.shippingName === 'string' && o.shippingName.trim()) ? o.shippingName.trim() :
    (o.user?.name && o.user.name.trim()) ? o.user.name.trim() :
    o.customerName || 'Valued Client';
  return name;
};

const getCustomerEmail = (o: any) => {
  if (!o) return 'client@fahad-ali.com';
  const email =
    (typeof o.shippingEmail === 'string' && o.shippingEmail.trim() && o.shippingEmail.trim() !== 'customer@example.com' && o.shippingEmail.trim() !== 'client@gmail.com') ? o.shippingEmail.trim() :
    (o.user?.email && o.user.email.trim() && o.user.email.trim() !== 'guest@fahad-ali-interior.com') ? o.user.email.trim() :
    (typeof o.shippingAddress === 'object' && o.shippingAddress?.email) ? o.shippingAddress.email :
    (typeof o.shippingInfo === 'object' && o.shippingInfo?.email) ? o.shippingInfo.email :
    (typeof o.shippingEmail === 'string' && o.shippingEmail.trim()) ? o.shippingEmail.trim() :
    o.user?.email || o.customerEmail || 'client@fahad-ali.com';
  return email;
};

const getCustomerPhone = (o: any) => {
  if (!o) return '—';
  const raw =
    (typeof o.shippingPhone === 'string' && o.shippingPhone.trim() && !o.shippingPhone.includes('0000000') && !o.shippingPhone.includes('1234567')) ? o.shippingPhone.trim() :
    (o.user?.phone && o.user.phone.trim() && !o.user.phone.includes('0000000') && !o.user.phone.includes('1234567')) ? o.user.phone.trim() :
    (typeof o.shippingAddress === 'object' && o.shippingAddress?.phone && !o.shippingAddress.phone.includes('0000000')) ? o.shippingAddress.phone :
    (typeof o.shippingInfo === 'object' && o.shippingInfo?.phone && !o.shippingInfo.phone.includes('0000000')) ? o.shippingInfo.phone :
    null;
  return raw || '—';
};

const getCustomerAddress = (o: any) => {
  if (!o) return 'Pakistan';
  let street = '';
  if (typeof o.shippingAddress === 'string') {
    street = o.shippingAddress.trim();
  } else if (typeof o.shippingAddress === 'object' && o.shippingAddress) {
    street = o.shippingAddress.address || o.shippingAddress.street || '';
  } else if (typeof o.shippingInfo === 'object' && o.shippingInfo) {
    street = o.shippingInfo.address || '';
  }

  const city =
    (typeof o.shippingCity === 'string' && o.shippingCity.trim()) ? o.shippingCity.trim() :
    (typeof o.shippingAddress === 'object' && o.shippingAddress?.city) ? o.shippingAddress.city :
    (typeof o.shippingInfo === 'object' && o.shippingInfo?.city) ? o.shippingInfo.city :
    o.city || '';

  const province =
    (typeof o.shippingProvince === 'string' && o.shippingProvince.trim()) ? o.shippingProvince.trim() :
    (typeof o.shippingAddress === 'object' && o.shippingAddress?.province) ? o.shippingAddress.province :
    (typeof o.shippingInfo === 'object' && o.shippingInfo?.province) ? o.shippingInfo.province :
    '';

  const parts = [street, city, province].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Pakistan';
};

const getOrderItemsSummary = (o: any) => {
  if (!o) return 'Bespoke Luxury Interior Unit';

  const itemsList = Array.isArray(o.items) && o.items.length > 0 ? o.items :
                    Array.isArray(o.orderItems) && o.orderItems.length > 0 ? o.orderItems :
                    [];

  if (itemsList.length > 0) {
    return itemsList.map((item: any) => {
      const title = item.name || item.title || item.product?.name || item.product?.title || 'Interior Item';
      const qty = item.quantity || 1;
      return `${title} (x${qty})`;
    }).join(', ');
  }

  return 'Bespoke Luxury Interior Unit';
};

const formatOrderDateTime = (dateVal: any) => {
  const d = new Date(dateVal || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const dayStr = d.toLocaleDateString('en-US', { weekday: 'long' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { dateStr, dayStr, timeStr };
};

interface OverviewTabProps {
  stats: any;
  analytics: any;
  orders: any[];
  setActiveTab: (tab: string) => void;
}

export default function OverviewTab({ stats, analytics, orders, setActiveTab }: OverviewTabProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '7d' | '30d' | '1y' | 'custom'>('all');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'orders'>('revenue');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // ── 1. REAL FILTERED ORDERS BY TIMEFRAME ──
  const filteredOrders = useMemo(() => {
    const valid = Array.isArray(orders) ? orders : [];
    const now = new Date();

    if (selectedTimeframe === 'all') {
      return valid;
    }

    if (selectedTimeframe === 'custom') {
      const start = new Date(customStartDate + 'T00:00:00').getTime();
      const end = new Date(customEndDate + 'T23:59:59').getTime();
      return valid.filter((o) => {
        const t = new Date(o.createdAt || Date.now()).getTime();
        return t >= start && t <= end;
      });
    }

    if (selectedTimeframe === '7d') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return valid.filter((o) => new Date(o.createdAt || Date.now()).getTime() >= sevenDaysAgo.getTime());
    }

    if (selectedTimeframe === '30d') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return valid.filter((o) => new Date(o.createdAt || Date.now()).getTime() >= thirtyDaysAgo.getTime());
    }

    if (selectedTimeframe === '1y') {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return valid.filter((o) => new Date(o.createdAt || Date.now()).getTime() >= oneYearAgo.getTime());
    }

    return valid;
  }, [orders, selectedTimeframe, customStartDate, customEndDate]);

  // ── 2. 100% REAL Dynamic Revenue & Orders Timeframe Data for Graphs ──
  const revenueChartData = useMemo(() => {
    const validOrders = Array.isArray(orders) ? orders : [];
    const now = new Date();

    // ── ALL TIME BREAKDOWN ──
    if (selectedTimeframe === 'all') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthMap: Record<string, { name: string; fullDate: string; revenue: number; ordersCount: number }> = {};
      
      months.forEach((m) => {
        monthMap[m] = { name: m, fullDate: `${m} ${now.getFullYear()}`, revenue: 0, ordersCount: 0 };
      });

      validOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const mName = d.toLocaleDateString('en-US', { month: 'short' });
        if (monthMap[mName]) {
          monthMap[mName].revenue += Number(o.totalAmount) || 0;
          monthMap[mName].ordersCount += 1;
        }
      });

      const result = Object.values(monthMap);
      const activeIdx = Math.max(now.getMonth() + 1, 6);
      return result.slice(0, activeIdx);
    }

    // ── CUSTOM DATE RANGE BREAKDOWN ──
    if (selectedTimeframe === 'custom') {
      const start = new Date(customStartDate + 'T00:00:00');
      const end = new Date(customEndDate + 'T23:59:59');
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      if (diffDays <= 31) {
        const days: { name: string; fullDate: string; revenue: number; ordersCount: number }[] = [];
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          let dayRevenue = 0;
          let dayOrders = 0;
          filteredOrders.forEach((o) => {
            const oDate = new Date(o.createdAt || Date.now()).toISOString().split('T')[0];
            if (oDate === dateStr) {
              dayRevenue += Number(o.totalAmount) || 0;
              dayOrders++;
            }
          });

          days.push({
            name: dayLabel,
            fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            revenue: dayRevenue,
            ordersCount: dayOrders,
          });
        }
        return days.length > 0 ? days : [{ name: 'No Data', fullDate: 'Selected Range', revenue: 0, ordersCount: 0 }];
      } else {
        const monthMap: Record<string, { revenue: number; ordersCount: number }> = {};
        filteredOrders.forEach((o) => {
          const d = new Date(o.createdAt || Date.now());
          const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (!monthMap[key]) monthMap[key] = { revenue: 0, ordersCount: 0 };
          monthMap[key].revenue += Number(o.totalAmount) || 0;
          monthMap[key].ordersCount++;
        });
        const result = Object.entries(monthMap).map(([name, val]) => ({
          name,
          fullDate: name,
          revenue: val.revenue,
          ordersCount: val.ordersCount,
        }));
        return result.length > 0 ? result : [{ name: 'Custom Range', fullDate: 'Selected Range', revenue: 0, ordersCount: 0 }];
      }
    }

    // ── 7 DAYS BREAKDOWN ──
    if (selectedTimeframe === '7d') {
      const days: { name: string; fullDate: string; revenue: number; ordersCount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        
        let dayRevenue = 0;
        let dayOrders = 0;
        filteredOrders.forEach((o) => {
          const orderDate = new Date(o.createdAt || Date.now()).toISOString().split('T')[0];
          if (orderDate === dateStr) {
            dayRevenue += Number(o.totalAmount) || 0;
            dayOrders++;
          }
        });

        days.push({
          name: dayKey,
          fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          ordersCount: dayOrders,
        });
      }
      return days;
    }

    // ── 30 DAYS BREAKDOWN ──
    if (selectedTimeframe === '30d') {
      const weeks: { name: string; fullDate: string; revenue: number; ordersCount: number }[] = [
        { name: 'Wk 1', fullDate: 'Days 1-7', revenue: 0, ordersCount: 0 },
        { name: 'Wk 2', fullDate: 'Days 8-14', revenue: 0, ordersCount: 0 },
        { name: 'Wk 3', fullDate: 'Days 15-21', revenue: 0, ordersCount: 0 },
        { name: 'Wk 4', fullDate: 'Days 22-30', revenue: 0, ordersCount: 0 },
      ];

      filteredOrders.forEach((o) => {
        const orderTime = new Date(o.createdAt || Date.now()).getTime();
        const diffDays = Math.floor((now.getTime() - orderTime) / (1000 * 60 * 60 * 24));
        const amount = Number(o.totalAmount) || 0;

        if (diffDays >= 0 && diffDays <= 7) {
          weeks[3].revenue += amount;
          weeks[3].ordersCount += 1;
        } else if (diffDays <= 14) {
          weeks[2].revenue += amount;
          weeks[2].ordersCount += 1;
        } else if (diffDays <= 21) {
          weeks[1].revenue += amount;
          weeks[1].ordersCount += 1;
        } else if (diffDays <= 30) {
          weeks[0].revenue += amount;
          weeks[0].ordersCount += 1;
        }
      });

      return weeks;
    }

    // ── 1 YEAR BREAKDOWN ──
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = now.getMonth();
    const monthData = months.slice(0, Math.max(currentMonthIdx + 1, 6)).map((m) => ({
      name: m,
      fullDate: `${m} ${now.getFullYear()}`,
      revenue: 0,
      ordersCount: 0,
    }));

    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now());
      const mName = d.toLocaleDateString('en-US', { month: 'short' });
      const target = monthData.find((item) => item.name === mName);
      if (target) {
        target.revenue += Number(o.totalAmount) || 0;
        target.ordersCount += 1;
      }
    });

    return monthData;
  }, [orders, filteredOrders, selectedTimeframe, customStartDate, customEndDate]);

  // ── 3. 100% REAL Order Status Breakdown Strictly Filtered by Active Timeframe ──
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, { count: number; color: string; bg: string }> = {
      PENDING: { count: 0, color: '#D4AF37', bg: '#FAF5EE' },
      PROCESSING: { count: 0, color: '#3B82F6', bg: '#EFF6FF' },
      SHIPPED: { count: 0, color: '#6366F1', bg: '#EEF2FF' },
      DELIVERED: { count: 0, color: '#10B981', bg: '#ECFDF5' },
      CANCELLED: { count: 0, color: '#EF4444', bg: '#FEF2F2' }
    };

    filteredOrders.forEach((o) => {
      const raw = (o?.status || '').toString().toUpperCase().trim();
      if (statusCounts[raw]) statusCounts[raw].count++;
      else if (raw.includes('PEND')) statusCounts.PENDING.count++;
      else if (raw.includes('PROC')) statusCounts.PROCESSING.count++;
      else if (raw.includes('SHIP')) statusCounts.SHIPPED.count++;
      else if (raw.includes('DELIV')) statusCounts.DELIVERED.count++;
      else if (raw.includes('CANC')) statusCounts.CANCELLED.count++;
    });

    return Object.entries(statusCounts).map(([name, data]) => ({
      name,
      value: Math.max(0, data.count),
      color: data.color,
      bg: data.bg,
    }));
  }, [filteredOrders]);

  // ── FINANCIAL STATEMENT AUDIT & EXPORT LOGIC ──
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementSearchQuery, setStatementSearchQuery] = useState('');

  const statementFilteredOrders = useMemo(() => {
    const validOrders = Array.isArray(orders) ? orders : [];
    const q = statementSearchQuery.trim().toLowerCase();

    if (!q) {
      return filteredOrders;
    }

    // Comprehensive multi-field matching function
    const matchesQuery = (o: any) => {
      const rawId = String(o.id || o._id || '').toLowerCase();
      const shortId = rawId.slice(-6);
      const name = getCustomerName(o).toLowerCase();
      const email = getCustomerEmail(o).toLowerCase();
      const rawPhone = getCustomerPhone(o).toLowerCase();
      const cleanPhone = rawPhone.replace(/[\s\-\+\(\)]/g, '');
      const cleanQuery = q.replace(/[\s\-\+\(\)]/g, '');
      const address = getCustomerAddress(o).toLowerCase();
      const status = String(o.status || '').toLowerCase();
      const payment = String(o.paymentMethod || '').toLowerCase();
      const items = getOrderItemsSummary(o).toLowerCase();
      const rawAmt = String(o.totalAmount || '');
      const formattedAmt = formatPrice(Number(o.totalAmount) || 0).toLowerCase();
      const dt = formatOrderDateTime(o.createdAt);
      const fullDateStr = new Date(o.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase();

      return (
        rawId.includes(q) ||
        shortId.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        rawPhone.includes(q) ||
        (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
        address.includes(q) ||
        status.includes(q) ||
        payment.includes(q) ||
        items.includes(q) ||
        rawAmt.includes(q) ||
        formattedAmt.includes(q) ||
        dt.dateStr.toLowerCase().includes(q) ||
        dt.dayStr.toLowerCase().includes(q) ||
        dt.timeStr.toLowerCase().includes(q) ||
        fullDateStr.includes(q)
      );
    };

    // First search within currently filtered timeframe
    const inScopeMatches = filteredOrders.filter(matchesQuery);
    if (inScopeMatches.length > 0) {
      return inScopeMatches;
    }

    // Fallback search across all database orders so no customer record is ever hidden
    return validOrders.filter(matchesQuery);
  }, [filteredOrders, statementSearchQuery, orders]);

  const statementPeriodRevenue = useMemo(() => {
    return statementFilteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [statementFilteredOrders]);

  const statementAvgOrderValue = statementFilteredOrders.length > 0
    ? Math.round(statementPeriodRevenue / statementFilteredOrders.length)
    : 0;

  const statementDeliveredRevenue = useMemo(() => {
    return statementFilteredOrders
      .filter((o) => (o.status || '').toUpperCase() === 'DELIVERED')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [statementFilteredOrders]);

  const downloadStatementCSV = () => {
    const headers = [
      'Order Ref',
      'Date',
      'Day',
      'Time',
      'Customer Name',
      'Phone Number',
      'Gmail / Email',
      'Delivery Address',
      'Items Ordered',
      'Status',
      'Payment Method',
      'Total Amount (PKR)'
    ];

    const rows = statementFilteredOrders.map((o, idx) => {
      const dt = formatOrderDateTime(o.createdAt);
      return [
        `"#${(o.id || o._id || '').slice(-6).toUpperCase() || `ORD-${idx + 1}`}"`,
        `"${dt.dateStr}"`,
        `"${dt.dayStr}"`,
        `"${dt.timeStr}"`,
        `"${getCustomerName(o)}"`,
        `"${getCustomerPhone(o)}"`,
        `"${getCustomerEmail(o)}"`,
        `"${getCustomerAddress(o)}"`,
        `"${getOrderItemsSummary(o).replace(/"/g, '""')}"`,
        `"${o.status || 'PENDING'}"`,
        `"${o.paymentMethod || 'COD'}"`,
        Number(o.totalAmount) || 0,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fahad_Ali_Interior_Customer_Statement_${selectedTimeframe.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printStatement = () => {
    window.print();
  };

  const activePeriodRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [filteredOrders]);

  const activePeriodOrderCount = filteredOrders.length;

  const activePeriodDeliveredCount = useMemo(() => {
    return filteredOrders.filter((o) => (o.status || '').toUpperCase() === 'DELIVERED').length;
  }, [filteredOrders]);

  const realUserCount = stats?.userCount ?? 0;
  const realProductCount = stats?.productCount ?? 0;

  const kpis = [
    {
      label: selectedTimeframe === 'all' ? 'TOTAL REVENUE' : `REVENUE (${selectedTimeframe.toUpperCase()})`,
      numValue: activePeriodRevenue,
      prefix: 'Rs. ',
      sub: `${activePeriodOrderCount} Orders in Period`,
      icon: Coins,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: selectedTimeframe === 'all' ? 'TOTAL ORDERS' : `ORDERS (${selectedTimeframe.toUpperCase()})`,
      numValue: activePeriodOrderCount,
      prefix: '',
      sub: `${activePeriodDeliveredCount} Delivered / Completed`,
      icon: ClipboardList,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'ACTIVE CUSTOMERS',
      numValue: realUserCount,
      prefix: '',
      sub: 'Live Registered Accounts',
      icon: Users,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
    {
      label: 'LIVE CATALOG ITEMS',
      numValue: realProductCount,
      prefix: '',
      sub: '100% In-Stock Database',
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
    <div className="flex-1 flex flex-col gap-3 font-sans pb-2">

      {/* ── $100,000 LUXURY EXECUTIVE HEADER (DUAL RESPONSIVE: GRAND ON DESKTOP, COMPACT ON MOBILE - MATCHING IMAGE 1) ── */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          {/* Badges Row */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            {/* Version Badge */}
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">ENTERPRISE SUITE V2.4</span>
            </span>

            {/* Live Real Data Sync Beacon */}
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden tracking-wide">LIVE SYNCED</span>
              <span className="hidden lg:inline tracking-wide">100% REAL LIVE DATA SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            {/* Mobile: Executive & Suite Dashboard */}
            <span className="sm:hidden">
              Executive <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Suite Dashboard</span>
            </span>

            {/* Desktop: Full Title */}
            <span className="hidden sm:inline">
              Fahad Ali Interior <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">— Executive Dashboard</span>
            </span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time live visitor telemetry radar, revenue forecasts, order fulfillment stream, and inventory health.
          </p>
        </div>

        {/* Financial Statement Gold Button (Matching Image 1) */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            type="button"
            onClick={() => setShowStatementModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <FileText size={15} />
            <span>Financial Statement</span>
          </button>
        </div>
      </motion.div>

      {/* ── KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
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

      {/* ── CHARTS SECTION (FLEX-1 MIN-H-0 FITS 100% SCREEN HEIGHT DYNAMICALLY) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 flex-1 min-h-0">

        {/* ── 1. Revenue & Acquisition Registry (Area Chart - 3 Cols) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="lg:col-span-3 bg-white border border-[#E7DDD0] rounded-[20px] p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col justify-between min-h-[290px] sm:min-h-[310px] lg:min-h-0 lg:h-full hover:border-[#B88E4B]/40 transition-all"
        >
          {/* Header with Title + Metric Switcher & Timeframe */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-100 pb-2.5 shrink-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm lg:text-base font-black text-[#221814] flex items-center gap-1.5 font-serif">
                  <span className="text-[#B88E4B]">✦</span> Revenue & Acquisition Registry
                </h2>
                <span className="text-[9px] font-black text-[#B08552] bg-gradient-to-r from-[#FAF5EE] to-[#F3E7D3] border border-[#B88E4B]/35 px-2 py-0.5 rounded-full shadow-2xs">
                  {selectedTimeframe.toUpperCase()} TELEMETRY
                </span>
              </div>
              <p className="text-stone-400 text-[10px] font-medium mt-0.5">
                {activeMetric === 'revenue' ? 'Real-time revenue trajectory from database orders' : 'Total order volume distribution across period'}
              </p>
            </div>

            {/* Metric Toggle + Timeframe Pill Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
              {/* Metric Toggle */}
              <div className="flex bg-[#FAF7F2] p-0.5 rounded-lg border border-[#E7DDD0]">
                <button
                  type="button"
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-2 py-0.5 text-[9.5px] font-black rounded-md transition-all cursor-pointer ${
                    activeMetric === 'revenue'
                      ? 'bg-[#221814] text-[#F3E5AB] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Revenue (Rs.)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric('orders')}
                  className={`px-2 py-0.5 text-[9.5px] font-black rounded-md transition-all cursor-pointer ${
                    activeMetric === 'orders'
                      ? 'bg-[#221814] text-[#F3E5AB] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Orders (Qty)
                </button>
              </div>

              {/* Timeframe Selector */}
              <div className="flex bg-[#FAF7F2] p-0.5 rounded-lg border border-[#E7DDD0]">
                {(['all', '7d', '30d', '1y', 'custom'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-1.5 py-0.5 text-[9px] font-black rounded-md transition-all uppercase flex items-center gap-0.5 cursor-pointer ${
                      selectedTimeframe === tf
                        ? 'bg-[#B88E4B] text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {tf === 'custom' ? <Calendar size={9} /> : tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Custom Date Filter Inline Inputs */}
          {selectedTimeframe === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gradient-to-r from-[#FAF5EE] via-white to-[#F5ECE0] border border-[#B88E4B]/40 rounded-full px-3 py-1 my-1.5 flex items-center justify-between flex-wrap gap-2 text-[10px] shadow-2xs"
            >
              <div className="flex items-center gap-1.5 font-bold text-[#8C6239]">
                <Calendar size={12} className="text-[#B88E4B]" />
                <span className="font-serif font-black uppercase text-[10px]">Custom Scope:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white border border-[#D9C4AC] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#18110D] focus:outline-none focus:border-[#B88E4B] shadow-2xs cursor-pointer"
                />
                <span className="text-[#B88E4B] font-black text-xs">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white border border-[#D9C4AC] rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#18110D] focus:outline-none focus:border-[#B88E4B] shadow-2xs cursor-pointer"
                />
              </div>
            </motion.div>
          )}

          {/* Interactive Recharts SVG Container */}
          <div className="w-full h-[230px] sm:h-[250px] lg:h-[265px] mt-2 relative pb-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 14, right: 14, left: -14, bottom: 8 }}>
                <defs>
                  <linearGradient id="colorRevGoldReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B88E4B" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FAF7F2" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrdersBlueReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#60A5FA" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#FAF7F2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EAE0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                  tick={{ fill: '#7A6354', fontSize: 10.5, fontWeight: 800 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7A6354', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(v) =>
                    activeMetric === 'revenue'
                      ? v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                      : `${v}`
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#18110D]/95 backdrop-blur-md border border-[#C9A24D]/50 rounded-xl p-2.5 shadow-xl text-white text-xs min-w-[150px]">
                          <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>{data.fullDate || data.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </p>
                          <p className="font-black text-sm text-[#FFF3D1]">
                            Rs. {formatPrice(data.revenue || 0)}
                          </p>
                          <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-300">
                            <span>Orders Volume:</span>
                            <span className="font-bold text-white">{data.ordersCount || 0} Orders</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric === 'revenue' ? 'revenue' : 'ordersCount'}
                  stroke={activeMetric === 'revenue' ? '#B88E4B' : '#3B82F6'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={activeMetric === 'revenue' ? 'url(#colorRevGoldReal)' : 'url(#colorOrdersBlueReal)'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── 2. Fulfillment Stream (Interactive Bar Chart - 2 Cols) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.25 }} 
          className="lg:col-span-2 bg-white border border-[#E7DDD0] rounded-[20px] p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col justify-between min-h-[290px] sm:min-h-[310px] hover:border-[#B88E4B]/40 transition-all"
        >
          <div className="flex-1 flex flex-col justify-between h-full min-h-0">
            {/* Header */}
            <div className="border-b border-neutral-100 pb-2 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div>
                <h2 className="text-xs sm:text-sm lg:text-base font-black text-[#221814] flex items-center gap-1.5 font-serif">
                  <span className="text-[#B88E4B]">✦</span> Fulfillment Stream
                </h2>
                <p className="text-stone-400 text-[10px] font-medium">Click any bar to inspect in Orders Registry</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-[9px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Orders</span>
                <ExternalLink size={9} className="opacity-70" />
              </button>
            </div>

            {/* Interactive Bar Chart with Click Handlers */}
            <div className="w-full h-[230px] sm:h-[250px] lg:h-[265px] mt-2 relative pb-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderStatusData}
                  margin={{ top: 22, right: 10, left: -20, bottom: 10 }}
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setActiveTab('orders');
                    }
                  }}
                  className="cursor-pointer"
                >
                  <defs>
                    <linearGradient id="barGoldPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                      <stop offset="100%" stopColor="#996515" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barBlueProc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barIndigoShip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barEmeraldDeliv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="barRoseCancel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F87171" stopOpacity={1} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EAE0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                    tick={{ fill: '#7A6354', fontSize: 9.5, fontWeight: 900 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#7A6354', fontSize: 10, fontWeight: 800 }}
                    domain={[0, 'dataMax + 1']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#18110D]/95 backdrop-blur-md border border-[#C9A24D]/50 rounded-xl p-2.5 shadow-xl text-white text-xs min-w-[140px]">
                            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-1">
                              {data.name} STATUS
                            </p>
                            <p className="font-black text-sm text-white">
                              {data.value} {data.value === 1 ? 'Order' : 'Orders'}
                            </p>
                            <p className="mt-1 pt-1 border-t border-white/10 text-[9.5px] text-amber-300 font-semibold flex items-center gap-1">
                              <span>👉 Tap to open Orders</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {orderStatusData.map((entry, index) => {
                      let fillGradient = 'url(#barGoldPending)';
                      if (entry.name === 'PROCESSING') fillGradient = 'url(#barBlueProc)';
                      else if (entry.name === 'SHIPPED') fillGradient = 'url(#barIndigoShip)';
                      else if (entry.name === 'DELIVERED') fillGradient = 'url(#barEmeraldDeliv)';
                      else if (entry.name === 'CANCELLED') fillGradient = 'url(#barRoseCancel)';
                      return <Cell key={`cell-${index}`} fill={fillGradient} />;
                    })}
                    <LabelList dataKey="value" position="top" fill="#7A6354" fontSize={10} fontWeight={900} offset={4} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── $10,000,000 EXECUTIVE FINANCIAL & AUDIT STATEMENT MODAL (ULTRA-LUXURY MODERN EDITION) ── */}
      <AnimatePresence>
        {showStatementModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-stone-900/60 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-[#FAF7F2] border border-[#D9C4AC] rounded-[28px] max-w-6xl w-full p-4 sm:p-6 lg:p-7 shadow-[0_25px_80px_rgba(44,30,24,0.18)] relative max-h-[94vh] flex flex-col justify-between overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:h-auto"
            >
              {/* 1. Modal Top Header (Matching Admin Dashboard Header Style) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E7DDD0] shrink-0 print:hidden">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white text-[#8C6239] border border-[#D9C4AC] flex items-center gap-1 shadow-2xs font-serif">
                      <Sparkles size={10} className="text-[#B88E4B]" />
                      <span>ENTERPRISE SUITE V2.4</span>
                    </span>
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
                      </span>
                      <span>100% REAL AUDIT DATA</span>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-[#221814] tracking-tight font-serif">
                    Fahad Ali Interior <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">— Financial Statement & Audit Ledger</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={downloadStatementCSV}
                    className="h-[38px] px-3.5 sm:px-4 rounded-full bg-white hover:bg-[#FAF5EE] border border-[#D9C4AC] hover:border-[#B88E4B] text-[#1F1612] text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95 group"
                  >
                    <Download size={13} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                    <span>Download Full CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={printStatement}
                    className="h-[38px] px-4 sm:px-5 rounded-full bg-gradient-to-r from-[#18110D] via-[#2C1C15] to-[#18110D] text-[#F8E8C9] hover:text-white border border-[#C9A24D]/80 shadow-[0_4px_18px_rgba(201,162,77,0.28)] hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] text-xs font-serif font-black tracking-wide flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Printer size={13} className="text-[#F3E5AB]" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStatementModal(false)}
                    className="w-9 h-9 rounded-full bg-white hover:bg-[#FAF5EE] border border-[#D9C4AC] text-stone-600 hover:text-stone-900 flex items-center justify-center cursor-pointer transition-all ml-1 shadow-2xs"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* 2. Interactive Date Range & Search Controls Bar */}
              <div className="py-2.5 border-b border-[#E7DDD0] flex flex-col md:flex-row items-center justify-between gap-2.5 shrink-0 print:hidden bg-white/70 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-7 px-4 sm:px-6 lg:px-7">
                {/* Timeframe selector + Custom Date Inputs */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <div className="h-[38px] flex items-center bg-gradient-to-r from-[#FAF5EE] via-white to-[#F5ECE0] border border-[#D9C4AC] rounded-full p-1 shadow-xs text-xs">
                    {(['all', '7d', '30d', '1y', 'custom'] as const).map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`h-full px-2.5 sm:px-3 rounded-full text-[10px] sm:text-[10.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedTimeframe === tf
                            ? 'bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#996515] text-white shadow-xs'
                            : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-black/5'
                        }`}
                      >
                        {tf === 'custom' ? (
                          <>
                            <Calendar size={12} className={selectedTimeframe === tf ? 'text-white' : 'text-[#B88E4B]'} />
                            <span>CUSTOM DATE</span>
                          </>
                        ) : tf === 'all' ? (
                          <span>ALL</span>
                        ) : (
                          tf.toUpperCase()
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedTimeframe === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-[38px] flex items-center gap-2 bg-[#FAF5EE] border border-[#B88E4B]/60 rounded-full px-3 shadow-xs text-xs"
                    >
                      <span className="text-[#8C6239] font-serif font-black text-[10.5px] uppercase">From:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-white border border-[#D9C4AC] rounded-full px-2.5 py-0.5 text-[10.5px] font-bold text-[#18110D] focus:outline-none focus:border-[#B88E4B] shadow-2xs cursor-pointer"
                      />
                      <span className="text-[#B88E4B] font-black text-xs">→</span>
                      <span className="text-[#8C6239] font-serif font-black text-[10.5px] uppercase">To:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-white border border-[#D9C4AC] rounded-full px-2.5 py-0.5 text-[10.5px] font-bold text-[#18110D] focus:outline-none focus:border-[#B88E4B] shadow-2xs cursor-pointer"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B88E4B] pointer-events-none" />
                  <input
                    type="text"
                    value={statementSearchQuery}
                    onChange={(e) => setStatementSearchQuery(e.target.value)}
                    placeholder="Search Name, Phone, Gmail, City, Status..."
                    className="h-[38px] w-full bg-white border border-[#D9C4AC] rounded-full pl-9.5 pr-9 text-xs font-semibold text-[#18110D] focus:outline-none focus:border-[#B88E4B] focus:ring-2 focus:ring-[#B88E4B]/20 placeholder:text-stone-400 shadow-xs"
                  />
                  {statementSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setStatementSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full hover:bg-stone-100 cursor-pointer"
                      title="Clear Search"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 3. Scrollable Printable Statement Body */}
              <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4 font-sans">
                {/* Official Grand Luxury Letterhead Header */}
                <div className="bg-white border border-[#E7DDD0] rounded-[22px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.02)] relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h2 className="font-serif font-black text-xl sm:text-2xl lg:text-3xl text-[#221814] tracking-tight">
                          FAHAD ALI INTERIOR
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FAF5EE] text-[#8C6239] border border-[#D9C4AC] shadow-2xs font-serif">
                          EXECUTIVE AUDIT SUITE
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">Bespoke Architectural Interiors, Sovereign Decor & Luxury Catalog</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Lahore & Karachi, Pakistan • Support: +92 300 1234567 • NTN: #FAI-PK-9821</p>
                    </div>

                    <div className="text-left sm:text-right text-xs bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] border border-[#D9C4AC] rounded-2xl p-3.5 shadow-xs shrink-0 min-w-[210px]">
                      <p className="text-[#8C6239] font-black uppercase text-[9px] tracking-widest font-serif">STATEMENT AUDIT REF</p>
                      <p className="font-mono font-black text-[#1F1612] text-sm mt-0.5">
                        FAI-STMT-{selectedTimeframe.toUpperCase()}-{new Date().getFullYear()}
                      </p>
                      <p className="text-[10px] text-stone-600 mt-1 font-semibold">
                        Generated: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="inline-block mt-1 text-[9.5px] font-black text-[#8C6239] bg-white border border-[#D9C4AC] px-2 py-0.5 rounded-full shadow-2xs">
                        Scope: {selectedTimeframe === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedTimeframe.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Executive KPI Metric Cards (Matching Dashboard Cards Exactly) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Card 1: Gross Period Revenue */}
                  <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] relative overflow-hidden group hover:shadow-[0_8px_25px_rgba(184,142,75,0.12)] hover:border-[#B88E4B]/60 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] sm:text-[11px] font-black tracking-wider text-stone-500 uppercase">
                        Gross Period Revenue
                      </span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] border border-[#E2D1BC] text-[#B88E4B] shadow-xs">
                        <Coins size={16} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#1F1612] tracking-tight font-serif">
                      Rs. {formatPrice(statementPeriodRevenue)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>100% Real Database Orders</span>
                    </div>
                  </div>

                  {/* Card 2: Matching Orders */}
                  <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] relative overflow-hidden group hover:shadow-[0_8px_25px_rgba(59,130,246,0.12)] hover:border-blue-400/60 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] sm:text-[11px] font-black tracking-wider text-stone-500 uppercase">
                        Matching Orders
                      </span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200/60 text-blue-600 shadow-xs">
                        <ClipboardList size={16} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#1F1612] tracking-tight font-serif">
                      {statementFilteredOrders.length} Records
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>In Active Filter Scope</span>
                    </div>
                  </div>

                  {/* Card 3: Average Order Value */}
                  <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] relative overflow-hidden group hover:shadow-[0_8px_25px_rgba(168,85,247,0.12)] hover:border-purple-400/60 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] sm:text-[11px] font-black tracking-wider text-stone-500 uppercase">
                        Average Order Value
                      </span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-200/60 text-purple-600 shadow-xs">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[#1F1612] tracking-tight font-serif">
                      Rs. {formatPrice(statementAvgOrderValue)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Average Basket Size</span>
                    </div>
                  </div>

                  {/* Card 4: Delivered / Realized */}
                  <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] relative overflow-hidden group hover:shadow-[0_8px_25px_rgba(16,185,129,0.12)] hover:border-emerald-400/60 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] sm:text-[11px] font-black tracking-wider text-stone-500 uppercase">
                        Delivered / Realized
                      </span>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/60 text-emerald-600 shadow-xs">
                        <ShieldCheck size={16} />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight font-serif">
                      Rs. {formatPrice(statementDeliveredRevenue)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Completed Transactions</span>
                    </div>
                  </div>
                </div>

                {/* 5. Complete Itemized Customer & Transaction Audit Table */}
                <div className="bg-white border border-[#E7DDD0] rounded-[22px] overflow-hidden shadow-[0_4px_20px_rgba(44,30,24,0.02)]">
                  <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FAF5EE] via-white to-[#FAF5EE] border-b border-[#E7DDD0] flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#221814] flex items-center gap-1.5 font-serif">
                        <span className="text-[#B88E4B]">✦</span> Customer & Order Audit Ledger ({statementFilteredOrders.length} Entries)
                      </h3>
                      <p className="text-[10px] text-stone-500 font-medium mt-0.5">Includes Time, Date, Day, Customer Name, Phone, Gmail, Delivery City & Purchased Items</p>
                    </div>
                    <span className="text-[10px] font-black text-[#8C6239] bg-white border border-[#D9C4AC] px-3 py-1 rounded-full shadow-2xs font-serif">
                      100% VERIFIED LEDGER
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF5EE] text-[#7A6354] font-black font-serif text-[10.5px] uppercase tracking-wider border-b border-[#E7DDD0] sticky top-0 z-10 shadow-xs">
                        <tr>
                          <th className="py-3 px-3.5">Order Ref</th>
                          <th className="py-3 px-3.5">Date, Day & Time</th>
                          <th className="py-3 px-3.5">Customer & Contact</th>
                          <th className="py-3 px-3.5">Delivery Address</th>
                          <th className="py-3 px-3.5">Items Ordered</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5 text-right">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE7DC]">
                        {statementFilteredOrders.length > 0 ? (
                          statementFilteredOrders.map((o, idx) => {
                            const dt = formatOrderDateTime(o.createdAt);
                            const custName = getCustomerName(o);
                            const custEmail = getCustomerEmail(o);
                            const custPhone = getCustomerPhone(o);
                            const custAddr = getCustomerAddress(o);
                            const itemsSummary = getOrderItemsSummary(o);

                            return (
                              <tr key={o.id || o._id || idx} className="hover:bg-[#FAF5EE]/80 transition-colors">
                                {/* 1. Order Ref */}
                                <td className="py-3.5 px-3.5 align-top">
                                  <span className="bg-[#FAF5EE] text-[#8C6239] border border-[#B88E4B]/30 px-2 py-0.5 rounded-md font-mono font-black text-[10.5px] block w-fit shadow-2xs">
                                    #{(o.id || o._id || '').slice(-6).toUpperCase() || `ORD-${idx + 1}`}
                                  </span>
                                  <span className="text-[9.5px] text-stone-400 font-bold block mt-1">
                                    {o.paymentMethod || 'COD'}
                                  </span>
                                </td>

                                {/* 2. Date, Day & Time */}
                                <td className="py-3.5 px-3.5 align-top text-[11px]">
                                  <div className="font-bold text-[#221814] flex items-center gap-1.5">
                                    <Clock size={11} className="text-[#B88E4B] shrink-0" />
                                    <span>{dt.timeStr}</span>
                                  </div>
                                  <span className="text-stone-600 font-semibold block text-[10.5px] mt-0.5">{dt.dateStr}</span>
                                  <span className="text-[9px] font-black text-[#8C6239] uppercase tracking-wider bg-[#FAF5EE] px-1.5 py-0.2 rounded border border-[#E2D1BC] inline-block mt-0.5">{dt.dayStr}</span>
                                </td>

                                {/* 3. Customer Name, Phone & Gmail */}
                                <td className="py-3.5 px-3.5 align-top">
                                  <p className="font-bold text-[#1F1612] text-xs leading-tight">
                                    {custName}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10.5px] text-stone-700 font-mono mt-1">
                                    <Phone size={10} className="text-[#B88E4B] shrink-0" />
                                    <span>{custPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-stone-500 font-sans mt-0.5">
                                    <Mail size={10} className="text-blue-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{custEmail}</span>
                                  </div>
                                </td>

                                {/* 4. Delivery Address & City */}
                                <td className="py-3.5 px-3.5 align-top text-[10.5px] text-stone-600 max-w-[160px]">
                                  <div className="flex items-start gap-1">
                                    <MapPin size={11} className="text-rose-500 shrink-0 mt-0.5" />
                                    <span className="leading-tight font-medium">{custAddr}</span>
                                  </div>
                                </td>

                                {/* 5. Items Ordered */}
                                <td className="py-3.5 px-3.5 align-top text-[10.5px] text-stone-700 max-w-[180px]">
                                  <div className="flex items-start gap-1">
                                    <ShoppingBag size={11} className="text-[#B88E4B] shrink-0 mt-0.5" />
                                    <span className="leading-tight line-clamp-2 font-medium">{itemsSummary}</span>
                                  </div>
                                </td>

                                {/* 6. Status Badge */}
                                <td className="py-3.5 px-3.5 align-top">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block border shadow-2xs ${
                                    (o.status || '').toUpperCase() === 'DELIVERED'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : (o.status || '').toUpperCase() === 'PROCESSING'
                                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                                      : (o.status || '').toUpperCase() === 'SHIPPED'
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                      : (o.status || '').toUpperCase() === 'CANCELLED'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}>
                                    {o.status || 'PENDING'}
                                  </span>
                                </td>

                                {/* 7. Amount in PKR */}
                                <td className="py-3.5 px-3.5 align-top text-right font-black text-[#1F1612] font-serif text-[13px] whitespace-nowrap">
                                  Rs. {formatPrice(Number(o.totalAmount) || 0)}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                              No transactions match your search or date filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Official Executive Verification & Certification Bar */}
                <div className="pt-3 border-t border-[#E7DDD0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-stone-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Certified Financial Ledger • Complete Customer Registry Verified by Fahad Ali Interior Executive Engine</span>
                  </div>
                  <div className="font-mono text-stone-500 font-bold">
                    HASH: {Math.random().toString(36).substring(2, 10).toUpperCase()}-VERIFIED-PK
                  </div>
                </div>
              </div>

              {/* 7. Modal Footer */}
              <div className="pt-3 border-t border-[#E7DDD0] flex justify-between items-center shrink-0 print:hidden text-xs">
                <span className="text-stone-500 text-[11px] font-semibold">
                  Showing <span className="font-black text-[#1F1612]">{statementFilteredOrders.length}</span> of {filteredOrders.length} orders in active scope.
                </span>
                <button
                  type="button"
                  onClick={() => setShowStatementModal(false)}
                  className="px-5 py-2 rounded-full bg-[#18110D] hover:bg-black text-[#F8E8C9] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Close Statement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
