'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { PaymentMethodType, BankItem } from './checkout-banks-types';
import { TIER1_BANKS } from './banks-tier1';
import { TIER2_BANKS } from './banks-tier2';
import { TIER3_BANKS } from './banks-tier3';

export type { PaymentMethodType, BankItem };

export const BANKS_LIST: BankItem[] = [
  ...TIER1_BANKS,
  ...TIER2_BANKS,
  ...TIER3_BANKS,
];

export interface CheckoutBankCardPanelProps {
  selectedBank: BankItem;
  setSelectedBank: (bank: BankItem) => void;
  cardType: 'debit' | 'credit';
  setCardType: (type: 'debit' | 'credit') => void;
  cardDetails: { number: string; expiry: string; cvv: string };
  setCardDetails: React.Dispatch<React.SetStateAction<{ number: string; expiry: string; cvv: string }>>;
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
}

export function CheckoutBankCardPanel({
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
}: CheckoutBankCardPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch font-sans">
      {/* Interactive Luxury 3D ATM Card Preview (md:col-span-6) */}
      <div className="md:col-span-6 flex flex-col items-center gap-2 font-sans">
        <div
          ref={cardRef}
          onClick={() => setIsCardFlipped((p) => !p)}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          className="w-full aspect-[1.586/1] min-h-[220px] relative select-none cursor-pointer [perspective:1200px] group will-change-transform"
          title="Click card to flip"
        >
          {/* 3D Flip Inner Container */}
          <div
            style={{
              transform: `rotateY(${isCardFlipped ? 180 : 0}deg) rotateX(${isCardFlipped ? -tiltStyle.rotateX : tiltStyle.rotateX}deg) rotateY(${tiltStyle.rotateY}deg)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className="w-full h-full relative rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
          >
            {/* FRONT SIDE */}
            <div
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              className={`absolute inset-0 w-full h-full rounded-2xl p-4 sm:p-5 overflow-hidden bg-gradient-to-tr ${selectedBank.cardTheme.bgGradient} border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.6)] flex flex-col justify-between`}
            >
              {/* Security Guilloché Micro-Pattern Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.2) 50%, transparent 52%)`,
                  backgroundSize: '16px 16px, 32px 32px',
                }}
              />

              {/* Dynamic Holographic Specular Glare */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-150"
                style={{
                  background: `radial-gradient(circle at ${tiltStyle.glareX}% ${tiltStyle.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.25) 25%, transparent 60%)`,
                }}
              />

              {/* Ambient Bank Glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl pointer-events-none opacity-40 transition-colors duration-500"
                style={{ backgroundColor: selectedBank.cardTheme.accentColor }}
              />

              {/* Top Row: Bank Identity & NFC Contactless */}
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center p-1 shadow-sm">
                    {selectedBank.renderLogo('w-5 h-5')}
                  </div>
                  <div>
                    <span className={`text-xs sm:text-sm font-serif font-black tracking-wide block leading-tight ${selectedBank.cardTheme.textColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
                      {selectedBank.name}
                    </span>
                    <span className="text-[8px] font-sans font-bold text-white/70 tracking-widest block uppercase drop-shadow-xs">
                      {selectedBank.tagline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white/90 drop-shadow-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M7 17a6 6 0 0 1 0-10" />
                    <path d="M11 19a9 9 0 0 0 0-14" />
                    <path d="M15 21a12 12 0 0 0 0-18" />
                  </svg>
                  <span
                    className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-inner transition-colors duration-300 ${selectedBank.cardTheme.badgeStyle}`}
                  >
                    {cardType === 'credit' ? 'CREDIT' : 'DEBIT'}
                  </span>
                </div>
              </div>

              {/* Middle Row: EMV Chip & Microtext */}
              <div className="flex items-center justify-between my-auto relative z-10">
                <div className="w-11 h-8.5 rounded-md bg-gradient-to-br from-[#FFE082] via-[#FFCA28] to-[#B28900] border border-[#FFE082] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_2px_rgba(0,0,0,0.5),0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center relative overflow-hidden">
                  <div className="w-full h-[1px] bg-[#6D4C41]/60 absolute top-2.5" />
                  <div className="w-full h-[1px] bg-[#6D4C41]/60 absolute bottom-2.5" />
                  <div className="h-full w-[1px] bg-[#6D4C41]/60 absolute left-3.5" />
                  <div className="h-full w-[1px] bg-[#6D4C41]/60 absolute right-3.5" />
                  <div className="w-3.5 h-3 rounded bg-gradient-to-b from-[#FFD54F] to-[#C79100] border border-[#6D4C41]/40 shadow-inner z-10" />
                </div>
                <span className="text-[8px] font-mono font-bold text-white/60 uppercase tracking-[0.2em] bg-black/25 px-2 py-0.5 rounded backdrop-blur-xs border border-white/10">
                  {selectedBank.shortName.toUpperCase()} • ELECTRONIC USE ONLY
                </span>
              </div>

              {/* Card Number Embossed */}
              <div className="relative z-10 my-1">
                <div
                  className={`font-mono text-base sm:text-lg font-black tracking-[0.22em] ${selectedBank.cardTheme.textColor}`}
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 1px rgba(255,255,255,0.3)',
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
                  }}
                >
                  {cardDetails.number ? cardDetails.number : '4532 •••• •••• 3456'}
                </div>
              </div>

              {/* Bottom Row: Cardholder & Expiry & Logo */}
              <div className="flex justify-between items-end relative z-10 pt-1.5 border-t border-white/20">
                <div className="space-y-0.5 max-w-[140px]">
                  <span className="text-[7.5px] font-mono uppercase text-white/60 tracking-widest block font-bold">
                    CARDHOLDER
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-sans font-black tracking-wider truncate block uppercase ${selectedBank.cardTheme.textColor}`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                  >
                    {cardholderName ? cardholderName : 'MUHAMMAD FAHAD ALI'}
                  </span>
                </div>

                <div className="space-y-0.5 text-center">
                  <span className="text-[7px] font-mono uppercase text-white/60 tracking-wider block font-bold">
                    VALID THRU
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-mono font-bold block ${selectedBank.cardTheme.textColor}`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                  >
                    {cardDetails.expiry ? cardDetails.expiry : '12/28'}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex -space-x-2.5 items-center">
                    <div className="w-6 h-6 rounded-full bg-[#EB001B] opacity-95 shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                    <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90 shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                  </div>
                  <span className="text-[7px] font-sans font-extrabold text-white/90 tracking-tighter drop-shadow-xs -mt-1">
                    mastercard
                  </span>
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-gradient-to-tr ${selectedBank.cardTheme.bgGradient} border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.6)] flex flex-col justify-between py-3 sm:py-3.5`}
            >
              {/* Dynamic Holographic Specular Glare */}
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-150"
                style={{
                  background: `radial-gradient(circle at ${100 - tiltStyle.glareX}% ${tiltStyle.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.25) 25%, transparent 60%)`,
                }}
              />

              {/* 1. Black Magnetic Stripe */}
              <div className="w-full h-8.5 sm:h-9.5 bg-[#111115] shadow-inner relative z-10 flex items-center px-4">
                <div className="w-full h-[1px] bg-white/10" />
              </div>

              {/* 2. White Security Signature Bar with CVC / CVV */}
              <div className="px-4 space-y-1 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-mono uppercase text-white/60 tracking-wider">
                    Authorized Signature • Not Valid Unless Signed
                  </span>
                  <span className="text-[7px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                    SECURITY CODE
                  </span>
                </div>

                <div className="flex items-center">
                  <div
                    className="flex-1 h-7 sm:h-8 bg-[#F4F4F6] rounded-l-md border border-stone-300 flex items-center px-3 relative overflow-hidden"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 5px, #f3f4f6 5px, #f3f4f6 10px)`,
                    }}
                  >
                    <span className="font-serif italic font-semibold text-stone-800 text-xs sm:text-sm tracking-wider select-none truncate">
                      {cardholderName || 'Muhammad Fahad Ali'}
                    </span>
                  </div>

                  <div className="w-14 sm:w-16 h-7 sm:h-8 bg-white border-y border-r border-stone-300 rounded-r-md flex items-center justify-center shadow-inner">
                    <span className="font-mono italic font-black text-stone-900 text-xs sm:text-sm tracking-widest">
                      {cardDetails.cvv ? cardDetails.cvv : '849'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Bank Legal Micro-Text & Interbank Network */}
              <div className="px-4 flex justify-between items-end relative z-10 pt-1 border-t border-white/15">
                <div className="max-w-[200px] space-y-0.5">
                  <p className="text-[7px] font-sans text-white/70 leading-tight">
                    24/7 Helpline: <strong className="text-white">111-00-1987</strong> • Issued under license from State Bank of Pakistan. Property of {selectedBank.name}.
                  </p>
                  <span className="text-[6.5px] font-mono text-white/50 block">
                    If found, return to nearest {selectedBank.shortName} Branch.
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-white/15 border border-white/20 text-[8px] font-black text-white">
                    1LINK
                  </div>
                  <div className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-400/40 text-[8px] font-black text-emerald-300">
                    PayPak
                  </div>
                  <div className="flex -space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#EB001B] opacity-90" />
                    <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Micro Flip Hint Pill */}
        <button
          type="button"
          onClick={() => setIsCardFlipped((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] hover:bg-[#F3EAD9] border border-[#B88E4B]/40 text-[#8C6239] text-[10.5px] font-black tracking-wider cursor-pointer shadow-2xs transition-colors"
        >
          <span>🔄</span>
          <span>{isCardFlipped ? 'Click to show Front Side' : 'Click to show Back Side (CVC / CVV)'}</span>
        </button>
      </div>

      {/* Card Controls & Form Inputs (md:col-span-6) */}
      <div className="md:col-span-6 space-y-2.5 flex flex-col justify-between">
        {/* 1. Bank Selector Dropdown with Search */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider">
              Select Pakistani Bank ({BANKS_LIST.length} Banks)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsBankDropdownOpen((prev) => !prev);
              setBankSearchQuery('');
            }}
            className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E0D7CB] hover:border-[#B88E4B] rounded-xl px-3 py-2 flex items-center justify-between text-xs font-semibold text-[#1F1612] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedBank.renderLogo('w-4 h-4 shrink-0')}
              <span className="font-bold truncate">{selectedBank.name}</span>
            </div>
            {isBankDropdownOpen ? <ChevronUp size={15} className="text-stone-600 shrink-0" /> : <ChevronDown size={15} className="text-stone-600 shrink-0" />}
          </button>

          {isBankDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0D7CB] rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto py-1 px-1 divide-y divide-stone-100">
              <div className="p-1.5 sticky top-0 bg-white z-10 border-b border-stone-100">
                <input
                  id="checkout-bank-search"
                  name="bankSearch"
                  type="text"
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  placeholder="🔍  Search bank (Meezan, HBL, UBL, ABL...)"
                  className="w-full bg-[#FAF5EE] border border-[#E2D9CD] focus:border-[#B88E4B] rounded-lg px-2.5 py-1 text-xs font-medium text-[#1F1612] outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {BANKS_LIST.filter(
                (b) =>
                  b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                  b.shortName.toLowerCase().includes(bankSearchQuery.toLowerCase())
              ).map((bank) => {
                const isSelected = selectedBank.id === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      setSelectedBank(bank);
                      setIsBankDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'border border-[#C5A059] bg-[#FAF5EE] text-[#1F1612] font-bold' : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {bank.renderLogo('w-4 h-4 shrink-0')}
                      <span className="truncate">{bank.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-[#B88E4B] shrink-0" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Card Type (Debit vs Credit) Switcher */}
        <div className="space-y-1">
          <span className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
            Card Mode
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCardType('debit')}
              className={`py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                cardType === 'debit'
                  ? 'bg-[#8C6239] text-white border-[#8C6239] shadow-2xs'
                  : 'bg-white text-stone-700 border-[#E2D9CD] hover:border-[#B88E4B]'
              }`}
            >
              <span>💳</span>
              <span>Debit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setCardType('credit')}
              className={`py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border ${
                cardType === 'credit'
                  ? 'bg-[#8C6239] text-white border-[#8C6239] shadow-2xs'
                  : 'bg-white text-stone-700 border-[#E2D9CD] hover:border-[#B88E4B]'
              }`}
            >
              <span>✨</span>
              <span>Credit Card</span>
            </button>
          </div>
        </div>

        {/* 3. Card Number Input */}
        <div>
          <label htmlFor="checkout-card-number" className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
            Card Number <span className="text-amber-700">*</span>
          </label>
          <input
            id="checkout-card-number"
            name="cardNumber"
            autoComplete="cc-number"
            type="text"
            value={cardDetails.number}
            onChange={handleCardNumberChange}
            maxLength={19}
            placeholder="4532 8891 7890 3456"
            className="w-full bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-black text-[#1F1612] outline-none shadow-2xs tracking-wider"
          />
        </div>

        {/* 4. Expiry & CVV */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="checkout-card-expiry" className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
              Expiry Date <span className="text-amber-700">*</span>
            </label>
            <input
              id="checkout-card-expiry"
              name="cardExpiry"
              autoComplete="cc-exp"
              type="text"
              value={cardDetails.expiry}
              onChange={handleExpiryChange}
              maxLength={5}
              placeholder="12/28"
              className="w-full bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#1F1612] outline-none text-center shadow-2xs"
            />
          </div>
          <div>
            <label htmlFor="checkout-card-cvv" className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
              CVV Code <span className="text-amber-700">*</span>
            </label>
            <input
              id="checkout-card-cvv"
              name="cardCvv"
              autoComplete="cc-csc"
              type="password"
              value={cardDetails.cvv}
              onFocus={() => setIsCardFlipped(true)}
              onBlur={() => setIsCardFlipped(false)}
              onChange={(e) => setCardDetails((p) => ({ ...p, cvv: e.target.value.slice(0, 4) }))}
              maxLength={4}
              placeholder="•••"
              className="w-full bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#1F1612] outline-none text-center shadow-2xs"
            />
          </div>
        </div>

        {/* Transparent Card Authorization Notice */}
        <div className="bg-[#FAF7F2] border border-[#E2D9CD] rounded-xl p-2.5 text-[10.5px] text-[#7A6354] leading-relaxed flex items-start gap-2">
          <span className="text-amber-700 text-sm shrink-0">🛡️</span>
          <span>
            <strong className="text-[#2C1E18]">Direct Card Authorization:</strong> Your card is validated for booking reservation. No immediate funds will be auto-debited until your order is verified with our master concierge. For instant digital settlement, select <strong>Raast Instant IBFT</strong>, <strong>JazzCash</strong>, or <strong>Easypaisa</strong>.
          </span>
        </div>
      </div>
    </div>
  );
}
