'use client';

import { ReactNode, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/ui/BackToTop';
import { useCartStore } from '@/store/cartStore';
import { useWishlistDrawerStore } from '@/components/WishlistDrawer';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
const WishlistDrawerPanel = dynamic(
  () => import('@/components/WishlistDrawer').then((m) => m.WishlistDrawerPanel),
  { ssr: false }
);
const SearchModal = dynamic(() => import('@/components/SearchModal'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });
const PWAInstallPrompt = dynamic(() => import('@/components/PWAInstallPrompt'), { ssr: false });
const AiInteriorChatbot = dynamic(
  () => import('@/components/ai/AiEmployeeWidget').then((m) => m.AiEmployeeWidget),
  { ssr: false }
);

// Read at module level (server-evaluated at build time in Next.js)
const googleEnabled =
  !!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED &&
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

function SearchParamsListener({ setAuthOpen }: { setAuthOpen: (v: boolean) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('auth') === 'login') {
      setAuthOpen(true);
    }
  }, [searchParams, setAuthOpen]);

  return null;
}

interface StoreShellProps {
  children: ReactNode;
  showFooter?: boolean;
  hideNavbar?: boolean;
}

export default function StoreShell({ children, showFooter = true, hideNavbar = false }: StoreShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const isWishlistOpen = useWishlistDrawerStore((s) => s.isOpen);
  const [cartMounted, setCartMounted] = useState(false);
  const [wishlistMounted, setWishlistMounted] = useState(false);

  useEffect(() => {
    if (isCartOpen && !cartMounted) setCartMounted(true);
  }, [isCartOpen, cartMounted]);

  useEffect(() => {
    if (isWishlistOpen && !wishlistMounted) setWishlistMounted(true);
  }, [isWishlistOpen, wishlistMounted]);

  useEffect(() => {
    // Ultra-Fast TBT Optimization: Defer secondary background widgets until main thread is idle
    const enableInteractive = () => setInteractive(true);

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Mount secondary widgets on first user engagement or idle
      const events = ['scroll', 'touchstart', 'mousemove', 'keydown'] as const;
      const onFirstInteraction = () => {
        enableInteractive();
        events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction));
      };
      events.forEach((ev) => window.addEventListener(ev, onFirstInteraction, { passive: true, once: true }));

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(enableInteractive, { timeout: 2000 });
      } else {
        setTimeout(enableInteractive, 1200);
      }
    }

    const handler = () => setAuthOpen(true);
    const triggerCart = () => {
      setCartMounted(true);
      enableInteractive();
    };
    const triggerWishlist = () => {
      setWishlistMounted(true);
      enableInteractive();
    };

    window.addEventListener('open-auth', handler);
    window.addEventListener('open-cart', triggerCart);
    window.addEventListener('open-wishlist', triggerWishlist);

    return () => {
      window.removeEventListener('open-auth', handler);
      window.removeEventListener('open-cart', triggerCart);
      window.removeEventListener('open-wishlist', triggerWishlist);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#221814]" style={{ backgroundColor: '#FCFAF7' }}>
      <Suspense fallback={null}>
        <SearchParamsListener setAuthOpen={setAuthOpen} />
      </Suspense>
      {!hideNavbar && <Navbar onSearchOpen={() => setSearchOpen(true)} onAuthOpen={() => setAuthOpen(true)} />}
      {children}
      {showFooter && <Footer />}
      {cartMounted && <CartDrawer />}
      {wishlistMounted && <WishlistDrawerPanel />}
      {searchOpen && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
      {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} googleEnabled={googleEnabled} />}
      {interactive && <PWAInstallPrompt />}
      {interactive && <AiInteriorChatbot />}
      <BackToTop />
    </div>
  );
}
