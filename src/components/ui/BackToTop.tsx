'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 380);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-[126px] sm:bottom-[130px] right-4 sm:right-6 lg:bottom-24 lg:right-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] text-white shadow-[0_8px_25px_rgba(184,142,75,0.35)] hover:shadow-[0_12px_32px_rgba(184,142,75,0.5)] border-2 border-white/60 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
    >
      <ArrowUp size={18} strokeWidth={2.5} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  );
}
