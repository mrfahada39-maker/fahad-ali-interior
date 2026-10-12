'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StoreShell from '@/components/StoreShell';
import OrdersPageClient from './OrdersPageClient';
import { motion } from 'framer-motion';
import { Package, ArrowRight, User } from 'lucide-react';

function GuestTrackCard() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderId.trim().replace(/^[#\s]+/, '');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanId || !cleanEmail) return;
    router.push(`/orders/${encodeURIComponent(cleanId)}?email=${encodeURIComponent(cleanEmail)}`);
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] pt-32 pb-24 px-4 flex items-center justify-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/95 border-[1.5px] border-[#E8DFC8] p-8 rounded-3xl shadow-xl text-center"
      >
        <div className="w-16 h-16 bg-[#FAF5EE] rounded-2xl border border-[#D4AF37]/50 flex items-center justify-center mx-auto mb-4 text-[#8C6239]">
          <Package size={32} />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] mb-2">Track Your Order</h1>
        <p className="text-[#5C483E] text-xs sm:text-sm mb-6">
          Track guest order status in real time using your Order ID and checkout email.
        </p>

        <form onSubmit={handleTrack} className="space-y-4 text-left">
          <div>
            <label htmlFor="track-order-id" className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1">
              Order ID / Number
            </label>
            <input name="fai_page_field_1"
              id="track-order-id"
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-123456 or clxyz..."
              className="w-full bg-[#FAF7F2] border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-4 py-3 text-sm text-[#1F1612] outline-none shadow-2xs font-mono font-medium"
            />
          </div>

          <div>
            <label htmlFor="track-order-email" className="block text-[11px] font-black uppercase tracking-wider text-[#7A6354] mb-1">
              Checkout Email Address
            </label>
            <input name="fai_page_field_2"
              id="track-order-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full bg-[#FAF7F2] border border-[#E2D9CD] focus:border-[#B88E4B] rounded-xl px-4 py-3 text-sm text-[#1F1612] outline-none shadow-2xs font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Track Order Now</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#EFE8DD] flex items-center justify-center gap-2 text-xs text-[#7A6354]">
          <User size={13} />
          <span>Have an account?</span>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-auth'));
              }
            }}
            className="text-[#B88E4B] hover:underline font-bold cursor-pointer"
          >
            Sign In to View All Orders
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function OrdersPage() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <StoreShell>
        <main className="min-h-screen bg-[#FDFBF7] pt-24 flex items-center justify-center">
          <p className="text-[#8C6239] font-medium font-serif">Loading royal orders...</p>
        </main>
      </StoreShell>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <StoreShell>
        <GuestTrackCard />
      </StoreShell>
    );
  }

  return (
    <StoreShell>
      <OrdersPageClient />
    </StoreShell>
  );
}
