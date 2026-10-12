import React from 'react';
import { BankItem } from './checkout-banks-types';

export const TIER1_BANKS: BankItem[] = [
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
];
