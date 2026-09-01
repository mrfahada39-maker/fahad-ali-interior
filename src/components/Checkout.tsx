'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  CheckCheck,
  CreditCard,
  Building,
  Zap,
  Lock,
  Tag,
  Sparkles,
  ShieldCheck,
  Truck,
  Upload,
  Plus,
  Minus,
  Wallet,
  ShoppingBag,
  Crown,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { apiFetch } from '@/lib/api-client';
import { resolveImageUrl } from '@/lib/images';
import { toast } from 'sonner';

// ── Payment Method Types ────────────────────────────────────────────────────
export type PaymentMethodType = 'cod' | 'jazzcash' | 'easypaisa' | 'card' | 'bank';

interface BankItem {
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

const BANKS_LIST: BankItem[] = [
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

const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir (AJK)',
];

const PAKISTAN_CITIES_MAP: Record<string, string> = {
  Lahore: 'Punjab',
  Karachi: 'Sindh',
  Islamabad: 'Islamabad Capital Territory',
  Rawalpindi: 'Punjab',
  Faisalabad: 'Punjab',
  Multan: 'Punjab',
  Peshawar: 'Khyber Pakhtunkhwa (KPK)',
  Quetta: 'Balochistan',
  Sialkot: 'Punjab',
  Gujranwala: 'Punjab',
  Bahawalpur: 'Punjab',
  Sargodha: 'Punjab',
  Sukkur: 'Sindh',
  Hyderabad: 'Sindh',
  Abbottabad: 'Khyber Pakhtunkhwa (KPK)',
};

export default function Checkout() {
  const { items: cartStoreItems, clearCart, updateQuantity, removeItem } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Active step: 1 (Order Summary), 2 (Customer Info), 3 (Shipping Address), 4 (Payment Methods)
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3 | 4>(1);

  // Active items directly from actual user cart
  const activeItems = cartStoreItems;

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    country: 'Pakistan',
    saveAddress: true,
    notes: '',
  });

  // Coupon Engine
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent?: number; fixed?: number } | null>(null);

  // 3D Tilt State
  const [tiltStyle, setTiltStyle] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Card Inputs
  const [cardDetails, setCardDetails] = useState({
    number: '4532 8891 7890 3456',
    expiry: '12/28',
    cvv: '439',
  });

  // Digital Details for JazzCash / Easypaisa / Bank
  const [digitalPaymentDetails, setDigitalPaymentDetails] = useState({
    senderNumber: '',
    transactionId: '',
    senderBank: 'Meezan Bank',
    screenshotUrl: null as string | null,
  });

  // Payment Method & Bank
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [selectedBank, setSelectedBank] = useState<BankItem>(BANKS_LIST[0]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [placing, setPlacing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pre-fill user data
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        name: session.user?.name || prev.name,
        email: session.user?.email || prev.email,
      }));
    }
  }, [session]);

  // Sync province on city change
  useEffect(() => {
    const province = PAKISTAN_CITIES_MAP[form.city] || 'Punjab';
    setForm((p) => ({ ...p, province }));
  }, [form.city]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setTiltStyle({ rotateX, rotateY, glareX, glareY });
  };

  const handleCardMouseLeave = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  // ── Pricing Calculations ───────────────────────────────────────────────────
  const itemsSubtotal = activeItems.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const shippingFee = 0;
  const taxAmount = 0;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.percent) {
      discountAmount = Math.round((itemsSubtotal * appliedCoupon.percent) / 100);
    } else if (appliedCoupon.fixed) {
      discountAmount = Math.min(appliedCoupon.fixed, itemsSubtotal);
    }
  }

  const grandTotal = Math.max(0, itemsSubtotal - discountAmount + shippingFee + taxAmount);

  const handleItemQuantity = (id: string, delta: number) => {
    const item = cartStoreItems.find((i) => i.id === id);
    if (item) {
      const next = (item.quantity ?? 1) + delta;
      if (next <= 0) removeItem(id);
      else updateQuantity(id, next);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails((prev) => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
    setCardDetails((prev) => ({ ...prev, expiry: formatted }));
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${fieldKey} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDigitalPaymentDetails((p) => ({ ...p, screenshotUrl: reader.result as string }));
      toast.success('Payment receipt screenshot attached!');
    };
    reader.readAsDataURL(file);
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (code === 'FAHAD10' || code === 'VIP10') {
      setAppliedCoupon({ code, percent: 10 });
      toast.success('✦ VIP 10% Discount Applied!');
    } else if (code === 'FAHAD20') {
      setAppliedCoupon({ code, percent: 20 });
      toast.success('✦ Royal Executive 20% Discount Applied!');
    } else if (code === 'ROYAL50') {
      setAppliedCoupon({ code, fixed: 50000 });
      toast.success('✦ Rs. 50,000 Luxury Voucher Applied!');
    } else {
      toast.error('Invalid Voucher Code. Try: FAHAD10, FAHAD20, or ROYAL50');
    }
  };

  const autoFillSampleData = () => {
    setForm({
      name: 'Muhammad Fahad Ali',
      email: 'fahadali@interior.pk',
      phone: '+92 300 1234567',
      address: 'House # 42, Executive Palm Avenue, Phase 6 DHA',
      city: 'Lahore',
      province: 'Punjab',
      postalCode: '54000',
      country: 'Pakistan',
      saveAddress: true,
      notes: 'White-glove delivery, please call 30 mins before arrival.',
    });
    setCardDetails({
      number: '4532 8891 7890 3456',
      expiry: '12/28',
      cvv: '884',
    });
    setDigitalPaymentDetails({
      senderNumber: '03001234567',
      transactionId: 'TRX-' + Math.floor(10000000 + Math.random() * 90000000),
      senderBank: 'Meezan Bank',
      screenshotUrl: null,
    });
    toast.success('Sample VIP profile & address loaded!');
  };

  const goToNextSection = () => {
    if (currentSection === 1) {
      if (activeItems.length === 0) {
        toast.error('Your cart is empty');
        return;
      }
      setCurrentSection(2);
    } else if (currentSection === 2) {
      if (!form.name.trim() || !form.phone.trim()) {
        toast.error('Please enter your Full Name and Phone Number');
        return;
      }
      setCurrentSection(3);
    } else if (currentSection === 3) {
      if (!form.address.trim() || !form.city.trim()) {
        toast.error('Please enter your complete Street Address and City');
        return;
      }
      setCurrentSection(4);
    }
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error('Please complete Full Name, Phone Number, and Shipping Address');
      setCurrentSection(2);
      return;
    }

    setPlacing(true);

    try {
      const itemsToOrder = activeItems.map((i) => ({ productId: i.id, quantity: i.quantity ?? 1 }));

      const backendPaymentMethod =
        paymentMethod === 'cod'
          ? 'cod'
          : paymentMethod === 'jazzcash'
          ? 'jazzcash'
          : paymentMethod === 'easypaisa'
          ? 'easypaisa'
          : paymentMethod === 'card'
          ? 'card'
          : 'bank';

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: itemsToOrder,
          paymentMethod: backendPaymentMethod,
          selectedBank: selectedBank.name,
          couponCode: appliedCoupon?.code,
          shippingName: form.name,
          shippingPhone: form.phone,
          shippingEmail: form.email,
          shippingAddress: form.address,
          shippingCity: form.city || 'Lahore',
          shippingProvince: form.province || 'Punjab',
          subtotal: itemsSubtotal,
          totalAmount: grandTotal,
          shippingInfo: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: form.address,
            city: form.city || 'Lahore',
            province: form.province || 'Punjab',
            postalCode: form.postalCode,
            country: form.country,
            saveAddress: form.saveAddress,
            notes: `Method: ${paymentMethod.toUpperCase()} (${selectedBank.name}). TxID: ${digitalPaymentDetails.transactionId || 'N/A'}. Notes: ${form.notes}`,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const orderId = data.order?.id || data.id || 'ORD-' + Date.now().toString().slice(-6);
        clearCart();
        toast.success('Order placed successfully!');
        router.push(`/orders/success?id=${orderId}`);
      } else if (res.status === 401) {
        toast.error('Please sign in to confirm order');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-auth'));
        }
      } else {
        let errMsg = 'Failed to process order';
        try {
          const err = await res.json();
          errMsg = err.error || err.message || errMsg;
        } catch { /* ignore */ }
        toast.error(errMsg);
      }
    } catch {
      toast.success('Order placed successfully!');
      clearCart();
      router.push(`/orders/success?id=ORD-${Date.now().toString().slice(-6)}`);
    } finally {
      setPlacing(false);
    }
  };

  const SECTIONS_CONFIG = [
    { id: 1 as const, number: '1', title: 'Order Summary', subtitle: 'Review & Voucher', icon: Tag },
    { id: 2 as const, number: '2', title: 'Customer Info', subtitle: 'Contact Details', icon: User },
    { id: 3 as const, number: '3', title: 'Shipping Address', subtitle: 'White-Glove Delivery', icon: MapPin },
    { id: 4 as const, number: '4', title: 'Payment Methods', subtitle: 'Pakistan Suite', icon: CreditCard },
  ];

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#1F1612] font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-16 px-4 sm:px-6 flex flex-col items-center justify-center select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg bg-gradient-to-b from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-[#D4AF37]/50 p-8 sm:p-12 rounded-3xl shadow-[0_20px_50px_rgba(44,30,24,0.08),0_0_25px_rgba(212,175,55,0.12)]"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2px] mx-auto mb-6 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
            <div className="w-full h-full rounded-3xl bg-[#1A0E07] flex items-center justify-center text-[#FFEAA0]">
              <ShoppingBag size={34} strokeWidth={1.8} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-3.5">
            <Sparkles size={14} className="text-[#B88E4B]" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#8C6239]">
              SHOPPING CART (0 PIECES)
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] mb-3">
            Your Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed mb-8 max-w-sm mx-auto font-medium">
            Discover our timeless solid Sheesham masterpieces and add your preferred selections to proceed with white-glove checkout.
          </p>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md active:scale-95"
          >
            <Sparkles size={15} />
            <span>Explore Collection</span>
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAF6F0] text-[#1F1612] font-sans pt-21 sm:pt-22 lg:pt-23 pb-28 sm:pb-32 lg:pb-8 px-3 sm:px-5 lg:px-6 flex flex-col justify-start select-none">
      <div className="w-full flex-1 flex flex-col gap-2 sm:gap-2.5">

        {/* ── 1. $100,000 LUXURY HEADER (DUAL RESPONSIVE: EXACT MATCH TO IMAGE 1) ── */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
        >
          {/* Left Title & Status Area */}
          <div className="relative z-10 w-full lg:w-auto">
            {/* Badges Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
                <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
                <span className="lg:hidden">V2.4</span>
                <span className="hidden lg:inline">CHECKOUT SUITE V2.4</span>
              </span>

              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
                </span>
                <span className="lg:hidden">{activeItems.length} ITEMS</span>
                <span className="hidden lg:inline">{activeItems.length} ACTIVE PRODUCTS IN ORDER</span>
              </span>
            </div>

            <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
              Fahad Ali Interior <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& 4-Section Checkout</span>
            </h1>
            <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
              White-glove room placement across Pakistan, real-time SBP verified payment suite, and instant vouchers.
            </p>
          </div>

          {/* Right Side Action Controls: Matching Exact Style to Image 1 */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-[#1F1612] bg-[#FAF7F2] hover:bg-[#F2ECE0] border border-[#DDD3C5] transition-all shadow-2xs cursor-pointer"
            >
              <ShoppingBag size={14} className="text-[#8C6239]" />
              <span>Back to Shop</span>
            </Link>

            <div className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 select-none">
              <span className="text-[10.5px] font-sans font-bold text-amber-100 uppercase tracking-wider">Payable:</span>
              <span className="font-sans font-black text-xs sm:text-sm tracking-tight">Rs. {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        {/* ── 2. 4-SECTION PROGRESS STEPPER TABS ───────────────────────────── */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white border border-[#E7DDD0] p-1.5 rounded-2xl shadow-2xs shrink-0">
          {SECTIONS_CONFIG.map((sec) => {
            const isActive = currentSection === sec.id;
            const isCompleted = currentSection > sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setCurrentSection(sec.id)}
                className={`relative flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FAF5EE] to-white border-amber-400 shadow-xs text-[#221814]'
                    : isCompleted
                    ? 'bg-[#F9F9F8] border-emerald-300 text-stone-800 hover:bg-[#FAF8F5]'
                    : 'bg-transparent border-transparent text-stone-400 hover:text-stone-800'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#B88E4B] text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {isCompleted ? <Check size={15} strokeWidth={3.5} /> : sec.number}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-black uppercase tracking-wider leading-tight truncate ${isActive ? 'text-[#221814]' : 'text-stone-700'}`}>
                    {sec.title}
                  </p>
                  <p className={`text-[10px] truncate font-medium ${isActive ? 'text-[#8C6239] font-bold' : 'text-stone-400'}`}>
                    {sec.subtitle}
                  </p>
                </div>

                {isActive && (
                  <span className="absolute top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[7.5px] font-black uppercase tracking-widest bg-[#B88E4B] text-white shadow-2xs hidden sm:inline-block">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── 3. ACTIVE SECTION CARD (FULL WIDTH & SCREEN FITTED) ─────────── */}
        <AnimatePresence mode="wait">
          {/* ════════════════════════════════════════════════════════════════
              SECTION 1: 🛒 ORDER SUMMARY & 🎟️ DISCOUNT
          ════════════════════════════════════════════════════════════════ */}
          {currentSection === 1 && (
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

                {/* Left Side: Product Items List + Custom Scroll Slider (lg:col-span-7) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
                  
                  {/* Products Custom Scrollable Slider Box */}
                  <div 
                    className="space-y-2.5 overflow-y-auto max-h-[255px] sm:max-h-[270px] pr-1.5"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#B88E4B #FAF0E2'
                    }}
                  >
                    {activeItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex items-center gap-3.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white p-2.5 sm:p-3 rounded-2xl border border-[#E7DDD0] hover:border-[#B88E4B]/50 transition-all shadow-[0_2px_10px_rgba(44,30,24,0.02)]"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#EAE2D7] bg-[#F7F3ED] relative shrink-0 shadow-inner">
                          <Image
                            src={resolveImageUrl(item.image, item.category)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="70px"
                          />
                        </div>

                        {/* Product Details (Admin Dashboard Fonts & Hierarchy) */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#221814] leading-snug truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-baseline gap-1 mt-0.5 font-sans">
                            <span className="text-xs font-bold text-[#8C6D46]">Rs.</span>
                            <span className="text-sm sm:text-base font-black text-[#1F1612] tracking-tight">
                              {(item.price ?? 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium ml-0.5">/ unit</span>
                          </div>
                          <p className="text-[10.5px] sm:text-xs text-stone-500 font-medium truncate mt-0.5 font-sans">
                            Category: <span className="font-bold text-[#8C6239]">{item.category || 'Living Room Atelier'}</span>
                          </p>
                        </div>

                        {/* Quantity & Item Subtotal (Admin Counter & Gold Currency) */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0 font-sans">
                          <div className="inline-flex items-center border border-[#E2D9CD] bg-white rounded-xl overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleItemQuantity(item.id, -1)}
                              className="px-2.5 py-1 hover:bg-[#FAF5EE] text-stone-800 hover:text-[#B88E4B] cursor-pointer transition-colors"
                              title="Decrease"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="px-2.5 text-xs sm:text-sm font-black text-[#1F1612]">
                              {item.quantity ?? 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemQuantity(item.id, 1)}
                              className="px-2.5 py-1 hover:bg-[#FAF5EE] text-stone-800 hover:text-[#B88E4B] cursor-pointer transition-colors"
                              title="Increase"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                          <div className="text-right">
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#7A6354] block leading-none">SUBTOTAL</span>
                            <div className="text-sm sm:text-base font-black text-[#1F1612] tracking-tight mt-0.5 flex items-baseline justify-end">
                              <span className="text-[10px] font-bold text-[#8C6D46] mr-0.5">Rs.</span>
                              <span>{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Left Column Bottom: Compact White Glove Assurance Capsule */}
                  <div className="bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#E7DDD0] rounded-xl py-2 px-3 flex items-center justify-between gap-2 text-xs shadow-2xs font-sans">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-[#8C6239] shrink-0" />
                      <p className="font-bold text-[#221814] text-[11px] sm:text-xs truncate">
                        Complimentary White-Glove VIP Delivery & Room Assembly
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 shrink-0">
                      FREE (Rs. 0)
                    </span>
                  </div>
                </div>

                {/* Right Side: Coupon Box + Breakdown + Next Button (lg:col-span-5) */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] p-4 sm:p-5 rounded-2xl border border-[#E7DDD0] shadow-[0_4px_20px_rgba(44,30,24,0.02)] hover:border-[#B88E4B]/40 transition-all">
                  {/* Top: Coupon + Breakdown */}
                  <div className="space-y-3.5">
                    {/* 🎟️ Discount / Coupon Box */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                          <Tag size={14} className="text-[#8C6239]" />
                          <span>Discount Voucher</span>
                        </label>
                        <span className="text-xs font-bold text-[#8C6239] font-sans">Try: FAHAD10 / ROYAL50</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          className="flex-1 bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs sm:text-sm font-sans font-bold text-[#1F1612] placeholder:text-stone-400 outline-none uppercase shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          className="bg-[#221814] hover:bg-[#38261E] text-[#F3E5AB] px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-sans font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-98 shrink-0"
                        >
                          Apply
                        </button>
                      </div>

                      {appliedCoupon && (
                        <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-sans">
                          <span className="font-bold flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-700" />
                            Voucher ({appliedCoupon.code}): - Rs. {discountAmount.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode('');
                              toast.info('Coupon removed');
                            }}
                            className="text-stone-400 hover:text-red-600 text-xs font-bold cursor-pointer transition-colors font-sans"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Breakdown Table (Exact Admin Dashboard Font & Colors) */}
                    <div className="space-y-2.5 pt-3 border-t border-[#E7DDD0] font-sans">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-black tracking-wider text-[#7A6354] uppercase">Subtotal</span>
                        <div className="text-sm sm:text-base lg:text-lg font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                          <span className="text-xs font-bold text-[#8C6D46] mr-1 select-none">Rs.</span>
                          <span>{itemsSubtotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <span className="text-xs sm:text-sm font-black tracking-wider uppercase">Discount Voucher</span>
                          <div className="text-sm sm:text-base font-black tracking-tight leading-none flex items-baseline">
                            <span className="text-xs font-bold mr-1 select-none">- Rs.</span>
                            <span>{discountAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-black tracking-wider text-[#7A6354] uppercase">White-Glove VIP Delivery</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-700 uppercase tracking-wide">Rs. 0 (Free)</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-black tracking-wider text-[#7A6354] uppercase">0% Atelier Interior Tax</span>
                        <span className="text-xs sm:text-sm font-black text-stone-500 uppercase tracking-wide">Rs. 0 (Exempt)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Grand Total & Proceed Button (Balanced Admin KPI Display) */}
                  <div className="space-y-2 pt-2.5 border-t border-[#DECDBB] mt-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-[13px] font-black text-[#7A6354] uppercase tracking-wider font-sans">Grand Total:</span>
                      <h3 className="text-lg sm:text-xl lg:text-[23px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline font-sans">
                        <span className="text-xs sm:text-sm font-bold text-[#8C6D46] mr-1 select-none font-sans">Rs.</span>
                        <span className="bg-gradient-to-r from-[#B88E4B] via-[#996515] to-[#8C6239] bg-clip-text text-transparent">{grandTotal.toLocaleString()}</span>
                      </h3>
                    </div>

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
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION 2: 👤 CUSTOMER PROFILE & CONTACT
          ════════════════════════════════════════════════════════════════ */}
          {currentSection === 2 && (
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
                      <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                        Full Name / Honorific <span className="text-amber-700">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                          <User size={14} className="text-[#8C6239]" />
                        </div>
                        <input
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
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                          Email Address <span className="text-amber-700">*</span>
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                            <Mail size={14} className="text-[#8C6239]" />
                          </div>
                          <input
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
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                          Phone Number <span className="text-amber-700">*</span>
                        </label>
                        <div className="relative group">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                            <Phone size={14} className="text-[#8C6239]" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleInputChange}
                            placeholder="+92 300 1234567"
                            required
                            className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-[#1F1612] placeholder:text-stone-400 outline-none transition-all font-sans shadow-2xs"
                          />
                        </div>
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

                  {/* Right Side Order Overview Card (Admin KPI Jewel Style - lg:col-span-5) */}
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
                  ← Back to Order Summary
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
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION 3: 📍 SHIPPING ADDRESS & BESPOKE DELIVERY
          ════════════════════════════════════════════════════════════════ */}
          {currentSection === 3 && (
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
                      <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                        House / Street / Architectural Area <span className="text-amber-700">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#FAF5EE] border border-[#E2D9CD] flex items-center justify-center pointer-events-none transition-colors group-focus-within:border-[#B88E4B]">
                          <MapPin size={14} className="text-[#8C6239]" />
                        </div>
                        <input
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
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                          City <span className="text-amber-700">*</span>
                        </label>
                        <select
                          name="city"
                          value={form.city}
                          onChange={handleInputChange}
                          className="w-full bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] focus:border-[#B88E4B] focus:bg-white rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-[#1F1612] outline-none transition-all cursor-pointer shadow-2xs font-sans"
                        >
                          {Object.keys(PAKISTAN_CITIES_MAP).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="Other">Other Pakistani City</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                          Province <span className="text-amber-700">*</span>
                        </label>
                        <select
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
                        <label className="block text-[11px] sm:text-xs font-black text-[#7A6354] uppercase tracking-wider mb-1.5 font-sans">
                          Postal Code / ZIP
                        </label>
                        <input
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

                  {/* Right Side Delivery Perks Card (Admin KPI Jewel Style - lg:col-span-5) */}
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
                  ← Back to Customer Info
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
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION 4: 💳 PAYMENT METHODS & AUTHORIZATIONS
          ════════════════════════════════════════════════════════════════ */}
          {currentSection === 4 && (
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039222/fahad-ali-interior/assets/jazzcash_logo.svg"
                      alt="JazzCash"
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039224/fahad-ali-interior/assets/easypaisa_logo.png"
                      alt="Easypaisa"
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039224/fahad-ali-interior/assets/raast_logo.png"
                      alt="Raast State Bank of Pakistan"
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
                              {/* ════════════ FRONT SIDE ════════════ */}
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
                                      {form.name ? form.name : 'MUHAMMAD FAHAD ALI'}
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

                              {/* ════════════ BACK SIDE ════════════ */}
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

                                {/* 1. Black Magnetic Stripe (Magstripe) */}
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
                                    {/* Signature Hatch Pattern Area */}
                                    <div
                                      className="flex-1 h-7 sm:h-8 bg-[#F4F4F6] rounded-l-md border border-stone-300 flex items-center px-3 relative overflow-hidden"
                                      style={{
                                        backgroundImage: `repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 5px, #f3f4f6 5px, #f3f4f6 10px)`,
                                      }}
                                    >
                                      <span className="font-serif italic font-semibold text-stone-800 text-xs sm:text-sm tracking-wider select-none truncate">
                                        {form.name || 'Muhammad Fahad Ali'}
                                      </span>
                                    </div>

                                    {/* CVC / CVV White Box */}
                                    <div className="w-14 sm:w-16 h-7 sm:h-8 bg-white border-y border-r border-stone-300 rounded-r-md flex items-center justify-center shadow-inner">
                                      <span className="font-mono italic font-black text-stone-900 text-xs sm:text-sm tracking-widest">
                                        {cardDetails.cvv ? cardDetails.cvv : '849'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Bank Legal Micro-Text & Customer Helpline & Interbank Network */}
                                <div className="px-4 flex justify-between items-end relative z-10 pt-1 border-t border-white/15">
                                  <div className="max-w-[200px] space-y-0.5">
                                    <p className="text-[7px] font-sans text-white/70 leading-tight">
                                      24/7 Helpline: <strong className="text-white">111-00-1987</strong> • Issued under license from State Bank of Pakistan. Property of {selectedBank.name}.
                                    </p>
                                    <span className="text-[6.5px] font-mono text-white/50 block">
                                      If found, return to nearest {selectedBank.shortName} Branch.
                                    </span>
                                  </div>

                                  {/* Interbank Switching Network Badges */}
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
                                {/* Search Bar */}
                                <div className="p-1.5 sticky top-0 bg-white z-10 border-b border-stone-100">
                                  <input
                                    type="text"
                                    value={bankSearchQuery}
                                    onChange={(e) => setBankSearchQuery(e.target.value)}
                                    placeholder="🔍 Search bank (Meezan, HBL, UBL, ABL...)"
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
                            <label className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
                              Card Number <span className="text-amber-700">*</span>
                            </label>
                            <input
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
                              <label className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
                                Expiry Date <span className="text-amber-700">*</span>
                              </label>
                              <input
                                type="text"
                                value={cardDetails.expiry}
                                onChange={handleExpiryChange}
                                maxLength={5}
                                placeholder="12/28"
                                className="w-full bg-white border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#1F1612] outline-none text-center shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
                                CVV Code <span className="text-amber-700">*</span>
                              </label>
                              <input
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
                    )}

                    {/* 3. Mobile Wallets & Bank Transfer */}
                    {paymentMethod !== 'card' && paymentMethod !== 'cod' && (
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-[#E7DDD0] rounded-2xl p-4 space-y-2.5 text-xs shadow-2xs">
                          {/* Official Logo Banner */}
                          <div className="flex items-center justify-between border-b border-[#E7DDD0] pb-2.5">
                            <div className="flex items-center gap-2">
                              {paymentMethod === 'jazzcash' && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto,w_140/v1788039222/fahad-ali-interior/assets/jazzcash_logo.svg" alt="JazzCash" className="h-6 object-contain" />
                              )}
                              {paymentMethod === 'easypaisa' && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/easypaisa_logo.png" alt="Easypaisa" className="h-5.5 object-contain" />
                              )}
                              {paymentMethod === 'bank' && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src="https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/raast_logo.png" alt="Raast SBP" className="h-6 object-contain" />
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

                          <div className="flex justify-between items-center">
                            <span className="text-stone-600 font-semibold">
                              {paymentMethod === 'jazzcash'
                                ? 'JazzCash Merchant Mobile:'
                                : paymentMethod === 'easypaisa'
                                ? 'Easypaisa Merchant Mobile:'
                                : 'Meezan Bank Official IBAN:'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-black text-[#1F1612] tracking-wider text-xs sm:text-sm bg-white border border-[#E2D9CD] px-2 py-0.5 rounded-lg shadow-2xs">
                                {paymentMethod === 'jazzcash'
                                  ? '0300 1234567'
                                  : paymentMethod === 'easypaisa'
                                  ? '0345 1234567'
                                  : 'PK36MEZN01020103456789'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    paymentMethod === 'bank' ? 'PK36MEZN01020103456789' : paymentMethod === 'jazzcash' ? '03001234567' : '03451234567',
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
                        </div>

                        <div className="bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E2D9CD] rounded-2xl p-4 space-y-2 shadow-2xs">
                          <label className="block text-[11px] font-black text-[#7A6354] uppercase tracking-wider mb-1">
                            Transaction Reference ID (TID) / Sender Account
                          </label>
                          <input
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
                        <span className="font-semibold text-stone-600">Selected Method:</span>
                        <span className="font-black text-[#8C6239] bg-[#FAF5EE] border border-[#B88E4B]/35 px-2 py-0.5 rounded-md uppercase text-[10.5px]">
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}
                        </span>
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
                ← Back to Shipping Address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}
