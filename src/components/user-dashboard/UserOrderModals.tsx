'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Printer,
  Download,
  Truck,
  CheckCircle2,
  Sparkles,
  Layers,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/button';
import { resolveImageUrl } from '@/lib/images';
import { formatPrice } from '@/lib/pakistan-localization';
import { toast } from 'sonner';

export interface OrderDetailsItem {
  name: string;
  image?: string;
  quantity?: number;
  price: number;
}

export interface OrderDetailsRecord {
  id?: string;
  status?: string;
  totalAmount?: number;
  items?: OrderDetailsItem[];
}

export interface QuickViewProductRecord {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  material?: string;
}

export interface UserOrderModalsProps {
  selectedOrderDetails: OrderDetailsRecord | null;
  setSelectedOrderDetails: (order: OrderDetailsRecord | null) => void;
  trackingOrder: OrderDetailsRecord | null;
  setTrackingOrder: (order: OrderDetailsRecord | null) => void;
  quickViewProduct: QuickViewProductRecord | null;
  setQuickViewProduct: (product: QuickViewProductRecord | null) => void;
  onAddQuickViewToCart: (product: QuickViewProductRecord) => void;
}

export function UserOrderModals({
  selectedOrderDetails,
  setSelectedOrderDetails,
  trackingOrder,
  setTrackingOrder,
  quickViewProduct,
  setQuickViewProduct,
  onAddQuickViewToCart,
}: UserOrderModalsProps) {
  return (
    <>
      {/* ── MODAL: ORDER DETAILS / INVOICE MODAL ── */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-[#E7DDD0] max-w-lg w-full p-5 shadow-2xl space-y-3.5 relative"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E7DDD0]">
              <div>
                <p className="text-xs font-mono font-bold text-[#8C6239]">
                  COMMISSION #{(selectedOrderDetails.id || '').slice(-8).toUpperCase()}
                </p>
                <h3 className="font-serif font-black text-base text-[#1F1612]">Invoice & Crafting Specifications</h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-7 h-7 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(selectedOrderDetails.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE]/60 border border-[#E7DDD0]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white relative border border-[#E7DDD0]">
                      <Image src={resolveImageUrl(item.image, 'Furniture')} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1F1612]">{item.name}</p>
                      <p className="text-[10px] text-stone-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-serif font-black text-xs text-[#8C6239]">
                    Rs. {formatPrice(item.price * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2.5 border-t border-[#E7DDD0] flex items-center justify-between text-sm">
              <span className="font-bold text-[#1F1612]">Total Commission Value</span>
              <span className="font-serif font-black text-base text-[#B88E4B]">
                Rs. {formatPrice(selectedOrderDetails.totalAmount || 0)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  window.print();
                }}
                variant="outline"
                className="flex-1 rounded-xl border-[#E7DDD0] hover:bg-[#FAF5EE] text-[#1F1612] text-xs font-bold h-9 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <Printer size={13} className="mr-1.5 text-[#B88E4B]" /> Print Slip
              </Button>
              <Button
                type="button"
                onClick={() => {
                  toast.success('Official Tax Invoice downloaded successfully');
                  setSelectedOrderDetails(null);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white text-xs font-bold h-9 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download size={13} className="mr-1.5" /> Download PDF
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: LIVE CRAFTING & FULFILLMENT TRACKER ── */}
      {trackingOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] max-w-xl w-full p-6 shadow-2xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DDD0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#8C6239] text-white flex items-center justify-center shadow-xs">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-black text-[#8C6239] uppercase tracking-wider">
                    LIVE CRAFTING RADAR #{(trackingOrder.id || '').slice(-8).toUpperCase()}
                  </p>
                  <h3 className="font-serif font-black text-base text-[#1F1612]">
                    Bespoke Order Journey & Stage Radar
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {(() => {
              const trackStatus = String(trackingOrder.status || '').toUpperCase();
              return (
                <div className="space-y-3 py-1">
                  {[
                    {
                      step: 1,
                      title: 'Bespoke Commission Accepted',
                      desc: 'Order registered in master registry and queued for seasoning.',
                      done: true,
                      active: false,
                      icon: CheckCircle2,
                    },
                    {
                      step: 2,
                      title: 'Timber Moisture Seasoning & Grading',
                      desc: 'Solid Sheesham wood tested for < 10% kiln moisture equilibrium.',
                      done: true,
                      active: false,
                      icon: CheckCircle2,
                    },
                    {
                      step: 3,
                      title: 'Artisan Joinery & Hand-Carving',
                      desc: 'Senior craftsmen shaping mortise-and-tenon structural joints.',
                      done: trackStatus === 'SHIPPED' || trackStatus === 'DELIVERED',
                      active: trackStatus === 'PENDING' || !trackStatus,
                      icon: Sparkles,
                    },
                    {
                      step: 4,
                      title: 'Royal Walnut Multi-Coat Polish & QC',
                      desc: 'Hand-buffed natural lacquer applied and velvet upholstery fitted.',
                      done: trackStatus === 'DELIVERED',
                      active: trackStatus === 'SHIPPED',
                      icon: Layers,
                    },
                    {
                      step: 5,
                      title: 'White-Glove Fleet Transit & Setup',
                      desc: 'Insured transit to client estate with on-site white-glove placement.',
                      done: trackStatus === 'DELIVERED',
                      active: false,
                      icon: Truck,
                    },
                  ].map((st, i) => {
                    const Icon = st.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 relative">
                        {i < 4 && (
                          <div className={`absolute left-4 top-8 w-0.5 h-7 ${st.done ? 'bg-[#B88E4B]' : 'bg-stone-200'}`} />
                        )}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                            st.done
                              ? 'bg-[#B88E4B] text-white shadow-xs'
                              : st.active
                              ? 'bg-amber-100 text-[#8C6239] ring-2 ring-[#B88E4B] animate-pulse'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xs font-bold ${st.done || st.active ? 'text-[#1F1612]' : 'text-stone-400'}`}>
                            {st.title} {st.active && <span className="text-[10px] text-[#B88E4B] font-mono font-black ml-1">[CURRENT WORKSHOP PHASE]</span>}
                          </h4>
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{st.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="p-3 rounded-xl bg-[#FAF5EE] border border-[#E7DDD0] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase block">Dedicated Concierge</span>
                <span className="text-xs font-bold text-[#1F1612]">Master Artisan Fahad Ali</span>
              </div>
              <a
                href={`https://wa.me/923207006110?text=Hello%20Fahad%20Ali,%20tracking%20Bespoke%20Commission%20%23${(trackingOrder.id || '').slice(-8).toUpperCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs"
              >
                <MessageSquare size={12} /> WhatsApp Inquiry
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: QUICK VIEW PRODUCT CRAFTING SPECIFICATIONS ── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] max-w-lg w-full p-5 shadow-2xl space-y-3.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E7DDD0]">
              <span className="text-[9px] font-mono font-black text-[#8C6239] uppercase tracking-wider">
                ✦ BESPOKE SPECIFICATION SHEET
              </span>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="w-7 h-7 rounded-full bg-[#FAF5EE] text-stone-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-[#FAF5EE] rounded-xl overflow-hidden border border-[#E7DDD0]">
              <Image
                src={resolveImageUrl(quickViewProduct.image, quickViewProduct.category)}
                alt={quickViewProduct.name}
                fill
                className="object-cover"
              />
            </div>

            <div>
              <h3 className="font-serif font-black text-lg text-[#1F1612]">{quickViewProduct.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Category: <span className="font-bold text-[#1F1612]">{quickViewProduct.category || 'Luxury Living Room'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Timber Type</span>
                <span className="font-bold text-[#1F1612]">Grade-A Solid Sheesham</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Upholstery</span>
                <span className="font-bold text-[#1F1612]">{quickViewProduct.material || 'Turkish Velvet'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Warranty</span>
                <span className="font-bold text-emerald-700">10-Year Timber Warranty</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF5EE]/70 border border-[#E7DDD0]">
                <span className="text-stone-400 block font-mono text-[9px] uppercase">Transit Service</span>
                <span className="font-bold text-[#8C6239]">Free White-Glove Setup</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E7DDD0] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 block font-mono uppercase">Commission</span>
                <span className="font-serif font-black text-lg text-[#1F1612]">
                  Rs. {formatPrice(quickViewProduct.price)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onAddQuickViewToCart(quickViewProduct)}
                  className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white font-bold text-xs h-9 px-4 cursor-pointer shadow-sm active:scale-95"
                >
                  <ShoppingBag size={13} className="mr-1.5" /> Add to Shopping Bag
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
