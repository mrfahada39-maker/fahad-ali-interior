'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatPricePk } from '@/lib/format-price';
import { resolveImageUrl } from '@/lib/images';
import Image from 'next/image';

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getGST = useCartStore((s) => s.getGST);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  // Prefetch checkout route as soon as cart drawer opens
  useEffect(() => {
    if (isOpen) {
      router.prefetch('/checkout');
      router.prefetch('/shop');
    }
  }, [isOpen, router]);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    closeCart();
    router.push('/checkout');
  };

  const totalQuantity = items.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center sm:justify-end p-3 sm:p-6 overflow-hidden">
          
          {/* Subtle Luxury Frosted Glass Backdrop (Background Stays Visible) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 -z-10 bg-[#221814]/30 backdrop-blur-sm transition-all duration-300"
          />

          {/* Luxury Floating Cart Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: '#FCFAF7' }}
            className="w-full max-w-[440px] h-[600px] max-h-[90vh] bg-[#FCFAF7] border-2 border-[#D4AF37]/50 rounded-[28px] shadow-[0_25px_80px_rgba(44,30,24,0.18),0_0_35px_rgba(184,142,75,0.2)] flex flex-col overflow-hidden z-20"
          >
            {/* Top Brand Header */}
            <div className="relative px-5 py-4 border-b border-[#E2D6C8] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#8C6239] shadow-2xs">
                  <ShoppingBag size={16} className="stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-sm text-[#221814] uppercase tracking-wide flex items-center gap-1.5 leading-tight">
                    Shopping Cart
                    <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC]">
                      {totalQuantity} {totalQuantity === 1 ? 'Piece' : 'Pieces'}
                    </span>
                  </h2>
                  <p className="text-[8.5px] font-bold text-[#8C6239] uppercase tracking-[0.25em]">
                    Fahad Ali Bespoke Atelier
                  </p>
                </div>
              </div>

              {/* Ornate Close Button */}
              <button
                onClick={closeCart}
                className="w-8.5 h-8.5 rounded-full bg-[#FAF5EE] border border-[#E2D1BC] text-[#8C6239] hover:bg-[#B88E4B] hover:text-white hover:border-[#B88E4B] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                aria-label="Close cart"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Cart Items Stream */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF6F0]">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] mb-3 shadow-xs">
                  <ShoppingBag size={28} className="stroke-[1.8]" />
                </div>
                <h3 className="font-serif font-black text-base text-[#221814]">Your Cart is Empty</h3>
                <p className="text-stone-500 text-xs max-w-xs mt-1 leading-relaxed">
                  Discover our timeless solid sheesham masterpieces and add your preferred selections to your bespoke order.
                </p>
                <Button
                  onClick={() => {
                    closeCart();
                    router.push('/shop');
                  }}
                  className="mt-5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold rounded-xl px-5 h-10 text-xs shadow-xs transition-all cursor-pointer"
                >
                  Explore Collection
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FAF6F0]">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-3 bg-white rounded-2xl p-3 border border-[#E7DDD0] shadow-2xs hover:border-[#B88E4B] transition-colors"
                    >
                      {/* High-Res Product Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center">
                        <img
                          src={resolveImageUrl(item.image, item.name)}
                          alt={item.name}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      {/* Info & Quantity Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-1">
                          <div>
                            <h3 className="text-[#221814] text-xs sm:text-sm font-black font-serif truncate">
                              {item.name}
                            </h3>
                            <p className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider mt-0.5">
                              100% Solid Sheesham
                            </p>
                          </div>
                          <span className="font-serif font-black text-xs sm:text-sm text-[#B88E4B] shrink-0">
                            Rs. {formatPricePk(item.price)}
                          </span>
                        </div>

                        {/* Quantity Controls & Delete */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                          <div className="flex items-center gap-1 bg-[#FAF5EE] p-0.5 rounded-lg border border-[#E2D1BC]">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-5 h-5 rounded-md bg-white border border-[#E2D1BC] flex items-center justify-center text-[#8C6239] hover:bg-[#B88E4B] hover:text-white transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus size={9} strokeWidth={2.5} />
                            </button>
                            <span className="text-[#221814] text-xs font-black w-5 text-center font-serif">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 rounded-md bg-white border border-[#E2D1BC] flex items-center justify-center text-[#8C6239] hover:bg-[#B88E4B] hover:text-white transition-colors cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus size={9} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              removeItem(item.id);
                              toast.success(`${item.name} removed from cart`);
                            }}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Luxury Footer Summary & Checkout */}
                <div className="border-t border-[#E2D6C8] p-4 bg-white space-y-3 shrink-0 shadow-[0_-4px_20px_rgba(44,30,24,0.04)]">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-500 font-medium">
                      <span>Artisan Subtotal</span>
                      <span className="text-[#221814] font-bold">Rs. {formatPricePk(getSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-stone-500 font-medium">
                      <span>Sales Tax & GST (17%)</span>
                      <span className="text-[#221814] font-bold">Rs. {formatPricePk(Math.round(getGST()))}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-[#E7DDD0]">
                      <div>
                        <span className="font-serif font-black text-sm text-[#221814]">Grand Total</span>
                        <p className="text-[9.5px] font-bold text-emerald-700">✓ Free White-Glove Dispatch</p>
                      </div>
                      <span className="font-serif font-black text-base sm:text-lg text-[#B88E4B]">
                        Rs. {formatPricePk(Math.round(getTotal()))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCheckout}
                      onMouseEnter={() => router.prefetch('/checkout')}
                      onTouchStart={() => router.prefetch('/checkout')}
                      className="flex-1 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold rounded-xl h-11 text-xs sm:text-sm shadow-[0_4px_20px_rgba(184,142,75,0.3)] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight size={14} className="stroke-[2.2]" />
                    </button>
                    <button
                      onClick={clearCart}
                      className="border border-[#E2D1BC] text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 font-bold rounded-xl h-11 px-3 text-xs transition-all cursor-pointer"
                      title="Empty cart"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
