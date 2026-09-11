'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  WifiOff,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Phone,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { useSiteSettingsStore } from '@/store';

export default function OfflineClient() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const siteSettings = useSiteSettingsStore((s) => s.settings);

  const whatsappNumber = siteSettings?.socialWhatsapp || '923000000000';
  const cleanWhatsapp = whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsapp || '923000000000'}?text=Hello%20Fahad%20Ali%20Interior%20Concierge,%20I%20am%20browsing%20offline%20and%20need%20assistance.`;
  const contactPhone = siteSettings?.contactPhone || '+92 300 0000000';

  const handleManualReconnect = useCallback(async () => {
    setIsChecking(true);

    // 1. Browser navigator check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setIsChecking(false);
      toast.error('Still offline. No internet connection detected.');
      return;
    }

    // 2. Real external internet ping test with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Ping reliable external CDN
      await fetch(`https://1.1.1.1/cdn-cgi/trace?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsOnline(true);
      toast.success('Connected! Returning to live showroom...');
      const targetUrl = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('last_online_path') || '/') : '/';
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 600);
    } catch {
      setIsOnline(false);
      toast.error('Still offline. No active internet signal.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('Internet connection detected. Click "Reconnect Now" to reload.', { duration: 3000 });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAF7F2] text-[#2D231E] font-sans selection:bg-[#B88E4B] selection:text-black flex flex-col justify-between px-4 sm:px-8 lg:px-16 py-5 sm:py-8 lg:py-10 relative overflow-hidden select-none">
      
      {/* â”€â”€ BACKGROUND SOFT AMBIENT LIGHT (REVIEWS SECTION EXACT GLOW) â”€â”€ */}
      <div className="absolute -top-[10%] left-[15%] w-[600px] h-[600px] bg-gradient-to-r from-[#FAF5EE]/90 via-[#F3E7D3]/60 to-[#FAF5EE]/90 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-[10%] right-[15%] w-[700px] h-[700px] bg-gradient-to-r from-[#FAF5EE]/90 via-[#F0E3D0]/60 to-[#FAF5EE]/90 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* â”€â”€ TOP HEADER: BRAND LOGO & TAGLINE â”€â”€ */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center"
      >
        <Link href="/" className="inline-block group text-center">
          <span className="font-serif font-black text-2xl sm:text-3xl lg:text-[34px] text-[#221814] tracking-tight leading-none block group-hover:scale-[1.015] transition-transform">
            Fahad Ali <span className="font-serif italic font-normal text-[#C9A24D] mx-1.5 sm:mx-2 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif font-black">Interior</span>
          </span>
        </Link>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-[#8C6239] mt-1.5 font-sans">
          HAUTE COUTURE INTERIORS Â· LAHORE
        </span>
      </motion.header>

      {/* â”€â”€ MAIN LUXURY CARD SHOWCASE â”€â”€ */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl mx-auto my-auto py-4 sm:py-6"
      >
        <div className="relative bg-white/85 backdrop-blur-2xl border-[1.5px] border-[#E2D2BC]/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 lg:p-12 shadow-[0_25px_70px_rgba(44,30,24,0.08),0_0_35px_rgba(184,142,75,0.06)] overflow-hidden">
          
          {/* Card Corner Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-amber-200/30 to-transparent blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* â”€â”€ LEFT COLUMN (7 COLS ON DESKTOP): HERO MESSAGE & ACTIONS â”€â”€ */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/70 shadow-2xs mb-3">
                <span className="text-[#B88E4B] text-[11px]">âœ¦</span>
                <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-[#7A6354]">
                  STANDBY & RESILIENCE MODE
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-black text-[#221814] tracking-tight leading-[1.15] mt-1 mb-2">
                You're <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Offline</span>
              </h1>

              {/* Diamond Line Divider */}
              <div className="flex items-center justify-center lg:justify-start gap-2.5 my-2.5">
                <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent lg:from-[#B88E4B]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#B88E4B] shadow-[0_0_6px_#B88E4B]" />
                <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent lg:to-transparent" />
              </div>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm lg:text-[15px] text-[#7A6048] font-serif italic max-w-lg leading-relaxed mt-1">
                Your connection is temporarily paused. Your saved boutique selections, living room catalog, and offline showroom remain fully accessible.
              </p>

              {/* Action Buttons */}
              <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md lg:max-w-none">
                <button
                  onClick={handleManualReconnect}
                  disabled={isChecking}
                  className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-gradient-to-r from-[#B88E4B] via-[#A87E47] to-[#996515] hover:from-[#C49A57] hover:to-[#8C6239] text-white font-serif font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(184,142,75,0.38)] hover:shadow-[0_8px_25px_rgba(184,142,75,0.48)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 border border-white/20"
                >
                  <RefreshCw size={15} className={`stroke-[2.4] ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking Connection...' : 'âœ¦ Reconnect Now'}</span>
                </button>

                <Link
                  href="/"
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-[#FAF5EE] hover:bg-white text-[#1F1612] border border-amber-300/80 hover:border-[#B88E4B] font-serif font-bold text-xs sm:text-sm shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap"
                >
                  <Home size={15} className="text-[#8C6239]" />
                  <span>Browse Cached Showroom</span>
                  <ArrowRight size={14} className="text-[#8C6239] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Concierge Hotline Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] hover:bg-white border border-amber-300/60 text-[#1F1612] hover:text-[#25D366] font-serif font-bold shadow-2xs transition-all cursor-pointer hover:scale-105"
                >
                  <MessageSquare size={13} className="text-[#25D366]" />
                  <span>WhatsApp Concierge</span>
                </a>

                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] hover:bg-white border border-amber-300/60 text-[#1F1612] hover:text-[#8C6239] font-serif font-bold shadow-2xs transition-all cursor-pointer hover:scale-105"
                >
                  <Phone size={13} className="text-[#8C6239]" />
                  <span>Call Showroom</span>
                </a>
              </div>

            </div>

            {/* â”€â”€ RIGHT COLUMN (5 COLS ON DESKTOP): LARGE MAJESTIC LUXURY BEACON â”€â”€ */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
              
              {/* Glowing Luxury Beacon Sphere with Large Concentric Rings */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 lg:w-64 lg:h-64 flex items-center justify-center my-2">
                
                {/* Concentric Animated Pulse Rings */}
                <span className="absolute inset-0 rounded-full border-2 border-[#B88E4B]/35 animate-ping opacity-45 pointer-events-none" />
                <span className="absolute -inset-3.5 rounded-full border border-amber-300/50 opacity-45 pointer-events-none" />
                <span className="absolute -inset-7 rounded-full border border-amber-300/25 opacity-30 pointer-events-none" />
                <span className="absolute -inset-10.5 rounded-full border border-amber-300/15 opacity-20 pointer-events-none hidden sm:block" />

                {/* Central Metallic Beacon Sphere */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-white via-[#FAF5EE] to-amber-100/90 border-2 border-amber-300/90 text-[#B88E4B] shadow-[0_16px_50px_rgba(184,142,75,0.3),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center">
                  <WifiOff className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 stroke-[2.2] text-[#8C6239]" />
                  
                  {/* Live Amber Status Dot */}
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex h-5 w-5 sm:h-6 sm:w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 sm:h-6 sm:w-6 bg-amber-500 border-2 sm:border-3 border-white shadow-md" />
                  </span>
                </div>

              </div>

              {/* Concise Status Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-amber-300/80 text-[#8C6239] text-xs sm:text-[13px] font-mono font-bold shadow-2xs mt-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                <span>Local Showroom Cached & Ready</span>
              </div>

            </div>

          </div>
        </div>
      </motion.main>

      {/* â”€â”€ FOOTER SIGNATURE â”€â”€ */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-[#E7DDD0]/70 text-[10.5px] sm:text-[11px] font-mono text-[#8C6239] uppercase tracking-wider">
        <span>Fahad Ali Interior Flagship</span>
        <span>Lahore, Pakistan</span>
      </footer>

    </div>
  );
}
