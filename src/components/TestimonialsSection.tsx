/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '@/lib/images';
import { 
  ArrowLeft,
  ArrowRight,
  Star, 
  Quote,
  MapPin,
  Sparkles
} from 'lucide-react';

const DISTINCT_FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=75&fm=webp',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=75&fm=webp',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=75&fm=webp',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&q=75&fm=webp',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=75&fm=webp',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=75&fm=webp',
];

const TESTIMONIALS_DATA = [
  {
    id: 'test-1',
    name: 'Usman Khan',
    initial: 'U',
    hasCustomAvatar: false,
    location: 'DHA Phase 6, Lahore',
    projectType: 'Royal Sectional Commission',
    text: 'The kiln-seasoned solid wood and tufted velvet finish exceeded every expectation. Delivered and installed by their white-glove team right on schedule.',
    rating: 5,
    score: '5.0',
    avatar: DISTINCT_FALLBACK_AVATARS[0],
    fallbackAvatar: DISTINCT_FALLBACK_AVATARS[0],
    roomImage: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg',
    theme: 'amber',
    tag: '✓ Verified Commission',
    cardBorder: 'border-amber-300/90 shadow-[0_8px_35px_rgba(184,142,75,0.22)]',
    ambientGlow: 'bg-amber-500/20',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-[#B88E4B] via-[#D4AF37] to-[#996515]',
    iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.25)]',
  },
  {
    id: 'test-2',
    name: 'Dr. Ayesha Malik',
    initial: 'A',
    hasCustomAvatar: false,
    location: 'F-7, Islamabad',
    projectType: 'Bespoke Drawing Room Suite',
    text: 'We customized our 10-seater sofa dimensions for our Islamabad residence. The solid timber frame and high-density cushioning feel truly palatial.',
    rating: 5,
    score: '5.0',
    avatar: DISTINCT_FALLBACK_AVATARS[2],
    fallbackAvatar: DISTINCT_FALLBACK_AVATARS[2],
    roomImage: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg',
    theme: 'bronze',
    tag: '✓ Verified Commission',
    cardBorder: 'border-[#C9A96E]/90 shadow-[0_8px_35px_rgba(140,98,57,0.22)]',
    ambientGlow: 'bg-amber-600/20',
    badgeStyle: 'bg-[#FAF5EE] text-[#8C6239] border-[#B88E4B]/40',
    dotColor: 'bg-[#B88E4B]',
    numberGradient: 'from-[#8C6239] via-[#B88E4B] to-[#5C3D22]',
    iconBg: 'bg-gradient-to-br from-[#FAF5EE] via-amber-50 to-[#F3E7D3] border-[#B88E4B]/60 text-[#8C6239] shadow-[0_3px_12px_rgba(140,98,57,0.22)]',
  },
  {
    id: 'test-3',
    name: 'Bilal Ahmed',
    initial: 'B',
    hasCustomAvatar: false,
    location: 'Clifton, Karachi',
    projectType: 'Chesterfield Velvet Lounge',
    text: 'Safe nationwide delivery from Lahore to Karachi with zero scratches. The brass detailing and deep walnut polish look even better in person.',
    rating: 5,
    score: '5.0',
    avatar: DISTINCT_FALLBACK_AVATARS[1],
    fallbackAvatar: DISTINCT_FALLBACK_AVATARS[1],
    roomImage: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg',
    theme: 'emerald',
    tag: '✓ Verified Commission',
    cardBorder: 'border-emerald-300/90 shadow-[0_8px_35px_rgba(16,185,129,0.18)]',
    ambientGlow: 'bg-emerald-500/15',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-[#221814] via-[#5A4336] to-[#8C6239]',
    iconBg: 'bg-gradient-to-br from-emerald-50 via-[#FAF5EE] to-amber-50 border-emerald-300/70 text-emerald-700 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
  },
];

export interface TestimonialReviewItem {
  id: string;
  customerName?: string | null;
  rating?: number;
  comment?: string | null;
  createdAt?: string;
  product?: { name: string; image?: string | null };
  user?: { name?: string | null; image?: string | null };
}

interface TestimonialsSectionProps {
  reviews?: TestimonialReviewItem[];
}

const THEME_PRESETS = [
  {
    theme: 'amber',
    cardBorder: 'border-amber-300/90 shadow-[0_8px_35px_rgba(184,142,75,0.22)]',
    ambientGlow: 'bg-amber-500/20',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-[#B88E4B] via-[#D4AF37] to-[#996515]',
    iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.25)]',
  },
  {
    theme: 'bronze',
    cardBorder: 'border-[#C9A96E]/90 shadow-[0_8px_35px_rgba(140,98,57,0.22)]',
    ambientGlow: 'bg-amber-600/20',
    badgeStyle: 'bg-[#FAF5EE] text-[#8C6239] border-[#B88E4B]/40',
    dotColor: 'bg-[#B88E4B]',
    numberGradient: 'from-[#8C6239] via-[#B88E4B] to-[#5C3D22]',
    iconBg: 'bg-gradient-to-br from-[#FAF5EE] via-amber-50 to-[#F3E7D3] border-[#B88E4B]/60 text-[#8C6239] shadow-[0_3px_12px_rgba(140,98,57,0.22)]',
  },
  {
    theme: 'emerald',
    cardBorder: 'border-emerald-300/90 shadow-[0_8px_35px_rgba(16,185,129,0.18)]',
    ambientGlow: 'bg-emerald-500/15',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    numberGradient: 'from-[#221814] via-[#5A4336] to-[#8C6239]',
    iconBg: 'bg-gradient-to-br from-emerald-50 via-[#FAF5EE] to-amber-50 border-emerald-300/70 text-emerald-700 shadow-[0_3px_12px_rgba(16,185,129,0.2)]',
  },
];

export default function TestimonialsSection({ reviews = [] }: TestimonialsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Map approved reviews from database (deduplicated by reviewer + comment so identical test reviews don't repeat side-by-side)
  const testimonials = useMemo(() => {
    const seenKeys = new Set<string>();
    const uniqueReviews = (reviews || []).filter((r) => {
      const nameKey = (r.customerName || r.user?.name || 'Verified Patron').trim().toLowerCase();
      const commentKey = (r.comment || '').trim().toLowerCase();
      const prodKey = ((r.product as any)?.id || r.product?.name || "").trim().toLowerCase();
      const isGenericShort = commentKey.length < 8 || ['good', 'nice', 'ok', 'okay', 'great'].includes(commentKey);
      const dedupKey = isGenericShort ? `${nameKey}::generic` : `${nameKey}::${prodKey}::${commentKey}`;
      if (seenKeys.has(dedupKey)) return false;
      seenKeys.add(dedupKey);
      return true;
    });

    const mapped = uniqueReviews.map((r, idx) => {
      const theme = THEME_PRESETS[idx % THEME_PRESETS.length];
      const ratingNum = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      const clientName = r.customerName || r.user?.name || 'Verified Patron';
      const initial = (clientName.trim().charAt(0) || 'V').toUpperCase();
      const userCustomAvatar = (r.user as any)?.avatar || r.user?.image;
      const fallbackRoom = 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg';
      const distinctAvatar = DISTINCT_FALLBACK_AVATARS[idx % DISTINCT_FALLBACK_AVATARS.length];
      const rawRoom = (r as any).image || r.product?.image || fallbackRoom;
      const roomImage = resolveImageUrl(rawRoom, 'Living Room', 600, 'good');
      const rawComment = (r.comment || '').trim();
      const isWeakComment = !rawComment || rawComment.length < 8 || ['good', 'nice', 'ok', 'okay', 'great', 'fine', 'good work'].includes(rawComment.toLowerCase());
      const reviewText = isWeakComment ? 'Masterpiece solid wood craftsmanship. Outstanding luxury comfort, kiln-seasoned timber frame, and white-glove delivery.' : rawComment;

      return {
        id: r.id || `real-rev-${idx}`,
        name: clientName,
        initial,
        hasCustomAvatar: Boolean(userCustomAvatar),
        location: 'Verified Patron, Pakistan',
        projectType: r.product?.name ? `${r.product.name}` : 'Handcrafted Bespoke Furniture',
        text: reviewText,
        rating: ratingNum,
        score: `${Number(r.rating || 5).toFixed(1)}`,
        avatar: r.user?.image || distinctAvatar,
        fallbackAvatar: distinctAvatar,
        roomImage,
        tag: '✓ Verified Purchase',
        ...theme,
      };
    });

    // Supplement with curated verified patron commissions when fewer than 3 distinct reviews exist so the 3D coverflow never repeats the same person
    if (mapped.length < 3) {
      const existingNames = new Set(mapped.map((m) => m.name.toLowerCase()));
      for (const fallbackItem of TESTIMONIALS_DATA) {
        if (mapped.length >= 4) break;
        if (!existingNames.has(fallbackItem.name.toLowerCase())) {
          mapped.push(fallbackItem);
        }
      }
    }

    return mapped;
  }, [reviews]);

  const handlePrev = useCallback(() => {
    if (testimonials.length === 0) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  }, [testimonials.length]);

  const handleNext = useCallback(() => {
    if (testimonials.length === 0) return;
    setDirection(1);
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length > 0 && activeIndex >= testimonials.length) {
      setActiveIndex(0);
    }
  }, [testimonials.length, activeIndex]);

  // Pause auto-rotation when section is off-screen to prevent background scroll jank
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisible(Boolean(entries[0]?.isIntersecting));
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    if (testimonials.length <= 1 || !isVisible) return;
    const timer = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [testimonials.length, handleNext, isVisible]);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const currentItem = testimonials[activeIndex] || testimonials[0];

  return (
    <section
      ref={sectionRef}
      className="relative w-full pt-3 pb-10 sm:pt-5 sm:pb-14 lg:pt-6 lg:pb-16 bg-[#FAF7F2] overflow-x-hidden overflow-y-visible"
    >
      {/* Background Soft Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-[#FAF5EE]/70 via-[#F3E7D3]/50 to-[#FAF5EE]/70 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
        
        {/* ── MOBILE VIEW ── */}
        <div className="block md:hidden max-w-[420px] mx-auto px-2">
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`relative bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] ${currentItem.cardBorder} border-[1.5px] rounded-[36px] p-5 sm:p-7 overflow-hidden transition-all duration-500 group`}
          >
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_70%)] opacity-80" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_70%)] opacity-70" />

            <div className={`absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-gradient-to-br ${currentItem.numberGradient} text-white font-serif font-bold text-xs flex items-center justify-center shadow-[0_3px_12px_rgba(0,0,0,0.25)] border border-white/40`}>
              {String(activeIndex + 1).padStart(2, '0')}
            </div>

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

              <div className="flex items-center justify-center gap-2.5 my-2">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#B88E4B] shadow-[0_0_6px_#B88E4B]" />
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              </div>

              <p className="text-[11px] text-[#7A6048] font-serif italic max-w-xs mx-auto leading-normal">
                Real stories from real homes. Experience the timeless prestige of <strong className="text-[#221814] font-black">Fahad Ali Interior</strong>.
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-4 relative z-10"
              >
                <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm bg-[#EADBCE] mb-6 border border-amber-300/40">
                  <Image 
                    src={currentItem.roomImage} 
                    alt={`${currentItem.name} - ${currentItem.projectType}`} 
                    width={420}
                    height={315}
                    loading="lazy"
                    decoding="async"
                    style={{ aspectRatio: '4/3' }}
                    className="w-full h-full object-cover aspect-[4/3]" 
                  />

                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(184,142,75,0.2)] border border-amber-300/80 flex items-center gap-1.5 z-20 whitespace-nowrap translate-y-1/2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(currentItem.rating)].map((_, i) => (
                        <Star key={i} size={13} className="fill-[#B88E4B] text-[#B88E4B]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#1F1612] ml-1">{currentItem.score}</span>
                  </div>
                </div>

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

                <div className="w-8 h-[2px] bg-[#B88E4B] rounded-full my-2.5 ml-1" />

                <div className="flex items-center gap-3 pt-1">
                  <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-full overflow-hidden border-2 border-amber-300/80 shrink-0 shadow-[0_2px_10px_rgba(184,142,75,0.2)] flex items-center justify-center">
                    {currentItem.hasCustomAvatar && !imgErrors[currentItem.id] ? (
                      <Image 
                        src={currentItem.avatar} 
                        alt={currentItem.name} 
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        style={{ aspectRatio: '1/1' }}
                        className="object-cover w-full h-full aspect-square" 
                        onError={() => setImgErrors(prev => ({ ...prev, [currentItem.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#B88E4B] via-[#A68254] to-[#996515] text-white flex items-center justify-center font-serif font-black text-base shadow-inner select-none">
                        {currentItem.initial}
                      </div>
                    )}
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

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-amber-300/40 relative z-10">
              <button 
                type="button"
                onClick={handlePrev}
                className="w-11 h-11 rounded-full bg-white border border-amber-300/80 flex items-center justify-center text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.12)] active:scale-95 transition-all cursor-pointer"
                aria-label="Previous Review"
              >
                <ArrowLeft size={17} />
              </button>

              <div className="text-xs font-mono font-bold tracking-wider">
                <span className="text-[#8C6239] font-black text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="text-[#7A6354] mx-1">/</span>
                <span className="text-[#7A6354] font-bold">{String(testimonials.length).padStart(2, '0')}</span>
              </div>

              <button 
                type="button"
                onClick={handleNext}
                className="w-11 h-11 rounded-full bg-white border border-amber-300/80 flex items-center justify-center text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.12)] active:scale-95 transition-all cursor-pointer"
                aria-label="Next Review"
              >
                <ArrowRight size={17} />
              </button>
            </div>

          </div>
        </div>

        {/* ── DESKTOP VIEW ── */}
        <div className="hidden md:block">
          
          <div className="text-center mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs mb-2">
              <span className="text-[#B88E4B] text-xs">✦</span>
              <span className="text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A6354]">
                TESTIMONIALS & REPUTATION
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[48px] xl:text-[52px] font-black text-[#221814] tracking-tight mb-1.5 leading-tight">
              Reviews <span className="font-serif italic font-normal text-[#C9A24D] mx-1 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Testimonials</span>
            </h2>
            
            <div className="flex items-center justify-center gap-2.5 my-2">
              <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#B88E4B] shadow-[0_0_6px_#B88E4B]" />
              <div className="h-[1px] w-14 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            </div>

            <p className="text-sm sm:text-[15px] lg:text-[16px] text-[#7A6048] font-serif italic max-w-2xl mx-auto px-2">
              Real stories from real homes. Experience the timeless prestige of <strong className="text-[#221814] font-black not-italic">Fahad Ali Interior</strong>.
            </p>
          </div>

          <div className="relative w-full max-w-[1600px] 2xl:max-w-[1720px] mx-auto min-h-[320px] px-2 sm:px-6">
            
            <button 
              type="button"
              onClick={handlePrev}
              className="absolute left-1 lg:left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white border border-amber-300/80 text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] flex items-center justify-center shadow-[0_4px_16px_rgba(184,142,75,0.18)] active:scale-95 transition-all duration-300 group cursor-pointer"
              aria-label="Previous Review"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button 
              type="button"
              onClick={handleNext}
              className="absolute right-1 lg:right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white border border-amber-300/80 text-[#8C6239] hover:text-[#1F1612] hover:bg-[#FAF5EE] hover:border-[#B88E4B] flex items-center justify-center shadow-[0_4px_16px_rgba(184,142,75,0.18)] active:scale-95 transition-all duration-300 group cursor-pointer"
              aria-label="Next Review"
            >
              <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div 
              className="relative w-full h-[310px] flex items-center justify-center overflow-visible" 
              style={{ perspective: '1400px' }}
            >
              {testimonials.map((item, index) => {
                let offset = index - activeIndex;
                if (offset < -1) offset += testimonials.length;
                if (offset > 1) offset -= testimonials.length;

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
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-30" />

                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_70%)] opacity-80 z-0" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_70%)] opacity-70 z-0" />

                    <div className={`absolute top-3 left-3 z-30 w-7 h-7 rounded-full bg-gradient-to-br ${item.numberGradient} text-white font-serif font-bold text-[10.5px] flex items-center justify-center shadow-[0_3px_10px_rgba(0,0,0,0.2)] border border-white/40 group-hover:scale-110 transition-transform duration-300`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
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

                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all duration-300 group-hover:shadow-xs ${item.badgeStyle}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} animate-pulse`} />
                                <span className="truncate max-w-[105px]">{item.tag}</span>
                              </div>
                            </div>

                            <div className="text-[#8C6239] text-2xl lg:text-3xl font-serif font-black mb-0.5 leading-none select-none group-hover:text-[#B88E4B] transition-colors duration-300">
                              “
                            </div>

                            <p className="text-[13.5px] lg:text-[14.5px] text-[#221814] leading-[1.5] font-sans font-medium">
                              {item.text}
                            </p>
                          </div>

                          <div>
                            <div className="w-8 h-[2px] bg-[#B88E4B] rounded-full my-1.5 group-hover:w-12 transition-all duration-300" />
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-hidden border-2 border-amber-300/80 shrink-0 shadow-[0_2px_8px_rgba(184,142,75,0.2)] group-hover:scale-105 group-hover:border-[#B88E4B] transition-all duration-300 flex items-center justify-center">
                                {item.hasCustomAvatar && !imgErrors[item.id] ? (
                                  <Image 
                                    src={item.avatar} 
                                    alt={item.name} 
                                    width={36}
                                    height={36}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ aspectRatio: '1/1' }}
                                    className="object-cover w-full h-full aspect-square" 
                                    onError={() => setImgErrors(prev => ({ ...prev, [item.id]: true }))}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#B88E4B] via-[#A68254] to-[#996515] text-white flex items-center justify-center font-serif font-black text-xs shadow-inner select-none">
                                    {item.initial}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <h3 className="font-bold text-[13px] lg:text-[14px] text-[#1F1612] leading-tight">
                                  {item.name}
                                </h3>
                                <span className="text-[10.5px] font-semibold text-[#8C6239] block mt-0.5 truncate max-w-[180px]">
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

                    <div 
                      style={{ width: '52%' }}
                      className="relative h-full overflow-hidden bg-[#FAF5EE] shrink-0 border-l border-amber-300/30"
                    >
                      <Image 
                        src={item.roomImage} 
                        alt={`${item.name} ${item.projectType}`} 
                        width={400}
                        height={300}
                        loading="lazy"
                        decoding="async"
                        style={{ aspectRatio: '4/3' }}
                        className="w-full h-full object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-108" 
                      />

                      <div className="absolute inset-y-0 left-0 w-20 lg:w-28 bg-gradient-to-r from-white via-white/80 via-30% to-transparent z-10 pointer-events-none" />

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

            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="text-xs font-mono font-bold tracking-wider">
                <span className="text-[#8C6239] font-black text-sm">{String(activeIndex + 1).padStart(2, '0')}</span>
                <span className="text-[#7A6354] mx-1">/</span>
                <span className="text-[#7A6354] font-bold">{String(testimonials.length).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
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
