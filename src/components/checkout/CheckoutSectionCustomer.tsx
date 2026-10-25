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
  MessageSquare,
  CheckCircle2,
  Loader2,
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
  isPhoneVerified: boolean;
  otpCode: string;
  setOtpCode: (c: string) => void;
  otpSent: boolean;
  otpLoading: boolean;
  otpVerifying: boolean;
  otpCooldown: number;
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleResetPhoneVerification: () => void;
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
  isPhoneVerified,
  otpCode,
  setOtpCode,
  otpSent,
  otpLoading,
  otpVerifying,
  otpCooldown,
  handleSendOtp,
  handleVerifyOtp,
  handleResetPhoneVerification,
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

                {/* ── WhatsApp 6-Digit OTP Verification Box ── */}
                {form.phone && isPhoneValid && (
                  <div className="mt-2.5 font-sans">
                    {isPhoneVerified ? (
                      <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <CheckCircle2 size={14} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-emerald-950 block leading-tight">
                              Phone Number Verified via WhatsApp ✓
                            </span>
                            <span className="text-[9.5px] text-emerald-700 font-medium">
                              Genuine buyer authenticated — Protected against fake orders
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetPhoneVerification}
                          className="text-[10px] font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-[#FAF7F2] via-white to-[#FAF5EE] border border-[#E2D9CD] rounded-xl p-3 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare size={14} className="text-[#25D366]" />
                            <span className="text-[11px] font-black text-[#221814] uppercase tracking-wider">
                              Verify Mobile Number (WhatsApp OTP)
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                            Required to Proceed
                          </span>
                        </div>

                        {!otpSent ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5">
                            <p className="text-[10.5px] text-[#7A6354] leading-relaxed">
                              Send an instant 6-digit WhatsApp OTP to confirm order authenticity.
                            </p>
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading}
                              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-105 text-white font-serif font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {otpLoading ? (
                                <Loader2 size={13} className="animate-spin text-white" />
                              ) : (
                                <MessageSquare size={13} />
                              )}
                              <span>{otpLoading ? 'Sending...' : 'Send WhatsApp Code'}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-0.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                              <span className="text-stone-600 font-medium">
                                Enter the 6-digit code sent to <strong className="font-bold text-[#1F1612]">{form.phone}</strong>:
                              </span>
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={otpCooldown > 0 || otpLoading}
                                className="text-[10px] font-bold text-[#8C6239] hover:underline cursor-pointer disabled:opacity-50 text-left"
                              >
                                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code via WhatsApp'}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id="fai-checkout-otp-input"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="• • • • • •"
                                className="flex-1 bg-white border border-[#E2D9CD] focus:border-[#25D366] rounded-xl px-4 py-2 text-center font-mono font-black text-base sm:text-lg tracking-[0.35em] text-[#1F1612] outline-none shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={otpVerifying || otpCode.replace(/\D/g, '').length !== 6}
                                className="px-5 py-2.5 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] hover:brightness-110 text-[#FFEAA0] font-serif font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                              >
                                {otpVerifying ? (
                                  <Loader2 size={13} className="animate-spin text-[#FFEAA0]" />
                                ) : (
                                  <ShieldCheck size={14} className="text-[#FFEAA0]" />
                                )}
                                <span>{otpVerifying ? 'Verifying...' : 'Verify Code'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
