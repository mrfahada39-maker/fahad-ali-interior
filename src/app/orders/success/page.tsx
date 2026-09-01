'use client';

import StoreShell from '@/components/layout/StoreShell';
import Link from 'next/link';
import { Check, Truck, Package, Sparkles, Copy, ArrowRight, MessageSquare, ShieldCheck, Crown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function SuccessContent() {
  const params = useSearchParams();
  const rawId = params.get('id') || 'FA-' + Date.now().toString().slice(-6);
  const displayId = (rawId.startsWith('order_') ? rawId.slice(6, 14) : rawId.slice(-8)).toUpperCase();
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(rawId);
    setCopied(true);
    toast.success('Royal Order ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/923207006110?text=${encodeURIComponent(`Hello Fahad Ali Interior! I just placed order #${displayId} and would like to confirm my delivery schedule.`)}`;

  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-20 relative overflow-hidden select-none">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FFEAA0]/25 via-[#C9A96E]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 text-center">

        {/* Animated 24K Royal Gold Checkmark Jewel */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2.5px] mx-auto mb-6 shadow-[0_0_35px_rgba(212,175,55,0.45)]"
        >
          <div className="w-full h-full rounded-3xl bg-[#1A0E07] flex items-center justify-center text-[#FFEAA0]">
            <Check size={40} strokeWidth={2.5} className="text-[#FFEAA0]" />
          </div>
        </motion.div>

        {/* Royal Confirmation Banner */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-3.5">
            <Crown size={14} className="text-[#B88E4B]" />
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#8C6239] via-[#B88E4B] to-[#8C6239] bg-clip-text text-transparent">
              ROYAL COMMISSION CONFIRMED
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#221814] tracking-tight mb-2">
            Thank You For <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Your Order!</span>
          </h1>

          <p className="text-sm sm:text-base text-[#5C483E] font-medium max-w-md mx-auto mb-6">
            Your handcrafted luxury furniture commission has been successfully recorded and transmitted to our master artisan workshop.
          </p>

          {/* Order ID Pill with Copy Action */}
          <div className="inline-flex items-center gap-2.5 bg-white border-[1.5px] border-[#E8DFC8] rounded-2xl px-5 py-2.5 mb-8 shadow-xs">
            <Package size={16} className="text-[#8C6239]" />
            <span className="font-serif text-xs sm:text-sm font-black text-[#221814] uppercase tracking-wider">
              Order Reference: #{displayId}
            </span>
            <button
              onClick={copyId}
              className="p-1 hover:bg-[#FAF5EE] rounded-lg text-[#8C6239] transition-colors border border-[#E8DFC8]/60 cursor-pointer"
              title="Copy Order ID"
            >
              <Copy size={13} />
            </button>
          </div>
        </motion.div>

        {/* 3-Step What Happens Next Road Map */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] rounded-3xl p-6 sm:p-7 mb-8 text-left shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DD]">
            <h3 className="font-serif font-black text-xs sm:text-sm uppercase tracking-wider text-[#221814] flex items-center gap-2">
              <Sparkles size={15} className="text-[#B88E4B]" />
              White-Glove Fulfillment Roadmap
            </h3>
            <span className="text-[11px] font-serif font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
              5-7 Business Days
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                step: '01',
                title: 'Payment & Blueprint Confirmation',
                desc: 'Our dispatch desk validates order details & queues seasoned timber cuts.',
              },
              {
                step: '02',
                title: 'Master Artisan Handcrafting',
                desc: '100% solid Sheesham woodwork, joinery testing, and Italian velvet upholstery.',
              },
              {
                step: '03',
                title: 'White-Glove Delivery & In-Room Assembly',
                desc: 'Dedicated transport with complete unboxing and bolt fitting at your residence.',
              },
            ].map((st) => (
              <div key={st.step} className="flex items-start gap-3.5 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EFE8DD]">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2A170D] to-[#0D0603] text-[#FFEAA0] font-serif text-[11px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                  {st.step}
                </span>
                <div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-[#221814]">{st.title}</h4>
                  <p className="text-[11px] text-[#5C483E] mt-0.5 font-medium">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <Link
            href={`/orders/${rawId}`}
            prefetch={true}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <span>Track Royal Order Live</span>
            <ArrowRight size={14} />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <MessageSquare size={15} />
            <span>Confirm on WhatsApp</span>
          </a>

          <Link
            href="/shop"
            prefetch={true}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-[#FAF7F2] text-[#5C483E] border border-[#E8DFC8] hover:border-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Browse Catalog</span>
          </Link>
        </motion.div>

      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <StoreShell showFooter={true}>
      <Suspense fallback={
        <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#B88E4B] border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <SuccessContent />
      </Suspense>
    </StoreShell>
  );
}
