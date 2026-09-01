'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Phone, MapPin, CreditCard,
  Printer, Copy, Check, MessageSquare, ExternalLink, RefreshCw, Sparkles, ShieldCheck, Crown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiFetchJsonWithStatus } from '@/lib/api-client';
import { ensureEnterpriseTokens } from '@/hooks/use-enterprise-auth-sync';
import { resolveImageUrl } from '@/lib/images';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-PK').format(n);
}

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Confirmed', desc: 'Blueprint queued & payment validated' },
  { id: 'processing', label: 'Artisan Crafting', desc: 'Handcarving seasoned Sheesham' },
  { id: 'shipped', label: 'Dispatched', desc: 'In-transit with White-Glove fleet' },
  { id: 'delivered', label: 'Delivered & Installed', desc: 'Handed over & assembled in room' },
];

function statusIcon(status: string) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'delivered': return <CheckCircle2 className="text-emerald-600" size={20} />;
    case 'shipped': return <Truck className="text-purple-600" size={20} />;
    case 'processing': return <Package className="text-blue-600" size={20} />;
    case 'cancelled': return <XCircle className="text-rose-600" size={20} />;
    default: return <Clock className="text-amber-600" size={20} />;
  }
}

function statusColor(status: string) {
  const s = (status || '').toLowerCase();
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border border-amber-300/80 shadow-2xs',
    processing: 'bg-blue-50 text-blue-800 border border-blue-300/80 shadow-2xs',
    shipped: 'bg-purple-50 text-purple-800 border border-purple-300/80 shadow-2xs',
    delivered: 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-2xs font-bold',
    cancelled: 'bg-rose-50 text-rose-800 border border-rose-300/80 shadow-2xs',
  };
  return map[s] ?? 'bg-[#FAF5EE] text-[#8C6239] border border-[#E8DFC8]';
}

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const addItemToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        const tokenOk = await ensureEnterpriseTokens();
        if (!tokenOk && isMounted) {
          router.push('/');
          return;
        }
      }

      try {
        await ensureEnterpriseTokens();

        // Tier 1: Try single order endpoint
        const res1 = await apiFetchJsonWithStatus<any>(`/api/v1/orders/${orderId}`);
        if (res1.ok && res1.data && !res1.data.error) {
          if (isMounted) setOrder(res1.data);
          return;
        }

        // Tier 2: Fallback to user orders list
        const res2 = await apiFetchJsonWithStatus<any[]>(`/api/v1/orders`);
        if (res2.ok && Array.isArray(res2.data)) {
          const found = res2.data.find((o: any) => o.id === orderId || o.id?.endsWith(orderId));
          if (found) {
            if (isMounted) setOrder(found);
            return;
          }
        }

        // Tier 3: Fallback to dashboard bundle
        const res3 = await apiFetchJsonWithStatus<any>(`/api/user/dashboard-bundle`);
        if (res3.ok && res3.data?.orders && Array.isArray(res3.data.orders)) {
          const found = res3.data.orders.find((o: any) => o.id === orderId || o.id?.endsWith(orderId));
          if (found) {
            if (isMounted) setOrder(found);
            return;
          }
        }

        if (isMounted) setError('Order not found or you do not have permission to view it.');
      } catch {
        if (isMounted) setError('Order not found or you do not have permission to view it.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [orderId, session, status, router]);

  const copyOrderId = () => {
    if (!order?.id) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    toast.success('Royal Order ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const printReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4 font-sans select-none">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <div className="w-full h-full rounded-2xl bg-[#1A0E07] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-[#FFEAA0] border-t-transparent rounded-full"
            />
          </div>
        </div>
        <p className="font-serif text-sm font-bold text-[#8C6239] uppercase tracking-widest animate-pulse">
          Fetching Royal Blueprint & Tracking...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4 font-sans select-none">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md bg-white/90 border-[1.5px] border-[#E8DFC8] p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 bg-[#FAF5EE] rounded-2xl border border-[#D4AF37]/50 flex items-center justify-center mx-auto mb-4 text-[#8C6239]">
            <Package size={32} />
          </div>
          <h2 className="font-serif text-2xl font-black text-[#221814] mb-2">Order Archive Not Available</h2>
          <p className="text-[#5C483E] text-xs sm:text-sm mb-6">{error || 'Order record not found or access restricted.'}</p>
          <Link href="/orders" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-md">
            <ArrowLeft size={16} /> Return to Orders List
          </Link>
        </motion.div>
      </div>
    );
  }

  const normalizedStatus = (order.status || '').toLowerCase();
  const stepIds = STATUS_STEPS.map((s) => s.id);
  const currentStepIndex = stepIds.indexOf(normalizedStatus);
  const formattedId = order.id ? (order.id.startsWith('order_') ? order.id.slice(6, 14) : order.id.slice(-8)).toUpperCase() : 'ORDER';
  const progressPercent = currentStepIndex < 0 ? 0 : Math.min(100, Math.max(12, ((currentStepIndex + 1) / STATUS_STEPS.length) * 100));

  const whatsappMessage = encodeURIComponent(`Hello Fahad Ali Interior! I am inquiring regarding my Royal Order #${formattedId}.`);
  const whatsappUrl = `https://wa.me/923207006110?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-20 relative overflow-hidden select-none">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FFEAA0]/20 via-[#C9A96E]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <Link href="/orders" className="inline-flex items-center gap-2 text-[#8C6239] hover:text-[#221814] text-xs sm:text-sm font-serif font-bold uppercase tracking-wider transition-all group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to My Orders
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={printReceipt}
                className="inline-flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#221814] bg-white border border-[#E8DFC8] hover:border-[#D4AF37] px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Print Official Tax Receipt"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:brightness-110 active:scale-95"
              >
                <MessageSquare size={14} /> VIP Concierge
              </a>
            </div>
          </div>

          {/* Luxury Order Header */}
          <div className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 sm:p-8 mb-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] tracking-tight">
                    Order <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">#{formattedId}</span>
                  </h1>
                  <button
                    onClick={copyOrderId}
                    className="p-1.5 rounded-lg hover:bg-[#FAF5EE] text-[#8C6239] transition-colors border border-[#E8DFC8]/60 cursor-pointer"
                    title="Copy full Order ID"
                  >
                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#7A6354] mt-1 font-medium flex items-center gap-2">
                  <span>Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                  <span>•</span>
                  <span className="text-[#221814] font-bold">{order.items?.length || 1} Masterpiece Item(s)</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {statusIcon(order.status)}
                <span className={`px-4 py-1.5 rounded-full text-xs font-serif font-black uppercase tracking-wider ${statusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Haute Couture Animated Order Tracking Progress */}
          {normalizedStatus !== 'cancelled' && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EFE8DD]">
                <div>
                  <h2 className="font-serif font-black text-base sm:text-lg text-[#221814] flex items-center gap-2">
                    <Sparkles size={18} className="text-[#B88E4B]" /> Master Artisan Live Progress
                  </h2>
                  <p className="text-xs text-[#7A6354] mt-0.5">Real-time status updates from our woodworking studio to your residence</p>
                </div>
                {normalizedStatus === 'delivered' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-serif font-black text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-300">
                    <ShieldCheck size={14} className="text-emerald-600" /> Fulfilled & Verified
                  </span>
                )}
              </div>

              {/* Step Bar with Animated Progress */}
              <div className="relative pt-2 pb-6">
                {/* Background Line */}
                <div className="absolute top-7 left-8 right-8 h-1 bg-[#E8DFC8] rounded-full" />
                {/* Animated Active Line */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute top-7 left-8 h-1 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-emerald-500 rounded-full shadow-xs"
                />

                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div key={step.id} className="flex flex-col items-center text-center cursor-default px-1">
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-serif font-black border-2 transition-all z-10 ${
                            isPassed
                              ? 'bg-gradient-to-br from-[#2A170D] via-[#1A0E07] to-[#0D0603] border-[#D4AF37] text-[#FFEAA0] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                              : 'bg-white border-[#E8DFC8] text-[#8C6239]'
                          }`}
                        >
                          {isPassed ? '✓' : idx + 1}
                          {isCurrent && (
                            <span className="absolute -inset-1 rounded-2xl border-2 border-[#D4AF37] animate-ping opacity-60 pointer-events-none" />
                          )}
                        </motion.div>

                        <span className={`text-xs sm:text-sm font-serif font-bold uppercase tracking-wider mt-3 ${isPassed ? 'text-[#221814]' : 'text-[#7A6354]'}`}>
                          {step.label}
                        </span>
                        <span className="text-[11px] text-[#8C6239] hidden md:block max-w-[120px] mt-1 leading-tight font-medium">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Ordered Items List */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
            <h2 className="font-serif font-black text-base sm:text-lg text-[#221814] mb-6 pb-3 border-b border-[#EFE8DD]">
              Ordered Furniture Sets ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-[#EFE8DD]">
              {(order.items || []).map((item: any, idx: number) => {
                const imgUrl = resolveImageUrl(item.image || item.product?.image);
                const itemPrice = item.unitPrice || item.price || 0;
                const itemQty = item.quantity || 1;
                const productId = item.productId || item.product?.id || item.id;
                const productName = item.productName || item.name || item.product?.name || 'Interior Masterpiece';

                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-200 border border-[#E8DFC8] shrink-0">
                        <Image src={imgUrl} alt={productName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="80px" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-sm sm:text-base text-[#221814] truncate">{productName}</h3>
                        <p className="text-xs text-[#7A6354] mt-0.5 font-medium">
                          Quantity: <span className="font-bold text-[#221814]">{itemQty}</span> • 100% Solid Sheesham (10-Yr Warranty)
                        </p>
                        <p className="font-serif text-xs font-bold text-[#8C6239] mt-0.5">PKR {formatPrice(itemPrice)} / unit</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <p className="font-serif font-black text-base sm:text-lg text-[#221814]">
                        PKR {formatPrice(itemPrice * itemQty)}
                      </p>
                      {productId && (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/product/${productId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-serif font-bold uppercase tracking-wider text-[#8C6239] hover:text-[#221814] transition-colors"
                          >
                            <span>View Product</span>
                            <ExternalLink size={12} />
                          </Link>
                          <button
                            onClick={() => {
                              addItemToCart({
                                id: productId,
                                name: productName,
                                price: itemPrice,
                                image: imgUrl || '/images/sofa_beige.webp',
                                category: item.product?.category || 'Furniture',
                              });
                              toast.success('Added to Cart', { description: productName });
                              openCart();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-serif font-bold uppercase tracking-wider text-[#1A0E07] bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] px-2.5 py-1 rounded-lg transition-all shadow-2xs hover:brightness-105 cursor-pointer"
                          >
                            <RefreshCw size={11} /> Re-Order
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Summary Breakdown */}
            <div className="mt-8 pt-6 border-t border-[#EFE8DD] space-y-2.5 bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFC8]">
              <div className="flex justify-between text-xs sm:text-sm text-[#7A6354] font-medium">
                <span>Catalogue Subtotal</span>
                <span className="font-serif font-bold text-[#221814]">PKR {formatPrice(order.subtotal || 0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-emerald-700 font-medium">
                  <span>Royal Discount Applied</span>
                  <span className="font-serif font-bold">- PKR {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs sm:text-sm text-[#7A6354] font-medium">
                <span>White-Glove Nationwide Delivery</span>
                <span className="font-serif font-bold text-emerald-700">
                  {(order.shippingCost || 0) === 0 ? 'COMPLIMENTARY (FREE)' : `PKR ${formatPrice(order.shippingCost)}`}
                </span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-black text-[#221814] pt-3 border-t border-[#E8DFC8]">
                <span className="font-serif">Total Settlement</span>
                <span className="font-serif text-[#8C6239]">PKR {formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>
          </motion.div>

          {/* Grid Layout for Shipping & Payment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shipping Info Card */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 shadow-xs">
              <h2 className="font-serif font-black text-sm uppercase tracking-wider text-[#221814] mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#B88E4B]" /> Delivery Destination
              </h2>
              {order.shippingInfo || order.shippingName ? (
                <div className="text-[#5C483E] text-xs sm:text-sm space-y-1.5">
                  <p className="font-serif font-bold text-[#221814] text-base">{order.shippingInfo?.name || order.shippingName || 'Customer'}</p>
                  {(order.shippingInfo?.phone || order.shippingPhone) && (
                    <p className="flex items-center gap-1.5 text-xs text-[#8C6239] font-medium">
                      <Phone size={13} /> {order.shippingInfo?.phone || order.shippingPhone}
                    </p>
                  )}
                  <p className="text-xs pt-1">{order.shippingInfo?.address || order.shippingAddress || 'Standard Address'}</p>
                  <p className="text-xs font-bold text-[#221814]">
                    {order.shippingInfo?.city || order.shippingCity}{' '}
                    {(order.shippingInfo?.province || order.shippingProvince) ? `, ${order.shippingInfo?.province || order.shippingProvince}` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#7A6354]">Delivery address verified and recorded securely.</p>
              )}
            </motion.div>

            {/* Payment Method & Status Card */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 shadow-xs">
              <h2 className="font-serif font-black text-sm uppercase tracking-wider text-[#221814] mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-[#B88E4B]" /> Payment Protocol
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-[#7A6354] font-medium">Payment Gateway:</span>
                  <span className="font-serif font-black text-[#221814] uppercase tracking-wider">{order.paymentMethod?.replace('_', ' ') || 'COD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-[#EFE8DD]">
                  <span className="text-[#7A6354] font-medium">Verification Status:</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-serif font-black uppercase tracking-wider ${
                    order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                    order.paymentStatus?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-300' :
                    'bg-[#FAF5EE] text-[#8C6239] border border-[#E8DFC8]'
                  }`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </motion.div>

          </div>

        </motion.div>
      </div>
    </div>
  );
}
