'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store';

export default function FloatingViewCartBar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getItemCount = useCartStore((s) => s.getItemCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show if cart is empty, or drawer is already open, or user is already on cart/checkout page
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const isExcludedPage = pathname === '/cart' || pathname === '/checkout';

  const shouldShow = itemCount > 0 && !isOpen && !isExcludedPage;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="floating-view-cart-bar"
          initial={{ opacity: 0, y: 40, scale: 0.92, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 40, scale: 0.92, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed z-40 bottom-[72px] lg:bottom-2.5 left-1/2 pointer-events-auto"
        >
          <motion.button
            type="button"
            onClick={openCart}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            aria-label={`View Cart with ${itemCount} items, total Rs. ${subtotal.toLocaleString()}`}
            className="group relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#B88E4B] via-[#A87B37] to-[#996515] hover:brightness-110 text-white shadow-[0_12px_36px_rgba(184,142,75,0.45)] hover:shadow-[0_16px_46px_rgba(184,142,75,0.6)] border border-amber-300/40 cursor-pointer select-none overflow-hidden transition-all duration-300"
          >
            {/* Ambient Shimmer Sweep Animation */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out pointer-events-none" />

            {/* Item Count Circle Badge */}
            <motion.span
              key={itemCount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#221814] font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0"
            >
              {itemCount}
            </motion.span>

            {/* View Cart Text */}
            <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-white leading-none whitespace-nowrap">
              View Cart
            </span>

            {/* Dynamic Live Subtotal Amount */}
            <span className="text-xs sm:text-sm font-bold text-amber-100 tracking-tight font-sans pl-1 sm:pl-2 whitespace-nowrap">
              Rs. {subtotal.toLocaleString()}
            </span>

            {/* Arrow Icon */}
            <ArrowRight 
              size={17} 
              className="text-white shrink-0 group-hover:translate-x-1 transition-transform ml-0.5" 
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
