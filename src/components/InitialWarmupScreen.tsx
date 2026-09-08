'use client';

import { useState, useEffect } from 'react';

export default function InitialWarmupScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const alreadyWarmed = sessionStorage.getItem('fahad_site_warmed');
      if (!alreadyWarmed) {
        setVisible(true);

        // 400ms ultra-clean warmup: allows browser to complete layout and first paint
        const fadeTimer = setTimeout(() => {
          setFading(true);
          sessionStorage.setItem('fahad_site_warmed', '1');
        }, 450);

        const removeTimer = setTimeout(() => {
          setVisible(false);
        }, 800);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    } catch {
      setVisible(false);
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none pointer-events-none transition-opacity duration-350 ease-out ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#FAF7F2',
        contain: 'strict',
      }}
    >
      {/* Centerpiece Luxury Badge */}
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-md w-full">
        {/* Royal Crown Crest */}
        <div className="relative mb-5">
          <div
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-[24px] flex items-center justify-center shadow-[0_10px_28px_rgba(184,142,75,0.28)] border border-white/70"
            style={{
              background: 'linear-gradient(135deg, #DFB86C 0%, #C9A24D 50%, #B38738 100%)',
            }}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-xs"
            >
              <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.201a4 4 0 0 1-3.865 2.926H8.718a4 4 0 0 1-3.865-2.926L2.019 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
              <path d="M5 21h14" />
            </svg>
          </div>
          {/* Active Emerald Dot */}
          <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white absolute -top-0.5 -right-0.5 shadow-xs" />
        </div>

        {/* Brand Name */}
        <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-[0.06em] uppercase text-[#1F1916] mb-1">
          FAHAD ALI <span className="italic font-normal text-[#C8A055]">&</span> INTERIOR
        </h1>

        {/* Tagline */}
        <p className="text-[10px] sm:text-[11px] tracking-[0.26em] uppercase font-serif italic text-[#8E7969] font-medium mb-6">
          MASTERPIECES CRAFTED FOR ROYALTY
        </p>

        {/* High-Speed Gold Progress Track */}
        <div className="w-48 sm:w-56 h-[3px] bg-[#E8DDD0] rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C9A24D] via-[#DFB86C] to-[#B38738]"
            style={{
              animation: 'fahadWarmupProgress 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          />
        </div>

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono tracking-[0.2em] font-bold uppercase text-[#8E7969]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A055] animate-ping" />
          <span>AUTHENTICATING LIVING SPACE</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fahadWarmupProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
