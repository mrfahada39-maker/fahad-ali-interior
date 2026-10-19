/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Search, ShoppingBag, User, Home, Armchair, Sparkles, PhoneCall, Bell, LogOut, Compass, Crown, ChevronRight, Heart, LayoutGrid, Phone, UserPlus, Headphones, Facebook, Instagram, Youtube } from 'lucide-react';
import { useCartStore, useSiteSettingsStore } from '@/store';
import { BUSINESS_CONTACT } from '@/lib/contact-config';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useWishlistDrawerStore } from '@/components/WishlistDrawer';

const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false });

interface NavbarProps {
  onSearchOpen: () => void;
  onAuthOpen: () => void;
}

export default function Navbar({ onSearchOpen, onAuthOpen }: NavbarProps) {
  const settings = useSiteSettingsStore((s) => s.settings);
  const contactPhone = settings?.contactPhone || BUSINESS_CONTACT.phone;
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const rawPathname = usePathname();
  const pathname = rawPathname || '/';
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

  useEffect(() => {
    if (!mounted || !session?.user) {
      setUnreadCount(0);
      return;
    }
    fetch('/api/v1/customers/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const data = body?.data || body;
        if (data && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [mounted, session?.user]);

  const desktopNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/#signature-categories' },
    { label: 'Blog', href: '/#signature-categories' },
    { label: 'Collection', href: '/#signature-categories' },
    { label: 'About', href: '/about' },
    { label: 'Service', href: '/contact' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* ── STICKY FLOATING EDITORIAL LUXURY NAVBAR (MATCHES MOCKUP 100%) ── */}
      <header suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 w-full px-3 sm:px-6 pt-2.5 sm:pt-3 pointer-events-none font-sans">
        <nav 
          suppressHydrationWarning
          className="pointer-events-auto w-full max-w-[1550px] mx-auto bg-white/95 md:backdrop-blur-md rounded-[20px] sm:rounded-full border border-[#EBE1D3] shadow-[0_4px_25px_rgba(44,30,24,0.06)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300"
        >
          {/* ── DESKTOP LEFT SECTION: BRAND LOGO WITH ICON ── */}
          <div className="hidden lg:flex items-center">
            <Link href="/" prefetch={false} className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl bg-[#FAF5ED] border border-[#E8DFC8] flex items-center justify-center text-[#B88E4B] shrink-0">
                <svg className="w-5 h-5 xl:w-6 xl:h-6 fill-none stroke-[#B88E4B] stroke-[1.8]" viewBox="0 0 24 24">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                  <path d="M7 16h10M8 12h8" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif font-black text-base xl:text-lg text-[#1F1A17] tracking-tight leading-none group-hover:text-[#B88E4B] transition-colors whitespace-nowrap">
                  Fahad Ali Interior
                </span>
                <span className="text-[8px] xl:text-[9px] font-bold tracking-[0.2em] uppercase text-[#A67C37] mt-1 leading-none whitespace-nowrap">
                  LUXURY FURNITURE • MODERN LIVING
                </span>
              </div>
            </Link>
          </div>

          {/* ── DESKTOP CENTER SECTION: NAV LINKS ── */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {desktopNavLinks.map((link) => {
              const isActive = (link.href === '/' && pathname === '/') || (link.href !== '/' && !link.href.startsWith('/#') && pathname === link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  prefetch={false}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C59B4B] text-white px-4.5 py-1.5 rounded-full shadow-xs'
                      : 'text-[#4A3E38] hover:text-[#C59B4B] px-3 py-1.5 rounded-full hover:bg-[#FAF5ED]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── DESKTOP RIGHT SECTION: SEARCH, WISHLIST, CART, ALERTS, PROFILE ── */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-2.5">
            {/* 1. Search */}
            <button 
              onClick={onSearchOpen} 
              className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E5] text-[#2C1E18] hover:text-[#B88E4B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Search Catalog"
            >
              <Search size={16} strokeWidth={1.8} />
            </button>

            {/* 2. Wishlist */}
            <button
              onClick={() => useWishlistDrawerStore.getState().openDrawer()}
              className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E5] text-[#2C1E18] hover:text-[#B88E4B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart size={16} strokeWidth={1.8} />
            </button>

            {/* 3. Shopping Cart */}
            <button 
              onClick={openCart} 
              className="relative w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E5] text-[#2C1E18] hover:text-[#B88E4B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#C59B4B] text-white text-[9.5px] font-bold flex items-center justify-center px-1">
                {mounted ? cartItemCount : 0}
              </span>
            </button>

            {/* 4. Notifications / Alerts */}
            {mounted && session?.user ? (
              <div className="flex items-center">
                <NotificationBell />
              </div>
            ) : (
              <button 
                onClick={onAuthOpen}
                className="relative w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E5] text-[#2C1E18] hover:text-[#B88E4B] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={16} strokeWidth={1.8} />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#C59B4B] text-white text-[9.5px] font-bold flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              </button>
            )}

            {/* 5. Account / Profile */}
            <Link
              href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '/?auth=login'}
              prefetch={false}
              onClick={mounted && session?.user ? undefined : (e) => { e.preventDefault(); onAuthOpen(); }}
              className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-[#FAF2E5] text-[#2C1E18] hover:text-[#B88E4B] flex items-center justify-center transition-colors"
              aria-label="Profile / Account"
            >
              <User size={16} strokeWidth={1.8} />
            </Link>

            {mounted && session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-[#FAF7F2] hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* ── MOBILE NAV BAR (LG:HIDDEN) ── */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Mobile Left: Menu & Search */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMobileOpen(true)} 
                className="w-9 h-9 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#2C1E18] active:scale-95 transition-transform" 
                aria-label="Open Navigation Menu"
              >
                <LayoutGrid size={18} strokeWidth={1.8} />
              </button>
              <button 
                onClick={onSearchOpen} 
                className="w-9 h-9 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#2C1E18] active:scale-95 transition-transform" 
                aria-label="Search Catalog"
              >
                <Search size={17} strokeWidth={1.8} />
              </button>
            </div>

            {/* Mobile Center: Brand Logo */}
            <Link href="/" prefetch={false} className="flex flex-col items-center">
              <span className="font-serif text-lg font-black tracking-wider uppercase text-[#1F1A17]">
                FAHAD ALI
              </span>
              <span className="text-[8px] tracking-[0.3em] font-medium uppercase text-[#B88E4B] -mt-1">
                INTERIOR
              </span>
            </Link>

            {/* Mobile Right: Wishlist & Cart */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => useWishlistDrawerStore.getState().openDrawer()}
                className="w-9 h-9 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#2C1E18] active:scale-95 transition-transform"
                aria-label="Wishlist"
              >
                <Heart size={17} strokeWidth={1.8} />
              </button>
              <button 
                onClick={openCart} 
                className="relative w-9 h-9 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#2C1E18] active:scale-95 transition-transform" 
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={17} strokeWidth={1.8} />
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-[#C59B4B] text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {mounted ? cartItemCount : 0}
                </span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── LUXURY CURVED MOBILE DRAWER (EXACT 100% REPLICA OF SCREENSHOT IMAGE) ── */}
      {mobileOpen && (
      <>
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
            <Link prefetch={false} href="/" onClick={() => setMobileOpen(false)} className="group flex flex-col">
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
              <span className="text-[#C9A96E] text-[10px]">✦</span>
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
            prefetch={false}
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
            href="/#signature-categories"
            prefetch={false}
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


          {/* CONTACT US */}
          <Link
            href="/contact"
            prefetch={false}
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

          {/* ABOUT */}
          <Link
            href="/about"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <Sparkles size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                ABOUT
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 6. WISHLIST */}
          <button


            onClick={(e) => {
              setMobileOpen(false);
              useWishlistDrawerStore.getState().openDrawer();
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
          </button>

          {/* 7. NOTIFICATION (with Live Unread Badge) */}
          <Link
            href={mounted && session?.user ? '/dashboard?tab=notifications' : '/?auth=login'}
            prefetch={false}
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
              {mounted && session?.user && unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C9A96E] text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {unreadCount}
                </span>
              )}
              <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
            </div>
          </Link>

          {/* 8. LOGIN / REGISTER */}
          <Link
            href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '/?auth=login'}
            prefetch={false}
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
            <span className="text-[#C9A96E] text-xs">✦</span>
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
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="text-xs font-semibold text-[#2C1E18] block hover:underline">
                {contactPhone}
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
                href={settings?.socialFacebook || 'https://facebook.com/fahadaliinterior'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a 
                href={settings?.socialInstagram || 'https://instagram.com/fahadaliinterior'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://pinterest.com/fahadaliinterior" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-[#F4ECE1] border border-[#E6DCCF] text-[#8A5A2B] flex items-center justify-center hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer shadow-sm"
                aria-label="Pinterest"
              >
                <Sparkles size={18} strokeWidth={1.5} />
              </a>
              <a 
                href="https://youtube.com/@fahadaliinterior" 
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

      </>
      )}

      {/* ── 100% FLUSH BOTTOM NAVBAR (HAUTE COUTURE 24K ROYAL GOLD & OBSIDIAN GLASS) ── */}
      <nav 
        suppressHydrationWarning
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 w-full z-40 lg:hidden bg-[#0D0704] border-t border-[#D4AF37]/50 text-white shadow-[0_-12px_45px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] px-1 pt-1.5 pb-2 h-[66px] sm:h-[70px] flex items-center justify-around select-none overflow-visible before:absolute before:inset-x-0 before:top-0 before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-[#FFEAA0] before:to-transparent"
      >
        {/* 1. Shop */}
        <Link prefetch={false}
          href="/#signature-categories"
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            mounted && pathname.startsWith('/product') ? '-top-3.5' : 'py-1'
          }`}
        >
          {/* 24K Gold Liquid Bubble Dome (Active) */}
          <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] items-center justify-center ${mounted && pathname.startsWith('/product') ? 'flex' : 'hidden'}`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
              <LayoutGrid size={24} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
            </div>
          </div>
          {/* Flat Inactive Item */}
          <LayoutGrid size={23} strokeWidth={1.8} className={`text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200 ${mounted && pathname.startsWith('/product') ? 'hidden' : 'block'}`} />
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            mounted && pathname.startsWith('/product')
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            Shop
          </span>
          {mounted && pathname.startsWith('/product') && (
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
        <Link prefetch={false}
          href="/"
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            mounted && pathname === '/' ? '-top-3.5' : 'py-1'
          }`}
        >
          {/* 24K Gold Liquid Bubble Dome (Active) */}
          <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] items-center justify-center ${mounted && pathname === '/' ? 'flex' : 'hidden'}`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
              <Compass size={25} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
            </div>
          </div>
          {/* Flat Inactive Item */}
          <Compass size={24} strokeWidth={1.8} className={`text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200 ${mounted && pathname === '/' ? 'hidden' : 'block'}`} />
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            mounted && pathname === '/'
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            Home
          </span>
          {mounted && pathname === '/' && (
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
        <Link prefetch={false}
          href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '/?auth=login'}
          onClick={mounted && session?.user ? undefined : (e) => { e.preventDefault(); onAuthOpen(); }}
          className={`relative flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer active:scale-90 group ${
            mounted && (pathname.includes('dashboard') || pathname.includes('admin')) ? '-top-3.5' : 'py-1'
          }`}
        >
          {/* 24K Gold Liquid Bubble Dome (Active) */}
          <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] shadow-[0_8px_25px_rgba(212,175,55,0.8),0_0_15px_rgba(255,234,160,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.9)] items-center justify-center ${mounted && (pathname.includes('dashboard') || pathname.includes('admin')) ? 'flex' : 'hidden'}`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#28170D] via-[#1A0E07] to-[#0D0603] flex items-center justify-center shadow-inner">
              <Crown size={24} strokeWidth={2.4} className="text-[#FFEAA0] drop-shadow-[0_0_10px_rgba(255,234,160,0.95)]" />
            </div>
          </div>
          {/* Flat Inactive Item */}
          <Crown size={23} strokeWidth={1.8} className={`text-[#E5D5BA] group-hover:scale-110 group-hover:text-[#FFEAA0] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all duration-200 ${mounted && (pathname.includes('dashboard') || pathname.includes('admin')) ? 'hidden' : 'block'}`} />
          <span className={`text-[9.5px] mt-0.5 font-serif uppercase tracking-widest transition-colors ${
            mounted && (pathname.includes('dashboard') || pathname.includes('admin'))
              ? 'font-black bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#FFEAA0] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
              : 'font-medium text-[#D4C3B3] group-hover:text-[#FFEAA0]'
          }`}>
            {mounted && session?.user ? 'Account' : 'Login'}
          </span>
          {mounted && (pathname.includes('dashboard') || pathname.includes('admin')) && (
            <span className="w-3.5 h-0.5 rounded-full bg-gradient-to-r from-[#FFDF78] via-[#FFEAA0] to-[#FFDF78] shadow-[0_0_8px_#FFEAA0] mt-0.5 animate-pulse" />
          )}
        </Link>
      </nav>
    </>
  );
}
