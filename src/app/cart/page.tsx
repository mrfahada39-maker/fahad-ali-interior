'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import StoreShell from '@/components/layout/StoreShell';
import { useCartStore } from '@/store/cartStore';
import { resolveImageUrl } from '@/lib/images';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = getSubtotal();
  const shipping = subtotal > 0 ? 50 : 0;
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'FAHAD10') {
      setCouponApplied(true);
    }
  };

  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-theme-bg font-sans pt-28 pb-28 sm:pb-32 lg:pb-20">
        <div className="max-w-[1200px] mx-auto px-6">

          <div className="text-center mb-16">
            <h1 className="font-serif text-3xl text-theme-dark">Your Cart</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-serif text-2xl text-theme-dark mb-4">Your cart is empty</p>
              <p className="text-theme-muted text-sm mb-8">Looks like you haven't added anything yet.</p>
              <Link href="/shop" prefetch={true} className="bg-theme-dark text-white px-8 py-3.5 rounded-md text-xs font-semibold tracking-widest uppercase hover:bg-theme-muted transition-colors inline-block">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Table with Luminous Golden Border */}
              <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(184,142,75,0.08)] relative">
                <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-amber-500/10 opacity-70" />

                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-amber-200/60 bg-[#FAF5EE]/70 relative z-10">
                  <div className="col-span-6">
                    <span className="text-xs font-black text-[#7A6354] uppercase tracking-widest">Product</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-black text-[#7A6354] uppercase tracking-widest">Price</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-black text-[#7A6354] uppercase tracking-widest">Quantity</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-black text-[#7A6354] uppercase tracking-widest">Subtotal</span>
                  </div>
                </div>

                {/* Cart Items */}
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 border-b border-amber-200/40 items-center relative z-10 hover:bg-[#FAF5EE]/40 transition-colors">
                    <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                      <div className="w-24 h-24 bg-[#FAF5EE] border border-amber-200/60 rounded-2xl overflow-hidden relative shrink-0 shadow-2xs">
                        <Image
                          src={resolveImageUrl(item.image, item.category)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-[#221814] text-base mb-1">{item.name}</h3>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE] border border-amber-300/60 px-2.5 py-0.5 rounded-full shadow-2xs">
                          {item.category}
                        </span>
                        <p className="text-[#221814] text-sm font-bold md:hidden mt-2">Rs. {(item.price ?? 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 text-center hidden md:block">
                      <span className="text-[#221814] text-sm font-black font-sans">Rs. {(item.price ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                      <div className="flex items-center w-28 bg-white border border-amber-300/70 rounded-xl shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex-1 h-9 flex items-center justify-center text-[#221814] hover:bg-[#FAF5EE] transition-colors rounded-l-xl cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <div className="flex-1 h-9 flex items-center justify-center text-xs font-black text-[#221814] border-x border-amber-200/60 font-sans">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex-1 h-9 flex items-center justify-center text-[#221814] hover:bg-[#FAF5EE] transition-colors rounded-r-xl cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-end items-center gap-4">
                      <span className="text-[#221814] text-base font-black font-sans">Rs. {((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Section */}
              <div className="mt-8 flex flex-col md:flex-row justify-between gap-8 items-start">
                {/* Coupon Box */}
                <div className="w-full md:w-1/3 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(184,142,75,0.06)] relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />
                  <span className="block text-xs font-black uppercase tracking-wider text-[#7A6354] mb-3 relative z-10">Privilege Coupon Code</span>
                  {couponApplied ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-300/80 rounded-xl px-4 py-3 shadow-2xs">
                      ✓ Coupon "FAHAD10" applied — 10% Royal Privilege Off!
                    </div>
                  ) : (
                    <div className="flex relative z-10">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="flex-1 border border-amber-300/60 rounded-l-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#B88E4B] bg-white shadow-2xs"
                      />
                      <button
                        onClick={applyCoupon}
                        className="bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white px-6 py-2.5 rounded-r-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-stone-500 mt-2.5 relative z-10">Try privilege code: <span className="font-bold text-[#B88E4B]">FAHAD10</span> for 10% instant off</p>
                </div>

                {/* Order Summary Card */}
                <div className="w-full md:w-[420px]">
                  <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] p-6 border-[1.5px] border-amber-300/80 rounded-[24px] shadow-[0_8px_30px_rgba(184,142,75,0.08)] relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none bg-amber-500/15 opacity-80" />

                    <h3 className="font-serif font-bold text-lg text-[#221814] mb-4 pb-3 border-b border-amber-200/60 relative z-10">
                      Order Summary
                    </h3>

                    <div className="flex justify-between mb-3 text-sm relative z-10">
                      <span className="text-[#7A6048]">Subtotal</span>
                      <span className="text-[#221814] font-bold font-sans">Rs. {(subtotal ?? 0).toLocaleString()}</span>
                    </div>
                    {couponApplied && (
                      <div className="flex justify-between mb-3 text-sm text-emerald-700 font-bold relative z-10">
                        <span>Royal Privilege (10%)</span>
                        <span className="font-sans">-Rs. {(discount ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between mb-5 pb-5 border-b border-amber-200/60 text-sm relative z-10">
                      <span className="text-[#7A6048]">White-Glove Delivery</span>
                      <span className="text-[#221814] font-bold font-sans">Rs. {(shipping ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-6 relative z-10">
                      <span className="text-[#221814] font-black text-base">Total Investment</span>
                      <span className="text-2xl font-black text-[#221814] font-sans">Rs. {(total ?? 0).toLocaleString()}</span>
                    </div>
                    <Link
                      href="/checkout"
                      prefetch={true}
                      className="block w-full text-center bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white py-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_4px_16px_rgba(184,142,75,0.25)] relative z-10 active:scale-98"
                    >
                      Proceed To Royal Checkout
                    </Link>
                    <Link
                      href="/shop"
                      prefetch={true}
                      className="block w-full text-center text-stone-500 text-xs mt-3.5 hover:text-[#B88E4B] transition-colors relative z-10 font-bold"
                    >
                      ← Continue Curating Collection
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </StoreShell>
  );
}
