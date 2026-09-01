'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag,
  Plus, 
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';

import { useSiteSettingsStore } from '@/store/siteSettingsStore';

export default function Footer() {
  const settings = useSiteSettingsStore((s) => s.settings) || {};

  // Mobile Accordions State (Menu open by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    menu: true,
    navigation: false,
    categories: false,
    more: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <footer 
      className="w-full relative bg-[#F7F3ED] text-[#2C1E18] pt-8 sm:pt-11 pb-24 sm:pb-28 lg:pb-6 border-t border-[#E8DFC8]/60 overflow-hidden font-sans select-none" 
      data-testid="footer"
    >

      {/* ── Soft Ambient Animated Glow in Background ── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[#B88E4B]/10 blur-3xl pointer-events-none z-0 animate-pulse" />

      {/* ── MAIN FOOTER LAYOUT (DESKTOP GRID & MOBILE ACCORDIONS) ── */}
      <div className="w-full max-w-[1550px] 2xl:max-w-[1650px] mx-auto px-5 sm:px-8 relative z-20">
        
        {/* DESKTOP 5-COLUMN GRID (>= lg) WITH ANIMATED STAGGER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:grid grid-cols-5 gap-0"
        >
          
          {/* Column 1: Brand Info */}
          <div className="pr-8 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight uppercase text-[#221814]">
                  FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D] mx-1.5 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
                </h2>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-[#2C1E18] mb-1.5 flex items-center gap-1.5">
                <span>Your smart furniture destination</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed mb-4.5 max-w-sm">
                Fahad Ali Interior brings luxury, comfort, and timeless design together. Explore our exclusive furniture collections crafted for modern living.
              </p>

              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link 
                  href="/shop"
                  prefetch={true}
                  className="relative group overflow-hidden inline-flex items-center gap-2 bg-[#5C3D2E] hover:bg-[#4A2F22] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-300 shadow-md mb-4 hover:shadow-lg w-fit cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <ShoppingBag size={16} className="transition-transform group-hover:rotate-12 duration-300" />
                  <span>Shop Collection</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1 duration-300" />
                </Link>
              </motion.div>
            </div>

            {/* Animated Social Icons */}
            <div className="flex items-center gap-2.5 pt-1.5">
              {[
                { icon: Facebook, href: settings.socialFacebook || 'https://facebook.com', label: 'Facebook' },
                { icon: Instagram, href: settings.socialInstagram || 'https://instagram.com', label: 'Instagram' },
                { isPinterest: true, href: 'https://pinterest.com', label: 'Pinterest' },
                { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' }
              ].map((soc, i) => (
                <motion.a 
                  key={soc.label}
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  href={soc.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-full border border-[#2C1E18]/20 flex items-center justify-center text-[#2C1E18] hover:bg-[#2C1E18] hover:text-white hover:border-[#2C1E18] transition-colors shadow-2xs" 
                  aria-label={soc.label}
                >
                  {soc.isPinterest ? (
                    <span className="font-serif font-bold text-sm">P</span>
                  ) : soc.icon && (
                    <soc.icon size={16} />
                  )}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Menu (Centered & Admin Dashboard Styling) */}
          <div className="px-8 border-l border-[#E2D6C8] flex flex-col items-center text-center">
            <h4 className="font-serif font-black text-2xl sm:text-[26px] text-[#221814] mb-5 tracking-tight text-center w-full">Menu</h4>
            <ul className="space-y-3 text-[16px] sm:text-[17px] font-medium text-[#5C483E] flex flex-col items-center text-center">
              {[
                { label: 'Home', href: '/' },
                { label: 'Collections', href: '/shop/categories' },
                { label: 'Best Sellers', href: '/shop?sort=bestsellers' },
                { label: 'Custom Furniture', href: '/shop?category=Custom' },
                { label: 'Contact Us', href: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href} 
                    prefetch={true}
                    className="inline-block hover:text-[#B88E4B] hover:translate-x-1 transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Navigation (Centered & Admin Dashboard Styling) */}
          <div className="px-8 border-l border-[#E2D6C8] flex flex-col items-center text-center">
            <h4 className="font-serif font-black text-2xl sm:text-[26px] text-[#221814] mb-5 tracking-tight text-center w-full">Navigation</h4>
            <ul className="space-y-3 text-[16px] sm:text-[17px] font-medium text-[#5C483E] flex flex-col items-center text-center">
              {[
                { label: 'Delivery Info', href: '/faq#delivery' },
                { label: 'Return Policy', href: '/faq#returns' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Track Order', href: '/orders' },
                { label: 'FAQ', href: '/faq' },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href} 
                    prefetch={true}
                    className="inline-block hover:text-[#B88E4B] hover:translate-x-1 transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Categories (Centered & Admin Dashboard Styling) */}
          <div className="px-8 border-l border-[#E2D6C8] flex flex-col items-center text-center">
            <h4 className="font-serif font-black text-2xl sm:text-[26px] text-[#221814] mb-5 tracking-tight text-center w-full">Categories</h4>
            <ul className="space-y-3 text-[16px] sm:text-[17px] font-medium text-[#5C483E] flex flex-col items-center text-center">
              {[
                { label: 'Sofa Collection', href: '/shop?category=Living%20Room' },
                { label: 'Dining Tables', href: '/shop?category=Dining%20Room' },
                { label: 'Bedroom Sets', href: '/shop?category=Bedroom' },
                { label: 'Chairs & Stools', href: '/shop?category=Coffee%20Chairs' },
                { label: 'Coffee Tables', href: '/shop?category=Center%20Tables' },
                { label: 'Storage & Cabinets', href: '/shop?category=Luxury%20Wardrobes' },
                { label: 'Decor & Lighting', href: '/shop?category=Luxury%20Showcase' },
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href} 
                    prefetch={true}
                    className="inline-block hover:text-[#B88E4B] hover:translate-x-1 transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: More & Contact (Centered & Admin Dashboard Styling) */}
          <div className="pl-8 border-l border-[#E2D6C8] flex flex-col items-center text-center justify-between">
            <div className="flex flex-col items-center text-center w-full">
              <h4 className="font-serif font-black text-2xl sm:text-[26px] text-[#221814] mb-5 tracking-tight text-center w-full">More</h4>
              <ul className="space-y-3 text-[16px] sm:text-[17px] font-medium text-[#5C483E] mb-6 flex flex-col items-center text-center">
                {[
                  { label: 'My Account', href: '/dashboard' },
                  { label: 'Wishlist', href: '/dashboard?tab=wishlist' },
                  { label: 'Compare', href: '/shop' },
                  { label: 'VIP Concierge', href: '/contact' },
                  { label: 'Haute Portfolio', href: '/shop' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link 
                      href={item.href} 
                      prefetch={true}
                      className="inline-block hover:text-[#B88E4B] hover:translate-x-1 transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 text-sm sm:text-base text-[#221814] pt-2 flex flex-col items-center text-center">
              <a href="tel:+923001234567" className="flex items-center justify-center gap-2.5 hover:text-[#B88E4B] transition-colors duration-200 group">
                <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xs">
                  <Phone size={15} />
                </div>
                <span className="font-semibold text-xs sm:text-sm">+92 300 1234567</span>
              </a>
              <a href="mailto:info@fahadaliinterior.com" className="flex items-center justify-center gap-2.5 hover:text-[#B88E4B] transition-colors duration-200 group">
                <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] group-hover:bg-[#B88E4B] group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xs">
                  <Mail size={15} />
                </div>
                <span className="font-semibold text-xs sm:text-sm">info@fahadaliinterior.com</span>
              </a>
              <div className="flex items-center justify-center gap-2.5 text-[#221814] group">
                <div className="w-8 h-8 rounded-lg bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] group-hover:scale-110 transition-transform shadow-2xs">
                  <MapPin size={15} />
                </div>
                <span className="font-semibold text-xs sm:text-sm">Lahore, Pakistan</span>
              </div>
            </div>
          </div>

        </motion.div>

        {/* MOBILE & TABLET ACCORDIONS LAYOUT (< lg) WITH SMOOTH ANIMATIONS */}
        <div className="block lg:hidden space-y-4">
          
          {/* Top Brand Card (Centered & Larger Text) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 pb-6 border-b border-[#2C1E18]/15 flex flex-col items-center text-center"
          >
            {/* Brand Name with Luxury Two-Tone Combination */}
            <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-center mb-2 uppercase text-[#221814]">
              FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D] mx-1.5 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed max-w-sm mx-auto text-center font-medium mb-4">
              Fahad Ali Interior brings luxury, comfort, and timeless design together. Explore our exclusive furniture collections.
            </p>
            
            {/* Centered Social Media Buttons */}
            <div className="flex items-center justify-center gap-3">
              {[
                { icon: Facebook, href: settings.socialFacebook || 'https://facebook.com', label: 'Facebook' },
                { icon: Instagram, href: settings.socialInstagram || 'https://instagram.com', label: 'Instagram' },
                { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' }
              ].map((soc) => (
                <motion.a 
                  key={soc.label}
                  whileTap={{ scale: 0.92 }}
                  href={soc.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 rounded-full border border-[#2C1E18]/20 flex items-center justify-center text-[#2C1E18] hover:bg-[#2C1E18] hover:text-white transition-colors" 
                  aria-label={soc.label}
                >
                  <soc.icon size={15} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* ACCORDIONS LIST */}
          {[
            {
              id: 'menu',
              title: 'MENU',
              links: [
                { label: 'Home', href: '/' },
                { label: 'Collections', href: '/shop/categories' },
                { label: 'Best Sellers', href: '/shop?sort=bestsellers' },
                { label: 'Custom Furniture', href: '/shop?category=Custom' },
                { label: 'Contact Us', href: '/contact' },
              ]
            },
            {
              id: 'navigation',
              title: 'NAVIGATION',
              links: [
                { label: 'Delivery Info', href: '/faq#delivery' },
                { label: 'Return Policy', href: '/faq#returns' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Track Order', href: '/orders' },
                { label: 'FAQ', href: '/faq' },
              ]
            },
            {
              id: 'categories',
              title: 'CATEGORIES',
              links: [
                { label: 'Sofa Collection', href: '/shop?category=Living%20Room' },
                { label: 'Dining Tables', href: '/shop?category=Dining%20Room' },
                { label: 'Bedroom Sets', href: '/shop?category=Bedroom' },
                { label: 'Chairs & Stools', href: '/shop?category=Coffee%20Chairs' },
                { label: 'Coffee Tables', href: '/shop?category=Center%20Tables' },
                { label: 'Storage & Cabinets', href: '/shop?category=Luxury%20Wardrobes' },
                { label: 'Decor & Lighting', href: '/shop?category=Luxury%20Showcase' },
              ]
            },
            {
              id: 'more',
              title: 'MORE',
              links: [
                { label: 'My Account', href: '/dashboard' },
                { label: 'Wishlist', href: '/dashboard?tab=wishlist' },
                { label: 'Compare', href: '/shop' },
                { label: 'VIP Concierge', href: '/contact' },
              ]
            }
          ].map((acc) => {
            const isOpen = openSections[acc.id];
            return (
              <div 
                key={acc.id}
                className={`transition-all duration-300 ${isOpen ? 'border border-[#2C1E18]/25 bg-[#F2ECE4] rounded-2xl p-6 shadow-sm' : 'border-b border-[#2C1E18]/15 py-5 px-2'}`}
              >
                <button 
                  onClick={() => toggleSection(acc.id)}
                  className="w-full flex items-center justify-between text-[#2C1E18] cursor-pointer"
                >
                  <div className="w-7" />
                  <span className="font-serif font-black text-xl sm:text-2xl uppercase tracking-wide text-[#221814] text-center flex-1">{acc.title}</span>
                  {isOpen ? <Minus size={24} className="text-[#B88E4B]" /> : <Plus size={24} className="text-[#221814]" />}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-6 space-y-3.5 text-base sm:text-lg text-[#5C483E] font-medium text-center flex flex-col items-center">
                        {acc.links.map((link) => (
                          <li key={link.label}>
                            <Link href={link.href} prefetch={true} className="hover:text-[#B88E4B] transition-colors">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Direct Mobile Contact Info (Centered & Large) */}
          <div className="pt-6 space-y-2.5 text-xs sm:text-sm text-[#2C1E18] flex flex-col items-center text-center">
            <a href="tel:+923001234567" className="flex items-center gap-2 hover:text-[#B88E4B] transition-colors">
              <Phone size={15} />
              <span className="font-semibold">+92 300 1234567</span>
            </a>
            <a href="mailto:info@fahadaliinterior.com" className="flex items-center gap-2 hover:text-[#B88E4B] transition-colors">
              <Mail size={15} />
              <span className="font-semibold">info@fahadaliinterior.com</span>
            </a>
            <div className="flex items-center gap-2">
              <MapPin size={15} />
              <span className="font-semibold">Lahore, Pakistan</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── GIANT ELEGANT WATERMARK TEXT (ANIMATED BREATHING SHIMMER) ── */}
      <div className="w-full text-center mt-5 sm:mt-6 overflow-hidden pointer-events-none z-10 select-none flex justify-center">
        <motion.span 
          animate={{ opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="font-serif text-[6.5vw] sm:text-[7.2vw] lg:text-[7.8vw] xl:text-[8.2vw] font-normal tracking-[0.06em] uppercase text-[#2C1E18] leading-none block whitespace-nowrap"
        >
          FAHAD ALI INTERIOR
        </motion.span>
      </div>

    </footer>
  );
}
