'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Loader2, Sparkles, ChevronRight, Clock, Truck, CheckCircle2, XCircle, Search, ArrowRight, ShoppingBag, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetchJsonWithStatus, clearEnterpriseTokens } from '@/lib/api-client';
import { ensureEnterpriseTokens } from '@/hooks/use-enterprise-auth-sync';
import { resolveImageUrl } from '@/lib/images';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'delivered':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-serif font-black uppercase tracking-wider border border-emerald-300/80 shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Delivered
        </span>
      );
    case 'shipped':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-serif font-black uppercase tracking-wider border border-purple-300/80 shadow-2xs">
          <Truck size={13} className="text-purple-600" />
          Dispatched
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-serif font-black uppercase tracking-wider border border-blue-300/80 shadow-2xs">
          <Package size={13} className="text-blue-600" />
          Crafting
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-serif font-black uppercase tracking-wider border border-rose-300/80 shadow-2xs">
          <XCircle size={13} className="text-rose-600" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-serif font-black uppercase tracking-wider border border-amber-300/80 shadow-2xs">
          <Clock size={13} className="text-amber-600" />
          Pending Approval
        </span>
      );
  }
};

export default function OrdersPageClient() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        let hasToken = await ensureEnterpriseTokens();
        if (!hasToken) {
          toast.error('Please sign in to view your royal orders.');
          return;
        }

        let result = await apiFetchJsonWithStatus<any>('/api/user/orders');

        if (!result.ok && (result.status === 401 || result.status === 403)) {
          clearEnterpriseTokens();
          hasToken = await ensureEnterpriseTokens(true);
          if (hasToken) {
            result = await apiFetchJsonWithStatus('/api/user/orders');
          }
        }

        if (result.ok && result.data) {
          setOrders(Array.isArray(result.data) ? result.data : []);
        } else {
          // Fallback to /api/v1/orders
          const fallbackRes = await apiFetchJsonWithStatus<any>('/api/v1/orders');
          if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
            setOrders(fallbackRes.data);
          }
        }
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const s = (order.status || '').toLowerCase();
      if (filterTab !== 'all' && s !== filterTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = String(order.id || '').toLowerCase().includes(q);
        const nameMatch = String(order.shippingName || '').toLowerCase().includes(q);
        const itemMatch = Array.isArray(order.items) && order.items.some((i: any) => String(i.name || '').toLowerCase().includes(q));
        return idMatch || nameMatch || itemMatch;
      }
      return true;
    });
  }, [orders, filterTab, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2px] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <div className="w-full h-full rounded-2xl bg-[#1A0E07] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#FFEAA0] animate-spin" />
          </div>
        </div>
        <p className="font-serif text-sm font-bold text-[#8C6239] uppercase tracking-widest">
          Loading Royal Order Archive...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-16 px-4 sm:px-6 relative overflow-hidden font-sans select-none">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FFEAA0]/20 via-[#C9A96E]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-3.5">
            <Sparkles size={14} className="text-[#B88E4B]" />
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#8C6239] via-[#B88E4B] to-[#8C6239] bg-clip-text text-transparent">
              ROYAL CLIENT ARCHIVE
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#221814] tracking-tight mb-2">
            My Order <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">History</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#5C483E] font-medium max-w-lg mx-auto">
            Track real-time master craftsman progress, courier dispatches, and download certified tax invoices for your luxury suites.
          </p>
        </motion.div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Tab Filters */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-center md:justify-start">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'processing', label: 'In Crafting' },
              { id: 'shipped', label: 'Dispatched' },
              { id: 'delivered', label: 'Delivered' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-serif uppercase tracking-wider transition-all cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-bold border border-[#D4AF37] shadow-xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#5C483E] font-medium border border-[#E8DFC8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6239]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Product..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white/90 border border-[#E8DFC8] rounded-xl focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-[#221814]"
            />
          </div>
        </div>

        {/* Orders List or Empty State */}
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 bg-white/80 backdrop-blur-sm rounded-3xl border-[1.5px] border-[#E8DFC8] shadow-xs max-w-xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FAF5EE] border border-[#D4AF37]/60 flex items-center justify-center text-[#8C6239] mx-auto mb-4 shadow-xs">
              <ShoppingBag size={28} strokeWidth={1.8} />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#221814] mb-2">No Orders in this Section</h3>
            <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed mb-6">
              {searchQuery ? `No orders matched your search query "${searchQuery}".` : 'You haven\'t placed any furniture orders in this category yet.'}
            </p>
            <Link
              href="/shop"
              prefetch={true}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md active:scale-95"
            >
              <Sparkles size={14} />
              <span>Explore Haute Collection</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order: any, idx: number) => {
              const displayId = order.id ? (order.id.startsWith('order_') ? order.id.slice(6, 14) : order.id.slice(-8)).toUpperCase() : 'N/A';
              const rawItems = Array.isArray(order.items) ? order.items : [];
              const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white/90 backdrop-blur-md rounded-3xl border-[1.5px] border-[#E8DFC8] hover:border-[#D4AF37] p-5 sm:p-7 shadow-xs hover:shadow-[0_12px_35px_rgba(212,175,55,0.14)] transition-all"
                >
                  {/* Top Bar: Order ID, Date, Status, Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EFE8DD]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-base sm:text-lg text-[#221814]">
                          Order #{displayId}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#8C6239] bg-[#FAF5EE] px-2 py-0.5 rounded border border-[#E8DFC8]">
                          {order.paymentMethod || 'COD'}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A6354] mt-0.5 font-medium">
                        Placed on {orderDate} • Delivery to {order.shippingCity || 'Pakistan'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#8C6239] block">
                          Grand Total
                        </span>
                        <span className="font-serif text-base sm:text-lg font-black text-[#221814]">
                          PKR {formatPrice(Number(order.totalAmount || order.subtotal || 0))}
                        </span>
                      </div>
                      <div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>

                  {/* Product Items Thumbnails */}
                  <div className="py-4 space-y-3">
                    {rawItems.map((item: any, iIdx: number) => {
                      const itemImg = resolveImageUrl(item.image || item.product?.image);
                      return (
                        <div key={item.id || iIdx} className="flex items-center justify-between gap-3 bg-[#FAF7F2]/80 rounded-2xl p-3 border border-[#EFE8DD]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-200 border border-[#E8DFC8] shrink-0">
                              <Image
                                src={itemImg}
                                alt={item.name || 'Furniture'}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#221814] truncate">
                                {item.name || item.product?.name || 'Custom Handcrafted Furniture'}
                              </h4>
                              <p className="text-[11px] text-[#7A6354] mt-0.5">
                                Qty: <span className="font-bold text-[#221814]">{item.quantity || 1}</span> • 100% Solid Seasoned Sheesham
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-serif font-bold text-xs sm:text-sm text-[#8C6239]">
                              PKR {formatPrice(Number(item.price || 0) * (item.quantity || 1))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EFE8DD]">
                    <span className="text-[11px] font-medium text-[#7A6354]">
                      10-Year Structural Guarantee Included
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye size={13} />
                        <span>Track Order Live</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
