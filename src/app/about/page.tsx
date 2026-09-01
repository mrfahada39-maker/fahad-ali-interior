import { Metadata } from 'next';
import StoreShell from '@/components/layout/StoreShell';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'About Us | Fahad Ali Interior — Lahore Heritage Craftsmanship',
  description: 'Learn about Fahad Ali Interior: handcrafted solid Sheesham luxury furniture, generational woodworking masters, and bespoke royal craftsmanship from Lahore, Pakistan.',
};

export default function AboutPage() {
  return (
    <StoreShell showFooter={true}>
      <main className="min-h-screen bg-[#FAF8F5] text-[#2C1E18] font-sans pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs mb-4">
              <Sparkles size={13} className="text-[#B88E4B]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#7A6354]">
                OUR HERITAGE & ATELIER
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-[#221814] tracking-tight mb-4">
              Mastering The Art of <span className="text-[#B88E4B]">Solid Sheesham</span>
            </h1>
            <p className="text-sm sm:text-base text-[#7A6048] leading-relaxed font-serif italic">
              From the historic woodworking workshops of Lahore to luxury homes across Pakistan and worldwide, Fahad Ali Interior represents timeless craftsmanship, royal proportions, and generational mastery.
            </p>
          </div>

          {/* Hero Showcase 2-Col */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-20">
            <div className="lg:col-span-6 relative aspect-[4/3] rounded-[28px] overflow-hidden border-[1.5px] border-amber-300/80 shadow-[0_12px_40px_rgba(184,142,75,0.15)] bg-[#FAF5EE]">
              <Image
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
                alt="Fahad Ali Interior Royal Living Room Atelier"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300/80 text-emerald-800 text-xs font-bold">
                ✓ 100% Solid Seasoned Wood
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#221814] leading-tight">
                Generations of Craft, Engineered for Eternity
              </h2>
              <p className="text-sm text-[#5A4336] leading-relaxed">
                Every piece from our atelier begins with sustainably harvested, kiln-dried Sheesham (Dalbergia sissoo) hardwood. We strictly avoid hollow MDF, veneer stickers, or fragile composites. Our master ustads utilize classic mortise and tenon joinery perfected over decades.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/60">
                <div className="p-4 rounded-2xl bg-white border border-amber-300/50 shadow-2xs">
                  <Award className="text-[#B88E4B] mb-2" size={24} />
                  <h4 className="font-bold text-sm text-[#221814]">Bespoke Joinery</h4>
                  <p className="text-xs text-stone-500 mt-1">Hand-carved with traditional precision.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-amber-300/50 shadow-2xs">
                  <ShieldCheck className="text-[#B88E4B] mb-2" size={24} />
                  <h4 className="font-bold text-sm text-[#221814]">Lifetime Durability</h4>
                  <p className="text-xs text-stone-500 mt-1">Resistant to warping and aging.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  prefetch={true}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <span>Explore Masterpieces</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </StoreShell>
  );
}
