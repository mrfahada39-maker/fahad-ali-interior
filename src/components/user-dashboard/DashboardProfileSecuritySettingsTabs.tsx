'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Check, User, Phone, Mail, Sparkles, Layers, FileText,
} from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { toast } from 'sonner';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import SettingsTab from '@/components/UserSettingsTab';
import { renderHeaderBanner, renderKpiGrid, formatPrice } from './dashboard-kpis';

export function DashboardProfileTab({
  profileKpis,
  session,
  profile,
  copiedId,
  setCopiedId,
  totalSpentCalculated,
  handleSaveProfile,
  profileForm,
  setProfileForm,
  selectedTimberFinish,
  setSelectedTimberFinish,
  selectedFabricPreference,
  setSelectedFabricPreference,
}: {
  profileKpis: any[];
  session: any;
  profile: any;
  copiedId: boolean;
  setCopiedId: (c: boolean) => void;
  totalSpentCalculated: number;
  handleSaveProfile: (e: React.FormEvent) => void;
  profileForm: { name: string; phone: string; bio: string };
  setProfileForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; bio: string }>>;
  selectedTimberFinish: string;
  setSelectedTimberFinish: (s: string) => void;
  selectedFabricPreference: string;
  setSelectedFabricPreference: (s: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ CLIENT PROFILE',
        '✦ CLIENT CREDENTIALS V2.4',
        'VIP STATUS',
        'VERIFIED VIP PATRON',
        'VIP Client Profile',
        '& Credentials',
        'Manage your architectural contact credentials, registered contact channels, and bespoke styling notes.'
      )}

      {renderKpiGrid(profileKpis)}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] p-6 shadow-[0_4px_24px_rgba(44,30,24,0.04)] flex flex-col items-center text-center justify-between space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239]" />

          <div className="relative mt-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#B88E4B] via-[#996515] to-[#5A3A1A] border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl sm:text-4xl font-serif font-black">
              {(session?.user?.name || profile?.name || 'VIP Client')[0].toUpperCase()}
            </div>
            <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gradient-to-br from-[#B88E4B] to-[#5A3A1A] border-2 border-white flex items-center justify-center text-amber-200 text-xs shadow-md">
              <Crown size={15} />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="font-serif font-black text-xl text-[#1F1612]">
                {session?.user?.name || profile?.name || 'VIP Client'}
              </h3>
              <span className="text-emerald-600 text-xs" title="Verified VIP Patron">✓</span>
            </div>
            {session?.user?.email || profile?.email ? (
              <p className="text-xs text-[#8C6239] font-medium">
                {session?.user?.email || profile?.email}
              </p>
            ) : null}
          </div>

          <div className="w-full bg-[#FAF5EE] rounded-xl border border-[#E7DDD0] p-2.5 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[9px] font-mono font-bold text-stone-400 uppercase block">Patron ID</span>
              <span className="text-xs font-mono font-black text-[#1F1612]">
                #{(session?.user as any)?.id ? (session?.user as any).id.slice(-6).toUpperCase() : 'VIP'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const patronId = `#${(session?.user as any)?.id ? (session?.user as any).id.slice(-6).toUpperCase() : 'VIP'}`;
                navigator.clipboard.writeText(patronId);
                setCopiedId(true);
                toast.success(`Patron ID ${patronId} copied to clipboard`);
                setTimeout(() => setCopiedId(false), 2500);
              }}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#B88E4B] text-[#8C6239] hover:text-white border border-[#E7DDD0] text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              {copiedId ? 'Copied! ✓' : 'Copy ID'}
            </button>
          </div>

          <div className="w-full text-left space-y-2 pt-2 border-t border-[#E7DDD0]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#8C6239] font-serif flex items-center gap-1">
                <Crown size={12} /> {totalSpentCalculated >= 200000 ? 'Diamond Tier' : totalSpentCalculated >= 50000 ? 'Royal Gold Tier' : 'VIP Patron Tier'}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {totalSpentCalculated >= 200000 ? 'Top Tier' : `${Math.min(100, Math.round((totalSpentCalculated / (totalSpentCalculated >= 50000 ? 200000 : 50000)) * 100))}% to next`}
              </span>
            </div>
            <div className="w-full bg-[#E7DDD0]/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#B88E4B] to-[#D4AF37] rounded-full transition-all duration-500"
                style={{ width: `${totalSpentCalculated >= 200000 ? 100 : Math.max(5, Math.min(100, Math.round((totalSpentCalculated / (totalSpentCalculated >= 50000 ? 200000 : 50000)) * 100)))}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-500 italic">
              {totalSpentCalculated >= 200000
                ? 'Highest atelier recognition unlocked. Priority artisan line active.'
                : totalSpentCalculated >= 50000
                ? `Spend Rs. ${formatPrice(200000 - totalSpentCalculated)} more to unlock Royal Diamond Atelier tier.`
                : `Spend Rs. ${formatPrice(50000 - totalSpentCalculated)} more to unlock Royal Gold Atelier tier.`}
            </p>
          </div>

          <div className="w-full text-left space-y-1 pt-2 border-t border-[#E7DDD0]/60 text-[11px]">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block mb-1">Your Royal Privileges:</span>
            <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600" /> Free White-Glove Transit & Installation
            </p>
            <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600" /> Lifetime Timber Seasoning Warranty
            </p>
            <p className="text-[#1F1612] font-medium flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600" /> Dedicated Master Artisan Hotline
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[24px] border border-[#E7DDD0] p-6 shadow-[0_4px_24px_rgba(44,30,24,0.04)]">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="pb-2 border-b border-[#E7DDD0]">
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-[#8C6239] block">
                ✦ ARCHITECTURAL SPECIFICATIONS & CONTACT
              </span>
              <h3 className="font-serif font-black text-lg text-[#1F1612]">Client Credentials & Bespoke Preferences</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} className="text-[#B88E4B]" /> Full Legal Name
                </label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Your Full Name"
                  className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-10 focus:ring-[#B88E4B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={12} className="text-[#B88E4B]" /> Direct WhatsApp / Phone
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. 0300 1234567"
                  className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE]/40 text-xs h-10 focus:ring-[#B88E4B] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} className="text-[#B88E4B]" /> Registered Email Address (Verified)
              </label>
              <div className="relative">
                <Input
                  value={session?.user?.email || profile?.email || ''}
                  disabled
                  className="rounded-xl border-[#E7DDD0] bg-[#FAF5EE] text-xs h-10 text-stone-600 font-mono pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                  ✓ VERIFIED
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#B88E4B]" /> Signature Timber Polish Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Royal Walnut', 'Natural Sheesham', 'Antique Teak', 'Turkish Gold Leaf'].map((polish) => (
                  <button
                    key={polish}
                    type="button"
                    onClick={() => setSelectedTimberFinish(polish)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                      selectedTimberFinish === polish
                        ? 'bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white border-[#B88E4B] shadow-xs'
                        : 'bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] text-[#7A6354] border-[#E7DDD0]'
                    }`}
                  >
                    {polish}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-[#B88E4B]" /> Preferred Fabric & Upholstery
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Turkish Champagne Velvet', 'Emerald Turkish Velvet', 'Italian Tan Leather', 'Royal Navy Velvet'].map((fabric) => (
                  <button
                    key={fabric}
                    type="button"
                    onClick={() => setSelectedFabricPreference(fabric)}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                      selectedFabricPreference === fabric
                        ? 'bg-gradient-to-r from-[#B88E4B] to-[#8C6239] text-white border-[#B88E4B] shadow-xs'
                        : 'bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] text-[#7A6354] border-[#E7DDD0]'
                    }`}
                  >
                    {fabric}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#7A6354] uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} className="text-[#B88E4B]" /> Architectural & Bespoke Styling Notes (Bio)
              </label>
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="e.g. Prefer dark walnut polish with Turkish champagne velvet, custom 8-seater dining specifications..."
                className="rounded-xl border-[#E7DDD0] text-xs bg-[#FAF5EE]/40 focus:ring-[#B88E4B]"
                rows={3}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#8C6239] hover:brightness-110 text-white font-serif font-bold text-xs px-7 py-2.5 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardSecurityTab({ securityKpis }: { securityKpis: any[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ SECURITY SHIELD',
        '✦ ENCRYPTION SHIELD V2.4',
        'ACTIVE 256-BIT',
        'ENTERPRISE ENCRYPTION ACTIVE',
        'Security & Two-Factor',
        'Authentication Guard',
        'Fortify your VIP client portal with hardware TOTP tokens and cryptographic session guards.'
      )}

      {renderKpiGrid(securityKpis)}

      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] p-6 shadow-2xs">
        <TwoFactorSetup />
      </div>
    </motion.div>
  );
}

export function DashboardSettingsTab({ settingsKpis, profile }: { settingsKpis: any[]; profile: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {renderHeaderBanner(
        '✦ PORTAL CONFIG',
        '✦ PORTAL CONFIG V2.4',
        'AUTO SYNC',
        'AUTOMATIC PREFERENCE SYNC',
        'Client Suite',
        'Preferences & Settings',
        'Configure notifications, bespoke order status alerts, and client portal display formats.'
      )}

      {renderKpiGrid(settingsKpis)}

      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E7DDD0] p-6 shadow-2xs">
        <SettingsTab profile={profile} />
      </div>
    </motion.div>
  );
}
