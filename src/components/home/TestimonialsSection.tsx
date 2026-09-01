'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  ArrowRight,
  Star, 
  Quote,
  MapPin,
  Sparkles
} from 'lucide-react';

const TESTIMONIALS_DATA = [
  {
    id: 'test-1',
    name: 'Usman Khan',
    location: 'Lahore, Pakistan',
    projectType: 'Luxury Residence',
    text: 'The quality and finish of the furniture is outstanding. Fahad Ali Interior truly understands luxury and comfort.',
    rating: 5,
    score: '5.0',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    fallbackAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roomImage: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
    theme: 'amber',
    tag: '14 Orders in Period',
    cardBorder: 'border-amber-300/90 shadow-[0_8px_35px_rgba(245,158,11,0.22)]',
    ambientGlow: 'bg-amber-500/20',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-[#B88E4B] via-[#D4AF37] to-[#996515]',
    iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.25)]',
  },
  {
    id: 'test-2',
    name: 'Bilal Ahmed',
    location: 'Karachi, Pakistan',
    projectType: 'Penthouse Residence',
    text: 'Elegant design, durable materials, and excellent customer service. My whole experience was amazing!',
    rating: 5,
    score: '5.0',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    fallbackAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roomImage: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1000&q=80',
    theme: 'blue',
    tag: '4 Delivered / Completed',
    cardBorder: 'border-blue-300/90 shadow-[0_8px_35px_rgba(59,130,246,0.22)]',
    ambientGlow: 'bg-blue-500/20',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-500/30',
    dotColor: 'bg-blue-500',
    numberGradient: 'from-blue-500 via-sky-500 to-indigo-600',
    iconBg: 'bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/80 border-blue-300/70 text-blue-600 shadow-[0_3px_12px_rgba(59,130,246,0.25)]',
  },
  {
    id: 'test-3',
    name: 'Sara Khan',
    location: 'Multan, Pakistan',
    projectType: 'Bespoke Drawing Room',
    text: 'The craftsmanship and finish on our dining and sofa set is breathtaking. Everyone who visits our home compliments it!',
    rating: 5,
    score: '5.0',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    fallbackAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roomImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
    theme: 'purple',
    tag: 'Live Registered Accounts',
    cardBorder: 'border-purple-300/90 shadow-[0_8px_35px_rgba(168,85,247,0.22)]',
    ambientGlow: 'bg-purple-500/20',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-500/30',
    dotColor: 'bg-purple-500',
    numberGradient: 'from-purple-500 via-fuchsia-500 to-pink-600',
    iconBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-300/70 text-purple-600 shadow-[0_3px_12px_rgba(168,85,247,0.25)]',
  },
  {
    id: 'test-4',
    name: 'Zainab Hussain',
    location: 'Faisalabad, Pakistan',
    projectType: 'Executive Suite Project',
    text: 'Custom tailored luxury furniture delivered with meticulous care. Royal aesthetic, rich wood finish, and sublime comfort.',
    rating: 5,
    score: '5.0',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    fallbackAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roomImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    theme: 'emerald',
    tag: '100% In-Stock Database',
    cardBorder: 'border-emerald-300/90 shadow-[0_8px_35px_rgba(16,185,129,0.22)]',
    ambientGlow: 'bg-emerald-500/20',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    iconBg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-300/70 text-emerald-600 shadow-[0_3px_12px_rgba(16,185,129,0.25)]',
  },
  {
    id: 'test-5',
    name: 'Ayesha Malik',
    location: 'Islamabad, Pakistan',
    projectType: 'Luxury Villa Project',
    text: 'From custom sizing to delivery, everything was seamless. Highly recommend for anyone looking for premium furniture.',
    rating: 5,
    score: '5.0',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    fallbackAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    roomImage: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80',
    theme: 'rose',
    tag: '5-Star Verified Project',
    cardBorder: 'border-rose-300/90 shadow-[0_8px_35px_rgba(244,63,94,0.22)]',
    ambientGlow: 'bg-rose-500/20',
    badgeStyle: 'bg-rose-50 text-rose-800 border-rose-500/30',
    dotColor: 'bg-rose-500',
    numberGradient: 'from-rose-500 via-pink-500 to-amber-600',
    iconBg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80 border-rose-300/70 text-rose-600 shadow-[0_3px_12px_rgba(244,63,94,0.25)]',
  }
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handlePrev = () => {
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? TESTIMONIALS_DATA.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((prev) => (prev === TESTIMONIALS_DATA.length - 1 ? 0 : prev + 1));
  };

  // Touch Swipe Handlers for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const currentItem = TESTIMONIALS_DATA[activeIndex];

  return (
    <section 
      className="relative w-full pt-3 pb-10 sm:pt-5 sm:pb-14 lg:pt-6 lg:pb-16 bg-[#FAF7F2] overflow-x-hidden overflow-y-visible select-none"
    >
      
      {/* Background Soft Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-[#FAF5EE]/70 via-[#F3E7D3]/50 to-[#FAF5EE]/70 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
        
        {/* ════════════════════════════════════════════════════════════════════════════════
            ── MOBILE VIEW: MATCHING IMAGE 1 PRECISELY (PRESERVED AS IS) ──
           ════════════════════════════════════════════════════════════════════════════════ */}
        <div className="block md:hidden max-w-[420px] mx-auto px-2">
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`relative bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] ${currentItem.cardBorder} border-[1.5px] rounded-[36px] p-5 sm:p-7 overflow-hidden transition-all duration-500 group`}
          >
            {/* Ambient Colored Radial Glow in Top and Bottom Corners (Dynamic Lighting) */}
            <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none ${currentItem.ambientGlow} opacity-90 transition-all duration-700 animate-pulse`} />
            <div className={`absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none ${currentItem.ambientGlow} opacity-80 transition-all duration-700 animate-pulse`} />

            {/* Top Left Number Badge (Dynamic Gradient) */}
            <div className={`absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-gradient-to-br ${currentItem.numberGradient} text-white font-serif font-bold text-xs flex items-center justify-center shadow-[0_3px_12px_rgba(0,0,0,0.25)] border border-white/40`}>
              {String(activeIndex + 1).padStart(2, '0')}
            </div>

            {/* Top Centered Header (Matching Image 1) */}
            <div className="text-center pt-0.5 mb-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs mb-2">
                <span className="text-[#B88E4B] text-[11px]">✦</span>
                <span className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider text-[#7A6354]">
                  TESTIMONIALS & REPUTATION
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-[28px] font-black text-[#221814] tracking-tight leading-tight mb-1">
                Reviews <span className="font-serif italic font-normal text-[#C9A24D] mx-1 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Testimonials</span>
              </h2>

              {/* Diamond Line Divider */}
              <div className="flex items-center justify-center gap-2.5 my-2">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#B88E4B] shadow-[0_0_6px_#B88E4B]" />
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              </div>

              <p className="text-[11px] text-[#7A6048] font-serif italic max-w-xs mx-auto leading-normal">
                Real stories from real homes. Experience the timeless prestige of <strong className="text-[#221814] font-black">Fahad Ali Interior</strong>.
              </p>
            </div>

            {/* Animated Slide Container */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-4 relative z-10"
              >
                {/* Featured Architectural Room Image with Shining Border */}
                <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm bg-[#EADBCE] mb-6 border border-amber-300/40">
                  <Image 
                    src={currentItem.roomImage} 
                    alt={`${currentItem.name} - ${currentItem.projectType}`} 
                    fill 
                    sizes="(max-width: 640px) 100vw, 420px"
                    className="object-cover" 
                  />

                  {/* Floating Rating Pill with Shining Amber Glow */}
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(184,142,75,0.2)] border border-amber-300/80 flex items-center gap-1.5 z-20 whitespace-nowrap translate-y-1/2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(currentItem.rating)].map((_, i) => (
                        <Star key={i} size={13} className="fill-[#B88E4B] text-[#B88E4B]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#1F1612] ml-1">{currentItem.score}</span>
                  </div>
                </div>

                {/* Testimonial Quote */}
                <div className="pt-2">
                  <div className="flex items-start gap-3">
                    <div className="text-[#8C6239] text-3xl sm:text-4xl font-serif font-black shrink-0 leading-none select-none">
                      “
                    </div>
                    <p className="text-[13.5px] sm:text-[14px] text-[#221814] font-medium leading-relaxed font-sans flex-1">
                      {currentItem.text}
                    </p>
                  </div>
                </div>

                {/* Delicate Gold Divider */}
                <div className="w-8 h-[2px] bg-[#B88E4B] rounded-full my-2.5 ml-1" />

                {/* Reviewer Profile */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-full overflow-hidden border-2 border-amber-300/80 shrink-0 shadow-[0_2px_10px_rgba(184,142,75,0.2)]">
                    <Image 
                      src={imgErrors[currentItem.id] ? currentItem.fallbackAvatar : currentItem.avatar} 
                      alt={currentItem.name} 
                      fill 
                      loading="eager"
                      sizes="48px"
                      className="object-cover" 
                      onError={() => setImgErrors(prev => ({ ...prev, [currentItem.id]: true }))}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[14.5px] text-[#1F1612] leading-tight">
                      {currentItem.name}
                    </h3>
                    <span className="text-[11.5px] font-semibold text-[#8C6239] block mt-0.5">
                      {currentItem.projectType}
                    </span>
                    <span className="text-[10.5px] text-stone-500 flex items-center gap-1 mt-0.5 font-medium">
                      <MapPin size={11} className="text-[#8C6239] shrink-0" />
                      {currentItem.location}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Navigation Controls (Shining Luminous Buttons + Indicator) */}
            <div className="flex items-center justify-between pt-5 mt-4 border-t border-amber-300/40 relative z-10">
              <button 
                onClick={handlePrev}
                className="w-11 h-11 rounded-full bg-white border border-amber-300/80 flex items-center justify-center text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.12)] active:scale-95 transition-all cursor-pointer"
                aria-label="Previous Review"
              >
                <ArrowLeft size={17} />
              </button>

              <div className="text-xs font-mono font-bold tracking-wider">
                <span className="text-[#8C6239] font-black text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="text-[#7A6354] mx-1">/</span>
                <span className="text-[#7A6354] font-bold">{String(TESTIMONIALS_DATA.length).padStart(2, '0')}</span>
              </div>

              <button 
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-white border border-amber-300/80 flex items-center justify-center text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.12)] active:scale-95 transition-all cursor-pointer"
                aria-label="Next Review"
              >
                <ArrowRight size={17} />
              </button>
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════════════════
            ── DESKTOP VIEW: EXACT 1:1 MATCH OF IMAGE 2 (WIDE 3D COVERFLOW PANORAMA) ──
           ════════════════════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block">
          
          {/* Section Header (Matching Mobile Theme Exactly) */}
          <div className="text-center mb-3 sm:mb-4">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs mb-2">
              <span className="text-[#B88E4B] text-xs">✦</span>
              <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A6354]">
                TESTIMONIALS & REPUTATION
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-black text-[#221814] tracking-tight mb-1.5 leading-tight">
              Reviews <span className="font-serif italic font-normal text-[#C9A24D] mx-1 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Testimonials</span>
            </h2>
            
            {/* Diamond Line Divider */}
            <div className="flex items-center justify-center gap-2.5 my-2">
              <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#B88E4B] shadow-[0_0_6px_#B88E4B]" />
              <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            </div>

            <p className="text-sm sm:text-[15px] lg:text-[16px] text-[#7A6048] font-serif italic max-w-2xl mx-auto px-2">
              Real stories from real homes. Experience the timeless prestige of <strong className="text-[#221814] font-black not-italic">Fahad Ali Interior</strong>.
            </p>
          </div>

          {/* 3D Coverflow Panorama Container */}
          <div className="relative w-full max-w-[1600px] 2xl:max-w-[1720px] mx-auto min-h-[320px] px-2 sm:px-6">
            
            {/* Floating Left Arrow Button (Matching Mobile Gold Scheme) */}
            <button 
              onClick={handlePrev}
              className="absolute left-1 lg:left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white border border-amber-300/80 text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] flex items-center justify-center shadow-[0_4px_16px_rgba(184,142,75,0.18)] active:scale-95 transition-all duration-300 group cursor-pointer"
              aria-label="Previous Review"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Floating Right Arrow Button (Matching Mobile Gold Scheme) */}
            <button 
              onClick={handleNext}
              className="absolute right-1 lg:right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white border border-amber-300/80 text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] flex items-center justify-center shadow-[0_4px_16px_rgba(184,142,75,0.18)] active:scale-95 transition-all duration-300 group cursor-pointer"
              aria-label="Next Review"
            >
              <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Cards Container with 3D Perspective */}
            <div 
              className="relative w-full h-[310px] flex items-center justify-center overflow-visible" 
              style={{ perspective: '1400px' }}
            >
              {TESTIMONIALS_DATA.map((item, index) => {
                let offset = index - activeIndex;
                if (offset < -1) offset += TESTIMONIALS_DATA.length;
                if (offset > 1) offset -= TESTIMONIALS_DATA.length;

                const isCenter = offset === 0;
                const isLeft = offset === -1;
                const isRight = offset === 1;

                if (!isCenter && !isLeft && !isRight) return null;

                const transformStyle = isCenter
                  ? 'translateX(0%) scale(1) rotateY(0deg) translateZ(0px)'
                  : isLeft
                    ? 'translateX(-56%) scale(0.88) rotateY(22deg) translateZ(-50px)'
                    : 'translateX(56%) scale(0.88) rotateY(-22deg) translateZ(-50px)';

                return (
                  <motion.div
                    key={item.id}
                    onClick={() => setActiveIndex(index)}
                    initial={false}
                    animate={{
                      opacity: isCenter ? 1 : 0.75,
                    }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      width: 'min(600px, 84vw)',
                      height: '300px',
                      transform: transformStyle,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease-out, box-shadow 0.65s ease-out',
                    }}
                    className={`absolute cursor-pointer rounded-[28px] lg:rounded-[32px] overflow-hidden flex flex-row group transition-all duration-300 ${
                      isCenter 
                        ? `z-30 opacity-100 ${item.cardBorder} border-[2px] hover:-translate-y-1.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.14)]` 
                        : 'z-10 opacity-75 blur-[0.2px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-stone-200/80 hover:opacity-100 hover:scale-[0.91]'
                    } bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE]`}
                  >
                    {/* Shimmer Light Reflection Sweep on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-30" />

                    {/* Ambient Glowing Colored Lights Inside Card (Expands on Hover) */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${item.ambientGlow} opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 z-0 animate-pulse`} />
                    <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl pointer-events-none ${item.ambientGlow} opacity-70 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 z-0 animate-pulse`} />

                    {/* Top Left Number Badge (Matching KPI Luminous Jewel Scheme) */}
                    <div className={`absolute top-3 left-3 z-30 w-7 h-7 rounded-full bg-gradient-to-br ${item.numberGradient} text-white font-serif font-bold text-[10.5px] flex items-center justify-center shadow-[0_3px_10px_rgba(0,0,0,0.2)] border border-white/40 group-hover:scale-110 transition-transform duration-300`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
                    {/* Left Column: Testimonial Text & Profile (Matching Theme) */}
                    <div 
                      style={{ width: '48%' }}
                      className="px-5 py-3.5 pt-10 lg:px-6 lg:py-4 lg:pt-10 flex flex-col justify-between h-full relative z-20 shrink-0"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`text-${item.id}-${isCenter}`}
                          initial={{ opacity: 0.4, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0.4, y: -6 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="flex flex-col justify-between h-full"
                        >
                          <div>
                            {/* 5 Gold Stars & Top Status Pill */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-0.5">
                                {[...Array(item.rating)].map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    size={13.5} 
                                    className="fill-[#B88E4B] text-[#B88E4B] transition-transform duration-300 group-hover:scale-110" 
                                  />
                                ))}
                                <span className="text-[12px] font-bold text-[#1F1612] ml-1">{item.score}</span>
                              </div>

                              {/* Luminous Status Pill with Blinking Dot (Matching Dashboard KPI) */}
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all duration-300 group-hover:shadow-xs ${item.badgeStyle}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} animate-pulse`} />
                                <span className="truncate max-w-[105px]">{item.tag}</span>
                              </div>
                            </div>

                            {/* Large Quote Mark */}
                            <div className="text-[#8C6239] text-2xl lg:text-3xl font-serif font-black mb-0.5 leading-none select-none group-hover:text-[#B88E4B] transition-colors duration-300">
                              “
                            </div>

                            {/* Review Content (Enhanced Readable Size) */}
                            <p className="text-[13.5px] lg:text-[14.5px] text-[#221814] leading-[1.5] font-sans font-medium">
                              {item.text}
                            </p>
                          </div>

                          {/* Client Info & Divider */}
                          <div>
                            <div className="w-8 h-[2px] bg-[#B88E4B] rounded-full my-1.5 group-hover:w-12 transition-all duration-300" />
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-hidden border-2 border-amber-300/80 shrink-0 shadow-[0_2px_8px_rgba(184,142,75,0.2)] group-hover:scale-105 group-hover:border-[#B88E4B] transition-all duration-300">
                                <Image 
                                  src={imgErrors[item.id] ? item.fallbackAvatar : item.avatar} 
                                  alt={item.name} 
                                  fill 
                                  loading="eager"
                                  sizes="36px"
                                  className="object-cover" 
                                  onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                                />
                              </div>
                              <div className="flex flex-col">
                                <h3 className="font-bold text-[13px] lg:text-[14px] text-[#1F1612] leading-tight">
                                  {item.name}
                                </h3>
                                <span className="text-[10.5px] font-semibold text-[#8C6239] block mt-0.5">
                                  {item.projectType}
                                </span>
                                <span className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5 font-medium">
                                  <MapPin size={10} className="text-[#8C6239] shrink-0" />
                                  {item.location}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Right Column: Full Bleed Interior Room Image with Left Fade Blend */}
                    <div 
                      style={{ width: '52%' }}
                      className="relative h-full overflow-hidden bg-[#FAF5EE] shrink-0 border-l border-amber-300/30"
                    >
                      <Image 
                        src={item.roomImage} 
                        alt={`${item.name} ${item.projectType}`} 
                        fill 
                        loading="eager"
                        sizes="(max-width: 1024px) 50vw, 400px"
                        className="object-cover transition-transform duration-700 group-hover:scale-108" 
                      />

                      {/* Smooth Left Gradient Blend that seamlessly fades into the left cream side */}
                      <div className="absolute inset-y-0 left-0 w-20 lg:w-28 bg-gradient-to-r from-white via-white/80 via-30% to-transparent z-10 pointer-events-none" />

                      {/* Floating Luminous Jewel Badge at Bottom-Right */}
                      {isCenter && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`absolute bottom-3 right-3 lg:bottom-3.5 lg:right-3.5 w-9 h-9 rounded-2xl border flex items-center justify-center shadow-lg z-20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${item.iconBg}`}
                        >
                          <Quote size={13} className="rotate-180 fill-current" />
                        </motion.div>
                      )}
                    </div>

                  </motion.div>
                );
              })}
            </div>

            {/* Desktop Slider Controls / Counter (Matching Mobile Scheme) */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="text-xs font-mono font-bold tracking-wider">
                <span className="text-[#8C6239] font-black text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="text-[#7A6354] mx-1">/</span>
                <span className="text-[#7A6354] font-bold">{String(TESTIMONIALS_DATA.length).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {TESTIMONIALS_DATA.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className="min-w-[32px] min-h-[32px] p-2 flex items-center justify-center cursor-pointer transition-all duration-300"
                    aria-label={`Go to slide ${i + 1}`}
                  >
                    <span
                      className={`transition-all duration-300 rounded-full block ${
                        i === activeIndex 
                          ? 'w-6 h-2 bg-gradient-to-r from-[#B88E4B] to-[#996515] shadow-[0_0_6px_rgba(184,142,75,0.5)]' 
                          : 'w-2 h-2 bg-[#B88E4B]/40 hover:bg-[#B88E4B]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
