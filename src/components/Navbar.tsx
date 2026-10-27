/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Search, ShoppingBag, User, Home, Armchair, Sparkles, PhoneCall, Bell, LogOut, Compass, Crown, ChevronRight, Heart, LayoutGrid, Phone, UserPlus, Headphones, Facebook, Instagram, Youtube } from 'lucide-react';
import { useCartStore, useSiteSettingsStore, useUiNavigationStore } from '@/store';
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
  const isCategoryBarSticky = useUiNavigationStore((s) => s.isCategoryBarSticky);
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
    { label: 'Blog', href: '/blog' },
    { label: 'Collection', href: '/#signature-categories' },
    { label: 'About', href: '/about' },
    { label: 'Service', href: '/faq#delivery' },
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
      {/* ── STICKY FLOATING EDITORIAL LUXURY NAVBAR (HIDES WHEN CATEGORY BAR IS PINNED) ── */}
      <header
        suppressHydrationWarning
        className={`fixed top-0 left-0 right-0 z-50 w-full px-3 sm:px-6 pt-2.5 sm:pt-3 pointer-events-none font-sans transition-all duration-300 ease-in-out ${
          isCategoryBarSticky ? '-translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <nav 
          suppressHydrationWarning
          className="pointer-events-auto w-full max-w-[1550px] mx-auto bg-white/95 md:backdrop-blur-md rounded-[20px] sm:rounded-full border border-[#EBE1D3] shadow-[0_4px_25px_rgba(44,30,24,0.06)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300"
        >
          {/* ── DESKTOP LEFT SECTION: BRAND TITLE ── */}
          <div className="hidden lg:flex items-center">
            <Link href="/" prefetch={false} className="flex items-center gap-2 group shrink-0">
              <span className="font-serif font-black text-lg xl:text-xl tracking-wider uppercase text-[#1F1A17] group-hover:text-[#B88E4B] transition-colors whitespace-nowrap">
                FAHAD ALI
              </span>
              <span className="font-serif font-bold text-lg xl:text-xl tracking-wide bg-gradient-to-r from-[#B88E4B] via-[#E2C275] to-[#9E7333] bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(184,142,75,0.2)] whitespace-nowrap">
                Interior
              </span>
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
                aria-label="Log out"
              >
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* ── MOBILE NAV BAR (LG:HIDDEN) ── */}
          <div className="lg:hidden flex items-center justify-between w-full">
            {/* Mobile Left: Menu & Search */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setMobileOpen(true)} 
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs" 
                aria-label="Open Navigation Menu"
              >
                <LayoutGrid size={18} strokeWidth={1.8} />
              </button>
              <button 
                onClick={onSearchOpen} 
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs" 
                aria-label="Search Catalog"
              >
                <Search size={17} strokeWidth={1.8} />
              </button>
            </div>

            {/* Mobile Center: Brand Logo */}
            <Link href="/" prefetch={false} className="flex flex-col items-center py-1">
              <span className="font-serif text-lg font-black tracking-wider uppercase text-[#1F1A17]">
                FAHAD ALI
              </span>
              <span className="text-[9px] tracking-[0.3em] font-bold uppercase bg-gradient-to-r from-[#B88E4B] via-[#E2C275] to-[#9E7333] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(184,142,75,0.2)] -mt-1">
                INTERIOR
              </span>
            </Link>

            {/* Mobile Right: Wishlist & Cart */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => useWishlistDrawerStore.getState().openDrawer()}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs"
                aria-label="Wishlist"
              >
                <Heart size={17} strokeWidth={1.8} />
              </button>
              <button 
                onClick={openCart} 
                className="relative w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs" 
                aria-label="Shopping Cart"
              >
                <ShoppingBag size={17} strokeWidth={1.8} />
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#C59B4B] text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {mounted ? cartItemCount : 0}
                </span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── LUXURY CURVED MOBILE DRAWER (SNAPPY 300MS HARDWARE-ACCELERATED TRANSITION) ── */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 bg-black/60 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`fixed top-0 left-0 bottom-0 w-[88%] max-w-[390px] bg-[#FAF7F2] text-[#2C1E18] z-50 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto shadow-2xl rounded-r-[40px] border-r-2 border-[#C9A96E]/40 lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Top Header: Logo with Ornate Flourish & Circular Close Button */}
        <div className="flex items-start justify-between pt-1 pb-4">
          <div>
            <Link prefetch={false} href="/" onClick={() => setMobileOpen(false)} className="group flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl font-black tracking-wider uppercase text-[#1C1410]">
                FAHAD ALI
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-[0.35em] font-bold uppercase bg-gradient-to-r from-[#B88E4B] via-[#E2C275] to-[#9E7333] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(184,142,75,0.2)] -mt-0.5">
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
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#F4ECE1] border border-[#E6DCCF] flex items-center justify-center text-[#8A5A2B] shadow-sm hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer active:scale-95" 
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

          {/* BLOG / JOURNAL */}
          <Link
            href="/blog"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-[0_2px_8px_rgba(44,30,24,0.02)] hover:border-[#C9A96E] hover:bg-gradient-to-r hover:from-white hover:to-[#FDFBF7] hover:shadow-[0_8px_25px_rgba(201,169,110,0.2)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <Compass size={20} strokeWidth={1.5} className="text-[#8A5A2B] group-hover:scale-125 group-hover:rotate-6 group-hover:text-[#C9A96E] transition-all duration-300" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18] group-hover:text-[#8A5A2B] transition-colors duration-300">
                JOURNAL & CRAFT
              </span>
            </div>
            <ChevronRight size={18} className="text-[#C9A96E] opacity-75 group-hover:translate-x-1.5 group-hover:text-[#8A5A2B] group-hover:opacity-100 transition-all duration-300" />
          </Link>

          {/* 6. WISHLIST */}
          <button
            aria-label="Open Wishlist"
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

      {/* ── CLEAN LUXURY WHITE/IVORY BOTTOM NAVIGATION (MATCHES IMAGE 1 100%) ── */}
      <nav 
        suppressHydrationWarning
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 w-full z-40 lg:hidden bg-white/95 md:backdrop-blur-md border-t border-[#EAE1D5] shadow-[0_-4px_25px_rgba(44,30,24,0.06)] px-2 pt-1.5 pb-2 h-[62px] flex items-center justify-around select-none"
      >
        {/* 1. Home */}
        <Link 
          prefetch={false}
          href="/"
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        >
          <Home 
            size={20} 
            strokeWidth={pathname === '/' ? 2.2 : 1.8} 
            className={pathname === '/' ? 'text-[#8C6222]' : 'text-[#7D6F64]'} 
          />
          <span className={`text-[10px] mt-0.5 tracking-wide ${pathname === '/' ? 'font-bold text-[#8C6222]' : 'font-medium text-[#7D6F64]'}`}>
            Home
          </span>
          {pathname === '/' && (
            <span className="w-5 h-0.5 rounded-full bg-[#B88E4B] mt-0.5" />
          )}
        </Link>

        {/* 2. Shop */}
        <Link 
          prefetch={false}
          href="/#signature-categories"
          onClick={(e) => {
            const el = document.getElementById('signature-categories');
            if (el) {
              e.preventDefault();
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        >
          <LayoutGrid size={20} strokeWidth={1.8} className="text-[#7D6F64]" />
          <span className="text-[10px] mt-0.5 font-medium text-[#7D6F64] tracking-wide">
            Shop
          </span>
        </Link>

        {/* 3. Wishlist */}
        <button
          onClick={() => useWishlistDrawerStore.getState().openDrawer()}
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
          aria-label="Wishlist"
        >
          <Heart size={20} strokeWidth={1.8} className="text-[#7D6F64]" />
          <span className="text-[10px] mt-0.5 font-medium text-[#7D6F64] tracking-wide">
            Wishlist
          </span>
        </button>

        {/* 4. Cart */}
        <button
          onClick={openCart}
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
          aria-label="Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={1.8} className="text-[#7D6F64]" />
            {mounted && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#C59B4B] text-white text-[8.5px] font-bold flex items-center justify-center shadow-xs">
                {cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium text-[#7D6F64] tracking-wide">
            Cart
          </span>
        </button>

        {/* 5. Account */}
        <Link 
          prefetch={false}
          href={mounted && session?.user ? (isAdmin ? '/admin' : '/dashboard') : '/?auth=login'}
          onClick={mounted && session?.user ? undefined : (e) => { e.preventDefault(); onAuthOpen(); }}
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        >
          <User size={20} strokeWidth={1.8} className="text-[#7D6F64]" />
          <span className="text-[10px] mt-0.5 font-medium text-[#7D6F64] tracking-wide">
            Account
          </span>
        </Link>
      </nav>
    </>
  );
}
