'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Sparkles,
  ShieldCheck,
  Crown,
  Lock,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { CartItem } from '@/store';
import { CheckoutFormState } from './checkout-types';

export interface CheckoutSectionCustomerProps {
  form: CheckoutFormState;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  detectedTelecom: { brandColor: string; name: string } | null;
  isPhoneValid: boolean;
  activeItems: CartItem[];
  grandTotal: number;
  setCurrentSection: (sec: 1 | 2 | 3 | 4) => void;
  goToNextSection: () => void;
}

export function CheckoutSectionCustomer({
  form,
  handleInputChange,
  detectedTelecom,
  isPhoneValid,
  activeItems,
  grandTotal,
  setCurrentSection,
  goToNextSection,
}: CheckoutSectionCustomerProps) {
  return (
    <motion.div
      key="section-2"
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
            <User size={18} className="text-[#8C6239] stroke-[2.2]" />
            <span>2. Customer Profile & Contact Details</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
            <Sparkles size={10} className="text-[#B88E4B]" />
            <span>VIP CLIENT REGISTRATION</span>
          </span>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-start">
          {/* Form Inputs (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Full Name */}
            <div>
              <label htmlFor="customer-name-input" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                Full Name / Honorific <span className="text-amber-700">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                  <User size={14} className="text-[#8C6239]" />
                </div>
                <input
                  id="customer-name-input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Muhammad Fahad Ali"
                  required
                  className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] placeholder:text-stone-400 outline-none transition-all shadow-2xs font-sans"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="customer-email-input" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                  Email Address <span className="text-amber-700">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                    <Mail size={14} className="text-[#8C6239]" />
                  </div>
                  <input
                    id="customer-email-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="client@fahad-ali.com"
                    required
                    className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] placeholder:text-stone-400 outline-none transition-all shadow-2xs font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="customer-phone-input" className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider font-sans">
                    Phone Number <span className="text-amber-700">*</span>
                  </label>
                  {detectedTelecom && (
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-fadeIn"
                      style={{
                        backgroundColor: `${detectedTelecom.brandColor}15`,
                        color: detectedTelecom.brandColor,
                        border: `1px solid ${detectedTelecom.brandColor}40`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: detectedTelecom.brandColor }} />
                      {detectedTelecom.name}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                    <Phone size={14} className="text-[#8C6239]" />
                  </div>
                  <input
                    id="customer-phone-input"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="0300 1234567"
                    required
                    className={`w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border ${
                      form.phone && !isPhoneValid
                        ? 'border-amber-400 focus:border-amber-500'
                        : form.phone && isPhoneValid
                        ? 'border-emerald-500/70 focus:border-emerald-600'
                        : 'border-[#E2D9CD] focus:border-[#B88E4B]'
                    } focus:bg-white rounded-xl pl-12 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-[#1F1612] placeholder:text-stone-400 outline-none transition-all font-sans shadow-2xs`}
                  />
                  {form.phone && isPhoneValid && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" title="Valid Pakistani Mobile Number">
                      <ShieldCheck size={16} />
                    </div>
                  )}
                </div>
                {form.phone && !isPhoneValid && form.phone.length > 3 && (
                  <p className="text-[10px] text-amber-700 mt-1 font-medium font-sans">
                    Enter standard 11-digit Pakistani mobile number (e.g. 0300 1234567 or +92 300...)
                  </p>
                )}
              </div>
            </div>

            {/* VIP Client Privilege Trio Capsule */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans">
              <div className="bg-[#FAF7F2] border border-[#E7DDD0] rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#E2D9CD] flex items-center justify-center shrink-0">
                  <Crown size={12} className="text-[#8C6239]" />
                </div>
                <span className="text-[10px] font-bold text-[#221814] leading-tight">Assigned VIP Concierge</span>
              </div>
              <div className="bg-[#FAF7F2] border border-[#E7DDD0] rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#E2D9CD] flex items-center justify-center shrink-0">
                  <Lock size={12} className="text-emerald-700" />
                </div>
                <span className="text-[10px] font-bold text-[#221814] leading-tight">100% Confidential Data</span>
              </div>
              <div className="bg-[#FAF7F2] border border-[#E7DDD0] rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white border border-[#E2D9CD] flex items-center justify-center shrink-0">
                  <Zap size={12} className="text-amber-600" />
                </div>
                <span className="text-[10px] font-bold text-[#221814] leading-tight">Instant SMS Updates</span>
              </div>
            </div>
          </div>

          {/* Right Side Order Overview Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 sm:p-4.5 space-y-3 shadow-[0_4px_20px_rgba(44,30,24,0.02)] font-sans">
            <div className="flex justify-between items-center border-b border-[#E7DDD0] pb-2">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#7A6354]">Executive Overview</span>
              <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                LIVE CART SYNCED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-semibold">Curated Pieces:</span>
                <span className="font-bold text-[#1F1612] bg-white border border-[#E2D9CD] px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {activeItems.length} Bespoke Items
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-600 font-semibold">White-Glove VIP Delivery:</span>
                <span className="font-bold text-emerald-700">Rs. 0 (Complimentary)</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#DECDBB]">
                <span className="font-black text-xs uppercase tracking-wider text-[#7A6354]">Grand Total:</span>
                <div className="text-lg sm:text-xl font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                  <span className="text-xs font-bold text-[#8C6D46] mr-1 select-none">Rs.</span>
                  <span className="bg-gradient-to-r from-[#B88E4B] via-[#996515] to-[#8C6239] bg-clip-text text-transparent">
                    {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-[#FAF5EE] border border-emerald-200/80 rounded-xl text-emerald-900 text-[11px] font-semibold leading-relaxed flex items-start gap-2">
              <Sparkles size={14} className="text-emerald-700 shrink-0 mt-0.5" />
              <span>Dedicated VIP Concierge will coordinate white-glove delivery & room assembly upon order confirmation.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="pt-3 flex flex-col-reverse sm:flex-row justify-between items-center gap-2 border-t border-[#E7DDD0]/80 mt-4">
        <button
          type="button"
          onClick={() => setCurrentSection(1)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DECDBB] text-stone-700 hover:bg-[#FAF6F0] font-sans font-bold text-xs cursor-pointer transition-colors"
        >
          ←  Back to Order Summary
        </button>
        <button
          type="button"
          onClick={goToNextSection}
          className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white font-serif font-bold text-xs sm:text-sm px-6 py-2.5 sm:py-3 rounded-xl shadow-[0_4px_16px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-98 transition-all"
        >
          <span>Proceed to Shipping Address (Section 3)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
