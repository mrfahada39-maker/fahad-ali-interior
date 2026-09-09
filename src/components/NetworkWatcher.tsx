'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, ArrowRight, X } from 'lucide-react';

export default function NetworkWatcher() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkConnectivity = async () => {
      if (window.location.pathname === '/offline') return;

      if (!navigator.onLine) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 2000);
          await fetch('https://1.1.1.1/cdn-cgi/trace', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal,
          });
          clearTimeout(tid);
          setIsOffline(false);
        } catch {
          setIsOffline(true);
          setDismissed(false);
          try {
            sessionStorage.setItem('last_online_path', window.location.pathname + window.location.search);
          } catch {}
        }
      } else {
        if (isOffline) {
          setIsOffline(false);
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 3500);
        }
      }
    };

    const handleOffline = () => {
      checkConnectivity();
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOffline]);

  if (dismissed && !showRestored) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-50 flex justify-center pointer-events-none px-3 font-sans">
      <AnimatePresence>
        {isOffline && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="pointer-events-auto bg-[#1C1610]/95 backdrop-blur-md border border-[#D4AF37]/50 text-white rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-3 text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-[#B88E4B]/20 border border-[#B88E4B] flex items-center justify-center shrink-0">
              <WifiOff size={13} className="text-[#F5D77F]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-200">
                Offline Mode Active — Browsing Cached Showroom
              </span>
              <Link
                href="/offline"
                className="hidden sm:inline-flex items-center gap-1 text-[#F5D77F] font-bold hover:underline"
              >
                <span>Terminal</span>
                <ArrowRight size={12} />
              </Link>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-stone-400 hover:text-white p-0.5 ml-1 transition-colors cursor-pointer"
              title="Dismiss notice"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {showRestored && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="pointer-events-auto bg-[#062419]/95 backdrop-blur-md border border-emerald-400/50 text-white rounded-full px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-2.5 text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
              <Wifi size={13} className="text-emerald-300" />
            </div>
            <span className="font-semibold text-emerald-100">
              ✦ Connection Restored — Live Atelier Synced
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
