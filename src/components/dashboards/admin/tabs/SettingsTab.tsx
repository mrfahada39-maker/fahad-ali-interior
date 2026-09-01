'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  CreditCard,
  Share2,
  Eye,
  EyeOff,
  Shield,
  Palette,
  Sparkles,
  Save,
  Key,
  Lock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorSetup from '@/components/dashboards/TwoFactorSetup';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

interface SettingsTabProps {
  siteSettings: any;
  setSiteSettings: (s: any) => void;
  saveSettings: () => void;
  adminAccount: any;
  setAdminAccount: (a: any) => void;
  saveAdminAccount: () => void;
  passwordForm: any;
  setPasswordForm: (f: any) => void;
  showPassword: any;
  setShowPassword: (s: any) => void;
  changeAdminPassword: () => void;
}

export default function SettingsTab({
  siteSettings = {},
  setSiteSettings,
  saveSettings,
  adminAccount = { name: '', email: '', phone: '' },
  setAdminAccount,
  saveAdminAccount,
  passwordForm = { current: '', next: '', confirm: '' },
  setPasswordForm,
  showPassword = { current: false, next: false, confirm: false },
  setShowPassword,
  changeAdminPassword,
}: SettingsTabProps) {
  const [activeSettingsSection, setActiveSettingsSection] = useState<'general' | 'payments' | 'social' | 'security' | 'theme'>('general');

  const safeSettings = siteSettings || {};
  const safeAdmin = adminAccount || { name: '', email: '', phone: '' };
  const safePasswordForm = passwordForm || { current: '', next: '', confirm: '' };
  const safeShowPassword = showPassword || { current: false, next: false, confirm: false };

  function settingField(
    label: string,
    key: string,
    options?: { placeholder?: string; hint?: string; type?: string }
  ) {
    const rawVal = safeSettings[key];
    const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

    return (
      <div key={key} className="space-y-1">
        <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">
          {label}
        </label>
        <input
          type={options?.type || 'text'}
          value={valStr}
          onChange={(e) => setSiteSettings({ ...safeSettings, [key]: e.target.value })}
          placeholder={options?.placeholder || ''}
          className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-bold rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
        />
        {options?.hint && <p className="text-stone-400 text-[9.5px] italic">{options.hint}</p>}
      </div>
    );
  }

  function colorField(label: string, key: string, defaultValue: string) {
    const val = safeSettings[key] || defaultValue;

    return (
      <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-neutral-100 last:border-0">
        <div>
          <label className="text-[#1F1612] text-xs font-black block">{label}</label>
          <span className="text-[10px] text-stone-400 font-mono">{val}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={val}
            onChange={(e) => setSiteSettings({ ...safeSettings, [key]: e.target.value })}
            className="w-9 h-8 rounded-lg border border-[#E7DDD0] cursor-pointer bg-transparent"
          />
          <input
            value={val}
            onChange={(e) => setSiteSettings({ ...safeSettings, [key]: e.target.value })}
            className="w-20 bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] rounded-lg h-8 text-xs font-mono text-center font-bold"
          />
        </div>
      </div>
    );
  }

  const fonts = [
    { label: 'Outfit (Modern Luxury Sans)', value: 'Outfit' },
    { label: 'Playfair Display (Classic High-End Serif)', value: 'Playfair Display' },
    { label: 'Georgia (Warm Regal Serif)', value: 'Georgia' },
    { label: 'Inter (Clean Technical Minimalist)', value: 'Inter' },
    { label: 'Cormorant Garamond (Artisan Luxury)', value: 'Cormorant Garamond' },
    { label: 'Montserrat (Bold Architectural)', value: 'Montserrat' },
  ];

  const kpis = [
    {
      label: 'SYSTEM SECURITY HEALTH',
      numValue: 100,
      suffix: '%',
      sub: '🛡️ Encrypted & Guarded',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
      ambientGlow: 'bg-emerald-500/10',
      cardGlow: 'border-emerald-300/80 hover:border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.08)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'BRAND PALETTE & THEME',
      numValue: 7,
      sub: '✨ Tailored Luxury Tokens',
      icon: Palette,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'SETTLEMENT GATEWAY',
      numValue: 4,
      sub: '✓ Verified Payment Channels',
      icon: CreditCard,
      color: 'text-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]',
      ambientGlow: 'bg-blue-500/10',
      cardGlow: 'border-blue-300/80 hover:border-blue-500 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-500/30',
      dotColor: 'bg-blue-500',
    },
    {
      label: 'TWO-FACTOR 2FA STATUS',
      numValue: 100,
      suffix: '%',
      sub: '⚡ Biometric & TOTP Ready',
      icon: Key,
      color: 'text-purple-600',
      iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]',
      ambientGlow: 'bg-purple-500/10',
      cardGlow: 'border-purple-300/80 hover:border-purple-500 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-500/30',
      dotColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      
      {/* ── $100,000 EXECUTIVE HEADER (DUAL RESPONSIVE: GRAND ON DESKTOP, COMPACT ON MOBILE) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">SYSTEM CONFIGURATION V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">ENCRYPTED & LIVE</span>
              <span className="hidden lg:inline">DATABASE ENCRYPTED & LIVE</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Enterprise Settings <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Security Console</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Store identity, banking settlement accounts, concierge hotlines, typography, and administrator authentication.
          </p>
        </div>

        {/* Right Save All Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <button
            onClick={saveSettings}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Save size={15} />
            <span>Save Configurations</span>
          </button>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
                {kpi.label}
              </span>
              {/* 3D Glass Jewel Orb */}
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
                <kpi.icon size={17} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline">
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
                {kpi.suffix ? <span className="text-base font-bold text-[#8C6D46] ml-1">{kpi.suffix}</span> : null}
              </h3>

              <div className="mt-2.5 flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${kpi.badgeBg}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                  </span>
                  {kpi.sub}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── SETTINGS NAVIGATION PILLS ── */}
      <div className="bg-white border border-[#E7DDD0] rounded-[20px] p-2.5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: 'general', label: 'Store Identity & Address', icon: Store },
          { id: 'payments', label: 'Banking & Settlement', icon: CreditCard },
          { id: 'social', label: 'Concierge & Social Media', icon: Share2 },
          { id: 'security', label: 'Admin Security & 2FA', icon: Shield },
          { id: 'theme', label: 'Theme Tokens & Fonts', icon: Palette },
        ].map((tab) => {
          const isActive = activeSettingsSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsSection(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-2xs'
                  : 'bg-[#FCFAF7] hover:bg-[#FAF5EE] text-[#7A6354] hover:text-[#1F1612] border border-[#E7DDD0]'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ACTIVE CONFIGURATION SECTION PANELS ── */}
      <motion.div
        key={activeSettingsSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E7DDD0] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(44,30,24,0.015)] space-y-5"
      >
        {/* 1. GENERAL STORE IDENTITY */}
        {activeSettingsSection === 'general' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-[#221814] flex items-center gap-2 font-serif">
                <Store size={18} className="text-[#B88E4B]" /> Store Identity & Showroom Headquarters
              </h3>
              <p className="text-stone-400 text-xs font-semibold mt-0.5">
                Official store metadata, customer service credentials, and flagship location
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settingField('Brand / Storefront Name', 'siteName', { placeholder: 'Fahad Ali Interior' })}
              {settingField('Support & Dispatch Email', 'adminEmail', { placeholder: 'support@fahadali.com' })}
              {settingField('Customer Service Phone', 'contactPhone', { placeholder: '+92 300 1234567' })}
              {settingField('Heritage Founded Year', 'foundedYear', { placeholder: '2018' })}
            </div>
            {settingField('Flagship Showroom Physical Address', 'storeAddress', {
              placeholder: 'Lahore Showroom: Main Boulevard, Gulberg III, Lahore, Pakistan',
              hint: 'Displayed on invoices, customer receipts, and the footer of the luxury storefront.',
            })}

            <div className="flex justify-end pt-2">
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Save Store Identity
              </button>
            </div>
          </div>
        )}

        {/* 2. BANKING & SETTLEMENT */}
        {activeSettingsSection === 'payments' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-[#221814] flex items-center gap-2 font-serif">
                <CreditCard size={18} className="text-[#B88E4B]" /> Bank Account & Direct Settlement Channels
              </h3>
              <p className="text-stone-400 text-xs font-semibold mt-0.5">
                Bank transfer instructions displayed to clients on the checkout page
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settingField('Bank Name', 'bankName', { placeholder: 'Meezan Bank / HBL' })}
              {settingField('Account Title', 'accountTitle', { placeholder: 'Fahad Ali Interior' })}
              {settingField('Account Number', 'accountNumber', { placeholder: '01020304050607' })}
              {settingField('IBAN (International Account)', 'iban', { placeholder: 'PK36MEZN0001020304050607' })}
              {settingField('JazzCash Merchant / Mobile', 'jazzcashNumber', { placeholder: '03001234567' })}
              {settingField('EasyPaisa Merchant / Mobile', 'easypaisaNumber', { placeholder: '03001234567' })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Save Banking Details
              </button>
            </div>
          </div>
        )}

        {/* 3. CONCIERGE & SOCIAL MEDIA */}
        {activeSettingsSection === 'social' && (
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-[#221814] flex items-center gap-2 font-serif">
                <Share2 size={18} className="text-[#B88E4B]" /> Concierge Hotline & Social Presence
              </h3>
              <p className="text-stone-400 text-xs font-semibold mt-0.5">
                Official WhatsApp hotline and social profile links across Pakistan
              </p>
            </div>

            <div className="space-y-3">
              {settingField('WhatsApp Luxury Hotline (PK)', 'socialWhatsapp', {
                placeholder: '923001234567 or 03001234567',
                hint: 'Connected to 1-click floating WhatsApp buttons across the storefront.',
              })}
              {settingField('Instagram Profile URL', 'socialInstagram', {
                placeholder: 'https://instagram.com/fahadaliinterior',
              })}
              {settingField('Facebook Page URL', 'socialFacebook', {
                placeholder: 'https://facebook.com/fahadaliinterior',
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Save Social Channels
              </button>
            </div>
          </div>
        )}

        {/* 4. ADMIN SECURITY & 2FA */}
        {activeSettingsSection === 'security' && (
          <div className="space-y-6">
            {/* Account Credentials */}
            <div className="space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-black text-[#221814] flex items-center gap-2 font-serif">
                  <User size={18} className="text-[#B88E4B]" /> Administrator Account Profile
                </h3>
                <p className="text-stone-400 text-xs font-semibold mt-0.5">
                  Update primary administrative contact details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Admin Full Name</label>
                  <input
                    value={safeAdmin.name ?? ''}
                    onChange={(e) => setAdminAccount({ ...safeAdmin, name: e.target.value })}
                    placeholder="Admin Full Name"
                    className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-bold rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Email Address</label>
                  <input
                    value={safeAdmin.email ?? ''}
                    onChange={(e) => setAdminAccount({ ...safeAdmin, email: e.target.value })}
                    placeholder="admin@fahadali.com"
                    className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-bold rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Phone Number</label>
                  <input
                    value={safeAdmin.phone ?? ''}
                    onChange={(e) => setAdminAccount({ ...safeAdmin, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-bold rounded-xl h-9.5 px-3 text-xs focus:border-[#B88E4B] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveAdminAccount}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E7DDD0] hover:border-[#B88E4B] text-[#1F1612] font-black text-xs shadow-2xs transition-all hover:bg-[#FAF5EE]"
                >
                  Update Admin Profile
                </button>
              </div>
            </div>

            {/* Password Management */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <div>
                <h4 className="text-sm font-black text-[#221814] flex items-center gap-2 font-serif">
                  <Lock size={16} className="text-[#B88E4B]" /> Master Password Reset
                </h4>
                <p className="text-stone-400 text-xs font-semibold mt-0.5">Secure your administrator login session</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Current Password</label>
                  <div className="relative">
                    <input
                      type={safeShowPassword.current ? 'text' : 'password'}
                      value={safePasswordForm.current ?? ''}
                      onChange={(e) => setPasswordForm({ ...safePasswordForm, current: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-mono rounded-xl h-9.5 pl-3 pr-8 text-xs focus:border-[#B88E4B] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...safeShowPassword, current: !safeShowPassword.current })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1F1612]"
                    >
                      {safeShowPassword.current ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <input
                      type={safeShowPassword.next ? 'text' : 'password'}
                      value={safePasswordForm.next ?? ''}
                      onChange={(e) => setPasswordForm({ ...safePasswordForm, next: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-mono rounded-xl h-9.5 pl-3 pr-8 text-xs focus:border-[#B88E4B] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...safeShowPassword, next: !safeShowPassword.next })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1F1612]"
                    >
                      {safeShowPassword.next ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={safeShowPassword.confirm ? 'text' : 'password'}
                      value={safePasswordForm.confirm ?? ''}
                      onChange={(e) => setPasswordForm({ ...safePasswordForm, confirm: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-mono rounded-xl h-9.5 pl-3 pr-8 text-xs focus:border-[#B88E4B] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...safeShowPassword, confirm: !safeShowPassword.confirm })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1F1612]"
                    >
                      {safeShowPassword.confirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={changeAdminPassword}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white font-black text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Change Admin Password
                </button>
              </div>
            </div>

            {/* 2FA Authenticator */}
            <div className="pt-4 border-t border-neutral-100">
              <TwoFactorSetup />
            </div>
          </div>
        )}

        {/* 5. THEME TOKENS & FONTS */}
        {activeSettingsSection === 'theme' && (
          <div className="space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-[#221814] flex items-center gap-2 font-serif">
                <Palette size={18} className="text-[#B88E4B]" /> Typography & Dynamic Theme Color Tokens
              </h3>
              <p className="text-stone-400 text-xs font-semibold mt-0.5">
                Customize fonts, background champagne hues, and metallic gold accents across the storefront
              </p>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#7A6354] uppercase tracking-wider block">Global Typography Family</label>
              <select
                value={safeSettings.themeFontFamily || 'Outfit'}
                onChange={(e) => setSiteSettings({ ...safeSettings, themeFontFamily: e.target.value })}
                className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#1F1612] font-black rounded-xl h-10 px-3 text-xs focus:border-[#B88E4B] outline-none"
              >
                {fonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette List */}
            <div className="space-y-1 bg-[#FCFAF7] p-4 rounded-2xl border border-[#E7DDD0]">
              <p className="text-[10.5px] font-black text-[#8C6239] uppercase tracking-wider mb-2">STOREFRONT COLOR TOKENS</p>
              {colorField('Background Canvas', 'themeBgColor', '#FAF7F2')}
              {colorField('Card / Surface Hues', 'themeSurfaceColor', '#FFFDF9')}
              {colorField('Border & Divider Lines', 'themeBorderColor', '#E7DDD0')}
              {colorField('Primary Luxury Accent (Gold)', 'themeAccentColor', '#B88E4B')}
              {colorField('Primary Text / Dark Charcoal', 'themeDarkColor', '#221814')}
              {colorField('Muted Secondary Text', 'themeMutedColor', '#7A6354')}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} /> Save Theme Tokens
              </button>
            </div>
          </div>
        )}
      </motion.div>

    </div>
  );
}
