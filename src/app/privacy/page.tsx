import type { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, Phone, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy & Data Governance | Fahad Ali Interior',
  description: 'Enterprise privacy and encryption protocols protecting your furniture orders, design blueprints, and payment verifications.',
};

export default function PrivacyPage() {
  return (
    <StoreShell>
      <main className="min-h-screen bg-[#FDFBF7] font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-16 px-4 sm:px-6 relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FFEAA0]/20 via-[#C9A96E]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-80 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-4">
              <ShieldCheck size={14} className="text-[#B88E4B]" />
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#8C6239] via-[#B88E4B] to-[#8C6239] bg-clip-text text-transparent">
                SECURITY & DATA GOVERNANCE
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#221814] tracking-tight mb-3">
              Privacy <span className="font-serif italic font-normal text-[#C9A24D] mx-1">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Data Policy</span>
            </h1>

            <p className="text-xs sm:text-sm font-serif font-bold text-[#8C6239] uppercase tracking-widest mb-4">
              Last Updated & Verified: August 2026 • Version 2.4 Enterprise
            </p>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
              <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            </div>

            <p className="text-[#5C483E] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              At Fahad Ali Interior, we treat the confidentiality of your home blueprints, custom furniture specifications, and financial transactions with absolute integrity and bank-grade encryption.
            </p>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                icon: Lock,
                title: '256-Bit SSL Encryption',
                desc: 'All order payloads, personal records, and checkout communications are encrypted in transit and at rest.',
              },
              {
                icon: EyeOff,
                title: 'Zero Third-Party Selling',
                desc: 'We never sell, rent, or trade your personal contact details, residential address, or purchase history.',
              },
              {
                icon: ShieldCheck,
                title: 'Encrypted Payment Proofs',
                desc: 'Payment transfer screenshots are stored in private encrypted storage, accessible only to authorized staff.',
              },
              {
                icon: FileText,
                title: 'Customer Data Rights',
                desc: 'You have full rights to request an export, update, or permanent deletion of your profile data at any time.',
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="bg-white/85 backdrop-blur-sm border-[1.5px] border-[#E8DFC8] rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-[#D4AF37] hover:shadow-[0_8px_25px_rgba(212,175,55,0.12)] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-[#D4AF37]/50 flex items-center justify-center text-[#8C6239] mb-3.5 shadow-2xs">
                  <pillar.icon size={20} strokeWidth={2} />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-black text-[#221814] mb-1.5">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed font-medium">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Detailed Policy Clauses */}
          <div className="space-y-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-[1.5px] border-[#E8DFC8] shadow-[0_4px_25px_rgba(44,30,24,0.04)] mb-10">
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>1. Personal Information We Collect</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                When you browse our luxury catalog, customize a blueprint, create an account, or place an order, we collect essential fulfillment data including your full name, mobile number (for white-glove delivery coordination), email address, residential/shipping address, and customized room dimensions.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>2. Payment Security & Processing</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                Fahad Ali Interior supports Cash on Delivery (COD), direct Bank Transfer via State Bank of Pakistan RAAST, JazzCash, Easypaisa, and Debit/Credit Cards. For direct wallet or bank payments, transaction slips are encrypted and reviewed solely to verify settlement before white-glove dispatch. We do not store credit card CVV numbers on our servers.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>3. Logistics & White-Glove Handover</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                Your delivery address and phone number are shared exclusively with our internal dedicated logistics fleet and vetted white-glove delivery partners strictly for transportation, on-site room placement, and packaging assembly.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>4. Cookie Policy & Analytics</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                We use strictly functional and security session tokens (via secure HttpOnly cookies) to manage your shopping cart, authentication state, and bespoke wishlist. We do not engage in cross-site tracking or third-party ad retargeting networks.
              </p>
            </section>
          </div>

          {/* Contact Concierge Box */}
          <div className="bg-gradient-to-br from-[#1C1410] via-[#2A180E] to-[#120B07] rounded-3xl p-6 sm:p-8 text-white border-[1.5px] border-[#D4AF37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-serif font-bold uppercase tracking-widest text-[#FFEAA0] block mb-1">
                DATA PROTECTION OFFICER
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-black text-white">Have a Privacy or Data Request?</h3>
              <p className="text-xs sm:text-sm text-[#E6DCCF] mt-1 max-w-md">
                Contact our compliance desk for immediate data export, profile updates, or privacy inquiries.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3.5 bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] font-serif font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-105 transition-all flex items-center gap-2 shrink-0 shadow-[0_4px_16px_rgba(212,175,55,0.35)]"
            >
              <span>Contact Compliance</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
