'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, MessageCircle, Phone, Search, Sparkles, HelpCircle, ShieldCheck, Truck, CreditCard, RotateCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { faqCategories } from '@/lib/data/faq-data';

const CATEGORY_ICONS: Record<string, any> = {
  'Orders & Delivery': Truck,
  'Payment': CreditCard,
  'Products & Customization': Sparkles,
  'Returns & Refunds': RotateCcw,
};

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`rounded-2xl transition-all duration-300 overflow-hidden border-[1.5px] ${
        isOpen
          ? 'bg-gradient-to-br from-[#FAF5EE] via-white to-[#FAF5EE] border-[#D4AF37] shadow-[0_12px_30px_rgba(212,175,55,0.18)]'
          : 'bg-white/80 hover:bg-[#FAF7F2] border-[#E8DFC8] shadow-2xs hover:border-[#D4AF37]/50'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3.5 pr-3">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-serif text-xs font-black transition-colors ${
            isOpen ? 'bg-[#8C6239] text-[#FFEAA0] shadow-xs' : 'bg-[#FAF5EE] text-[#8C6239] group-hover:bg-[#8C6239] group-hover:text-white'
          }`}>
            {(index + 1).toString().padStart(2, '0')}
          </span>
          <span className={`font-serif text-[15px] sm:text-base md:text-lg transition-colors ${
            isOpen ? 'font-black text-[#221814]' : 'font-bold text-[#2C1E18] group-hover:text-[#8C6239]'
          }`}>
            {question}
          </span>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
          isOpen ? 'bg-[#8C6239] text-[#FFEAA0] rotate-180 shadow-xs' : 'bg-[#FAF5EE] border border-[#E7DDD0] text-[#5C483E] group-hover:border-[#D4AF37]'
        }`}>
          <ChevronDown size={17} strokeWidth={2.4} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-[15px] text-[#5C483E] leading-relaxed border-t border-[#EFE8DD]/70"
          >
            <p className="bg-[#FAF5EE]/70 rounded-xl p-4 border border-[#E8DFC8]/60 font-sans font-medium text-[#4A382F]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  const [phone, setPhone] = useState('+923207006110');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { apiFetchJson } = await import('@/lib/api-client');
        const data = await apiFetchJson<any>('/api/public/settings');
        if (data && data.contactPhone) {
          setPhone(data.contactPhone);
        }
      } catch { /* silent */ }
    };
    loadSettings();
  }, []);

  const categories = useMemo(() => ['All', ...faqCategories.map((c) => c.title)], []);

  const filteredCategories = useMemo(() => {
    return faqCategories
      .filter((cat) => selectedCategory === 'All' || cat.title === selectedCategory)
      .map((cat) => {
        const matchedQuestions = cat.questions.filter((q) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return q.q.toLowerCase().includes(query) || q.a.toLowerCase().includes(query);
        });
        return {
          ...cat,
          questions: matchedQuestions,
        };
      })
      .filter((cat) => cat.questions.length > 0);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden font-sans pt-28 sm:pt-32 pb-28 sm:pb-32 lg:pb-16 select-none">
      {/* Decorative Luxury Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-b from-[#FFEAA0]/20 via-[#C9A96E]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-60 right-0 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-60 left-0 w-96 h-96 rounded-full bg-[#B88E4B]/10 blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <section className="px-4 sm:px-6 relative z-10 max-w-5xl mx-auto text-center mb-10 sm:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EE] border border-[#D4AF37]/50 shadow-xs mb-4">
            <Sparkles size={14} className="text-[#B88E4B]" />
            <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#8C6239] via-[#B88E4B] to-[#8C6239] bg-clip-text text-transparent">
              ROYAL CONCIERGE & HELP
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#221814] tracking-tight mb-4">
            Frequently Asked <span className="font-serif italic font-normal text-[#C9A24D] mx-1">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Questions</span>
          </h1>

          <div className="flex items-center justify-center gap-3 my-4">
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
          </div>

          <p className="text-[#5C483E] text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-medium">
            Everything you need to know about our handcrafted 100% solid Sheesham furniture, white-glove nationwide delivery, custom blueprints, and 10-year warranty.
          </p>
        </motion.div>

        {/* Live Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 max-w-2xl mx-auto relative"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-4.5 text-[#8C6239] pointer-events-none" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g., delivery time, custom furniture, warranty, payment)..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/90 backdrop-blur-md border-[1.5px] border-[#E8DFC8] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 text-[#221814] text-sm sm:text-base font-medium shadow-[0_4px_20px_rgba(44,30,24,0.04)] outline-none transition-all placeholder:text-[#8C6239]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-xs font-bold uppercase tracking-wider text-[#8C6239] hover:text-[#221814] bg-[#FAF5EE] px-2.5 py-1 rounded-lg border border-[#E7DDD0]"
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Category Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 mt-6">
          {categories.map((cat) => {
            const Icon = cat === 'All' ? HelpCircle : CATEGORY_ICONS[cat] || HelpCircle;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-[13px] font-serif uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#2A170D] via-[#1A0E07] to-[#0D0603] text-[#FFEAA0] font-bold border border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.3)] scale-[1.03]'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#5C483E] font-medium border border-[#E8DFC8] shadow-2xs hover:border-[#D4AF37]/50'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-[#FFEAA0]' : 'text-[#8C6239]'} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordions Grid */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto relative z-10 space-y-10 sm:space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#E8DFC8] p-8 shadow-xs">
            <HelpCircle size={44} className="mx-auto text-[#B88E4B] mb-3" />
            <h3 className="font-serif text-xl font-bold text-[#221814]">No Matching Questions Found</h3>
            <p className="text-sm text-[#5C483E] mt-1 max-w-md mx-auto">
              We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another term or contact our VIP concierge team directly.
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.title] || Sparkles;
            return (
              <div key={cat.title} className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-[#E8DFC8]">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5EE] border border-[#D4AF37]/50 flex items-center justify-center text-[#8C6239] shadow-2xs">
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-black text-[#221814] tracking-tight uppercase">
                    {cat.title}
                  </h2>
                  <span className="text-xs font-serif font-bold text-[#8C6239] bg-[#FAF5EE] px-2.5 py-0.5 rounded-full border border-[#E8DFC8]">
                    {cat.questions.length} Questions
                  </span>
                </div>

                <div className="space-y-3">
                  {cat.questions.map((faq, qIdx) => (
                    <FAQItem key={faq.q} index={qIdx} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Still Have Questions Concierge Card */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto mt-16 sm:mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-[#1C1410] via-[#2A180E] to-[#120B07] rounded-3xl p-8 sm:p-12 text-center text-white border-[1.5px] border-[#D4AF37]/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          {/* Ambient Glow Inside Card */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFEAA0] via-[#C9A96E] to-[#6E4B1F] p-[2px] mx-auto mb-5 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              <div className="w-full h-full rounded-2xl bg-[#1A0E07] flex items-center justify-center text-[#FFEAA0]">
                <ShieldCheck size={26} strokeWidth={2.2} />
              </div>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">
              Need Personal Assistance with an Order?
            </h3>
            <p className="text-[#E6DCCF] text-sm sm:text-base leading-relaxed mb-8">
              Our Senior Master Furniture Consultants and VIP Concierge Team are available 7 days a week to assist with custom room measurements, wood swatches, and nationwide delivery queries.
            </p>

            <div className="flex flex-wrap gap-3.5 justify-center">
              <a
                href="https://wa.me/923207006110?text=Hello%20Fahad%20Ali%20Interior%20Concierge,%20I%20have%20a%20question"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-serif font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(37,211,102,0.3)] active:scale-95"
              >
                <MessageCircle size={17} />
                WhatsApp VIP Concierge
              </a>
              <a
                href={`tel:${phone}`}
                className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-[#FFEAA0] via-[#F5C46B] to-[#C9A96E] text-[#1A0E07] font-serif font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl hover:brightness-105 transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(212,175,55,0.35)] active:scale-95"
              >
                <Phone size={17} />
                Direct Call
              </a>
              <Link
                href="/contact"
                className="px-6 sm:px-8 py-3.5 bg-white/10 hover:bg-white/20 text-[#FFEAA0] border border-[#D4AF37]/50 font-serif font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
              >
                <span>Contact Showroom</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
