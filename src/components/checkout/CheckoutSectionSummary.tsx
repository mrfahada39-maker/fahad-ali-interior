/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Tag,
  CheckCircle2,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/images';
import { CartItem } from '@/store';
import { AppliedCoupon } from './checkout-types';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-PK').format(n);
}

export interface CheckoutSectionSummaryProps {
  activeItems: CartItem[];
  handleItemQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  itemsSubtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  appliedCoupon: AppliedCoupon | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: () => void;
  removeCoupon?: () => void;
  couponLoading: boolean;
  goToNextSection: () => void;
}

export function CheckoutSectionSummary({
  activeItems,
  handleItemQuantity,
  removeItem,
  itemsSubtotal,
  shippingFee,
  taxAmount,
  discountAmount,
  grandTotal,
  appliedCoupon,
  couponCode,
  setCouponCode,
  applyCoupon,
  removeCoupon,
  couponLoading,
  goToNextSection,
}: CheckoutSectionSummaryProps) {
  return (
    <motion.div
      key="section-1"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className="w-full flex-1 flex flex-col justify-between bg-white border border-[#E7DDD0] rounded-2xl p-3.5 sm:p-4.5 shadow-[0_4px_20px_rgba(44,30,24,0.02)]"
    >
      {/* Header Title */}
      <div className="flex justify-between items-center border-b border-[#E7DDD0]/80 pb-2.5 mb-3 shrink-0">
        <h2 className="text-sm sm:text-base lg:text-lg font-black text-[#221814] flex items-center gap-2 font-serif">
          <span className="text-[#B88E4B]">✦</span>
          <ShoppingBag size={18} className="text-[#8C6239] stroke-[2.2]" />
          <span>1. Order Summary & Review</span>
        </h2>
        <div className="flex items-center gap-2">
          {activeItems.length > 3 && (
            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>Scroll to view all {activeItems.length} items</span>
              <ChevronDown size={12} />
            </span>
          )}
          <span className="text-[9.5px] sm:text-[10px] font-black text-[#B08552] bg-[#FAF5EE] border border-[#B88E4B]/35 px-2.5 py-0.5 rounded-full">
            {activeItems.length} {activeItems.length === 1 ? 'CURATED PIECE' : 'CURATED PIECES'}
          </span>
        </div>
      </div>

      {/* 2-Column Full-Width Balanced Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 min-h-0">
        {/* Left Side: Product Items List */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
          <div
            className="space-y-2.5 overflow-y-auto max-h-[255px] sm:max-h-[270px] pr-1.5"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#B88E4B #FAF0E2',
            }}
          >
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white p-2.5 sm:p-3 rounded-2xl border border-[#E7DDD0] hover:border-[#B88E4B]/50 transition-all shadow-[0_2px_10px_rgba(44,30,24,0.02)]"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#EAE2D7] bg-[#F7F3ED] relative shrink-0 shadow-inner">
                  <Image
                    src={resolveImageUrl(item.image, item.category)}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="70px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-serif font-black text-xs sm:text-sm text-[#221814] truncate tracking-tight">
                      {item.name}
                    </p>
                    <span className="text-[8.5px] sm:text-[9.5px] font-black font-mono text-[#8C6239] uppercase bg-[#FAF5EE] border border-[#E8DFC8] px-1.5 py-0.5 rounded shrink-0">
                      Solid Wood
                    </span>
                  </div>

                  <p className="text-[10px] text-[#8C6239] font-medium mb-1.5 flex items-center gap-1.5">
                    <span>10-Yr Guarantee</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">100% Seasoned Hardwood</span>
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#E2D6C5] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleItemQuantity(item.id, -1)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-white text-stone-700 transition-colors cursor-pointer"
                        aria-label={`Decrease quantity of ${item.name}`}
                        title="Decrease quantity"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-mono font-bold w-5 text-center text-stone-900">
                        {item.quantity ?? 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleItemQuantity(item.id, 1)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-white text-stone-700 transition-colors cursor-pointer"
                        aria-label={`Increase quantity of ${item.name}`}
                        title="Increase quantity"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-mono font-black text-[#1F1612]">
                        PKR {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                        aria-label={`Remove ${item.name} from order`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FAF5EE] border border-[#B88E4B]/30 rounded-xl p-2.5 flex items-center justify-between mt-2">
            <span className="text-[10.5px] text-[#7A6354] font-medium flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#B88E4B]" />
              Need to add customized sizing or polish choice?
            </span>
            <Link
              href="/shop"
              className="text-[10.5px] font-serif font-black text-[#8C6239] hover:underline"
            >
              Browse Catalog →
            </Link>
          </div>
        </div>

        {/* Right Side: Financial Breakdown & Coupon Box */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-[#FAF8F5] border border-[#E7DDD0] rounded-2xl p-3.5 sm:p-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="coupon-input-summary" className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={12} className="text-[#B88E4B]" />
                Privilege Coupon Voucher
              </label>
              {appliedCoupon && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> {appliedCoupon.code} Applied
                  </span>
                  {removeCoupon && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[9.5px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                      title="Remove applied voucher"
                    >
                      Remove ×
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <input name="fai_checkoutsectionsummary_field_1"
                id="coupon-input-summary"
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                disabled={Boolean(appliedCoupon)}
                className="flex-1 bg-white border border-[#DECDBB] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 outline-none uppercase placeholder:text-stone-400 disabled:opacity-60"
              />
              {appliedCoupon && removeCoupon ? (
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || Boolean(appliedCoupon)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#2A170D] to-[#1A0E07] hover:brightness-110 text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {couponLoading ? '...' : appliedCoupon ? 'Applied' : 'Apply'}
                </button>
              )}
            </div>

            {/* Financial Summary Breakdown Rows */}
            <div className="space-y-2 border-t border-[#E7DDD0]/80 pt-2.5 text-xs text-[#5C483E]">
              <div className="flex justify-between">
                <span>Pieces Subtotal</span>
                <span className="font-mono font-bold text-stone-900">PKR {formatPrice(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">Nationwide Delivery</span>
                <span className="font-bold">COMPLIMENTARY</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (18% inclusive)</span>
                <span className="font-mono font-bold text-stone-900">
                  {taxAmount > 0 ? `PKR ${formatPrice(taxAmount)}` : 'Rs. 0'}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                  <span>Voucher Discount</span>
                  <span className="font-mono">- PKR {formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-[#E7DDD0] pt-2 text-sm sm:text-base font-black text-[#221814]">
                <span className="font-serif">Grand Settlement</span>
                <span className="font-mono text-[#8C6239] text-base sm:text-lg">
                  PKR {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={goToNextSection}
              className="w-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm py-2.5 sm:py-3 rounded-xl shadow-[0_4px_16px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span>Proceed to Customer Info (Section 2)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
