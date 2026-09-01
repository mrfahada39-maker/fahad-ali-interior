'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import ProductCard from './ProductCard';
import ScrollReveal from './ScrollReveal';
import { apiFetchJson as fetchJson } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image: string;
  material?: string | null;
  isPremium?: boolean;
  avgRating?: number;
  reviewCount?: number;
}

interface ProductGridProps {
  onQuickView: (product: Product) => void;
  initialCategory?: string;
  initialProducts?: Product[];
  /** When true and products were server-loaded, skip duplicate fetch on mount. */
  skipInitialFetch?: boolean;
}

const categoryOptions = ['All', 'Beds', 'Sofas', 'Dining', 'Wardrobes'];
const MAX_PRICE = 2_000_000;

export default function ProductGrid({
  onQuickView,
  initialCategory = 'All',
  initialProducts = [],
  skipInitialFetch = false,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [materialOptions, setMaterialOptions] = useState<string[]>(['All']);
  const initialProductsRef = useRef(initialProducts);
  const skipFirstFetchRef = useRef(skipInitialFetch && initialProducts.length > 0);

  useEffect(() => {
    initialProductsRef.current = initialProducts;
  }, [initialProducts]);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      const materials = new Set<string>();
      initialProducts.forEach((p) => {
        if (p.material) materials.add(p.material);
      });
      setMaterialOptions(['All', ...Array.from(materials).sort()]);
    }
  }, [initialProducts]);

  const fetchProducts = useCallback(async () => {
    if (initialProductsRef.current.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]));
      if (priceRange[1] < MAX_PRICE) params.set('maxPrice', String(priceRange[1]));
      if (selectedMaterial !== 'All') params.set('material', selectedMaterial);
      params.set('limit', '50');

      const data = await fetchJson<{ products: Product[] }>(`/api/products?${params.toString()}`);

      const list =
        data?.products && data.products.length > 0
          ? data.products
          : initialProductsRef.current;

      if (!list.length) {
        setFetchError('Products load nahi ho rahe. Please check your internet connection.');
      } else {
        setFetchError(null);
      }

      let filtered = list.map((p) => ({
        ...p,
        price: Number(p.price),
        isPremium: Boolean(p.isPremium),
      }));

      // Client-side price filtering
      filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

      // Client-side material filtering
      if (selectedMaterial !== 'All') {
        filtered = filtered.filter((p: Product) => p.material === selectedMaterial);
      }

      setProducts(filtered);

      // Extract unique materials from products
      const materials = new Set<string>();
      list.forEach((p: Product) => {
        if (p.material) materials.add(p.material);
      });
      setMaterialOptions(['All', ...Array.from(materials).sort()]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, priceRange, selectedMaterial]);

  useEffect(() => {
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false;
      return;
    }
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedMaterial !== 'All',
    priceRange[0] > 0 || priceRange[1] < MAX_PRICE,
  ].filter(Boolean).length;

  return (
    <section id="shop" className="py-20 sm:py-28 bg-theme-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[1px] bg-theme-accent" />
            <span className="text-theme-accent text-xs tracking-[0.3em] uppercase">Our Collection</span>
            <div className="w-8 h-[1px] bg-theme-accent" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-dark" style={{ fontFamily: 'Georgia, serif' }}>
            Luxury <span className="text-theme-accent">Furniture</span>
          </h2>
          <p className="text-theme-muted mt-4 max-w-lg mx-auto text-sm sm:text-base">
            Each piece is meticulously crafted to bring elegance and comfort to your home
          </p>
        </ScrollReveal>

        {/* Search & Filter Bar */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={18} />
              <Input
                placeholder="Search furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-theme-card border-theme-border text-theme-dark placeholder:text-theme-muted rounded-none pl-10 h-11 focus:border-theme-accent/50"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-theme-border text-theme-muted hover:text-theme-accent hover:border-theme-accent/30 rounded-none h-11 gap-2 relative"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-theme-accent text-[#2C1E18] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </ScrollReveal>

        {/* Category Tabs */}
        <ScrollReveal delay={0.15}>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {categoryOptions.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className={`rounded-none text-xs tracking-wider uppercase whitespace-nowrap h-9 px-4 ${
                   selectedCategory === cat
                     ? 'bg-theme-accent text-[#2C1E18] hover:bg-[#b8954f]'
                     : 'border-theme-border text-theme-muted hover:text-theme-accent hover:border-theme-accent/30'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </ScrollReveal>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-theme-card border border-theme-border rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-theme-dark font-semibold text-sm tracking-wider uppercase">Filters</h3>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedMaterial('All');
                      setPriceRange([0, MAX_PRICE]);
                      setSearchQuery('');
                    }}
                    className="text-theme-accent text-xs tracking-wider uppercase hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-theme-muted text-xs tracking-wider uppercase mb-3 block">
                      Price Range (PKR)
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={MAX_PRICE}
                      step={10000}
                      className="my-4"
                    />
                    <div className="flex justify-between text-theme-muted text-xs">
                      <span>Rs. {(priceRange[0] ?? 0).toLocaleString()}</span>
                      <span>Rs. {(priceRange[1] ?? MAX_PRICE).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Material Filter */}
                  <div>
                    <label className="text-theme-muted text-xs tracking-wider uppercase mb-3 block">
                      Material
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {materialOptions.map((mat) => (
                        <Badge
                          key={mat}
                          onClick={() => setSelectedMaterial(mat)}
                          className={`cursor-pointer text-[10px] tracking-wider rounded-none transition-colors ${
                            selectedMaterial === mat
                              ? 'bg-theme-accent text-[#2C1E18]'
                              : 'bg-theme-surface text-theme-muted hover:text-theme-accent hover:bg-theme-accent/10'
                          }`}
                        >
                          {mat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-theme-muted text-xs">Active filters:</span>
            {selectedCategory !== 'All' && (
              <Badge className="bg-theme-accent/10 text-theme-accent border-theme-accent/20 text-[10px] rounded-none gap-1">
                {selectedCategory}
                <X size={10} className="cursor-pointer" onClick={() => setSelectedCategory('All')} />
              </Badge>
            )}
            {selectedMaterial !== 'All' && (
              <Badge className="bg-theme-accent/10 text-theme-accent border-theme-accent/20 text-[10px] rounded-none gap-1">
                {selectedMaterial}
                <X size={10} className="cursor-pointer" onClick={() => setSelectedMaterial('All')} />
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < MAX_PRICE) && (
              <Badge className="bg-theme-accent/10 text-theme-accent border-theme-accent/20 text-[10px] rounded-none gap-1">
                Rs. {(priceRange[0] ?? 0).toLocaleString()} - {(priceRange[1] ?? MAX_PRICE).toLocaleString()}
                <X size={10} className="cursor-pointer" onClick={() => setPriceRange([0, MAX_PRICE])} />
              </Badge>
            )}
          </div>
        )}

        {/* Product Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-theme-muted text-sm">
            Showing <span className="text-theme-dark">{products.length}</span> products
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-theme-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-theme-surface" />
                <div className="p-5">
                  <div className="h-4 bg-theme-surface rounded w-3/4 mb-2" />
                  <div className="h-3 bg-theme-surface rounded w-1/2 mb-3" />
                  <div className="h-5 bg-theme-surface rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="mx-auto text-theme-muted mb-4" size={48} />
            <p className="text-theme-muted text-lg">No products found</p>
            {fetchError ? (
              <p className="text-amber-400/90 text-sm mt-3 max-w-md mx-auto">{fetchError}</p>
            ) : (
              <p className="text-theme-muted text-sm mt-2">Try adjusting your filters</p>
            )}
            <Button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedMaterial('All');
                setPriceRange([0, MAX_PRICE]);
                setSearchQuery('');
              }}
              variant="outline"
              className="mt-4 border-theme-accent/30 text-theme-accent rounded-none"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
