import type { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import Link from 'next/link';
import { Scale, Crown, ShieldCheck, Truck, RotateCcw, CheckCircle2, Phone, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Sale & Royal Warranty | Fahad Ali Interior',
  description: 'Official terms of sale, 10-year anti-termite guarantee, white-glove nationwide delivery, and bespoke custom furniture protocols.',
};

export default function TermsPage() {
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
              <Scale size={14} className="text-[#B88E4B]" />
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#8C6239] via-[#B88E4B] to-[#8C6239] bg-clip-text text-transparent">
                LEGAL GOVERNANCE & ROYAL WARRANTY
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#221814] tracking-tight mb-3">
              Terms <span className="font-serif italic font-normal text-[#C9A24D] mx-1">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Conditions of Sale</span>
            </h1>

            <p className="text-xs sm:text-sm font-serif font-bold text-[#8C6239] uppercase tracking-widest mb-4">
              Last Updated & Certified: August 2026 • Official Commerce Agreement
            </p>

            <div className="flex items-center justify-center gap-3 my-4">
              <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
              <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            </div>

            <p className="text-[#5C483E] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Welcome to Fahad Ali Interior. By purchasing our handcrafted luxury furniture, commissioning custom bespoke blueprints, or using this platform, you agree to the following terms and our 10-Year Anti-Termite & Structural Guarantee.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                icon: Crown,
                title: '100% Solid Seasoned Sheesham',
                desc: 'All furniture is crafted from genuine kiln-dried Pakistani Sheesham (8-12% moisture control). Zero synthetic veneers.',
              },
              {
                icon: ShieldCheck,
                title: '10-Year Structural Guarantee',
                desc: 'Includes 10-year anti-termite (deemak) and structural joinery replacement/repair warranty.',
              },
              {
                icon: Truck,
                title: 'White-Glove Nationwide Delivery',
                desc: 'Free white-glove transport, on-site unboxing, and master room assembly on orders above PKR 100,000.',
              },
              {
                icon: RotateCcw,
                title: '7-Day Inspection & Quality Support',
                desc: 'Full direct support for any transit damage or craftsmanship rectification within 7 days of delivery.',
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

          {/* Detailed Terms Clauses */}
          <div className="space-y-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-[1.5px] border-[#E8DFC8] shadow-[0_4px_25px_rgba(44,30,24,0.04)] mb-10">
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>1. Orders & Pricing Integrity</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                All prices listed in our catalog are in Pakistani Rupees (PKR) and include standard taxes. Once an order is placed, prices are locked. In case of bespoke custom orders requiring tailored wood dimensions, fabric grade upgrades (e.g. Royal Italian Velvet), or specialized marble inlays, final quotes are confirmed in advance before production commences.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>2. Payment Terms & Settlement</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                We accept Cash on Delivery (COD) up to standard order ceilings, RAAST State Bank of Pakistan instant transfers, JazzCash, Easypaisa, and Debit/Credit Cards. For bespoke manufacturing, a 30% advance deposit is required to start timber seasoning and artisan blueprint carving, with the balance payable upon delivery.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>3. Delivery, Assembly & Inspection</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                Standard ready-to-dispatch luxury sets are delivered within 3–5 business days in Lahore and 5–7 business days nationwide (Karachi, Islamabad, Rawalpindi, Peshawar, Multan, Faisalabad). Our white-glove team will place the furniture in your designated room and complete all bolt assemblies. Customers are requested to inspect the pieces upon handover.
              </p>
            </section>

            <div className="h-px bg-[#EFE8DD]" />

            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-[#8C6239] font-serif font-black text-sm uppercase tracking-wider">
                <CheckCircle2 size={16} />
                <span>4. 10-Year Warranty & Artisan Care</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C483E] leading-relaxed pl-6">
                All Fahad Ali Interior solid wood frames are covered by our 10-Year Structural & Anti-Termite Guarantee. In the unlikely event of joint instability or termite infestation under normal indoor residential use, we will repair or replace the affected component free of charge. Natural wood grain variations and character marks are hallmarks of authentic solid timber.
              </p>
            </section>
          </div>

          {/* Contact Concierge Box */}
          <div className="bg-gradient-to-br from-[#1C1410] via-[#2A180E] to-[#120B07] rounded-3xl p-6 sm:p-8 text-white border-[1.5px] border-[#D4AF37]/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-serif font-bold uppercase tracking-widest text-[#FFEAA0] block mb-1">
                ROYAL CLIENT SERVICES
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-black text-white">Need Custom Blueprint Assistance?</h3>
              <p className="text-xs sm:text-sm text-[#E6DCCF] mt-1 max-w-md">
                Our bespoke design team is available to craft 3D blueprints and tailored timber solutions.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3.5 bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] font-serif font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-105 transition-all flex items-center gap-2 shrink-0 shadow-[0_4px_16px_rgba(212,175,55,0.35)]"
            >
              <span>Speak to Design Team</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
    </StoreShell>
  );
}
