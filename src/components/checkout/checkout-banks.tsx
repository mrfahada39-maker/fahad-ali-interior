'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

export type PaymentMethodType = 'cod' | 'jazzcash' | 'easypaisa' | 'card' | 'bank';

export interface BankItem {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  code: string;
  cardTheme: {
    bgGradient: string;
    borderRim: string;
    textColor: string;
    subTextColor: string;
    accentColor: string;
    glowColor: string;
    badgeStyle: string;
    chipGradient: string;
    chipBorder: string;
  };
  renderLogo: (className?: string) => React.ReactNode;
}

export const BANKS_LIST: BankItem[] = [
  {
    id: 'meezan-bank',
    name: 'Meezan Bank',
    shortName: 'Meezan',
    tagline: 'The Premier Islamic Bank',
    code: '4339',
    cardTheme: {
      bgGradient: 'from-[#1A0626] via-[#38104F] to-[#581A7B]',
      borderRim: 'border-[#E5C158]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#581A7B',
      glowColor: 'rgba(88, 26, 123, 0.55)',
      badgeStyle: 'bg-amber-500/20 text-[#F5D77F] border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#4B1E6D" stroke="#D4AF37" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="13" fill="#361252" />
        <path d="M20 10L22 16.5H29L23.5 20.5L25.5 27L20 23L14.5 27L16.5 20.5L11 16.5H18L20 10Z" fill="#D4AF37" />
        <circle cx="20" cy="20" r="3.5" fill="#FFFFFF" />
        <circle cx="20" cy="20" r="1.5" fill="#4B1E6D" />
      </svg>
    ),
  },
  {
    id: 'hbl-bank',
    name: 'Habib Bank Limited (HBL)',
    shortName: 'HBL',
    tagline: 'Where You Come First',
    code: '1088',
    cardTheme: {
      bgGradient: 'from-[#012318] via-[#034430] to-[#096B4D]',
      borderRim: 'border-[#34D399]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#00835C',
      glowColor: 'rgba(0, 131, 92, 0.45)',
      badgeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#00835C" />
        <path d="M12 10H17V30H12V10ZM23 10H28V30H23V10ZM12 18H28V22H12V18Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'ubl-bank',
    name: 'United Bank Limited (UBL)',
    shortName: 'UBL',
    tagline: 'Where You Come First',
    code: '4482',
    cardTheme: {
      bgGradient: 'from-[#031535] via-[#092B6E] to-[#124AA6]',
      borderRim: 'border-[#60A5FA]',
      textColor: 'text-blue-50',
      subTextColor: 'text-blue-300/80',
      accentColor: '#0A4FA8',
      glowColor: 'rgba(10, 79, 168, 0.45)',
      badgeStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-blue-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#0A4FA8" />
        <path d="M14 12V22C14 25.3137 16.6863 28 20 28C23.3137 28 26 25.3137 26 22V12H22V22C22 23.1046 21.1046 24 20 24C18.8954 24 18 23.1046 18 22V12H14Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'alfalah-bank',
    name: 'Bank Alfalah',
    shortName: 'Alfalah',
    tagline: 'The Way Forward',
    code: '6610',
    cardTheme: {
      bgGradient: 'from-[#2B040B] via-[#610B19] to-[#991128]',
      borderRim: 'border-[#F87171]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#9C0E27',
      glowColor: 'rgba(156, 14, 39, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#9C0E27" />
        <path d="M12 28L20 12L28 28H23L20 21L17 28H12Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'sc-bank',
    name: 'Standard Chartered',
    shortName: 'SCB',
    tagline: 'Here for good',
    code: '3310',
    cardTheme: {
      bgGradient: 'from-[#031B2B] via-[#073B5E] to-[#0B5C91]',
      borderRim: 'border-[#38BDF8]',
      textColor: 'text-cyan-50',
      subTextColor: 'text-cyan-300/80',
      accentColor: '#0284C7',
      glowColor: 'rgba(2, 132, 199, 0.45)',
      badgeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-cyan-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#0B5C91" />
        <path d="M15 15C18 12 22 12 25 15C22 18 18 18 15 15Z" fill="#38BDF8" />
        <path d="M15 25C18 28 22 28 25 25C22 22 18 22 15 25Z" fill="#4ADE80" />
      </svg>
    ),
  },
  {
    id: 'mcb-bank',
    name: 'MCB Bank Limited',
    shortName: 'MCB',
    tagline: 'Bank for Life',
    code: '5219',
    cardTheme: {
      bgGradient: 'from-[#1A1405] via-[#382B08] to-[#5C450E]',
      borderRim: 'border-[#FBBF24]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#F59E0B" />
        <circle cx="20" cy="20" r="11" fill="#1C1505" />
        <path d="M15 20L18 14L22 22L25 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'abl-bank',
    name: 'Allied Bank Limited (ABL)',
    shortName: 'ABL',
    tagline: 'Aap Kay Saath Saath',
    code: '7412',
    cardTheme: {
      bgGradient: 'from-[#041E42] via-[#0A326E] to-[#124B9C]',
      borderRim: 'border-[#FB923C]',
      textColor: 'text-orange-50',
      subTextColor: 'text-orange-200/80',
      accentColor: '#EA580C',
      glowColor: 'rgba(234, 88, 12, 0.45)',
      badgeStyle: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#041E42" />
        <circle cx="20" cy="20" r="12" fill="#EA580C" />
        <path d="M15 25L20 15L25 25H21L20 22L19 25H15Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'faysal-bank',
    name: 'Faysal Bank Islamic',
    shortName: 'Faysal',
    tagline: 'Barkat Islamic Banking',
    code: '4820',
    cardTheme: {
      bgGradient: 'from-[#0A1633] via-[#14285E] to-[#1E3B87]',
      borderRim: 'border-[#FBBF24]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#1E3B87',
      glowColor: 'rgba(30, 59, 135, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#1E3B87" />
        <path d="M20 10L27 26H13L20 10Z" fill="#F5D77F" />
      </svg>
    ),
  },
  {
    id: 'bankislami',
    name: 'BankIslami Pakistan',
    shortName: 'BankIslami',
    tagline: 'Serving You, The Islamic Way',
    code: '3819',
    cardTheme: {
      bgGradient: 'from-[#02241F] via-[#054D43] to-[#0A7364]',
      borderRim: 'border-[#D4AF37]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0A7364',
      glowColor: 'rgba(10, 115, 100, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0A7364" />
        <circle cx="20" cy="20" r="10" fill="#D4AF37" />
        <path d="M20 13V27M13 20H27" stroke="#02241F" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'askari-bank',
    name: 'Askari Bank Limited',
    shortName: 'Askari',
    tagline: 'Committed to Excellence',
    code: '8910',
    cardTheme: {
      bgGradient: 'from-[#081326] via-[#102447] to-[#193B73]',
      borderRim: 'border-[#60A5FA]',
      textColor: 'text-blue-50',
      subTextColor: 'text-blue-300/80',
      accentColor: '#193B73',
      glowColor: 'rgba(25, 59, 115, 0.45)',
      badgeStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#102447" />
        <path d="M14 26L20 14L26 26H14Z" fill="#60A5FA" />
      </svg>
    ),
  },
  {
    id: 'nbp-bank',
    name: 'National Bank of Pakistan (NBP)',
    shortName: 'NBP',
    tagline: "The Nation's Bank",
    code: '1947',
    cardTheme: {
      bgGradient: 'from-[#022114] via-[#05442A] to-[#0B6B43]',
      borderRim: 'border-[#FBBF24]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0B6B43',
      glowColor: 'rgba(11, 107, 67, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0B6B43" />
        <circle cx="20" cy="20" r="12" fill="#FBBF24" />
        <path d="M20 12V28M12 20H28" stroke="#022114" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'dib-bank',
    name: 'Dubai Islamic Bank (DIB)',
    shortName: 'DIB',
    tagline: 'The Better Way to Bank',
    code: '7721',
    cardTheme: {
      bgGradient: 'from-[#171103] via-[#332607] to-[#543F0C]',
      borderRim: 'border-[#FCD34D]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#D97706',
      glowColor: 'rgba(217, 119, 6, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#543F0C" />
        <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="#FCD34D" />
      </svg>
    ),
  },
  {
    id: 'bop-bank',
    name: 'The Bank of Punjab (BOP)',
    shortName: 'BOP',
    tagline: 'Passion to Serve',
    code: '6019',
    cardTheme: {
      bgGradient: 'from-[#031D33] via-[#07365C] to-[#0D528A]',
      borderRim: 'border-[#38BDF8]',
      textColor: 'text-cyan-50',
      subTextColor: 'text-cyan-300/80',
      accentColor: '#0D528A',
      glowColor: 'rgba(13, 82, 138, 0.45)',
      badgeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-cyan-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0D528A" />
        <circle cx="20" cy="20" r="10" fill="#38BDF8" />
        <path d="M17 17H23V23H17V17Z" fill="#031D33" />
      </svg>
    ),
  },
  {
    id: 'soneri-bank',
    name: 'Soneri Bank Limited',
    shortName: 'Soneri',
    tagline: 'Roshan Har Qadam',
    code: '8830',
    cardTheme: {
      bgGradient: 'from-[#240A1A] via-[#4D1537] to-[#782156]',
      borderRim: 'border-[#F472B6]',
      textColor: 'text-pink-50',
      subTextColor: 'text-pink-300/80',
      accentColor: '#782156',
      glowColor: 'rgba(120, 33, 86, 0.45)',
      badgeStyle: 'bg-pink-500/20 text-pink-200 border-pink-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#782156" />
        <circle cx="20" cy="20" r="8" fill="#F472B6" />
      </svg>
    ),
  },
  {
    id: 'js-bank',
    name: 'JS Bank Limited',
    shortName: 'JS Bank',
    tagline: 'Financial Excellence',
    code: '5190',
    cardTheme: {
      bgGradient: 'from-[#031526] via-[#092B4D] to-[#0F4378]',
      borderRim: 'border-[#60A5FA]',
      textColor: 'text-blue-50',
      subTextColor: 'text-blue-300/80',
      accentColor: '#0F4378',
      glowColor: 'rgba(15, 67, 120, 0.45)',
      badgeStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-blue-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0F4378" />
        <path d="M14 16H26V20H14V16ZM14 22H22V26H14V22Z" fill="#60A5FA" />
      </svg>
    ),
  },
  {
    id: 'sadapay-bank',
    name: 'SadaPay (Mastercard)',
    shortName: 'SadaPay',
    tagline: 'Money Made Simple',
    code: '9012',
    cardTheme: {
      bgGradient: 'from-[#0F0F12] via-[#1C1917] to-[#292524]',
      borderRim: 'border-[#FB7185]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#F43F5E',
      glowColor: 'rgba(244, 63, 94, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-rose-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#F43F5E" />
        <circle cx="20" cy="20" r="10" fill="#FFFFFF" />
        <path d="M16 20H24M20 16V24" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'nayapay-bank',
    name: 'NayaPay (Visa Platinum)',
    shortName: 'NayaPay',
    tagline: 'A Wallet for Everyday Life',
    code: '4109',
    cardTheme: {
      bgGradient: 'from-[#0A1624] via-[#12273D] to-[#1C3B5E]',
      borderRim: 'border-[#FB923C]',
      textColor: 'text-orange-50',
      subTextColor: 'text-orange-300/80',
      accentColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.45)',
      badgeStyle: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-orange-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#F97316" />
        <circle cx="20" cy="20" r="10" fill="#FFFFFF" />
        <path d="M16 16L24 24M24 16L16 24" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'habib-metro',
    name: 'Habib Metropolitan Bank',
    shortName: 'Habib Metro',
    tagline: 'Stay Ahead',
    code: '5510',
    cardTheme: {
      bgGradient: 'from-[#022B22] via-[#075945] to-[#0D7A60]',
      borderRim: 'border-[#D4AF37]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#075945',
      glowColor: 'rgba(7, 89, 69, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#075945" />
        <circle cx="20" cy="20" r="11" fill="#D4AF37" />
        <path d="M14 20H26M20 14V26" stroke="#022B22" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'bok-bank',
    name: 'The Bank of Khyber (BOK)',
    shortName: 'BOK',
    tagline: 'Your Partner in Progress',
    code: '2301',
    cardTheme: {
      bgGradient: 'from-[#021A15] via-[#053D32] to-[#0A6352]',
      borderRim: 'border-[#34D399]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0A6352',
      glowColor: 'rgba(10, 99, 82, 0.45)',
      badgeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#053D32" />
        <path d="M13 25L20 13L27 25H13Z" fill="#34D399" />
      </svg>
    ),
  },
  {
    id: 'albaraka-bank',
    name: 'Al Baraka Bank (Pakistan)',
    shortName: 'Al Baraka',
    tagline: 'Your Partner in Prosperity',
    code: '7119',
    cardTheme: {
      bgGradient: 'from-[#05261F] via-[#0A4D3E] to-[#12705C]',
      borderRim: 'border-[#E5C158]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#12705C',
      glowColor: 'rgba(18, 112, 92, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#12705C" />
        <circle cx="20" cy="20" r="12" fill="#E5C158" />
      </svg>
    ),
  },
  {
    id: 'sindh-bank',
    name: 'Sindh Bank Limited',
    shortName: 'Sindh Bank',
    tagline: 'Powering Your Future',
    code: '8209',
    cardTheme: {
      bgGradient: 'from-[#1A0A02] via-[#4D1F08] to-[#80350E]',
      borderRim: 'border-[#F97316]',
      textColor: 'text-orange-50',
      subTextColor: 'text-orange-300/80',
      accentColor: '#80350E',
      glowColor: 'rgba(128, 53, 14, 0.45)',
      badgeStyle: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#80350E" />
        <circle cx="20" cy="20" r="10" fill="#F97316" />
      </svg>
    ),
  },
  {
    id: 'silkbank',
    name: 'Silkbank Limited',
    shortName: 'Silkbank',
    tagline: 'Yes We Can',
    code: '3190',
    cardTheme: {
      bgGradient: 'from-[#240308] via-[#590B18] to-[#8C142A]',
      borderRim: 'border-[#F87171]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#8C142A',
      glowColor: 'rgba(140, 20, 42, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-rose-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#8C142A" />
        <circle cx="20" cy="20" r="10" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'bml-bank',
    name: 'Bank Makramah Limited (BML)',
    shortName: 'BML',
    tagline: 'Islamic Banking Solutions',
    code: '4910',
    cardTheme: {
      bgGradient: 'from-[#0A1829] via-[#143254] to-[#1E4D82]',
      borderRim: 'border-[#FCD34D]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#1E4D82',
      glowColor: 'rgba(30, 77, 130, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#1E4D82" />
        <path d="M15 15H25V25H15V15Z" fill="#FCD34D" />
      </svg>
    ),
  },
  {
    id: 'samba-bank',
    name: 'Samba Bank Limited',
    shortName: 'Samba',
    tagline: 'World Class Banking',
    code: '6620',
    cardTheme: {
      bgGradient: 'from-[#031B33] via-[#083663] to-[#0D5294]',
      borderRim: 'border-[#38BDF8]',
      textColor: 'text-cyan-50',
      subTextColor: 'text-cyan-300/80',
      accentColor: '#0D5294',
      glowColor: 'rgba(13, 82, 148, 0.45)',
      badgeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-cyan-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0D5294" />
        <circle cx="20" cy="20" r="10" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    id: 'fwbl-bank',
    name: 'First Women Bank Limited (FWBL)',
    shortName: 'FWBL',
    tagline: 'Empowering Women, Transforming Pakistan',
    code: '1989',
    cardTheme: {
      bgGradient: 'from-[#240B1E] via-[#4D1840] to-[#7A2766]',
      borderRim: 'border-[#E879F9]',
      textColor: 'text-pink-50',
      subTextColor: 'text-pink-300/80',
      accentColor: '#7A2766',
      glowColor: 'rgba(122, 39, 102, 0.45)',
      badgeStyle: 'bg-pink-500/20 text-pink-200 border-pink-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-pink-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#7A2766" />
        <circle cx="20" cy="20" r="8" fill="#E879F9" />
      </svg>
    ),
  },
  {
    id: 'icbc-bank',
    name: 'ICBC Pakistan',
    shortName: 'ICBC',
    tagline: 'Excellence Without Borders',
    code: '1390',
    cardTheme: {
      bgGradient: 'from-[#240407] via-[#520C13] to-[#801620]',
      borderRim: 'border-[#E5C158]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#801620',
      glowColor: 'rgba(128, 22, 32, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#801620" />
        <path d="M14 20H26" stroke="#E5C158" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'citibank',
    name: 'Citibank N.A. Pakistan',
    shortName: 'Citibank',
    tagline: 'Global Financial Powerhouse',
    code: '2110',
    cardTheme: {
      bgGradient: 'from-[#021326] via-[#052952] to-[#0A4282]',
      borderRim: 'border-[#60A5FA]',
      textColor: 'text-blue-50',
      subTextColor: 'text-blue-300/80',
      accentColor: '#0A4282',
      glowColor: 'rgba(10, 66, 130, 0.45)',
      badgeStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-blue-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0A4282" />
        <path d="M14 24C16 16 24 16 26 24" stroke="#EF4444" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'boc-bank',
    name: 'Bank of China (BOC Pakistan)',
    shortName: 'BOC',
    tagline: 'Global Service, Trusted Quality',
    code: '1912',
    cardTheme: {
      bgGradient: 'from-[#210406] via-[#4D0B10] to-[#78141C]',
      borderRim: 'border-[#FBBF24]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#78141C',
      glowColor: 'rgba(120, 20, 28, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#78141C" />
        <circle cx="20" cy="20" r="8" stroke="#FBBF24" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'mmbl-bank',
    name: 'Mobilink Microfinance Bank (MMBL)',
    shortName: 'MMBL (JazzCash)',
    tagline: 'Financial Inclusion for Everyone',
    code: '9201',
    cardTheme: {
      bgGradient: 'from-[#1F0404] via-[#4A0A0A] to-[#731212]',
      borderRim: 'border-[#EF4444]',
      textColor: 'text-rose-50',
      subTextColor: 'text-rose-300/80',
      accentColor: '#731212',
      glowColor: 'rgba(115, 18, 18, 0.45)',
      badgeStyle: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-rose-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#731212" />
        <circle cx="20" cy="20" r="10" fill="#EF4444" />
      </svg>
    ),
  },
  {
    id: 'telenor-bank',
    name: 'Telenor Microfinance Bank (Easypaisa)',
    shortName: 'Telenor Bank',
    tagline: 'Digital Banking for All',
    code: '9202',
    cardTheme: {
      bgGradient: 'from-[#012419] via-[#044D36] to-[#087351]',
      borderRim: 'border-[#10B981]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#087351',
      glowColor: 'rgba(8, 115, 81, 0.45)',
      badgeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-emerald-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#087351" />
        <path d="M14 20L18 24L26 16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ubank',
    name: 'U Microfinance Bank (U Bank)',
    shortName: 'U Bank',
    tagline: 'Empowering Livelihoods',
    code: '9203',
    cardTheme: {
      bgGradient: 'from-[#1F0C02] via-[#4D2007] to-[#7A340D]',
      borderRim: 'border-[#FB923C]',
      textColor: 'text-orange-50',
      subTextColor: 'text-orange-300/80',
      accentColor: '#7A340D',
      glowColor: 'rgba(122, 52, 13, 0.45)',
      badgeStyle: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-orange-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#7A340D" />
        <circle cx="20" cy="20" r="10" fill="#FB923C" />
      </svg>
    ),
  },
  {
    id: 'khushhali-bank',
    name: 'Khushhali Microfinance Bank',
    shortName: 'Khushhali',
    tagline: "Pakistan's Pioneer Microfinance Bank",
    code: '9204',
    cardTheme: {
      bgGradient: 'from-[#031F15] via-[#074731] to-[#0C6E4D]',
      borderRim: 'border-[#34D399]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0C6E4D',
      glowColor: 'rgba(12, 110, 77, 0.45)',
      badgeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-emerald-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#0C6E4D" />
        <circle cx="20" cy="20" r="8" fill="#34D399" />
      </svg>
    ),
  },
  {
    id: 'finca-bank',
    name: 'FINCA Microfinance Bank',
    shortName: 'FINCA',
    tagline: 'Building Tomorrow Today',
    code: '9205',
    cardTheme: {
      bgGradient: 'from-[#021A2B] via-[#06395C] to-[#0B598F]',
      borderRim: 'border-[#38BDF8]',
      textColor: 'text-cyan-50',
      subTextColor: 'text-cyan-300/80',
      accentColor: '#0B598F',
      glowColor: 'rgba(11, 89, 143, 0.45)',
      badgeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-cyan-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0B598F" />
        <circle cx="20" cy="20" r="10" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    id: 'nrsp-bank',
    name: 'NRSP Microfinance Bank',
    shortName: 'NRSP Bank',
    tagline: 'Banking with Social Purpose',
    code: '9206',
    cardTheme: {
      bgGradient: 'from-[#022116] via-[#05452F] to-[#096B49]',
      borderRim: 'border-[#10B981]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#096B49',
      glowColor: 'rgba(9, 107, 73, 0.45)',
      badgeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-emerald-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#096B49" />
        <circle cx="20" cy="20" r="10" fill="#10B981" />
      </svg>
    ),
  },
  {
    id: 'bank-al-habib',
    name: 'Bank AL Habib Limited',
    shortName: 'Bank AL Habib',
    tagline: 'Rishta Bharosay Ka',
    code: '1014',
    cardTheme: {
      bgGradient: 'from-[#022415] via-[#054D2E] to-[#0A7347]',
      borderRim: 'border-[#D4AF37]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0A7347',
      glowColor: 'rgba(10, 115, 71, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#054D2E" />
        <circle cx="20" cy="20" r="11" fill="#D4AF37" />
        <path d="M20 12L25 24H15L20 12Z" fill="#054D2E" />
      </svg>
    ),
  },
  {
    id: 'mcb-islamic',
    name: 'MCB Islamic Bank Limited',
    shortName: 'MCB Islamic',
    tagline: 'Pure Banking, Pure Values',
    code: '5220',
    cardTheme: {
      bgGradient: 'from-[#04162E] via-[#0B2C5C] to-[#12458A]',
      borderRim: 'border-[#E5C158]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#12458A',
      glowColor: 'rgba(18, 69, 138, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#0B2C5C" />
        <circle cx="20" cy="20" r="12" stroke="#E5C158" strokeWidth="2" />
        <path d="M20 13V27M13 20H27" stroke="#E5C158" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'ztbl-bank',
    name: 'Zarai Taraqiati Bank Limited (ZTBL)',
    shortName: 'ZTBL',
    tagline: 'Empowering Agriculture in Pakistan',
    code: '3301',
    cardTheme: {
      bgGradient: 'from-[#022112] via-[#064225] to-[#0D6B3C]',
      borderRim: 'border-[#FBBF24]',
      textColor: 'text-emerald-50',
      subTextColor: 'text-emerald-300/80',
      accentColor: '#0D6B3C',
      glowColor: 'rgba(13, 107, 60, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#064225" />
        <circle cx="20" cy="20" r="11" fill="#FBBF24" />
        <path d="M20 14V26M15 18L20 14L25 18" stroke="#022112" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ppcb-bank',
    name: 'Punjab Provincial Cooperative Bank (PPCB)',
    shortName: 'PPCB',
    tagline: 'Cooperative Finance for Growth',
    code: '4401',
    cardTheme: {
      bgGradient: 'from-[#041C30] via-[#083861] to-[#0D5794]',
      borderRim: 'border-[#38BDF8]',
      textColor: 'text-cyan-50',
      subTextColor: 'text-cyan-300/80',
      accentColor: '#0D5794',
      glowColor: 'rgba(13, 87, 148, 0.45)',
      badgeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-cyan-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#083861" />
        <circle cx="20" cy="20" r="10" fill="#38BDF8" />
      </svg>
    ),
  },
  {
    id: 'deutsche-bank',
    name: 'Deutsche Bank AG Pakistan',
    shortName: 'Deutsche Bank',
    tagline: 'Expect the World of Us',
    code: '2105',
    cardTheme: {
      bgGradient: 'from-[#01142B] via-[#032959] to-[#05428F]',
      borderRim: 'border-[#60A5FA]',
      textColor: 'text-blue-50',
      subTextColor: 'text-blue-300/80',
      accentColor: '#05428F',
      glowColor: 'rgba(5, 66, 143, 0.45)',
      badgeStyle: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-blue-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0018A8" />
        <rect x="10" y="10" width="20" height="20" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
        <line x1="13" y1="27" x2="27" y2="13" stroke="#FFFFFF" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'mashreq-bank',
    name: 'Mashreq Bank Pakistan Limited',
    shortName: 'Mashreq Bank',
    tagline: 'Rise Every Day',
    code: '8812',
    cardTheme: {
      bgGradient: 'from-[#1F0C02] via-[#4A1E06] to-[#78320B]',
      borderRim: 'border-[#FB923C]',
      textColor: 'text-orange-50',
      subTextColor: 'text-orange-300/80',
      accentColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.45)',
      badgeStyle: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-orange-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#F97316" />
        <circle cx="20" cy="20" r="10" fill="#FFFFFF" />
        <circle cx="20" cy="20" r="6" fill="#F97316" />
      </svg>
    ),
  },
  {
    id: 'raqami-bank',
    name: 'Raqami Islamic Digital Bank Limited',
    shortName: 'Raqami Digital',
    tagline: "Pakistan's Islamic Digital Bank",
    code: '9901',
    cardTheme: {
      bgGradient: 'from-[#061F24] via-[#0D404A] to-[#166675]',
      borderRim: 'border-[#2DD4BF]',
      textColor: 'text-teal-50',
      subTextColor: 'text-teal-300/80',
      accentColor: '#14B8A6',
      glowColor: 'rgba(20, 184, 166, 0.45)',
      badgeStyle: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
      chipGradient: 'from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
      chipBorder: 'border-teal-200',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0D404A" />
        <circle cx="20" cy="20" r="10" stroke="#2DD4BF" strokeWidth="2.5" />
        <path d="M16 20H24" stroke="#2DD4BF" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'raast-sbp',
    name: 'Raast (State Bank of Pakistan)',
    shortName: 'Raast SBP',
    tagline: 'Instant National Payment System',
    code: '0001',
    cardTheme: {
      bgGradient: 'from-[#011C13] via-[#033B28] to-[#065C3F]',
      borderRim: 'border-[#D4AF37]',
      textColor: 'text-amber-100',
      subTextColor: 'text-amber-300/80',
      accentColor: '#065C3F',
      glowColor: 'rgba(6, 92, 63, 0.45)',
      badgeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      chipGradient: 'from-[#F5D77F] via-[#D4AF37] to-[#8C6239]',
      chipBorder: 'border-amber-300',
    },
    renderLogo: (className = 'w-5 h-5') => (
      <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#065C3F" />
        <circle cx="20" cy="20" r="12" fill="#D4AF37" />
        <path d="M16 20L19 23L24 17" stroke="#011C13" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
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
            <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider">
              Select Pakistani Bank ({BANKS_LIST.length} Banks)
            </label>
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
          <label className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider block mb-1">
            Card Mode
          </label>
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
      </div>
    </div>
  );
}
