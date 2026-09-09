'use client';

import { Shield, Sparkles, Truck, Award } from 'lucide-react';

const BADGES = [
  {
    icon: Shield,
    title: 'Solid Seasoned Sheesham',
    subtitle: 'Kiln-cured timber seasoned for 35+ years for zero warping',
  },
  {
    icon: Award,
    title: 'Lifetime Structural Craft',
    subtitle: 'Master mortise & tenon joinery built to endure generations',
  },
  {
    icon: Truck,
    title: 'White-Glove Room Delivery',
    subtitle: 'Complimentary room placement & assembly across Pakistan',
  },
  {
    icon: Sparkles,
    title: 'Bespoke Atelier Finishes',
    subtitle: '200+ imported Turkish velvets, linens & royal wood polishes',
  },
];

export default function TrustBadges() {
  return (
    <section className="w-full py-8 sm:py-12 bg-gradient-to-b from-[#FCFAF7] via-[#FAF6F0] to-[#FCFAF7] border-y border-[#E8DFC8]/60 relative overflow-hidden">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-amber-400/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1550px] 2xl:max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="group relative p-5 rounded-2xl bg-white/80 backdrop-blur-xs border border-amber-200/60 hover:border-[#B88E4B] shadow-[0_4px_16px_rgba(184,142,75,0.06)] hover:shadow-[0_12px_32px_rgba(184,142,75,0.16)] transition-all duration-300 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FAF5EE] to-[#EFE6DA] border border-amber-300/60 group-hover:border-[#B88E4B] flex items-center justify-center shrink-0 text-[#B88E4B] group-hover:text-white group-hover:from-[#B88E4B] group-hover:to-[#996515] transition-all duration-300 shadow-2xs group-hover:scale-105">
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#221814] group-hover:text-[#B88E4B] transition-colors">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-[#7A6048] mt-1 leading-relaxed">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
