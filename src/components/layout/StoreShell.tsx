'use client';

import { ReactNode, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
  useEffect(() => {
    // Ultra-Fast TBT Optimization: Defer secondary background widgets until main thread is idle
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setInteractive(true), { timeout: 2000 });
      } else {
        setTimeout(() => setInteractive(true), 1500);
      }
    }
    const handler = () => setAuthOpen(true);
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#221814]" style={{ backgroundColor: '#FCFAF7' }}>
      <Suspense fallback={null}>
        <SearchParamsListener setAuthOpen={setAuthOpen} />
      </Suspense>
      <Toaster
        position="top-right"
        closeButton
        richColors={false}
        duration={3500}
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(16px)',
            color: '#221814',
            border: '1.5px solid #E2D1BC',
            boxShadow: '0 16px 40px rgba(44,30,24,0.12), 0 2px 8px rgba(184,142,75,0.15)',
            borderRadius: '18px',
            padding: '14px 18px',
            fontSize: '13.5px',
            fontWeight: 550,
            fontFamily: 'inherit',
          },
          classNames: {
            toast: 'group !font-sans !tracking-tight',
            closeButton: '!bg-[#FAF5EE] !text-[#8C6239] !border !border-[#E2D1BC] hover:!bg-[#8C6239] hover:!text-white !transition-all !rounded-full !shadow-xs !left-auto !right-2 !top-2',
            success: '!border-amber-300/90 !text-[#221814]',
            error: '!border-rose-300/90 !text-[#221814]',
            info: '!border-amber-300/90 !text-[#221814]',
            warning: '!border-amber-400/90 !text-[#221814]',
          },
        }}
      />
      {!hideNavbar && <Navbar onSearchOpen={() => setSearchOpen(true)} onAuthOpen={() => setAuthOpen(true)} />}
      {children}
      {showFooter && <Footer />}
      {interactive && <CartDrawer />}
      {interactive && <WishlistDrawerPanel />}
      {searchOpen && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
      {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} googleEnabled={googleEnabled} />}
      {interactive && <PWAInstallPrompt />}
      {interactive && <AiInteriorChatbot />}
    </div>
  );
}
