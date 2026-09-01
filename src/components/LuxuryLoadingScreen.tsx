'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LuxuryLoadingScreen({
  onComplete,
  dbProgress = 0,
  forceShow = false,
}: {
  onComplete?: () => void;
  dbProgress?: number;
  forceShow?: boolean;
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('AUTHENTICATED • READY FOR LIVING');
  const [visible, setVisible] = useState(true);
  const completedRef = useRef(false);

  useEffect(() => {
    let frameId: number;
    const startTime = Date.now();
    // Ultra-snappy transition: 250ms max instead of 1200ms delay, or 0ms if dbProgress high
    const DURATION_MS = dbProgress >= 80 ? 150 : (forceShow ? 400 : 250);

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsed / DURATION_MS);
      const currentPercent = Math.max(dbProgress, Math.round(progressRatio * 100));

      setDisplayProgress(currentPercent);

      if (currentPercent < 30) {
        setStatusMessage('INITIALIZING SOLID HARDWOOD JOINERY...');
      } else if (currentPercent < 65) {
        setStatusMessage('CURATING HAUTE COUTURE ATELIER...');
      } else if (currentPercent < 90) {
        setStatusMessage('POLISHING IMPERIAL GOLD ACCENTS...');
      } else {
        setStatusMessage('AUTHENTICATED • READY FOR LIVING');
      }

      if (progressRatio >= 1 && !completedRef.current) {
        completedRef.current = true;
        setVisible(false);
        if (onComplete) onComplete();
      } else {
        frameId = requestAnimationFrame(updateProgress);
      }
    };

    frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [onComplete, dbProgress, forceShow]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999999] flex items-center justify-center select-none overflow-hidden p-4 sm:p-8"
          style={{
            backgroundColor: '#FAF7F2',
          }}
        >
          {/* ── SEAMLESS CENTERPIECE WITH LARGER LUXURY TYPOGRAPHY ── */}
          <div className="w-full max-w-2xl flex flex-col items-center justify-center text-center px-4">
            
            {/* 1. TOP ROYAL CROWN BADGE */}
            <div className="relative inline-block mb-6 sm:mb-8">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] sm:rounded-[30px] flex items-center justify-center shadow-[0_12px_32px_rgba(184,142,75,0.32)] border border-white/60"
                style={{
                  background: 'linear-gradient(135deg, #DFB86C 0%, #C9A24D 50%, #B38738 100%)',
                }}
              >
                {/* Clean Royal Crown SVG */}
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-xs sm:w-12 sm:h-12"
                >
                  <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.201a4 4 0 0 1-3.865 2.926H8.718a4 4 0 0 1-3.865-2.926L2.019 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                  <path d="M5 21h14" />
                </svg>
              </div>

              {/* Mint Green Status Dot */}
              <span className="w-4 h-4 rounded-full bg-[#34D399] border-2 border-white absolute -top-0.5 -right-0.5 shadow-xs" />
            </div>

            {/* 2. LARGER MAIN BRAND HEADING: FAHAD ALI & INTERIOR */}
            <h1 className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-3">
              <span
                className="font-serif font-black text-3xl sm:text-4xl md:text-5xl lg:text-[46px] tracking-[0.04em] uppercase text-[#1F1916]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif" }}
              >
                FAHAD ALI
              </span>
              <span
                className="font-serif italic font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[46px] text-[#C8A055] mx-1"
                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
              >
                &
              </span>
              <span
                className="font-serif font-black text-3xl sm:text-4xl md:text-5xl lg:text-[46px] tracking-[0.04em] uppercase"
                style={{
                  fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
                  background: 'linear-gradient(180deg, #D4AF37 0%, #B88E4B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                INTERIOR
              </span>
            </h1>

            {/* 3. LARGER DIAMOND DIVIDER LINE */}
            <div className="flex items-center justify-center gap-3 my-3 sm:my-4 w-full max-w-[340px] sm:max-w-[420px] mx-auto opacity-85">
              <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#C8A055] to-[#C8A055]" />
              <div className="w-2 h-2 rotate-45 bg-[#C8A055] shadow-[0_0_6px_#C8A055]" />
              <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#C8A055] to-[#C8A055]" />
            </div>

            {/* 4. LARGER SUBTITLE / TAGLINE */}
            <p
              className="text-xs sm:text-sm md:text-[13.5px] tracking-[0.24em] uppercase font-serif italic text-[#8E7969] font-medium mb-8 sm:mb-10"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
            >
              MASTERPIECES CRAFTED FOR ROYALTY • SOLID SHEESHAM
            </p>

            {/* 5. LARGER SERIF METRIC COUNTER (99 %) */}
            <div className="flex items-baseline justify-center select-none my-3">
              <span
                className="font-serif font-black text-8xl sm:text-9xl md:text-[110px] tracking-tight leading-none text-[#1F1916] tabular-nums"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif" }}
              >
                {displayProgress}
              </span>
              <span
                className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl text-[#C8A055] ml-2.5 sm:ml-3"
                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
              >
                %
              </span>
            </div>

            {/* 6. LARGER PROGRESS BAR TRACK & RADIANT TIP */}
            <div className="mt-8 relative w-full max-w-[480px] sm:max-w-[540px] h-[8px] sm:h-[9px] bg-[#E8DDD0] rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-100 ease-out relative"
                style={{
                  width: `${displayProgress}%`,
                  background: 'linear-gradient(90deg, #1F1916 0%, #5E422C 35%, #B88E4B 75%, #D4AF37 100%)',
                }}
              >
                {/* Radiant Glowing Tip */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-4 rounded-full bg-[#FFF7DC] blur-[2px]"
                  style={{
                    boxShadow: '0 0 16px #FFD700, 0 0 5px #FFFFFF',
                  }}
                />
              </div>
            </div>

            {/* 7. LARGER DYNAMIC TELEMETRY STATUS TEXT */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[#8E7969] text-xs sm:text-sm md:text-[13px] font-mono tracking-[0.22em] font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-[#C8A055] shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
