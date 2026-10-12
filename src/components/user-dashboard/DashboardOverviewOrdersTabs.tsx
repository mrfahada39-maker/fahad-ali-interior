'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Coins, ClipboardList, ShoppingBag, Search, Package, MessageSquare, Truck, Eye,
} from 'lucide-react';
import { Input } from '@/components/input';
import { renderHeaderBanner, renderKpiGrid, formatPrice } from './dashboard-kpis';

export function DashboardOverviewTab({
  overviewKpis,
  chartMetric,
  setChartMetric,
  totalSpentCalculated,
  orders,
  trajectoryData,
  fulfillmentData,
}: {
  overviewKpis: any[];
  chartMetric: 'REVENUE' | 'COUNT';
  setChartMetric: (m: 'REVENUE' | 'COUNT') => void;
  totalSpentCalculated: number;
  orders: any[];
  trajectoryData: any[];
  fulfillmentData: any[];
}) {
  return (
    <div className="flex-1 flex flex-col gap-3 font-sans pb-2">
      {renderHeaderBanner(
        'V2.4',
        'VIP CLIENT SUITE V2.4',
        'LIVE SYNCED',
        '100% REAL LIVE DATA SYNCED',
        'Fahad Ali Interior',
        '— Client Executive Suite',
        'Real-time bespoke commission tracking, timber seasoning radar, curated wishlist gallery, and direct master artisan concierge.',
        <Link
          href="/shop"
          className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <FileText size={15} />
          <span>Explore Haute Catalog</span>
        </Link>
      )}

      {renderKpiGrid(overviewKpis)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#E7DDD0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#B88E4B] text-xs">✦</span>
                <h3 className="font-serif font-black text-base sm:text-lg text-[#1F1612]">
                  Patronage & Living Trajectory
                </h3>
                <span className="text-[9.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-[#FAF5EE] border border-[#E7DDD0] text-[#8C6239]">
                  REAL TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-[#7A6354] mt-0.5">Real-time living room investment trajectory from database orders</p>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF5EE] p-1 rounded-xl border border-[#E7DDD0] self-start sm:self-auto">
              <button
                onClick={() => setChartMetric('REVENUE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  chartMetric === 'REVENUE' ? 'bg-[#221814] text-white shadow-xs' : 'text-[#7A6354]'
                }`}
              >
                Expenditure (Rs.)
              </button>
              <button
                onClick={() => setChartMetric('COUNT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  chartMetric === 'COUNT' ? 'bg-[#221814] text-white shadow-xs' : 'text-[#7A6354]'
                }`}
              >
                Orders (Qty)
              </button>
            </div>
          </div>

          <div className="h-[260px] w-full pt-1 flex flex-col justify-between">
            <div className="relative w-full h-[205px]">
              {totalSpentCalculated === 0 && (orders || []).length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#E7DDD0] rounded-xl bg-[#FAF5EE]/50">
                  <Coins size={28} className="text-[#C9A24D] mb-2 stroke-[1.5] opacity-80" />
                  <p className="font-serif text-sm font-bold text-[#1F1612]">No living room investments yet</p>
                  <p className="text-[11px] text-[#7A6354] mt-0.5 max-w-xs">Your bespoke acquisition trajectory will track here live once your first piece is commissioned.</p>
                  <Link href="/shop" className="mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8C6239] hover:underline flex items-center gap-1">
                    Browse Haute Catalog ↗
                  </Link>
                </div>
              ) : (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B88E4B" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#FAF7F2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="45" x2="500" y2="45" stroke="#F0E8DD" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#F0E8DD" strokeDasharray="3 3" />
                  <line x1="0" y1="135" x2="500" y2="135" stroke="#F0E8DD" strokeDasharray="3 3" />
                  <path
                    d={`M 0 170 C 80 150, 160 ${chartMetric === 'REVENUE' ? '100' : '110'}, 250 ${chartMetric === 'REVENUE' ? '70' : '90'} C 340 ${chartMetric === 'REVENUE' ? '50' : '60'}, 420 30, 500 20 L 500 180 L 0 180 Z`}
                    fill="url(#goldAreaGrad)"
                  />
                  <path
                    d={`M 0 170 C 80 150, 160 ${chartMetric === 'REVENUE' ? '100' : '110'}, 250 ${chartMetric === 'REVENUE' ? '70' : '90'} C 340 ${chartMetric === 'REVENUE' ? '50' : '60'}, 420 30, 500 20`}
                    fill="none"
                    stroke="#B88E4B"
                    strokeWidth={3}
                  />
                  <circle cx="250" cy={chartMetric === 'REVENUE' ? 70 : 90} r="4" fill="#B88E4B" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="500" cy="20" r="5" fill="#221814" stroke="#B88E4B" strokeWidth="2" />
                </svg>
              )}
            </div>
            <div className="flex justify-between text-[11px] text-[#9E8A78] font-mono px-1">
              {trajectoryData.map((d: any, i: number) => (
                <span key={i}>{d.name}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E7DDD0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#B88E4B] text-xs">✦</span>
                <h3 className="font-serif font-black text-base sm:text-lg text-[#1F1612]">
                  Fulfillment Stream
                </h3>
              </div>
              <p className="text-[11px] text-[#7A6354] mt-0.5">Click any stage to inspect in Orders Registry</p>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              Live Orders ↗
            </span>
          </div>

          <div className="h-[260px] w-full pt-1 flex flex-col justify-between">
            {(orders || []).length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#E7DDD0] rounded-xl bg-[#FAF5EE]/50">
                <ClipboardList size={28} className="text-[#C9A24D] mb-2 stroke-[1.5] opacity-80" />
                <p className="font-serif text-sm font-bold text-[#1F1612]">No active commissions</p>
                <p className="text-[11px] text-[#7A6354] mt-0.5 max-w-xs">Artisan stages (Pending, Processing, Shipped, Delivered) will update live here upon order placement.</p>
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full flex items-end justify-between gap-3 px-2">
                  {fulfillmentData.map((d: any, i: number) => {
                    const maxCount = Math.max(...fulfillmentData.map((item: any) => item.count || 0), 1);
                    const heightPercent = d.count === 0 ? 4 : Math.max(8, Math.round(((d.count || 0) / maxCount) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[10px] font-bold text-[#7A6354] opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.count}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 shadow-2xs group-hover:brightness-110 ${d.count === 0 ? 'bg-stone-200 opacity-40' : 'bg-gradient-to-t from-[#B88E4B] to-[#D4AF37]'}`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-[#9E8A78] font-bold px-1 border-t border-[#F0E8DD] pt-2">
                  {fulfillmentData.map((d: any, i: number) => (
                    <span key={i} className="text-center flex-1 truncate">{d.stage}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardOrdersTab({
  ordersKpis,
  orders,
  orderFilter,
  setOrderFilter,
  searchQuery,
  setSearchQuery,
  filteredOrders,
  session,
  profile,
  profileForm,
  setTrackingOrder,
  setSelectedOrderDetails,
}: {
  ordersKpis: any[];
  orders: any[];
  orderFilter: 'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED';
  setOrderFilter: (f: 'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredOrders: any[];
  session: any;
  profile: any;
  profileForm: { name: string; phone: string; bio: string };
  setTrackingOrder: (o: any) => void;
  setSelectedOrderDetails: (o: any) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ FULFILLMENT REGISTRY',
        '✦ FULFILLMENT REGISTRY V2.4',
        'LIVE SYNCED',
        '100% REAL DATABASE ORDERS SYNCED',
        'Fulfillment',
        '& Bespoke Commissions',
        'Real-time fulfillment stages, customer WhatsApp hotline, timber seasoning validation, and invoice generation.',
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white font-serif font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shrink-0 active:scale-95"
        >
          <ShoppingBag size={14} />
          <span>Explore Haute Catalog</span>
        </Link>
      )}

      {renderKpiGrid(ordersKpis)}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-[#E7DDD0] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'PENDING', label: 'Pending', count: orders.filter((o) => !o.status || String(o.status).toUpperCase() === 'PENDING').length },
            { id: 'SHIPPED', label: 'In-Transit', count: orders.filter((o) => ['SHIPPED', 'PROCESSING'].includes(String(o.status || '').toUpperCase())).length },
            { id: 'DELIVERED', label: 'Delivered', count: orders.filter((o) => String(o.status || '').toUpperCase() === 'DELIVERED').length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setOrderFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                orderFilter === f.id
                  ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-sm ring-1 ring-[#B88E4B]/40'
                  : 'bg-[#FAF5EE]/70 hover:bg-[#FAF5EE] border border-[#E7DDD0]/80 text-[#7A6354] hover:text-[#1F1612]'
              }`}
            >
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${orderFilter === f.id ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-[#7A6354]'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Client Name, Email, Phone..."
            className="pl-9 pr-8 rounded-xl border-[#E7DDD0] bg-white text-xs h-9 focus:ring-[#B88E4B] placeholder:text-stone-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-[#E7DDD0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7DDD0] bg-gradient-to-r from-[#FAF5EE] via-white to-[#FAF5EE] text-[10px] font-black text-[#7A6354] uppercase tracking-wider font-mono">
                <th className="py-3.5 px-5">ORDER REFERENCE</th>
                <th className="py-3.5 px-5">CLIENT & CONTACT DETAILS</th>
                <th className="py-3.5 px-5">TOTAL AMOUNT</th>
                <th className="py-3.5 px-5">CRAFTSMANSHIP STAGE</th>
                <th className="py-3.5 px-5">FULFILLMENT</th>
                <th className="py-3.5 px-5 text-right">QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DDD0]/80 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Package size={32} className="mx-auto mb-2 text-[#B88E4B]/50" />
                    <p className="font-serif font-black text-sm text-[#1F1612]">No Bespoke Orders Match Filter</p>
                    <p className="text-xs text-stone-500 mt-1">Try resetting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isDelivered = String(order.status || '').toUpperCase() === 'DELIVERED';
                  const isShipped = String(order.status || '').toUpperCase() === 'SHIPPED';
                  const orderRef = `#${(order.id || 'ORDER').slice(-8).toUpperCase()}`;
                  const clientName = order.customerName || session?.user?.name || profile?.name || 'VIP Client';
                  const clientEmail = order.customerEmail || session?.user?.email || profile?.email || '';
                  const clientPhone = order.customerPhone || profileForm.phone || '';

                  return (
                    <tr key={order.id || idx} className="hover:bg-[#FAF5EE]/50 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#B88E4B] animate-pulse" />
                          <div>
                            <span className="font-mono font-black text-xs text-[#1F1612] tracking-wide block group-hover:text-[#B88E4B] transition-colors">
                              {orderRef}
                            </span>
                            <span className="text-[10px] text-stone-400 mt-0.5 block font-mono">
                              {new Date(order.createdAt || Date.now()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] text-white flex items-center justify-center font-serif font-black text-xs shrink-0 shadow-2xs">
                            {clientName[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-[#1F1612] block">{clientName}</span>
                            {clientEmail && (
                              <span className="text-[11px] text-stone-500 block truncate max-w-[180px]">{clientEmail}</span>
                            )}
                            {clientPhone && (
                              <a
                                href={`https://wa.me/${clientPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10.5px] font-mono font-bold text-[#8C6239] hover:underline flex items-center gap-1 mt-0.5"
                              >
                                📞 {clientPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div>
                          <span className="font-serif font-black text-sm sm:text-base text-[#1F1612] block">
                            Rs. {formatPrice(order.totalAmount || 0)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 mt-0.5">
                            <Package size={10} className="text-[#B88E4B]" />
                            {(order.items || []).length} Bespoke Item(s)
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="space-y-1.5 min-w-[140px]">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isShipped
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? 'bg-emerald-500' : isShipped ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`} />
                            {order.status || 'PENDING'}
                          </span>

                          <div className="w-full bg-[#E7DDD0]/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDelivered
                                  ? 'bg-emerald-500 w-full'
                                  : isShipped
                                  ? 'bg-blue-500 w-3/4'
                                  : 'bg-[#B88E4B] w-1/3 animate-pulse'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs ${
                          isDelivered
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isShipped
                            ? 'bg-sky-50 border-sky-200 text-sky-800'
                            : 'bg-[#FAF5EE] border-[#E7DDD0] text-[#1F1612]'
                        }`}>
                          {isDelivered ? 'Delivered ✓' : isShipped ? 'In-Transit 🚚' : 'Pending ⏳'}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/923207006110?text=Hello%20Fahad%20Ali%20Interior%20Team,%20inquiring%20about%20Bespoke%20Order%20${orderRef}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="WhatsApp Master Hotline"
                          >
                            <MessageSquare size={14} />
                          </a>

                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#8C6239] hover:bg-[#B88E4B] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="Track Live Crafting Stages"
                          >
                            <Truck size={14} />
                          </button>

                          <button
                            onClick={() => setSelectedOrderDetails(order)}
                            className="w-8 h-8 rounded-xl bg-white border border-[#E7DDD0] text-stone-700 hover:text-[#B88E4B] hover:border-[#B88E4B] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                            title="View Invoice & Specs"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
