'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutGrid,
  Search,
  Heart,
  ShoppingBag,
  X,
  Home,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Compass,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useCartStore } from '@/store';
import { useWishlistDrawerStore } from '@/components/WishlistDrawer';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
const WishlistDrawerPanel = dynamic(
  () => import('@/components/WishlistDrawer').then((m) => m.WishlistDrawerPanel),
  { ssr: false }
);
const SearchModal = dynamic(() => import('@/components/SearchModal'), { ssr: false });

export function DashboardStoreNavbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const cartItemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const isWishlistOpen = useWishlistDrawerStore((s) => s.isOpen);
  const [cartMounted, setCartMounted] = useState(false);
  const [wishlistMounted, setWishlistMounted] = useState(false);

  const pathname = usePathname() || '';
  const roleUpper = (session?.user as { role?: string })?.role?.toUpperCase();
  const isAdmin = roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN';
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isCartOpen && !cartMounted) setCartMounted(true);
  }, [isCartOpen, cartMounted]);

  useEffect(() => {
    if (isWishlistOpen && !wishlistMounted) setWishlistMounted(true);
  }, [isWishlistOpen, wishlistMounted]);

  return (
    <>
      {/* ── IMAGE 1: STORE LUXURY PILL NAVBAR FOR MOBILE DASHBOARD ── */}
      <div className="bg-white/95 backdrop-blur-md rounded-[20px] sm:rounded-full border border-[#EBE1D3] shadow-[0_4px_25px_rgba(44,30,24,0.06)] px-4 py-2 flex items-center justify-between pointer-events-auto transition-all">
        {/* Mobile Left: Menu (Grid) & Search */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs cursor-pointer hover:bg-[#FAF2E5]"
            aria-label="Open Navigation Menu"
          >
            <LayoutGrid size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs cursor-pointer hover:bg-[#FAF2E5]"
            aria-label="Search Catalog"
          >
            <Search size={17} strokeWidth={1.8} />
          </button>
        </div>

        {/* Mobile Center: Brand Logo */}
        <Link href="/" prefetch={false} className="flex flex-col items-center py-1 group">
          <span className="font-serif text-lg font-black tracking-wider uppercase text-[#1F1A17] group-hover:text-[#B88E4B] transition-colors">
            FAHAD ALI
          </span>
          <span className="text-[8px] tracking-[0.3em] font-medium uppercase text-[#8C6222] -mt-1 leading-none">
            INTERIOR
          </span>
        </Link>

        {/* Mobile Right: Wishlist & Cart */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setWishlistMounted(true);
              useWishlistDrawerStore.getState().openDrawer();
            }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs cursor-pointer hover:bg-[#FAF2E5]"
            aria-label="Wishlist"
          >
            <Heart size={17} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCartMounted(true);
              openCart();
            }}
            className="relative w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#FAF7F2] border border-[#EBE1D3]/60 flex items-center justify-center text-[#2C1E18] active:scale-95 transition-all shadow-2xs cursor-pointer hover:bg-[#FAF2E5]"
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={17} strokeWidth={1.8} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#C59B4B] text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-2xs">
              {mounted ? cartItemCount : 0}
            </span>
          </button>
        </div>
      </div>

      {/* ── LUXURY CURVED MOBILE DRAWER ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden={!mobileOpen}
          className="fixed inset-0 bg-black/60 z-50 lg:hidden transition-opacity duration-300"
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        className={`fixed top-0 left-0 bottom-0 w-[88%] max-w-[390px] bg-[#FAF7F2] text-[#2C1E18] z-50 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto shadow-2xl rounded-r-[40px] border-r-2 border-[#C9A96E]/40 lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pt-1 pb-4">
          <div>
            <Link
              prefetch={false}
              href="/"
              onClick={() => setMobileOpen(false)}
              className="group flex flex-col"
            >
              <span className="font-serif text-2xl sm:text-3xl font-normal tracking-wider uppercase text-[#1C1410]">
                FAHAD ALI
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.35em] font-light uppercase text-[#8C6222] -mt-0.5">
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
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-[#F4ECE1] border border-[#E6DCCF] flex items-center justify-center text-[#8A5A2B] shadow-sm hover:bg-[#8A5A2B] hover:text-white transition-colors cursor-pointer active:scale-95"
            aria-label="Close Navigation"
          >
            <X size={22} strokeWidth={1.7} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-2.5 py-2">
          <Link
            href="/"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Home size={18} className="text-[#C9A96E]" />
              <span className="font-serif text-xs font-bold tracking-widest uppercase text-[#2C1E18]">
                Home
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>

          <Link
            href="/#signature-categories"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-[#8A5A2B]" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18]">
                Shop Catalog
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>

          <Link
            href="/dashboard"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <User size={18} className="text-[#8A5A2B]" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18]">
                User Dashboard
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-white border border-[#C9A96E]/50 shadow-2xs hover:border-[#C9A96E] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-[#B88E4B]" />
                <span className="font-serif text-xs font-bold tracking-widest uppercase text-[#8C6239]">
                  Admin Dashboard
                </span>
              </div>
              <ChevronRight size={16} className="text-[#C9A96E]" />
            </Link>
          )}

          <Link
            href="/blog"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Compass size={18} className="text-[#8A5A2B]" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18]">
                Journal & Craft
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>

          <Link
            href="/about"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[#8A5A2B]" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18]">
                About Us
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>

          <Link
            href="/contact"
            prefetch={false}
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/90 border border-[#EAE0D0] shadow-2xs hover:border-[#C9A96E] hover:bg-[#FAF5EE] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <PhoneCall size={18} className="text-[#8A5A2B]" />
              <span className="font-serif text-xs font-semibold tracking-widest uppercase text-[#2C1E18]">
                Contact Us
              </span>
            </div>
            <ChevronRight size={16} className="text-[#C9A96E] opacity-75" />
          </Link>
        </div>

        {/* Footer with Sign Out */}
        <div className="pt-4 border-t border-[#EAE0D0]">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200/80 font-serif text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out / Exit Portal</span>
          </button>
        </div>
      </div>

      {/* ── CLEAN LUXURY WHITE/IVORY BOTTOM NAVIGATION (FOR MOBILE DASHBOARDS) ── */}
      <nav
        suppressHydrationWarning
        aria-label="Dashboard Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 w-full z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-[#EAE1D5] shadow-[0_-4px_25px_rgba(44,30,24,0.06)] px-2 pt-1.5 pb-2 h-[62px] flex items-center justify-around select-none pointer-events-auto"
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
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        >
          <LayoutGrid size={20} strokeWidth={1.8} className="text-[#7D6F64]" />
          <span className="text-[10px] mt-0.5 font-medium text-[#7D6F64] tracking-wide">
            Shop
          </span>
        </Link>

        {/* 3. Wishlist */}
        <button
          type="button"
          onClick={() => {
            setWishlistMounted(true);
            useWishlistDrawerStore.getState().openDrawer();
          }}
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
          type="button"
          onClick={() => {
            setCartMounted(true);
            openCart();
          }}
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

        {/* 5. Portal / Dashboard */}
        <Link
          prefetch={false}
          href={isAdminPage ? '/admin' : '/dashboard'}
          className="relative flex-1 flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        >
          {isAdminPage ? (
            <ShieldCheck
              size={20}
              strokeWidth={2.2}
              className="text-[#8C6222]"
            />
          ) : (
            <User
              size={20}
              strokeWidth={2.2}
              className="text-[#8C6222]"
            />
          )}
          <span className="text-[10px] mt-0.5 tracking-wide font-bold text-[#8C6222]">
            {isAdminPage ? 'Admin' : 'Dashboard'}
          </span>
          <span className="w-5 h-0.5 rounded-full bg-[#B88E4B] mt-0.5" />
        </Link>
      </nav>

      {/* ── MODALS & DRAWERS ── */}
      {cartMounted && <CartDrawer />}
      {wishlistMounted && <WishlistDrawerPanel />}
      {searchOpen && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}
