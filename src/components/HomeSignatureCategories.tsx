'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { StorefrontProduct } from '@/lib/types';

interface HomeSignatureCategoriesProps {
  products: StorefrontProduct[];
  categories?: { name: string; items?: string; image?: string }[];
}

function normalizeCategoryName(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('living')) return 'Living Room';
  if (lower.includes('bed')) return 'Bedroom';
  if (lower.includes('dining')) return 'Dining Room';
  if (lower.includes('coffee chair') || (lower.includes('chair') && !lower.includes('dining'))) return 'Coffee Chairs';
  if (lower.includes('center table') || lower.includes('table')) return 'Center Tables';
  if (lower.includes('showcase')) return 'Luxury Showcase';
  if (lower.includes('wardrobe') || lower.includes('closet')) return 'Luxury Wardrobes';
  return trimmed;
}

function isProductInCategory(p: StorefrontProduct, catName: string): boolean {
  const pCat = (p.category || '').toLowerCase().trim();
  const cName = catName.toLowerCase().trim();
  if (!pCat) return false;

  if (cName === 'living room') {
    return pCat.includes('living') || pCat.includes('sofa') || (p.name || '').toLowerCase().includes('sofa');
  }
  if (cName === 'bedroom') {
    return pCat.includes('bed') || (p.name || '').toLowerCase().includes('bed');
  }
  if (cName === 'dining room') {
    return pCat.includes('dining') || (p.name || '').toLowerCase().includes('dining');
  }
  if (cName === 'coffee chairs') {
    return pCat.includes('coffee') || pCat.includes('chair') || (p.name || '').toLowerCase().includes('chair') || (p.name || '').toLowerCase().includes('lounge');
  }
  if (cName === 'center tables') {
    return pCat.includes('center table') || pCat.includes('table') || (p.name || '').toLowerCase().includes('table');
  }
  if (cName === 'luxury showcase') {
    return pCat.includes('showcase') || pCat.includes('console') || (p.name || '').toLowerCase().includes('showcase');
  }
  if (cName === 'luxury wardrobes') {
    return pCat.includes('wardrobe') || pCat.includes('closet') || (p.name || '').toLowerCase().includes('wardrobe');
  }

  return pCat === cName || pCat.includes(cName);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const DEFAULT_CATEGORY_ORDER = [
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Coffee Chairs',
  'Center Tables',
  'Luxury Showcase',
  'Luxury Wardrobes',
];

export default function HomeSignatureCategories({
  products = [],
  categories = [],
}: HomeSignatureCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const sectionTopRef = useRef<HTMLElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isAutoScrolling = useRef(false);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Determine category list in luxury editorial order
  const categoryNames = useMemo(() => {
    const list = ['All'];
    const seen = new Set<string>();

    // 1. Prioritize canonical atelier order
    for (const name of DEFAULT_CATEGORY_ORDER) {
      list.push(name);
      seen.add(name.toLowerCase());
    }

    // 2. Add any custom categories from database if not already present
    for (const c of categories) {
      const normalized = normalizeCategoryName(c.name);
      if (normalized && !seen.has(normalized.toLowerCase())) {
        list.push(normalized);
        seen.add(normalized.toLowerCase());
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
      if (matching.length > 0) {
        matching.forEach((p) => assignedIds.add(p.id));
        groups.push({
          name: cat,
          slug: slugify(cat),
          products: matching,
        });
      }
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

  // Handle clicking a category pill
  const handlePillClick = (cat: string) => {
    setActiveCategory(cat);
    isAutoScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    if (cat === 'All') {
      const el = sectionTopRef.current;
      if (el) {
        const navHeight = window.innerWidth >= 1024 ? 80 : window.innerWidth >= 640 ? 64 : 56;
        const y = el.getBoundingClientRect().top + window.pageYOffset - (navHeight + 20);
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
      const navHeight = window.innerWidth >= 1024 ? 80 : window.innerWidth >= 640 ? 64 : 56;
      const pillsBarHeight = 65;
      const y = target.getBoundingClientRect().top + window.pageYOffset - (navHeight + pillsBarHeight + 10);
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    scrollTimer.current = setTimeout(() => {
      isAutoScrolling.current = false;
    }, 700);
  };

  // Auto-scroll the active category pill into view horizontally on mobile
  useEffect(() => {
    if (activeCategory && pillRefs.current[activeCategory]) {
      pillRefs.current[activeCategory]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeCategory]);

  // High-performance IntersectionObserver for Scrollspy (Zero scroll event listeners)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const sections = document.querySelectorAll<HTMLElement>('.home-category-anchor-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isAutoScrolling.current) return;

        // Find intersecting section
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          // Choose the one highest up or with greatest ratio
          intersecting.sort((a, b) => {
            const topA = Math.abs(a.boundingClientRect.top - 140);
            const topB = Math.abs(b.boundingClientRect.top - 140);
            return topA - topB;
          });
          const cat = intersecting[0].target.getAttribute('data-category');
          if (cat && cat !== activeCategory) {
            setActiveCategory(cat);
          }
        }
      },
      {
        rootMargin: '-15% 0px -65% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [groupedCategories, activeCategory]);

  // If user scrolls back up past the first section, reset to "All"
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const topEl = sectionTopRef.current;
    if (!topEl || typeof IntersectionObserver === 'undefined') return;

    const topObserver = new IntersectionObserver(
      ([entry]) => {
        if (isAutoScrolling.current) return;
        if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
          setActiveCategory('All');
        }
      },
      { threshold: 0.2 }
    );

    topObserver.observe(topEl);
    return () => topObserver.disconnect();
  }, []);

  return (
    <section
      ref={sectionTopRef}
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

      {/* ── STICKY CATEGORY PILLS BAR (PINS FLUSH UNDER FIXED NAVBAR) ── */}
      <div className="sticky top-14 sm:top-16 lg:top-20 z-40 bg-[#FCFAF7]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-y border-amber-200/60 shadow-[0_4px_16px_rgba(184,142,75,0.06)] mb-8 transition-all">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
          {categoryNames.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                ref={(el) => { pillRefs.current[cat] = el; }}
                type="button"
                onClick={() => handlePillClick(cat)}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
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
        {groupedCategories.map((group) => (
          <div
            key={group.slug}
            id={`cat-section-${group.slug}`}
            data-category={group.name}
            className="home-category-anchor-section scroll-mt-32 sm:scroll-mt-40"
          >
            {/* Category Subheading Banner */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 border-b border-amber-200/70 pb-3.5 gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#B88E4B] mb-1">
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
                <Link
                  href={`/shop?category=${encodeURIComponent(group.name)}`}
                  prefetch={false}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#B88E4B] hover:text-[#8C6944] transition-colors"
                >
                  <span>Explore All</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {group.products.map((product, idx) => (
                <ProductCard
                  key={product.id || idx}
                  product={product}
                  index={idx}
                />
              ))}
            </div>

            {/* Mobile View All Link */}
            <div className="mt-5 text-center sm:hidden">
              <Link
                href={`/shop?category=${encodeURIComponent(group.name)}`}
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B88E4B] hover:underline"
              >
                <span>View All {group.name} Pieces</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM EXPLORE COMPLETE CATALOG CTA ── */}
      <div className="text-center mt-16 pt-6 border-t border-amber-200/50">
        <Link
          href="/shop"
          prefetch={false}
          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <Sparkles size={16} />
          <span>Explore Complete Atelier Collection</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
