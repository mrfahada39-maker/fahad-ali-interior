/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  Upload,
  Building,
  Copy,
  Check,
  Sparkles,
  Lock,
  Zap,
  CheckCheck,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  PaymentMethodType,
  BankItem,
  BANKS_LIST,
  CheckoutBankCardPanel,
} from '@/components/checkout/checkout-banks';
import { RAAST_SBP_DETAILS, PAKISTAN_CITIES } from '@/lib/pakistan-localization';
import { CardDetails, DigitalPaymentDetails, CheckoutFormState } from './checkout-types';

export interface CheckoutSectionPaymentProps {
  form: CheckoutFormState;
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (m: PaymentMethodType) => void;
  selectedBank: BankItem;
  setSelectedBank: (b: BankItem) => void;
  cardType: 'debit' | 'credit';
  setCardType: (t: 'debit' | 'credit') => void;
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  cardholderName: string;
  handleCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExpiryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  isBankDropdownOpen: boolean;
  setIsBankDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bankSearchQuery: string;
  setBankSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  cardRef: React.RefObject<HTMLDivElement | null>;
  isCardFlipped: boolean;
  setIsCardFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  tiltStyle: { rotateX: number; rotateY: number; glareX: number; glareY: number };
  handleCardMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCardMouseLeave: () => void;
  digitalPaymentDetails: DigitalPaymentDetails;
  setDigitalPaymentDetails: React.Dispatch<React.SetStateAction<DigitalPaymentDetails>>;
  copyToClipboard: (text: string, fieldKey: string) => void;
  copiedField: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  paymentScreenshot: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  placing: boolean;
  handlePlaceOrder: (e?: React.FormEvent) => Promise<void>;
  setCurrentSection: (s: 1 | 2 | 3 | 4) => void;
  grandTotal: number;
  formNotes: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CheckoutSectionPayment({
  form,
  paymentMethod,
  setPaymentMethod,
  selectedBank,
  setSelectedBank,
  cardType,
  setCardType,
  cardDetails,
  setCardDetails,
  cardholderName,
  handleCardNumberChange,
  handleExpiryChange,
  dropdownRef,
  isBankDropdownOpen,
  setIsBankDropdownOpen,
  bankSearchQuery,
  setBankSearchQuery,
  cardRef,
  isCardFlipped,
  setIsCardFlipped,
  tiltStyle,
  handleCardMouseMove,
  handleCardMouseLeave,
  digitalPaymentDetails,
  setDigitalPaymentDetails,
  copyToClipboard,
  copiedField,
  handleFileUpload,
  paymentScreenshot,
  fileInputRef,
  placing,
  handlePlaceOrder,
  setCurrentSection,
  grandTotal,
  formNotes,
  handleInputChange,
}: CheckoutSectionPaymentProps) {
  return (
            <motion.div
              key="section-4"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="w-full flex-1 flex flex-col justify-between bg-white border border-[#E7DDD0] rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(44,30,24,0.02)]"
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#E7DDD0]/80 pb-2.5 mb-3.5">
                  <h2 className="text-sm sm:text-base lg:text-lg font-black text-[#221814] flex items-center gap-2 font-serif">
                    <span className="text-[#B88E4B]">✦</span>
                    <CreditCard size={18} className="text-[#8C6239] stroke-[2.2]" />
                    <span>4. Payment Methods & Authorizations</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs font-sans">
                    <ShieldCheck size={12} className="text-emerald-700" />
                    <span>SBP VERIFIED & 256-BIT ENCRYPTED</span>
                  </span>
                </div>

                {/* 5 Ultra-Modern Payment Selector Micro-Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4 font-sans">
                  {/* 1. Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`h-[74px] sm:h-[82px] p-2 rounded-xl sm:rounded-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center gap-1 group ${
                      paymentMethod === 'cod'
                        ? 'bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/40 border-2 border-emerald-600 shadow-[0_4px_16px_rgba(5,150,105,0.22)] scale-[1.02]'
                        : 'bg-white hover:bg-[#FAF7F2] border border-[#E7DDD0] text-stone-600 hover:border-emerald-500/50 shadow-2xs'
                    }`}
                    title="Cash on Delivery (Pakistan)"
                  >
                    <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100/80 border border-emerald-300/80 flex items-center justify-center shadow-2xs">
                        <Truck size={16} className="text-emerald-700" />
                      </div>
                      <div className="text-left">
                        <span className="font-black text-xs text-[#221814] block leading-none">Cash on</span>
                        <span className="font-black text-[11px] text-emerald-700 block leading-tight">Delivery</span>
                      </div>
                    </div>
                  </button>

                  {/* 2. JazzCash (Official Cloudinary Logo) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`h-[74px] sm:h-[82px] p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer relative overflow-hidden flex items-center justify-center group ${
                      paymentMethod === 'jazzcash'
                        ? 'bg-gradient-to-b from-[#FAF5EE] via-white to-[#FAF5EE] border-2 border-[#ED1C24] shadow-[0_4px_16px_rgba(237,28,36,0.25)] scale-[1.02]'
                        : 'bg-white hover:bg-[#FAF7F2] border border-[#E7DDD0] hover:border-[#ED1C24]/50 shadow-2xs'
                    }`}
                    title="JazzCash Instant Mobile Account"
                  >
                    <Image
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039222/fahad-ali-interior/assets/jazzcash_logo.svg"
                      alt="JazzCash"
                      width={120}
                      height={56}
                      className="w-full h-full max-h-[52px] sm:max-h-[58px] object-contain group-hover:scale-105 transition-transform"
                    />
                  </button>

                  {/* 3. Easypaisa (Official Cloudinary Logo) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('easypaisa')}
                    className={`h-[74px] sm:h-[82px] p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer relative overflow-hidden flex items-center justify-center group ${
                      paymentMethod === 'easypaisa'
                        ? 'bg-gradient-to-b from-[#FAF5EE] via-white to-[#FAF5EE] border-2 border-[#00A859] shadow-[0_4px_16px_rgba(0,168,89,0.25)] scale-[1.02]'
                        : 'bg-white hover:bg-[#FAF7F2] border border-[#E7DDD0] hover:border-[#00A859]/50 shadow-2xs'
                    }`}
                    title="Easypaisa 1-Tap Wallet"
                  >
                    <Image
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039224/fahad-ali-interior/assets/easypaisa_logo.png"
                      alt="Easypaisa"
                      width={120}
                      height={44}
                      className="w-full h-full max-h-[38px] sm:max-h-[44px] max-w-[90%] object-contain group-hover:scale-105 transition-transform"
                    />
                  </button>

                  {/* 4. Debit / Credit Card (Official Mastercard + Visa Box) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`h-[74px] sm:h-[82px] p-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer relative overflow-hidden flex items-center justify-center group ${
                      paymentMethod === 'card'
                        ? 'bg-gradient-to-b from-[#FAF5EE] via-white to-[#FAF5EE] border-2 border-[#1A1F71] shadow-[0_4px_16px_rgba(26,31,113,0.22)] scale-[1.02]'
                        : 'bg-white hover:bg-[#FAF7F2] border border-[#E7DDD0] hover:border-[#1A1F71]/50 shadow-2xs'
                    }`}
                    title="Debit / Credit Card (Mastercard + Visa)"
                  >
                    <div className="w-full h-full flex items-center justify-center gap-2 sm:gap-2.5 px-1 group-hover:scale-105 transition-transform">
                      {/* Official Mastercard Dual-Spheres Vector Logo */}
                      <svg viewBox="0 0 72 44" className="h-6 sm:h-7 w-auto shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="24" cy="22" r="20" fill="#EB001B" />
                        <circle cx="48" cy="22" r="20" fill="#F79E1B" />
                        <path d="M36 7.4A20 20 0 0 1 43.6 22A20 20 0 0 1 36 36.6A20 20 0 0 1 28.4 22A20 20 0 0 1 36 7.4Z" fill="#FF5F00" />
                      </svg>

                      {/* Divider */}
                      <div className="h-6 w-px bg-stone-300/80 shrink-0" />

                      {/* Official Visa Vector Logo with Gold Wing */}
                      <svg viewBox="0 0 102 32" className="h-5 sm:h-5.5 w-auto shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M38.5 2.5L25.3 30H17.2L10.5 8.8C10.1 7.2 9.8 6.6 8.5 6C6.5 4.9 3.1 3.9 0 3.3L0.2 2.5H13.6C15.3 2.5 16.9 3.7 17.3 5.7L20.6 22L28.8 2.5H38.5Z" fill="#1A1F71" />
                        <path d="M53.8 20.6C53.8 13.5 43.6 13.1 43.7 9.8C43.7 8.8 44.7 7.7 47 7.4C48.1 7.2 51.3 7.1 54.9 8.7L56.4 2.3C54.4 1.6 51.8 0.9 48.6 0.9C41.2 0.9 36 4.7 36 10.1C36 14.1 39.7 16.3 42.5 17.6C45.3 18.9 46.3 19.8 46.3 21C46.3 22.8 44.1 23.6 42.1 23.6C39 23.6 37.2 23.1 34.6 21.9L33.1 28.5C35.1 29.4 38.8 30.1 42.6 30.1C50.6 30.1 53.8 26.2 53.8 20.6Z" fill="#1A1F71" />
                        <path d="M69.8 30H77.5L83.5 2.5H75.8L69.8 30Z" fill="#1A1F71" />
                        <path d="M98.6 2.5H91.1C89.5 2.5 88.2 3.4 87.6 4.8L74.8 30H82.9L84.5 25.5H94.4L95.3 30H102.5L98.6 2.5ZM86.7 19.4L90.8 7.8L93.2 19.4H86.7Z" fill="#1A1F71" />
                        <path d="M8.5 6C6.5 4.9 3.1 3.9 0 3.3L0.2 2.5H13.6C15.3 2.5 16.9 3.7 17.3 5.7L20.6 22L10.5 8.8C10.1 7.2 9.8 6.6 8.5 6Z" fill="#F7B600" />
                      </svg>
                    </div>
                  </button>

                  {/* 5. Bank Transfer & Raast (Official Cloudinary Logo) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`h-[74px] sm:h-[82px] p-2 rounded-xl sm:rounded-2xl transition-all cursor-pointer relative overflow-hidden flex items-center justify-center col-span-2 sm:col-span-1 group ${
                      paymentMethod === 'bank'
                        ? 'bg-gradient-to-b from-[#FAF5EE] via-white to-[#FAF5EE] border-2 border-[#006A4E] shadow-[0_4px_16px_rgba(0,106,78,0.25)] scale-[1.02]'
                        : 'bg-white hover:bg-[#FAF7F2] border border-[#E7DDD0] hover:border-[#006A4E]/50 shadow-2xs'
                    }`}
                    title="Raast Instant Payment (State Bank of Pakistan) / Bank Transfer"
                  >
                    <Image
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039224/fahad-ali-interior/assets/raast_logo.png"
                      alt="Raast State Bank of Pakistan"
                      width={120}
                      height={60}
                      className="w-full h-full max-h-[56px] sm:max-h-[62px] object-contain group-hover:scale-105 transition-transform"
                    />
                  </button>
                </div>

                {/* 2-Column Responsive Layout: Detail + Confirmation Card */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-start">
                  
                  {/* Left Column: Active Payment Method Form (lg:col-span-7) */}
                  <div className="lg:col-span-7 space-y-3 font-sans">
                    {/* 1. Cash on Delivery Protocol */}
                    {paymentMethod === 'cod' && (
                      <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 space-y-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.02)]">
                        <div className="flex items-center justify-between border-b border-[#E7DDD0] pb-2.5">
                          <div className="flex items-center gap-2">
                            <Truck size={17} className="text-[#8C6239]" />
                            <h3 className="font-serif font-black text-sm sm:text-base text-[#221814]">
                              White-Glove Doorstep Cash Protocol (Pakistan)
                            </h3>
                          </div>
                          <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                            VERIFIED COD
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-[#E2D9CD] shadow-2xs space-y-1">
                            <span className="font-black text-[#221814] text-[11px] block">1. Doorstep Delivery</span>
                            <p className="text-stone-500 text-[10.5px] leading-relaxed">VIP logistics team delivers straight to your home.</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-[#E2D9CD] shadow-2xs space-y-1">
                            <span className="font-black text-[#221814] text-[11px] block">2. Inspect & Verify</span>
                            <p className="text-stone-500 text-[10.5px] leading-relaxed">Check wood carving, fabrics & finish before paying.</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-[#E2D9CD] shadow-2xs space-y-1">
                            <span className="font-black text-[#221814] text-[11px] block">3. Room Assembly</span>
                            <p className="text-stone-500 text-[10.5px] leading-relaxed">Master craftsmen assemble & level pieces free.</p>
                          </div>
                        </div>

                        <div className="p-3 bg-[#FAF5EE] border border-[#B88E4B]/35 rounded-xl flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#7A6354]">Payable Cash at Doorstep:</span>
                          <span className="font-sans font-black text-sm sm:text-base text-[#8C6239]">
                            Rs. {grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. Debit / Credit Card */}
                    {paymentMethod === 'card' && (
                      <CheckoutBankCardPanel
                        selectedBank={selectedBank}
                        setSelectedBank={setSelectedBank}
                        cardType={cardType}
                        setCardType={setCardType}
                        cardDetails={cardDetails}
                        setCardDetails={setCardDetails}
                        cardholderName={form.name}
                        handleCardNumberChange={handleCardNumberChange}
                        handleExpiryChange={handleExpiryChange}
                        dropdownRef={dropdownRef}
                        isBankDropdownOpen={isBankDropdownOpen}
                        setIsBankDropdownOpen={setIsBankDropdownOpen}
                        bankSearchQuery={bankSearchQuery}
                        setBankSearchQuery={setBankSearchQuery}
                        cardRef={cardRef}
                        isCardFlipped={isCardFlipped}
                        setIsCardFlipped={setIsCardFlipped}
                        tiltStyle={tiltStyle}
                        handleCardMouseMove={handleCardMouseMove}
                        handleCardMouseLeave={handleCardMouseLeave}
                      />
                    )}

                    {/* 3. Mobile Wallets & Bank Transfer */}
                    {paymentMethod !== 'card' && paymentMethod !== 'cod' && (
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 space-y-2.5 text-xs shadow-2xs">
                          {/* Official Logo Banner */}
                          <div className="flex items-center justify-between border-b border-[#E7DDD0] pb-2.5">
                            <div className="flex items-center gap-2">
                              {paymentMethod === 'jazzcash' && (
                                <Image src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto,w_140/v1788039222/fahad-ali-interior/assets/jazzcash_logo.svg" alt="JazzCash" width={100} height={24} className="h-6 w-auto object-contain" />
                              )}
                              {paymentMethod === 'easypaisa' && (
                                <Image src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/easypaisa_logo.png" alt="Easypaisa" width={100} height={22} className="h-5.5 w-auto object-contain" />
                              )}
                              {paymentMethod === 'bank' && (
                                <Image src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/raast_logo.png" alt="Raast SBP" width={100} height={24} className="h-6 w-auto object-contain" />
                              )}
                            </div>
                            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                              VERIFIED MERCHANT
                            </span>
                          </div>

                          <div className="flex justify-between items-center border-b border-[#E7DDD0] pb-2">
                            <span className="text-stone-600 font-semibold">Official Account Title:</span>
                            <span className="font-bold text-[#221814]">Fahad Ali Interior</span>
                          </div>

                          {paymentMethod === 'bank' ? (
                            <div className="space-y-2.5 border-t border-[#E7DDD0] pt-2">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-stone-600 font-semibold block text-[11px]">State Bank Raast ID:</span>
                                  <span className="text-[9px] text-emerald-700 font-medium">0% Fee Instant Settlement</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-[#1F1612] text-xs sm:text-sm bg-white border border-[#E2D9CD] px-2 py-0.5 rounded-lg shadow-2xs">
                                    {RAAST_SBP_DETAILS.raastId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(RAAST_SBP_DETAILS.raastId, 'Raast ID')}
                                    className="text-[#B88E4B] hover:text-[#8C6239] bg-white border border-[#E2D9CD] hover:border-[#B88E4B] p-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                    title="Copy Raast ID"
                                  >
                                    {copiedField === 'Raast ID' ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-stone-600 font-semibold block text-[11px]">Official IBAN:</span>
                                  <span className="text-[9px] text-stone-500 font-medium">{RAAST_SBP_DETAILS.bankName}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-[#1F1612] text-[11px] sm:text-xs bg-white border border-[#E2D9CD] px-2 py-0.5 rounded-lg shadow-2xs">
                                    {RAAST_SBP_DETAILS.iban}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(RAAST_SBP_DETAILS.iban, 'IBAN')}
                                    className="text-[#B88E4B] hover:text-[#8C6239] bg-white border border-[#E2D9CD] hover:border-[#B88E4B] p-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                    title="Copy IBAN"
                                  >
                                    {copiedField === 'IBAN' ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center border-t border-[#E7DDD0] pt-2">
                              <span className="text-stone-600 font-semibold">
                                {paymentMethod === 'jazzcash'
                                  ? 'JazzCash Merchant Mobile:'
                                  : 'Easypaisa Merchant Mobile:'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-sans font-black text-[#1F1612] tracking-wider text-xs sm:text-sm bg-white border border-[#E2D9CD] px-2 py-0.5 rounded-lg shadow-2xs">
                                  {paymentMethod === 'jazzcash' ? '0300 1234567' : '0345 1234567'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      paymentMethod === 'jazzcash' ? '03001234567' : '03451234567',
                                      'Account Number'
                                    )
                                  }
                                  className="text-[#B88E4B] hover:text-[#8C6239] bg-white border border-[#E2D9CD] hover:border-[#B88E4B] p-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                                  title="Copy Number"
                                >
                                  {copiedField === 'Account Number' ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] rounded-2xl p-4 space-y-2 shadow-2xs">
                          <label htmlFor="checkout-transaction-id" className="block text-[11px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
                            Transaction Reference ID (TID) / Sender Account
                          </label>
                          <input
                            id="checkout-transaction-id"
                            name="transactionId"
                            type="text"
                            value={digitalPaymentDetails.transactionId}
                            onChange={(e) => setDigitalPaymentDetails((p) => ({ ...p, transactionId: e.target.value }))}
                            placeholder="e.g. 8492019482 / Trx # 0300XXXXXXX"
                            className="w-full bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-sans font-bold text-[#1F1612] outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Commission Confirmation Card (Admin KPI Jewel Style - lg:col-span-5) */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.02)] font-sans">
                    <div className="flex justify-between items-center border-b border-[#E7DDD0] pb-2">
                      <span className="text-[10.5px] font-black uppercase tracking-wider text-[#7A6354]">Commission Confirmation</span>
                      <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                        SBP VERIFIED
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-stone-700">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-stone-600">Client / Recipient:</span>
                        <span className="font-bold text-[#1F1612] truncate max-w-[150px]">{form.name || 'Muhammad Fahad Ali'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-stone-600">Delivery Destination:</span>
                        <span className="font-bold text-[#1F1612]">{form.city || 'Lahore'}, {form.province || 'Punjab'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-stone-600">Transit Timeline:</span>
                        <span className="font-bold text-emerald-700">{PAKISTAN_CITIES[form.city]?.estDeliveryDays || '2-3 Working Days (TCS Express)'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-stone-600">Selected Method:</span>
                        <span className="font-black text-[#8C6239] bg-[#FAF5EE] border border-[#B88E4B]/35 px-2 py-0.5 rounded-md uppercase text-[10.5px]">
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}
                        </span>
                      </div>

                      <div className="pt-1">
                        <div className="text-[10px] text-[#7A6354] bg-white border border-[#E7DDD0] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xs">
                          <ShieldCheck size={13} className="text-[#8C6239] shrink-0" />
                          <span>FBR &amp; PRA Sales Tax Compliant (Digital Invoice Attached)</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-[#DECDBB]">
                        <span className="font-black text-xs uppercase tracking-wider text-[#7A6354]">Payable Total:</span>
                        <div className="text-lg sm:text-xl font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                          <span className="text-xs font-bold text-[#8C6D46] mr-1 select-none">Rs.</span>
                          <span className="bg-gradient-to-r from-[#B88E4B] via-[#996515] to-[#8C6239] bg-clip-text text-transparent">
                            {grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="w-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm py-3 rounded-xl shadow-[0_4px_16px_rgba(184,142,75,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-60"
                    >
                      {placing ? (
                        <Loader2 size={16} className="animate-spin text-white" />
                      ) : (
                        <Sparkles size={16} className="text-white" />
                      )}
                      <span>Authorize & Place Order</span>
                    </button>
                  </div>
                </div>
              </div>

            {/* Navigation Action */}
            <div className="pt-3 flex justify-start border-t border-[#E7DDD0]/80 mt-4">
              <button
                type="button"
                onClick={() => setCurrentSection(3)}
                className="px-5 py-2.5 rounded-xl border border-[#DECDBB] text-stone-700 hover:bg-[#FAF6F0] font-sans font-bold text-xs cursor-pointer transition-colors"
              >
                ← Back to Shipping Address
              </button>
            </div>
          </motion.div>
  );
}
