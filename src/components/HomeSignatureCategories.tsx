'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { StorefrontProduct } from '@/lib/types';
import { useUiNavigationStore } from '@/store';

interface HomeSignatureCategoriesProps {
  products: StorefrontProduct[];
  categories?: { name: string; items?: string; image?: string }[];
}

function isProductInCategory(p: StorefrontProduct, catName: string): boolean {
  const pCat = (p.category || '').toLowerCase().trim();
  const cName = catName.toLowerCase().trim();
  if (!pCat) return false;

  // Direct exact match
  if (pCat === cName) return true;

  if (cName === 'living room') {
    return pCat === 'living room' || (pCat.includes('living') && !pCat.includes('dining'));
  }
  if (cName === 'bedroom') {
    return pCat === 'bedroom' || pCat.includes('bed') || (p.name || '').toLowerCase().includes('bed');
  }
  if (cName === 'dining room') {
    return pCat === 'dining room' || pCat.includes('dining') || (p.name || '').toLowerCase().includes('dining');
  }
  if (cName === 'office') {
    return pCat === 'office' || pCat.includes('desk') || (p.name || '').toLowerCase().includes('desk');
  }
  if (cName === 'sofas') {
    return pCat === 'sofas' || pCat.includes('sofa') || (p.name || '').toLowerCase().includes('sofa');
  }
  if (cName === 'coffee tables') {
    return pCat === 'coffee tables' || pCat.includes('coffee') || pCat.includes('table') || pCat.includes('chair');
  }
  if (cName === 'tv units') {
    return pCat === 'tv units' || pCat.includes('tv') || pCat.includes('media') || (p.name || '').toLowerCase().includes('tv');
  }
  if (cName === 'storage') {
    return pCat === 'storage' || pCat.includes('wardrobe') || pCat.includes('almirah') || pCat.includes('showcase') || pCat.includes('closet');
  }
  if (cName === 'outdoor') {
    return pCat === 'outdoor' || pCat.includes('garden');
  }
  if (cName === 'accessories') {
    return pCat === 'accessories' || pCat.includes('decor') || pCat.includes('lamp');
  }

  return pCat.includes(cName) || cName.includes(pCat);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const DEFAULT_CATEGORY_ORDER = [
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Office',
  'Sofas',
  'Coffee Tables',
  'TV Units',
  'Storage',
  'Outdoor',
  'Accessories',
];

export default function HomeSignatureCategories({
  products = [],
  categories = [],
}: HomeSignatureCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const setIsCategoryBarSticky = useUiNavigationStore((s) => s.setIsCategoryBarSticky);
  const sectionTopRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isAutoScrolling = useRef(false);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Dynamic category list derived directly from Neon database categories
  const categoryNames = useMemo(() => {
    const list = ['All'];
    const seen = new Set<string>();

    if (categories && categories.length > 0) {
      for (const c of categories) {
        const name = (c.name || '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          list.push(name);
          seen.add(name.toLowerCase());
        }
      }
    } else {
      for (const name of DEFAULT_CATEGORY_ORDER) {
        list.push(name);
        seen.add(name.toLowerCase());
      }
    }

    return list;
  }, [categories]);

  // Group products by category so each category is displayed in its own section
  const groupedCategories = useMemo(() => {
    const validCats = categoryNames.filter((c) => c !== 'All');
    const assignedIds = new Set<string>();
    const groups: { name: string; slug: string; products: StorefrontProduct[] }[] = [];

    for (const cat of validCats) {
      const matching = products.filter(
        (p) => !assignedIds.has(p.id) && isProductInCategory(p, cat)
      );
      matching.forEach((p) => assignedIds.add(p.id));
      groups.push({
        name: cat,
        slug: slugify(cat),
        products: matching,
      });
    }

    // Remaining products grouped under Atelier Signature
    const remaining = products.filter((p) => !assignedIds.has(p.id));
    if (remaining.length > 0) {
      groups.push({
        name: 'Signature Pieces',
        slug: 'signature-pieces',
        products: remaining,
      });
    }

    return groups;
  }, [products, categoryNames]);

  // Handle clicking a category pill (navbar is hidden when category bar is sticky, clean top-0 alignment)
  const handlePillClick = (cat: string) => {
    setActiveCategory(cat);
    if (cat !== 'All') {
      const slug = slugify(cat);
      setExpandedCategories((prev) => ({ ...prev, [slug]: true }));
    }
    isAutoScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    const pillsBarHeight = 58;

    if (cat === 'All') {
      const el = sectionTopRef.current;
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
      scrollTimer.current = setTimeout(() => {
        isAutoScrolling.current = false;
      }, 700);
      return;
    }

    const slug = slugify(cat);
    const target = document.getElementById(`cat-section-${slug}`);
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - (pillsBarHeight + 8);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    scrollTimer.current = setTimeout(() => {
      isAutoScrolling.current = false;
    }, 700);
  };

  const pillsContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the active category pill into view horizontally without touching window scroll
  useEffect(() => {
    // Only adjust horizontal scroll if a specific category was clicked (not default 'All')
    if (!activeCategory || activeCategory === 'All' || !pillsContainerRef.current) return;
    const activePill = pillRefs.current[activeCategory];
    const container = pillsContainerRef.current;
    if (activePill && container) {
      const pillLeft = activePill.offsetLeft;
      const pillWidth = activePill.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft = pillLeft - (containerWidth / 2) + (pillWidth / 2);
      container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    }
  }, [activeCategory]);

  // Zero-Reflow Ultra-Performance Scrollspy with IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const sections = document.querySelectorAll<HTMLElement>('.home-category-anchor-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAutoScrolling.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute('data-category');
            if (cat) {
              setActiveCategory(cat);
              break;
            }
          }
        }
      },
      {
        rootMargin: '-100px 0px -65% 0px',
        threshold: 0,
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [groupedCategories]);

  // Single Top Bar Coordinator: When category pills bar reaches top, autonomously hide top navbar to eliminate dual bars
  // Zero-Reflow IntersectionObserver eliminates synchronous window scroll getBoundingClientRect() calls
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel scrolls out of top viewport, bar is pinned/sticky
        const isSticky = !entry.isIntersecting && entry.boundingClientRect.top <= 20;
        setIsCategoryBarSticky(isSticky);
      },
      {
        rootMargin: '-12px 0px 0px 0px',
        threshold: [0, 1],
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      setIsCategoryBarSticky(false);
    };
  }, [setIsCategoryBarSticky]);

  return (
    <section
      ref={sectionTopRef}
      id="signature-categories"
      className="w-full max-w-[1600px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 relative z-10"
    >
      {/* ── SECTION HEADER ── */}
      <div className="text-center mb-6 pt-2">
        <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E2D1BC] shadow-xs mb-3.5">
          <span className="text-[#B88E4B] text-sm font-bold">✦</span>
          <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] text-[#7A6354]">
            HAUTE COUTURE COLLECTIONS
          </span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#221814] tracking-tight leading-tight mb-2">
          Signature <span className="font-serif italic font-normal text-[#C9A24D] mx-2 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Categories</span>
        </h2>
        <div className="flex items-center justify-center gap-3 my-2.5">
          <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
          <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
        </div>
        <p className="text-[#7A6048] text-xs sm:text-sm md:text-base font-serif italic max-w-xl mx-auto">
          100% Solid Seasoned Sheesham masterworks handcrafted for luxury living.
        </p>
      </div>

      {/* Invisible Sentinel right before category pills bar (detects when category bar pins at top) */}
      <div ref={sentinelRef} className="h-0.5 w-full pointer-events-none -mt-2 mb-1" />

      {/* ── STICKY CATEGORY PILLS BAR (PINS FLUSH AT TOP-0, NAVBAR AUTONOMOUSLY HIDES) ── */}
      <div className="sticky top-0 z-40 bg-[#FCFAF7] md:bg-[#FCFAF7]/98 md:backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-amber-200/70 shadow-[0_4px_16px_rgba(184,142,75,0.06)] mb-8 transition-all">
        <div ref={pillsContainerRef} data-scroll-container="horizontal" className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
          {categoryNames.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                ref={(el) => { pillRefs.current[cat] = el; }}
                type="button"
                onClick={() => handlePillClick(cat)}
                className={`relative flex-shrink-0 px-5 py-2.5 min-h-[44px] flex items-center justify-center rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] shadow-[0_4px_14px_rgba(184,142,75,0.35)] border border-amber-200/80 scale-[1.03]'
                    : 'text-[#5A4336] bg-white border border-amber-200/70 hover:border-amber-400 hover:bg-[#FAF5EE] shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CATEGORY-BY-CATEGORY PRODUCT SECTIONS (INSTANT SSR, 60FPS SCROLLSPY) ── */}
      <div className="space-y-14 sm:space-y-20">
        {groupedCategories.filter((group) => group.products.length > 0).map((group) => (
          <div
            key={group.slug}
            id={`cat-section-${group.slug}`}
            data-category={group.name}
            className="home-category-anchor-section scroll-mt-24 sm:scroll-mt-28"
          >
            {/* Category Subheading Banner */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 border-b border-amber-200/70 pb-3.5 gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6222] mb-1">
                  <span>✦</span>
                  <span>ROYAL BESPOKE COLLECTION</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#221814] tracking-tight">
                  {group.name}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-serif italic text-[#7A6048]">
                  {group.products.length} {group.products.length === 1 ? 'Masterpiece' : 'Masterpieces'} Available
                </span>
              </div>
            </div>

            {/* Product Cards Grid (Initial 4 per category for low TBT + expand on click) */}
            {(() => {
              const isExpanded = !!expandedCategories[group.slug];
              const visibleProducts = isExpanded ? group.products : group.products.slice(0, 4);
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {visibleProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id || idx}
                        product={product}
                        index={idx}
                      />
                    ))}
                  </div>

                  {group.products.length > 4 && !isExpanded && (
                    <div className="text-center mt-6 sm:mt-8">
                      <button
                        type="button"
                        onClick={() => setExpandedCategories((prev) => ({ ...prev, [group.slug]: true }))}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-amber-300 bg-white hover:bg-[#FAF5EE] text-[#8C6222] text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <span>View All {group.products.length} {group.name} Pieces</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* ── BOTTOM BACK TO ALL CATEGORIES CTA ── */}
      <div className="text-center mt-16 pt-6 border-t border-amber-200/50">
        <button
          type="button"
          onClick={() => handlePillClick('All')}
          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Back To Top Categories</span>
          <ArrowRight size={16} className="-rotate-90" />
        </button>
      </div>
    </section>
  );
}
