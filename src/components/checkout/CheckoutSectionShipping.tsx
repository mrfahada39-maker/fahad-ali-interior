'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Truck,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  PAKISTAN_CITIES,
  PAKISTAN_PROVINCES,
} from '@/lib/pakistan-localization';
import { CheckoutFormState } from './checkout-types';

export interface CheckoutSectionShippingProps {
  form: CheckoutFormState;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  grandTotal: number;
  setCurrentSection: (sec: 1 | 2 | 3 | 4) => void;
  goToNextSection: () => void;
}

export function CheckoutSectionShipping({
  form,
  handleInputChange,
  grandTotal,
  setCurrentSection,
  goToNextSection,
}: CheckoutSectionShippingProps) {
  return (
    <motion.div
      key="section-3"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className="w-full flex-1 flex flex-col justify-between bg-white border border-[#E7DDD0] rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.02)]"
    >
      <div>
        <div className="flex justify-between items-center border-b border-[#E7DDD0]/80 pb-2.5 mb-3.5">
          <h2 className="text-sm sm:text-base lg:text-lg font-black text-[#221814] flex items-center gap-2 font-serif">
            <span className="text-[#B88E4B]">✦</span>
            <MapPin size={18} className="text-[#8C6239] stroke-[2.2]" />
            <span>3. Shipping Address & White-Glove Delivery</span>
          </h2>
          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Truck size={12} className="text-emerald-700" />
            <span>Pakistan White-Glove (Rs. 0 Free)</span>
          </span>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-start">
          {/* Inputs (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Street Address */}
            <div>
              <label htmlFor="shipping-address-input" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                House / Street / Architectural Area <span className="text-amber-700">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                  <MapPin size={14} className="text-[#8C6239]" />
                </div>
                <input
                  id="shipping-address-input"
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="e.g. House # 42, Executive Palm Avenue, Phase 6 DHA"
                  required
                  className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] placeholder:text-stone-400 outline-none transition-all shadow-2xs font-sans"
                />
              </div>
            </div>

            {/* City & Province */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="shipping-city-select" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider font-sans">
                    City <span className="text-amber-700">*</span>
                  </label>
                  {PAKISTAN_CITIES[form.city] && (
                    <span className="text-[9px] font-bold text-[#8C6239] bg-[#FAF5EE] border border-[#E2D9CD] px-1.5 py-0.5 rounded">
                      {PAKISTAN_CITIES[form.city].province}
                    </span>
                  )}
                </div>
                <select
                  id="shipping-city-select"
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] outline-none transition-all cursor-pointer shadow-2xs font-sans"
                >
                  {Object.keys(PAKISTAN_CITIES).map((c) => (
                    <option key={c} value={c}>
                      {c} — {PAKISTAN_CITIES[c].province}
                    </option>
                  ))}
                  <option value="Other">Other Pakistani City</option>
                </select>
                {PAKISTAN_CITIES[form.city]?.estDeliveryDays && (
                  <div className="mt-1.5 text-[10.5px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-medium">
                    <Truck size={12} className="text-emerald-700 shrink-0" />
                    <span>
                      Transit: <strong className="font-bold">{PAKISTAN_CITIES[form.city].estDeliveryDays}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="shipping-province-select" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                  Province <span className="text-amber-700">*</span>
                </label>
                <select
                  id="shipping-province-select"
                  name="province"
                  value={form.province}
                  onChange={handleInputChange}
                  className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] outline-none transition-all cursor-pointer shadow-2xs font-sans"
                >
                  {PAKISTAN_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Postal Code & Country */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="shipping-postal-input" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                  Postal Code / ZIP
                </label>
                <input
                  id="shipping-postal-input"
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleInputChange}
                  placeholder="e.g. 54000"
                  className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#1F1612] outline-none font-sans shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                  Destination Country
                </label>
                <div className="w-full bg-gradient-to-r from-[#FAF5EE] to-[#F5E5CF] border border-[#B88E4B]/40 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#1F1612] font-black flex items-center justify-between select-none shadow-2xs font-sans">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Pakistan</span>
                  </span>
                  <span className="text-base">🇵🇰</span>
                </div>
              </div>
            </div>

            {/* Save Address Checkbox */}
            <div className="pt-1 font-sans">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-[#FAF7F2] border border-[#E7DDD0] rounded-xl p-3 hover:border-[#B88E4B]/50 transition-colors">
                <input
                  type="checkbox"
                  name="saveAddress"
                  checked={form.saveAddress}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-[#B88E4B] focus:ring-[#B88E4B] border-stone-300 accent-[#B88E4B] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#221814]">
                  Save this verified delivery address for future atelier commissions
                </span>
              </label>
            </div>
          </div>

          {/* Right Side Delivery Perks Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.02)] font-sans">
            <div className="flex justify-between items-center border-b border-[#E7DDD0] pb-2">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#7A6354] flex items-center gap-1.5">
                <Truck size={14} className="text-[#8C6239]" />
                <span>White-Glove Protocol</span>
              </span>
              <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                SBP ASSURED
              </span>
            </div>

            <ul className="space-y-2 text-stone-700 text-xs font-medium">
              <li className="flex items-center gap-2 bg-white/80 border border-[#E2D9CD] p-2 rounded-xl shadow-2xs">
                <Check size={14} className="text-emerald-700 shrink-0 stroke-[2.5]" />
                <span className="font-bold text-[#221814]">Complimentary VIP Doorstep Delivery</span>
              </li>
              <li className="flex items-center gap-2 bg-white/80 border border-[#E2D9CD] p-2 rounded-xl shadow-2xs">
                <Check size={14} className="text-emerald-700 shrink-0 stroke-[2.5]" />
                <span className="font-bold text-[#221814]">Master Craftsmen Room Placement & Assembly</span>
              </li>
              <li className="flex items-center gap-2 bg-white/80 border border-[#E2D9CD] p-2 rounded-xl shadow-2xs">
                <Check size={14} className="text-emerald-700 shrink-0 stroke-[2.5]" />
                <span className="font-bold text-[#221814]">Full Packaging Removal & Quality Verification</span>
              </li>
            </ul>

            <div className="pt-2.5 border-t border-[#DECDBB] flex justify-between items-center">
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-black tracking-wider block">Delivery Charge</span>
                <span className="text-xs font-black text-emerald-700">100% Free (Complimentary)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase font-black tracking-wider block">Payable Total</span>
                <span className="text-sm sm:text-base font-black font-sans text-[#8C6239]">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Action */}
      <div className="pt-3 flex flex-col-reverse sm:flex-row justify-between items-center gap-2 border-t border-[#E7DDD0]/80 mt-4">
        <button
          type="button"
          onClick={() => setCurrentSection(2)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DECDBB] text-stone-700 hover:bg-[#FAF6F0] font-sans font-bold text-xs cursor-pointer transition-colors"
        >
          ←  Back to Customer Info
        </button>
        <button
          type="button"
          onClick={goToNextSection}
          className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white font-serif font-bold text-xs sm:text-sm px-6 py-2.5 sm:py-3 rounded-xl shadow-[0_4px_16px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-98 transition-all"
        >
          <span>Proceed to Payment Methods (Section 4)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
