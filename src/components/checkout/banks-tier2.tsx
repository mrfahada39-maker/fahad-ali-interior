import React from 'react';
import { BankItem } from './checkout-banks-types';

export const TIER2_BANKS: BankItem[] = [
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
];
