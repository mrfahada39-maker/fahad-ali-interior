'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Search, ShoppingBag, User, Home, Armchair, Sparkles, PhoneCall, Bell, LogOut, Compass, Crown, ChevronRight, Heart, LayoutGrid, Phone, UserPlus, Headphones, Facebook, Instagram, Youtube } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

interface NavbarProps {
  onSearchOpen: () => void;
  onAuthOpen: () => void;
}

export default function Navbar({ onSearchOpen, onAuthOpen }: NavbarProps) {
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const roleUpper = (session?.user as { role?: string })?.role?.toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    let lastScrolled = false;
    const handleScroll = () => {
      const scrolled = window.scrollY > 30;
      if (scrolled !== lastScrolled) {
        lastScrolled = scrolled;
        setIsScrolled(scrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Left primary links with outline icons + text
  const leftLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Collections', href: '/shop/categories', icon: Armchair },
    { label: 'Contact Us', href: '/contact', icon: PhoneCall },
  ];

  const isSolid = isScrolled || pathname !== '/';

  return (
    <>
      {/* ── STICKY EDITORIAL LUXURY HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-500 font-sans">
        
      {/* Main Full-Width Editorial Navbar */}
      <nav 
        className={`w-full transition-all duration-500 border-b ${
          isSolid 
            ? "bg-[#FCFAF7]/95 backdrop-blur-xl text-[#221814] border-[#E7DDD0] shadow-[0_4px_25px_rgba(44,30,24,0.04)]" 
            : "bg-gradient-to-b from-black/80 via-black/45 to-transparent text-white border-white/10"
        }`}
      >
          
          <div className="w-full max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between">
            {/* LEFT SECTION: Home, Collections, About, Contact Us */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 w-2/5">
              {leftLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    className={`flex items-center gap-2 text-[14px] xl:text-[15px] font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${
                      isActive 
                        ? 'underline underline-offset-8 opacity-100 text-[#B88E4B]' 
                        : isSolid
                          ? 'text-[#2C1E18] opacity-90 hover:opacity-100 hover:text-[#B88E4B] hover:underline hover:underline-offset-8'
                          : 'text-white opacity-90 hover:opacity-100 hover:underline hover:underline-offset-8'
                    }`}
                  >
                    <IconComponent size={16} strokeWidth={1.7} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* MOBILE HAMBURGER */}
            <div className="lg:hidden flex items-center w-1/4">
              <button 
                onClick={() => setMobileOpen(true)} 
                className="p-1.5 transition-all duration-300 hover:scale-110 focus:outline-none cursor-pointer" 
                aria-label="Open Navigation Menu"
              >
                <LayoutGrid size={19} strokeWidth={1.6} className="text-current opacity-90 hover:opacity-100" />
              </button>
            </div>

            {/* CENTER SECTION: Logo (Original Font Weight + Two-Tone Color Combination) */}
            <div className="flex justify-center items-center w-2/4 lg:w-1/5 text-center">
              <Link href="/" prefetch={true} className="group flex flex-col items-center">
                <span className={`font-serif text-2xl min-[380px]:text-3xl sm:text-3xl lg:text-4xl font-normal tracking-wider uppercase transition-opacity group-hover:opacity-80 whitespace-nowrap drop-shadow-sm ${
                  isSolid ? 'text-[#221814]' : 'text-white'
                }`}>
                  FAHAD ALI
                </span>
                <span className={`text-[9px] sm:text-[11px] tracking-[0.35em] font-light uppercase transition-colors -mt-0.5 ${
                  isSolid ? 'text-[#B88E4B]' : 'text-[#F3E5AB]'
                }`}>
                  INTERIOR
                </span>
              </Link>
            </div>

            {/* RIGHT SECTION: Search, Notification, Profile, Cart */}
            <div className="flex items-center justify-end gap-4 xl:gap-6 w-1/4 lg:w-2/5">
              
              {/* 1. Sleek Search Button */}
              <button 
                onClick={onSearchOpen} 
                className="hidden sm:flex items-center gap-1.5 text-[14px] xl:text-[15px] font-medium tracking-wide transition-opacity hover:opacity-75 cursor-pointer whitespace-nowrap"
                aria-label="Search Catalog"
              >
                <Search size={16} strokeWidth={1.7} />
                <span>Search</span>
              </button>

              {/* 2. Notification */}
              {mounted && session?.user ? (
                <div className="hidden sm:flex items-center">
                  <NotificationBell />
                </div>
              ) : (
                <button 
                  onClick={onAuthOpen}
                  className="hidden sm:flex items-center gap-1.5 text-[14px] xl:text-[15px] font-medium tracking-wide transition-opacity hover:opacity-75 cursor-pointer whitespace-nowrap"
                  aria-label="Notifications"
                >
                  <Bell size={16} strokeWidth={1.7} />
                  <span className="hidden xl:inline">Alerts</span>
                </button>
              )}

              {/* 3. Account / Profile */}
              <Link
                href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '#'}
                prefetch={true}
                onClick={mounted && session?.user ? undefined : (e) => { e.preventDefault(); onAuthOpen(); }}
                className="hidden sm:flex items-center gap-1.5 text-[14px] xl:text-[15px] font-medium tracking-wide transition-opacity hover:opacity-75 whitespace-nowrap"
                aria-label="Profile / Account"
              >
                <User size={16} strokeWidth={1.7} />
                <span>{mounted && session?.user ? (isAdmin ? 'Admin' : 'Account') : 'Login'}</span>
              </Link>

              {mounted && session?.user && (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden sm:flex items-center gap-1 text-[14px] font-medium text-red-500 transition-opacity hover:opacity-75 cursor-pointer"
                  title="Log out"
                >
                  <LogOut size={15} strokeWidth={1.7} />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              )}

              {/* 4. Elegant Luxury Cart Button */}
              <button 
                onClick={openCart} 
                className="flex items-center gap-1.5 sm:gap-2 text-[14px] xl:text-[15px] font-medium tracking-wide transition-all duration-300 hover:scale-105 hover:opacity-85 cursor-pointer p-1 whitespace-nowrap"
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={19} strokeWidth={1.6} className="text-current opacity-90 hover:opacity-100" />
                <span className="hidden sm:inline">Cart</span>
                <span className="text-xs font-semibold">({mounted ? cartItemCount : 0})</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── LUXURY CURVED MOBILE DRAWER (EXACT 100% REPLICA OF SCREENSHOT IMAGE) ── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-500 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      <div
        className={`fixed top-0 left-0 bottom-0 w-[88%] max-w-[390px] bg-[#FAF7F2] text-[#2C1E18] z-50 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto shadow-2xl rounded-r-[40px] border-r-2 border-[#C9A96E]/40 lg:hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header: Logo with Ornate Flourish & Circular Close Button */}
        <div className="flex items-start justify-between pt-1 pb-4">
          <div>
            <Link href="/" onClick={() => setMobileOpen(false)} className="group flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl font-normal tracking-wider uppercase text-[#1C1410]">
                FAHAD ALI
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.35em] font-light uppercase text-[#B88E4B] -mt-0.5">
                INTERIOR
              </span>
            </Link>
            
            {/* Ornate Gold Flourish Line */}
            <div className="flex items-center gap-2 mt-2 w-36">
              <div className="h-px w-full bg-gradient-to-r from-[#C9A96E] to-transparent" />
              <span className="text-[#C9A96E] text-[10px]">❖</span>
              <div className="h-px w-full bg-gradient-to-l from-[#C9A96E] to-transparent" />
            </div>
          </div>

          <button 
            onClick={() => setMobileOpen(false)} 
            className="w-11 h-11 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] flex items-center justify-center text-[#8A5A2B] shadow-sm hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer" 
            aria-label="Close Navigation"
          >
            <X size={22} strokeWidth={1.7} />
          </button>
        </div>

        {/* Menu Items Card List (Matches Screenshot Cards 100% with Luxury Hover Animations) */}
        <div className="flex flex-col gap-3 py-2">
          
          {/* 1. HOME (Active Card with Gold Pill Bar & Hover Animation) */}
          <Link
            href="/"
            prefetch={true}
            onClick={() => setMobileOpen(false)}
            className="relative w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#F7F2EA] to-white border border-[#E6DCCF] shadow-sm hover:border-[#C9A96E] hover:shadow-[0_8px_25px_rgba(201,169,110,0.22)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group overflow-hidden"
          >
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#C9A96E] rounded-r-full group-hover:w-2 transition-all duration-300" />
            <div className="flex items-center gap-3.5 pl-2">
              <Home size={20} strokeWidth={1.5} className="text-[#C9A96E] group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300" />
              <span className="font-serif text-xs font-bold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                HOME
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>



          {/* 3. SHOP */}
          <Link
            href="/shop"
            prefetch={true}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <ShoppingBag size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                SHOP
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 4. COLLECTIONS */}
          <Link
            href="/shop/categories"
            prefetch={true}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <LayoutGrid size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                COLLECTIONS
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 5. CONTACT US */}
          <Link
            href="/contact"
            prefetch={true}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <PhoneCall size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                CONTACT US
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 6. WISHLIST */}
          <Link
            href={mounted && session?.user ? '/dashboard?tab=wishlist' : '#'}
            prefetch={true}
            onClick={(e) => {
              setMobileOpen(false);
              if (!session?.user) { e.preventDefault(); onAuthOpen(); }
            }}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <Heart size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                WISHLIST
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 7. NOTIFICATION (with Badge 2) */}
          <Link
            href={mounted && session?.user ? '/dashboard?tab=notifications' : '#'}
            prefetch={true}
            onClick={(e) => {
              setMobileOpen(false);
              if (!session?.user) { e.preventDefault(); onAuthOpen(); }
            }}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <Bell size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                NOTIFICATION
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#C9A96E] text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                2
              </span>
              <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
            </div>
          </Link>

          {/* 8. LOGIN / REGISTER */}
          <Link
            href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '#'}
            prefetch={true}
            onClick={(e) => {
              setMobileOpen(false);
              if (!session?.user) { e.preventDefault(); onAuthOpen(); }
            }}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <UserPlus size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                {mounted && session?.user ? 'MY ACCOUNT' : 'LOGIN / REGISTER'}
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {mounted && session?.user && (
            <button
              onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
              className="w-full py-2.5 text-center font-serif text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer mt-1"
            >
              LOG OUT
            </button>
          )}
        </div>

        {/* Bottom Need Help & Follow Us Section (Matches Screenshot Footer 100%) */}
        <div className="pt-2">
          {/* Ornate Gold Flourish Divider */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-20 bg-[#C9A96E]/40" />
            <span className="text-[#C9A96E] text-xs">❖</span>
            <div className="h-px w-20 bg-[#C9A96E]/40" />
          </div>

          {/* Need Help Section */}
          <div className="flex items-center gap-3.5 mb-5 px-1">
            <div className="w-12 h-12 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Headphones size={22} strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[#8A5A2B] block mb-0.5">
                NEED HELP?
              </span>
              <a href="tel:+923001234567" className="text-xs font-semibold text-[#2C1E18] block hover:underline">
                +92 300 1234567
              </a>
              <a href="mailto:support@fahadaliinterior.com" className="text-[11px] text-[#7A6048] block hover:underline">
                support@fahadaliinterior.com
              </a>
            </div>
          </div>

          {/* Follow Us Section */}
          <div className="px-1">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#8A5A2B] block mb-2.5">
              FOLLOW US
            </span>
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Pinterest"
              >
                <Sparkles size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="YouTube"
              >
                <Youtube size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 100% FLUSH BOTTOM NAVBAR (HAUTE COUTURE 24K ROYAL GOLD & OBSIDIAN GLASS) ── */}
      <nav 
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 w-full z-40 lg:hidden bg-[#0D0704]/96 backdrop-blur-3xl border-t border-[#D4AF37]/50 text-white shadow-[0_-12px_45px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] px-1 pt-1.5 pb-2 h-[66px] sm:h-[70px] flex items-center justify-around select-none overflow-visible before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-[#FFEAA0] before:to-transparent before:animate-pulse"
      >
        {/* 1. Shop */}
        <Link
          href="/shop"
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            pathname === '/shop' || pathname.startsWith('/product') ? '-top-3.5' : 'py-1'
          }`}
        >
          {pathname === '/shop' || pathname.startsWith('/product') ? (
            /* 24K Gold Liquid Bubble Dome (Active) */
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
                <LayoutGrid size={24} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
              </div>
            </div>
          ) : (
            /* Flat Inactive Item */
            <LayoutGrid size={23} strokeWidth={1.8} className="text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200" />
          )}
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            pathname === '/shop' || pathname.startsWith('/product')
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            Shop
          </span>
          {(pathname === '/shop' || pathname.startsWith('/product')) && (
            <span className="w-3.5 h-0.5 rounded-full bg-gradient-to-r from-[#FFDF78] via-[#FFEAA0] to-[#FFDF78] shadow-[0_0_8px_#FFEAA0] mt-0.5 animate-pulse" />
          )}
        </Link>

        {/* 2. Search */}
        <button
          onClick={onSearchOpen}
          className="relative flex-1 flex flex-col items-center justify-center py-1 text-[#E5D5BA] hover:text-[#FFEAA0] transition-all duration-200 cursor-pointer active:scale-90 group"
          aria-label="Search Catalog"
        >
          <Search size={23} strokeWidth={1.8} className="text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200" />
          <span className="text-[9.5px] mt-0.5 font-serif uppercase tracking-widest font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]">
            Search
          </span>
        </button>

        {/* 3. 👑 HOME (PROMINENT 24K GOLD JEWEL IN THE CENTER) */}
        <Link
          href="/"
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            pathname === '/' ? '-top-3.5' : 'py-1'
          }`}
        >
          {pathname === '/' ? (
            /* 24K Gold Liquid Bubble Dome (Active) */
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
                <Compass size={25} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
              </div>
            </div>
          ) : (
            /* Flat Inactive Item */
            <Compass size={24} strokeWidth={1.8} className="text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200" />
          )}
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            pathname === '/'
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            Home
          </span>
          {pathname === '/' && (
            <span className="w-4 h-0.5 rounded-full bg-gradient-to-r from-[#FFDF78] via-[#FFEAA0] to-[#FFDF78] shadow-[0_0_8px_#FFEAA0] mt-0.5 animate-pulse" />
          )}
        </Link>

        {/* 4. Cart */}
        <button
          onClick={openCart}
          className="relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 cursor-pointer active:scale-90 group"
          aria-label="Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag size={23} strokeWidth={1.8} className="text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200" />
            {mounted && cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-0.5 rounded-full bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] text-[8.5px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(255,234,160,0.9)] border border-[#0D0704] animate-pulse">
                {cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] mt-0.5 font-serif uppercase tracking-widest font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]">
            Cart
          </span>
        </button>

        {/* 5. Account */}
        <Link
          href={session?.user ? (isAdmin ? '/admin' : '/dashboard') : '#'}
          onClick={session?.user ? undefined : (e) => { e.preventDefault(); onAuthOpen(); }}
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            pathname.includes('dashboard') || pathname.includes('admin') ? '-top-3.5' : 'py-1'
          }`}
        >
          {pathname.includes('dashboard') || pathname.includes('admin') ? (
            /* 24K Gold Liquid Bubble Dome (Active) */
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
                <Crown size={24} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
              </div>
            </div>
          ) : (
            /* Flat Inactive Item */
            <Crown size={23} strokeWidth={1.8} className="text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200" />
          )}
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            pathname.includes('dashboard') || pathname.includes('admin')
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            {session?.user ? 'Account' : 'Login'}
          </span>
          {(pathname.includes('dashboard') || pathname.includes('admin')) && (
            <span className="w-3.5 h-0.5 rounded-full bg-gradient-to-r from-[#FFDF78] via-[#FFEAA0] to-[#FFDF78] shadow-[0_0_8px_#FFEAA0] mt-0.5 animate-pulse" />
          )}
        </Link>
      </nav>
    </>
  );
}
