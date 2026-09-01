'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Sparkles, Smartphone, Share, Crown } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_install_dismissed';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow]   = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in last 7 days
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS detection — Safari doesn't support beforeinstallprompt
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone;
    setIsIOS(ios);

    if (ios) {
      // Show iOS install instructions after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Chrome/Edge/Android — listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        role="dialog"
        aria-label="Install official app prompt"
      >
        <div className="bg-theme-surface/95 backdrop-blur-xl border border-theme-accent/40 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Gold Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10">
            {/* Ultra-Luxury Gold Atelier Icon Badge */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B88E4B] via-[#D4AF37] to-[#8C6239] text-white flex items-center justify-center flex-shrink-0 shadow-md border border-white/20">
              <Crown size={22} className="text-white drop-shadow-xs" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-theme-accent bg-theme-accent/10 border border-theme-accent/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles size={9} /> Official App
                </span>
              </div>
              <p className="text-theme-dark text-sm font-bold font-serif leading-tight">
                FAHAD ALI <span className="text-theme-accent font-sans font-normal text-xs">| Luxury App</span>
              </p>

              {isIOS ? (
                <p className="text-theme-muted text-[11px] mt-1 leading-relaxed">
                  Tap <Share size={12} className="inline text-theme-accent mx-0.5" /> <span className="text-theme-dark font-bold">Share</span> then <span className="text-theme-dark font-bold">Add to Home Screen</span> for high-speed luxury browsing.
                </p>
              ) : (
                <p className="text-theme-muted text-[11px] mt-1 leading-relaxed">
                  Install the official app for instant catalog access, VIP updates & offline browsing.
                </p>
              )}

              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#b08552] to-[#966f43] hover:from-[#966f43] hover:to-[#8C6239] text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-98"
                >
                  <Download size={14} />
                  Install App Now
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="text-theme-muted hover:text-theme-dark p-1 rounded-full hover:bg-theme-bg transition-colors flex-shrink-0 absolute top-3 right-3"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
