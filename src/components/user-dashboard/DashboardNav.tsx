'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
      {/* ── DESKTOP LUXURY CAPSULE SIDEBAR (IDENTICAL TO ADMIN DASHBOARD) ── */}
      <aside className="hidden lg:flex w-18 flex-col gap-2.5 h-full shrink-0 z-30 select-none">
        {/* Top Navigation Capsule */}
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] border-2 border-[#E7DDD0] py-3.5 px-2 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgba(44,30,24,0.03)] w-full overflow-y-auto scrollbar-hide flex-1 hover:border-[#B88E4B]/35 transition-all">
          {/* Live Storefront Home Website Button */}
          <div className="relative group/nav shrink-0 pb-2 mb-1 border-b border-[#E7DDD0]/80 w-full flex justify-center">
            <Link
              href="/"
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF5EE] to-[#F3E7D3] text-[#8C6239] hover:bg-gradient-to-br hover:from-[#B88E4B] hover:to-[#996515] hover:text-white flex items-center justify-center border border-[#E2D1BC] shadow-2xs hover:shadow-[0_4px_16px_rgba(184,142,75,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Home size={19} className="stroke-[2.2]" />
            </Link>

            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                <span className="text-[#B88E4B]">✦</span>
                <span>Go to Storefront Catalog</span>
              </div>
            </div>
          </div>

          {/* Navigation Item Tabs */}
          {DASHBOARD_TABS.filter((t) => t.id !== 'settings').map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative group/nav shrink-0">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-br from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-[0_4px_16px_rgba(184,142,75,0.35)] scale-105 border border-white/30'
                      : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
                  }`}
                >
                  <tab.icon size={19} className="relative z-10 stroke-[2.1]" />

                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#B88E4B] rounded-r-full shadow-sm" />
                  )}

                  {tab.id === 'orders' && ordersLength > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {ordersLength}
                    </span>
                  )}

                  {tab.id === 'wishlist' && mergedWishlistLength > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {mergedWishlistLength}
                    </span>
                  )}
                </button>

                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
                  <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                    <span className="text-[#B88E4B]">✦</span>
                    {tab.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Configuration Capsule */}
        <div className="bg-white/95 backdrop-blur-md rounded-[26px] border-2 border-[#E7DDD0] py-2.5 px-2 flex flex-col items-center gap-2 shadow-[0_8px_30px_rgba(44,30,24,0.03)] w-full shrink-0 hover:border-[#B88E4B]/35 transition-all">
          <div className="relative group/nav shrink-0">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-br from-[#B88E4B] via-[#A87E47] to-[#8C6239] text-white shadow-[0_4px_16px_rgba(184,142,75,0.35)] scale-105 border border-white/30'
                  : 'text-[#7A6354] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#E2D1BC] border border-transparent'
              }`}
            >
              <Settings size={19} className="group-hover/nav:rotate-45 transition-transform duration-300 stroke-[2.1]" />
            </button>

            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-white/10 flex items-center gap-1.5">
                <span>⚙️</span> Client Preferences
              </div>
            </div>
          </div>

          <div className="relative group/nav shrink-0">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-600/20 text-rose-600 hover:text-white hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 flex items-center justify-center border-2 border-rose-400/40 hover:border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:shadow-[0_0_22px_rgba(244,63,94,0.6)] relative cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut size={18} className="stroke-[2.3] group-hover/nav:-translate-x-0.5 transition-transform" />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs animate-pulse" />
            </button>

            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/nav:flex items-center z-50 pointer-events-none">
              <div className="bg-[#221814] text-white font-serif font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-rose-500/30 flex items-center gap-1.5">
                <LogOut size={12} className="text-rose-400" />
                Sign Out / Logout
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE & TABLET DUAL FLOATING LUXURY CARDS (EXACT MATCH TO ADMIN DASHBOARD) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 p-2 sm:p-3 flex flex-col gap-2 bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/95 to-transparent pointer-events-none">
        {/* ── STORE MOBILE PILL NAVBAR ── */}
        <DashboardStoreNavbar />

        <div className="bg-white/95 backdrop-blur-2xl border border-[#E7DDD0] rounded-2xl shadow-[0_4px_20px_rgba(44,30,24,0.035)] p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide pointer-events-auto relative">
          {DASHBOARD_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1 sm:gap-1.5 h-[34px] sm:h-[36px] px-2 sm:px-3.5 rounded-xl text-[11px] sm:text-[12.5px] whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 z-10 ${
                  isActive ? 'text-white font-black' : 'text-[#6B5345] hover:text-[#18110D] font-bold'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="userActiveTabMobileHighlight"
                    className="absolute inset-0 bg-gradient-to-r from-[#B88E4B] via-[#C9A24D] to-[#996515] rounded-xl shadow-[0_2px_10px_rgba(184,142,75,0.4)] border border-white/25 -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <tab.icon size={13.5} className={isActive ? 'text-white stroke-[2.2]' : 'text-[#8C6239] shrink-0 stroke-[2.2]'} />
                <span>{tab.label}</span>

                {tab.id === 'orders' && ordersLength > 0 && (
                  <span className="min-w-4 h-4 px-1 bg-emerald-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {ordersLength}
                  </span>
                )}
                {tab.id === 'wishlist' && mergedWishlistLength > 0 && (
                  <span className="min-w-4 h-4 px-1 bg-[#B88E4B] text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {mergedWishlistLength}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function DashboardTopTabDock(
  _props?: {
    activeTab?: string;
    setActiveTab?: (tab: string) => void;
    ordersLength?: number;
    mergedWishlistLength?: number;
  }
) {
  return null;
}
