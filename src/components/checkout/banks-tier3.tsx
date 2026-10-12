import React from 'react';
import { BankItem } from './checkout-banks-types';

export const TIER3_BANKS: BankItem[] = [
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
