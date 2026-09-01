'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Sparkles,
  MapPin,
  Smartphone,
  Clock,
  Coins,
  Globe,
  ShoppingBag,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Laptop
} from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface AiRadarTabProps {
  telemetry: any;
  stats: any;
}

export default function AiRadarTab({ telemetry, stats }: AiRadarTabProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'checkout' | 'cart' | 'viewing'>('all');

  // 100% REAL live active visitors from telemetry backend
  const liveVisitors: any[] = Array.isArray(telemetry?.visitors) ? telemetry.visitors : [];
  const activeVisitorsCount = telemetry?.activeVisitorsCount ?? liveVisitors.length;

  const filteredVisitors = liveVisitors.filter((v: any) => {
    if (activeFilter === 'cart') return v.status?.toLowerCase().includes('cart');
    if (activeFilter === 'checkout') return v.status?.toLowerCase().includes('checkout');
    if (activeFilter === 'viewing') return v.status?.toLowerCase().includes('view') || v.status?.toLowerCase().includes('brows');
    return true;
  });

  return (
    <div className="flex-1 flex flex-col justify-between gap-2.5 min-h-0 font-sans overflow-y-auto lg:overflow-hidden lg:h-full pr-0.5 pb-6 lg:pb-0">
      
      {/* ── TOP LUXURY HEADER (SHORT, CLEAN & COMPACT FOR MOBILE) ── */}
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
              <span className="hidden lg:inline">ENTERPRISE SUITE V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden tracking-wide">LIVE RADAR</span>
              <span className="hidden lg:inline tracking-wide">100% REAL LIVE DATA SYNCED</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            {/* Mobile: Exactly 5 Words */}
            <span className="sm:hidden">
              AI Visitor Radar <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Telemetry</span>
            </span>

            {/* Desktop: Full Title */}
            <span className="hidden sm:inline">
              Executive AI Visitor Radar <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Live Telemetry</span>
            </span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Real-time live active viewers count, exact product pages opened, city location breakdown, and order stream.
          </p>
        </div>

        {/* Live Active Visitors Glowing Capsule */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <div className="bg-gradient-to-br from-[#FAF5EE] via-white to-[#F3E7D3] border border-[#E2D1BC] px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative flex h-2.5 sm:h-3.5 w-2.5 sm:w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 sm:h-3.5 w-2.5 sm:w-3.5 bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-2xl lg:text-3xl font-black text-[#1F1612] leading-none font-sans">
                  <AnimatedCounter value={activeVisitorsCount} duration={1.0} />
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700">Online</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-stone-500 block">Active Viewers Now</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        
        {/* Top Active Region */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-amber-300/80 hover:border-amber-500 rounded-2xl sm:rounded-[22px] p-4.5 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)] flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-amber-500/10" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              TOP ACTIVE REGION
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]">
              <MapPin size={17} className="stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none truncate font-sans">
              {telemetry?.topLocation || (activeVisitorsCount === 0 ? 'Standby' : 'Detecting...')}
            </h3>

            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live Geolocation Radar
              </span>
            </div>
          </div>
        </motion.div>

        {/* Device Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.1, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-blue-300/80 hover:border-blue-500 rounded-2xl sm:rounded-[22px] p-4.5 shadow-[0_4px_20px_rgba(59,130,246,0.08)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.18)] flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-blue-500/10" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              DEVICE PLATFORM
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.2)]">
              <Laptop size={17} className="stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none truncate font-sans">
              {telemetry?.mobileRatio || (activeVisitorsCount === 0 ? 'Desktop' : 'Desktop Browser')}
            </h3>

            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-blue-50 text-blue-800 border-blue-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                </span>
                Active Client Hardware
              </span>
            </div>
          </div>
        </motion.div>

        {/* Avg Session Dwell */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.15, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-purple-300/80 hover:border-purple-500 rounded-2xl sm:rounded-[22px] p-4.5 shadow-[0_4px_20px_rgba(168,85,247,0.08)] hover:shadow-[0_12px_30px_rgba(168,85,247,0.18)] flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-purple-500/10" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              ACTIVE ENGAGEMENT
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.2)]">
              <Clock size={17} className="stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none truncate font-sans">
              {telemetry?.avgSessionTime || (activeVisitorsCount === 0 ? '0s' : 'Real-Time Active')}
            </h3>

            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-purple-50 text-purple-800 border-purple-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500" />
                </span>
                Live Shopper Dwell Time
              </span>
            </div>
          </div>
        </motion.div>

        {/* Storefront / Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.2, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border border-amber-300/80 hover:border-[#B88E4B] rounded-2xl sm:rounded-[22px] p-4.5 shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)] flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 bg-[#B88E4B]/10" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
              TOTAL REVENUE
            </span>
            <div className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]">
              <Coins size={17} className="stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-2 relative z-10">
            <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none flex items-baseline font-sans">
              <span className="text-base sm:text-lg font-bold text-[#8C6D46] mr-1 select-none">Rs. </span>
              <AnimatedCounter value={stats?.totalRevenue || 0} duration={1.5} />
            </h3>

            <div className="mt-2.5 flex items-center">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs bg-emerald-50 text-emerald-800 border-emerald-500/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                {stats?.orderCount || 0} Orders Processed
              </span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ── INTERACTIVE RADAR SCANNER & VISITOR TELEMETRY STREAM (EXACT OVERVIEW PANEL QUALITY) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
        
        {/* Left Column: Modern Premium Radar Scanner (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E7DDD0] rounded-[20px] p-3.5 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col justify-between h-full min-h-0 hover:border-[#B88E4B]/40 transition-all relative overflow-hidden group/radar">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2 shrink-0">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#221814] flex items-center gap-1.5 font-serif">
                <span className="text-[#B88E4B]">✦</span> Spatial Radar Array
              </h2>
              <p className="text-stone-400 text-[10px] font-semibold">Live geospatial telemetry & shopper frequency</p>
            </div>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-500/35 flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeVisitorsCount > 0 ? `${activeVisitorsCount} Active ${activeVisitorsCount === 1 ? 'Shopper' : 'Shoppers'}` : 'Scanning'}
            </span>
          </div>

          {/* Interactive Modern Radar Screen */}
          <div className="flex-1 w-full min-h-0 relative my-1 flex items-center justify-center">
            
            {/* Circular Tactical Radar Container */}
            <div className="relative w-[170px] h-[170px] rounded-full border-[2.5px] border-[#CBB393] bg-gradient-to-br from-[#FAF5EE] via-[#F4ECE0] to-[#ECE0CE] shadow-[inset_0_4px_18px_rgba(44,30,24,0.10),0_6px_20px_rgba(184,142,75,0.15)] flex items-center justify-center overflow-hidden">
              
              {/* Concentric Golden Sonar Grid Rings */}
              <div className="absolute inset-3 rounded-full border border-[#B88E4B]/25 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-[#B88E4B]/30 pointer-events-none" />
              <div className="absolute inset-13 rounded-full border border-[#B88E4B]/35 pointer-events-none" />
              
              {/* Tactical Degree Coordinates */}
              <span className="absolute top-1 text-[8px] font-mono font-black text-[#8C6944] pointer-events-none tracking-widest">N 0°</span>
              <span className="absolute bottom-1 text-[8px] font-mono font-black text-[#8C6944] pointer-events-none tracking-widest">S 180°</span>
              <span className="absolute right-1 text-[8px] font-mono font-black text-[#8C6944] pointer-events-none tracking-widest">E 90°</span>
              <span className="absolute left-1 text-[8px] font-mono font-black text-[#8C6944] pointer-events-none tracking-widest">W 270°</span>

              {/* Crosshair Axes */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1.5px] bg-[#B88E4B]/30" />
                <div className="h-full w-[1.5px] bg-[#B88E4B]/30 absolute" />
              </div>

              {/* Rotating Radar Sweep Needle */}
              <div className="absolute inset-0 rounded-full animate-spin [animation-duration:4s] origin-center pointer-events-none">
                <div
                  className="w-1/2 h-1/2 bg-gradient-to-br from-[#B88E4B]/50 via-emerald-500/30 to-transparent absolute top-0 right-0 origin-bottom-left"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                />
              </div>

              {/* Center Radar Transmitter Beacon */}
              <div className="relative z-10 w-4 h-4 rounded-full bg-gradient-to-br from-[#B88E4B] via-[#D4AF37] to-[#996515] border-2 border-white shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>

              {/* Dynamically Render Real Visitor Blips */}
              {liveVisitors.map((vis, i) => {
                const idStr = String(vis.id || `v-${i}`);
                const hash = idStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const posX = 22 + ((hash * 19) % 54);
                const posY = 22 + ((hash * 33) % 54);

                return (
                  <div
                    key={vis.id || i}
                    style={{ top: `${posY}%`, left: `${posX}%` }}
                    className="absolute z-20 group/blip cursor-pointer"
                  >
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/blip:flex flex-col bg-[#1F1612]/95 backdrop-blur-md text-white text-[9.5px] font-bold py-1.5 px-2.5 rounded-xl whitespace-nowrap shadow-2xl border border-white/15 z-30 pointer-events-none">
                      <span className="text-[#D4AF37] flex items-center gap-1 font-serif">
                        <span>📍</span> {vis.location}
                      </span>
                      <span className="text-stone-300 truncate max-w-[150px] font-medium">{vis.currentPage}</span>
                    </div>
                  </div>
                );
              })}

              {activeVisitorsCount === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-4 text-center pointer-events-none z-10">
                  <span className="text-[10px] font-black text-[#7A6354] bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#E7DDD0] shadow-2xs">
                    Listening for live website traffic...
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Bottom Modern Metric Capsules (3 Columns with Clear Bold Font) */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EADBCE] shrink-0">
            <div className="bg-[#FAF5EE] border border-[#EADBCE] rounded-xl py-1 px-1.5 text-center shadow-2xs hover:border-[#B88E4B]/50 transition-all">
              <span className="text-[9px] font-black uppercase text-stone-500 block tracking-wider">Active</span>
              <span className="text-xs font-black text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeVisitorsCount} {activeVisitorsCount === 1 ? 'Shopper' : 'Shoppers'}
              </span>
            </div>

            <div className="bg-[#FAF5EE] border border-[#EADBCE] rounded-xl py-1 px-1.5 text-center shadow-2xs hover:border-[#B88E4B]/50 transition-all">
              <span className="text-[9px] font-black uppercase text-stone-500 block tracking-wider">Prime City</span>
              <span className="text-xs font-black text-[#1F1612] truncate block font-sans mt-0.5">
                {telemetry?.topLocation || 'Standby'}
              </span>
            </div>

            <div className="bg-[#FAF5EE] border border-[#EADBCE] rounded-xl py-1 px-1.5 text-center shadow-2xs hover:border-[#B88E4B]/50 transition-all">
              <span className="text-[9px] font-black uppercase text-stone-500 block tracking-wider">Hardware</span>
              <span className="text-xs font-black text-blue-700 truncate block mt-0.5">
                {telemetry?.mobileRatio || 'Desktop'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Column: Real-Time Live Shopper Stream (7 Cols with High-Readability Cards) */}
        <div className="lg:col-span-7 bg-white border border-[#E7DDD0] rounded-[20px] p-4 shadow-[0_4px_20px_rgba(44,30,24,0.015)] flex flex-col justify-between h-full min-h-0 hover:border-[#B88E4B]/40 transition-all">
          
          {/* Header & Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2 shrink-0">
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#221814] flex items-center gap-1.5 font-serif">
                <span className="text-[#B88E4B]">✦</span> Real-Time Live Shopper Stream
              </h2>
              <p className="text-stone-400 text-[10px] font-semibold">Live verbatim page visits, device hardware, and traffic sources</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-[#F7F2EB] border border-[#E2D6C8] rounded-xl p-0.5 text-xs font-black">
              {(['all', 'checkout', 'cart', 'viewing'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] font-black transition-all cursor-pointer ${
                    activeFilter === f
                      ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-xs'
                      : 'text-stone-600 hover:text-[#221814]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Visitor Cards Feed Stream */}
          <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-2 pr-1 my-1">
            {filteredVisitors.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#E7DDD0] rounded-[16px] bg-[#FCFAF7]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <h4 className="font-bold text-sm text-[#221814] font-serif">Live Telemetry Stream Connected</h4>
                <p className="text-stone-500 text-xs max-w-sm mt-1 font-medium">
                  Currently listening for live visitors. When users browse the website on their phones or computers, their real city, page, device, and traffic source will appear here live!
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredVisitors.map((vis: any, idx: number) => (
                  <motion.div
                    key={vis.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-3 rounded-[16px] bg-[#FCFAF7] border border-[#EBE3D7] hover:border-[#B88E4B]/60 hover:shadow-xs transition-all space-y-2"
                  >
                    {/* Top Line: Session ID + Status + Time */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="font-mono text-xs font-black text-[#1F1612] bg-white border border-[#E2D1BC] px-2.5 py-0.5 rounded-md">
                          {vis.visitorNum}
                        </span>
                        <span className="text-[10.5px] font-bold text-stone-500 bg-white border border-stone-200 px-2.5 py-0.5 rounded-md">
                          {vis.lastSeenAgo || 'Active'}
                        </span>
                      </div>

                      <span className={`px-3 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider border ${
                        vis.status?.includes('Checkout')
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : vis.status?.includes('Cart')
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-blue-50 text-blue-900 border-blue-300'
                      }`}>
                        {vis.status}
                      </span>
                    </div>

                    {/* Bottom Grid: Current Product + Location + Device (Large Bold Typography) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1.5 border-t border-stone-200/60">
                      
                      {/* Product */}
                      <div className="flex items-center gap-2 text-[#1F1612] truncate bg-white border border-[#EADBCE] px-2.5 py-1 rounded-lg">
                        <ShoppingBag size={13} className="text-[#B88E4B] shrink-0" />
                        <span className="font-bold truncate text-xs" title={vis.currentPage}>
                          {vis.currentPage}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-stone-700 truncate bg-white border border-[#EADBCE] px-2.5 py-1 rounded-lg">
                        <MapPin size={13} className="text-amber-600 shrink-0" />
                        <span className="font-bold truncate text-xs">{vis.location}</span>
                      </div>

                      {/* Device & Traffic */}
                      <div className="flex items-center justify-between text-stone-600 truncate bg-white border border-[#EADBCE] px-2.5 py-1 rounded-lg">
                        <span className="truncate font-bold text-xs">{vis.device}</span>
                        <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.2 rounded text-[10px] shrink-0 ml-1">
                          {vis.trafficSource}
                        </span>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 pt-2 border-t border-neutral-100 shrink-0">
            <span className="flex items-center gap-1.5 text-stone-500">
              <Globe size={12} className="text-emerald-600" />
              Connected: <strong>fahad-ali-interior.vercel.app</strong>
            </span>
            <span className="font-mono text-stone-500">Auto-refresh stream: 4s</span>
          </div>

        </div>

      </div>

    </div>
  );
}
