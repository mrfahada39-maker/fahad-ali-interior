'use client';

import React from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Home, Settings, LogOut } from 'lucide-react';
import { DASHBOARD_TABS } from './dashboard-kpis';
import { DashboardStoreNavbar } from '@/components/shared/DashboardStoreNavbar';

export function DashboardSidebarAndMobileNav({
  activeTab,
  setActiveTab,
  mergedWishlistLength,
  ordersLength,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mergedWishlistLength: number;
  ordersLength: number;
}) {
  return (
    <>
      {/* ── DESKTOP FLOATING CAPSULE SIDEBAR ── */}
      <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 z-50 flex-col items-center justify-between w-20 select-none pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] border-2 border-[#E7DDD0] py-4 px-2.5 flex flex-col items-center gap-3 shadow-[0_16px_50px_rgba(44,30,24,0.06)] w-full shrink-0 hover:border-[#B88E4B]/40 transition-all">
          <div className="relative group/nav shrink-0 pb-2.5 mb-0.5 border-b border-[#E7DDD0]/80 w-full flex justify-center">
            <Link
              href="/"
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] text-[#8C6239] hover:bg-gradient-to-br hover:from-[#B88E4B] hover:to-[#996515] hover:text-white flex items-center justify-center border border-[#E2D1BC] shadow-2xs hover:shadow-[0_6px_20px_rgba(184,142,75,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Home size={20} className="stroke-[2.2]" />
            </Link>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-[#B88E4B]/30 flex items-center gap-1.5">
                <span className="text-[#D4AF37]">✦</span>
                <span>Go to Storefront Catalog</span>
              </div>
            </div>
          </div>

          {DASHBOARD_TABS.filter((t) => t.id !== 'settings').map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group/nav shrink-0">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-br from-[#D4AF37] via-[#B88E4B] to-[#7A4B1A] text-white shadow-[0_6px_20px_rgba(184,142,75,0.45)] ring-2 ring-[#B88E4B]/40 ring-offset-2 scale-105 border border-white/40'
                      : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
                  }`}
                >
                  <tab.icon size={20} className="relative z-10 stroke-[2.2]" />
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-[#D4AF37] to-[#8C6239] rounded-r-full shadow-sm" />
                  )}
                  {tab.id === 'wishlist' && mergedWishlistLength > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#B88E4B] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {mergedWishlistLength}
                    </span>
                  )}
                  {tab.id === 'orders' && ordersLength > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {ordersLength}
                    </span>
                  )}
                </button>
                <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-[#B88E4B]/30 flex items-center gap-1.5">
                    <span className="text-[#D4AF37]">✦</span>
                    {tab.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] border-2 border-[#E7DDD0] py-3 px-2.5 flex flex-col items-center gap-2.5 shadow-[0_12px_40px_rgba(44,30,24,0.05)] w-full shrink-0 hover:border-[#B88E4B]/40 transition-all">
          <div className="relative group/nav">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-br from-[#D4AF37] via-[#B88E4B] to-[#7A4B1A] text-white shadow-[0_6px_20px_rgba(184,142,75,0.45)] ring-2 ring-[#B88E4B]/40 ring-offset-2 scale-105 border border-white/40'
                  : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
              }`}
            >
              <Settings size={20} className="group-hover/nav:rotate-45 transition-transform duration-300 stroke-[2.2]" />
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                <span>⚙️</span> Portal Preferences
              </div>
            </div>
          </div>

          <div className="relative group/nav">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 text-rose-600 hover:text-white hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 flex items-center justify-center border-2 border-rose-400/40 hover:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)] relative cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut size={19} className="stroke-[2.3] group-hover/nav:-translate-x-0.5 transition-transform" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" />
            </button>
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap border border-rose-500/30 flex items-center gap-1.5">
                <LogOut size={12} className="text-rose-400" />
                Sign Out / Logout
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE DUAL FLOATING LUXURY CARDS ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-2 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
        {/* ── IMAGE 1 NAVBAR: STORE MOBILE PILL NAVBAR ── */}
        <DashboardStoreNavbar />

        <div className="bg-white/95 backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl shadow-[0_4px_20px_rgba(44,30,24,0.035)] p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pointer-events-auto">
          {DASHBOARD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs whitespace-nowrap cursor-pointer shrink-0 z-10 transition-all ${
                  isActive
                    ? 'text-white font-black bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239] shadow-sm'
                    : 'text-[#6B5345] hover:text-[#18110D] bg-[#FAF5EE]/60 hover:bg-[#FAF5EE] font-bold'
                }`}
              >
                <tab.icon size={14} className="stroke-[2.2]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function DashboardTopTabDock({
  activeTab,
  setActiveTab,
  ordersLength,
  mergedWishlistLength,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ordersLength: number;
  mergedWishlistLength: number;
}) {
  return (
    <div className="hidden lg:flex items-center justify-between gap-3 bg-white/90 backdrop-blur-xl border border-[#E7DDD0] shadow-[0_4px_24px_rgba(44,30,24,0.03)] p-1.5 rounded-2xl">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#8C6239] text-white shadow-sm font-black'
                  : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] border border-transparent'
              }`}
            >
              <tab.icon size={14} className="stroke-[2.2]" />
              <span>{tab.label}</span>
              {tab.id === 'orders' && ordersLength > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {ordersLength}
                </span>
              )}
              {tab.id === 'wishlist' && mergedWishlistLength > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'}`}>
                  {mergedWishlistLength}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pr-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-serif font-black text-[#8C6239] tracking-wide">
          ROYAL PATRON SUITE
        </span>
      </div>
    </div>
  );
}
