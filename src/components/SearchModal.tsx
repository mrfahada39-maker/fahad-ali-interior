'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, TrendingUp, Sparkles, ArrowRight, LayoutGrid, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetchJson as fetchJson } from '@/lib/api-client';
import { formatPricePk } from '@/lib/format-price';
import { resolveImageUrl } from '@/lib/images';
import { useClientCacheStore, CachedProduct } from '@/store/clientCacheStore';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  woodType?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Solid Sheesham Bed',
  'Royal Chesterfield Sofa',
  '8-Seater Dining Table',
  'Luxury Wardrobe',
  'Artisan Coffee Table',
  'Executive Office Desk'
];

const CURATED_CATEGORIES = [
  { name: 'Bedroom Suites', href: '/shop?category=Bedroom', count: '18 Pieces' },
  { name: 'Living & Lounge', href: '/shop?category=Living', count: '24 Pieces' },
  { name: 'Imperial Dining', href: '/shop?category=Dining', count: '12 Pieces' },
  { name: 'Office & Study', href: '/shop?category=Office', count: '10 Pieces' }
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('fahad-ali-recent-searches');
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Live Database Search Connection
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Direct live database query via /api/v1/products
      const data = await fetchJson<any>(
        `/api/v1/products?search=${encodeURIComponent(searchQuery.trim())}&limit=16`,
      );
      
      let prods: Product[] = [];
      if (Array.isArray(data)) {
        prods = data;
      } else if (data?.products && Array.isArray(data.products)) {
        prods = data.products;
      } else if (data?.data?.products && Array.isArray(data.data.products)) {
        prods = data.data.products;
      } else if (data?.data && Array.isArray(data.data)) {
        prods = data.data;
      }

      setResults(prods);
    } catch {
      // Fallback direct endpoint query
      try {
        const fallbackRes = await fetch(`/api/v1/products?search=${encodeURIComponent(searchQuery.trim())}&limit=16`).then(r => r.json());
        const prods = fallbackRes?.products || fallbackRes?.data?.products || (Array.isArray(fallbackRes) ? fallbackRes : []);
        setResults(prods);
      } catch {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchProducts(query);
      } else {
        setResults([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    try {
      const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('fahad-ali-recent-searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const setCachedProduct = useClientCacheStore((s) => s.setProduct);

  const handleSelectProduct = (product: Product) => {
    saveRecentSearch(query || product.name);
    setCachedProduct(product as unknown as CachedProduct);
    onClose();
    router.push(`/product/${product.id}`);
  };

  const handleRecentClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#221814]/30 backdrop-blur-sm transition-all duration-300"
        >
          {/* Backdrop Click Dismiss */}
          <div 
            className="fixed inset-0 -z-10" 
            onClick={onClose} 
            aria-hidden="true" 
          />

          {/* Luxury Modal Container (Exact Warm Alabaster & Imperial Gold Palette) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: '#FCFAF7' }}
            className="w-full max-w-3xl bg-[#FCFAF7] rounded-[28px] border-2 border-[#D4AF37]/50 shadow-[0_20px_70px_rgba(184,142,75,0.20),0_4px_25px_rgba(44,30,24,0.08)] p-5 sm:p-7 my-auto relative overflow-hidden flex flex-col gap-5 z-20"
          >
            {/* Top Brand Header (Centered, Larger Text, FA Logo Removed) */}
            <div className="relative flex items-center justify-center pb-4 border-b border-[#E2D6C8]/80 text-center w-full">
              <div className="flex flex-col items-center justify-center text-center px-8">
                <span className="font-serif font-black text-xl sm:text-2xl md:text-[26px] tracking-tight text-[#221814] uppercase leading-tight whitespace-nowrap">
                  FAHAD ALI <span className="font-serif italic font-normal text-[#C9A24D] mx-1 sm:mx-1.5 text-[1.05em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">INTERIOR</span>
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-[0.35em] font-bold text-[#8C6239] uppercase mt-0.5">
                  LIVE DATABASE CATALOG SEARCH
                </span>
              </div>

              {/* Ornate Close Button */}
              <button
                onClick={onClose}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF5EE] border border-[#E2D1BC] text-[#8C6239] hover:bg-[#B88E4B] hover:text-white hover:border-[#B88E4B] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                aria-label="Close search"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            {/* Sculpted Luxury Search Input Bar */}
            <div className="relative w-full">
              <div className="relative flex items-center bg-white border-2 border-[#B88E4B]/40 focus-within:border-[#B88E4B] focus-within:shadow-[0_8px_30px_rgba(184,142,75,0.2)] rounded-2xl h-14 sm:h-16 px-4 sm:px-5 transition-all shadow-xs">
                <Search size={22} className="text-[#B88E4B] shrink-0 stroke-[2.2]" />
                
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      saveRecentSearch(query);
                    }
                  }}
                  placeholder="Search solid sheesham beds, sofas, dining tables..."
                  className="w-full bg-transparent border-none text-[#221814] font-serif font-bold text-base sm:text-lg placeholder:text-stone-400 placeholder:font-sans placeholder:font-normal focus:outline-none px-3"
                />

                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1 rounded-full text-stone-400 hover:text-[#221814] transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Results / Suggestions Container */}
            <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
              
              {/* 1. Active Search Live Results from Database */}
              {query.trim() && (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="font-serif font-black text-xs uppercase tracking-widest text-[#8C6239] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{loading ? 'Searching Database...' : `${results.length} Database Masterpiece${results.length === 1 ? '' : 's'} Found`}</span>
                    </p>
                    {results.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                        LIVE DATABASE SYNC
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#E7DDD0] p-3 rounded-2xl flex items-center gap-3.5 shadow-2xs">
                          <div className="w-16 h-16 rounded-xl bg-[#EAE2D7]/70 shrink-0 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#FCFAF7]/80 before:to-transparent" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-3/4 rounded-md bg-[#EAE2D7]/70 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#FCFAF7]/80 before:to-transparent" />
                            <div className="h-3.5 w-1/2 rounded-md bg-[#EAE2D7]/70 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#FCFAF7]/80 before:to-transparent" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {results.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          onMouseEnter={() => {
                            setCachedProduct(product as unknown as CachedProduct);
                            router.prefetch(`/product/${product.id}`);
                          }}
                          onTouchStart={() => {
                            setCachedProduct(product as unknown as CachedProduct);
                            router.prefetch(`/product/${product.id}`);
                          }}
                          className="w-full bg-white border border-[#E7DDD0] hover:border-[#B88E4B] p-3 rounded-2xl flex items-center gap-3.5 transition-all duration-200 shadow-2xs hover:shadow-[0_8px_25px_rgba(184,142,75,0.15)] group cursor-pointer text-left"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF5EE] border border-[#E7DDD0]/80 shrink-0">
                            <Image
                              src={resolveImageUrl(product.image, product.category)}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="64px"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-black text-xs sm:text-sm text-[#221814] group-hover:text-[#B88E4B] transition-colors truncate">
                              {product.name}
                            </h4>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6239] mt-0.5 truncate">
                              {product.category}
                            </p>
                            <p className="font-serif font-black text-xs sm:text-sm text-[#B88E4B] mt-1">
                              Rs. {formatPricePk(product.price)}
                            </p>
                          </div>

                          <ArrowUpRight size={16} className="text-stone-300 group-hover:text-[#B88E4B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mr-1" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E7DDD0] rounded-2xl p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center mx-auto mb-2.5 text-[#B88E4B]">
                        <Search size={22} />
                      </div>
                      <h4 className="font-serif font-black text-sm text-[#221814]">No Database Records Found</h4>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                        We couldn&apos;t find anything in the live catalog matching &ldquo;{query}&rdquo;. Try searching for &ldquo;Sheesham Bed&rdquo; or &ldquo;Chesterfield Sofa&rdquo;.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Empty Query Initial State: Recent & Popular Searches */}
              {!query.trim() && (
                <div className="space-y-5">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5 px-1">
                        <Clock size={13} className="text-[#8C6239]" />
                        <p className="font-serif font-black text-xs uppercase tracking-wider text-[#8C6239]">
                          Recent Searches
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => handleRecentClick(search)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-[#E2D1BC] text-[#221814] text-xs font-serif font-bold hover:border-[#B88E4B] hover:text-[#B88E4B] hover:bg-[#FAF5EE] transition-all cursor-pointer shadow-2xs"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 px-1">
                      <TrendingUp size={13} className="text-[#B88E4B]" />
                      <p className="font-serif font-black text-xs uppercase tracking-wider text-[#8C6239]">
                        Popular Trending Searches
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleRecentClick(term)}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2D1BC] text-[#5C483E] text-xs sm:text-sm font-serif font-bold hover:border-[#B88E4B] hover:text-[#B88E4B] hover:bg-[#FAF5EE] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                        >
                          <Sparkles size={11} className="text-[#B88E4B]" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Curated Categories Direct Jump */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 px-1">
                      <LayoutGrid size={13} className="text-[#8C6239]" />
                      <p className="font-serif font-black text-xs uppercase tracking-wider text-[#8C6239]">
                        Explore Curated Collections
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CURATED_CATEGORIES.map((cat) => (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          onClick={onClose}
                          className="p-3 rounded-2xl bg-white border border-[#E7DDD0] hover:border-[#B88E4B] hover:bg-[#FAF5EE] transition-all shadow-2xs group"
                        >
                          <p className="font-serif font-black text-xs text-[#221814] group-hover:text-[#B88E4B] transition-colors leading-tight">
                            {cat.name}
                          </p>
                          <p className="text-[10px] font-bold text-[#8C6239] mt-0.5">
                            {cat.count}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Footer Hint */}
            <div className="pt-3 border-t border-[#E2D6C8]/80 flex items-center justify-between text-[11px] text-[#7A6354] font-medium px-1">
              <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E2D1BC] font-mono text-[10px]">ESC</kbd> to exit</span>
              <Link href="/shop" onClick={onClose} className="flex items-center gap-1 font-serif font-bold text-[#8C6239] hover:text-[#B88E4B] transition-colors ml-auto">
                <span>View Full Masterpiece Catalog</span>
                <ArrowRight size={12} />
              </Link>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
