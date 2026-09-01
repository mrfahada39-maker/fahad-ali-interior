'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, PackageSearch, SlidersHorizontal, RotateCcw, Sparkles, Compass,
  CheckCircle2, LayoutGrid, Grid, List, Eye, ShoppingBag, Heart, X, MessageSquare,
  ArrowRight, Tag, ShieldCheck, Truck, Clock, Star
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { apiFetchJson as fetchJson } from '@/lib/api-client';
import type { StorefrontProduct } from '@/lib/types/product';
import { resolveImageUrl } from '@/lib/images';
import { useCartStore } from '@/store/cartStore';
import { useClientCacheStore, CachedProduct } from '@/store/clientCacheStore';
import { CURATED_FALLBACK_PRODUCTS } from '@/lib/curated-products';
import { toast } from 'sonner';

const DEFAULT_CATEGORIES = ['All', 'Beds', 'Sofas', 'Dining', 'Wardrobes', 'Coffee', 'TV', 'Office', 'Storage', 'Outdoor', 'Kids', 'Accessories', 'Custom Furniture Solutions'];

const materials = ['Sheesham Wood', 'Engineered Wood', 'Solid Wood', 'Metal', 'Upholstered', 'Glass', 'Marble', 'Leather', 'Cane'];

const sortOptions = [
  { value: '', label: 'Featured Popularity' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const sizes = ['Single', 'Double', 'Queen', 'King'];

const colors = [
  { name: 'Natural Brown', hex: '#8B6914' },
  { name: 'Walnut', hex: '#3D2B1F' },
  { name: 'White', hex: '#F5F5F0' },
  { name: 'Grey', hex: '#8A8A8A' },
  { name: 'Black', hex: '#2C1E18' },
  { name: 'Teal', hex: '#2A6B7C' },
];

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface ShopPageProps {
  initialProducts?: StorefrontProduct[];
  initialCategory?: string;
}

export default function ShopPage({ initialProducts = [], initialCategory }: ShopPageProps) {
  const defaultPool = initialProducts && initialProducts.length > 0 ? initialProducts : CURATED_FALLBACK_PRODUCTS;
  const safeInitial = initialCategory === 'Custom Furniture Solutions' ? [] : defaultPool;
  const [products, setProducts] = useState<StorefrontProduct[]>(safeInitial);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid3' | 'grid4' | 'list'>('grid3');
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const skipFirstFetch = useRef(safeInitial.length > 0);

  // Custom Studio States
  const [selectedWood, setSelectedWood] = useState('sheesham');
  const [selectedFabric, setSelectedFabric] = useState('velvet');
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', roomType: 'Living Room', budget: '', message: '' });
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  const handleCustomInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) return;
    setInquirySubmitting(true);
    try {
      const res = await fetchJson<any>('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryForm.name,
          email: inquiryForm.email,
          phone: inquiryForm.phone || undefined,
          message: `[Custom Furniture Inquiry - Room: ${inquiryForm.roomType}, Budget: ${inquiryForm.budget || 'N/A'}] ${inquiryForm.message}`,
          roomType: inquiryForm.roomType,
          budget: inquiryForm.budget ? parseFloat(inquiryForm.budget) : undefined,
        }),
      });
      if (res) {
        setInquirySuccess(true);
        setInquiryForm({ name: '', email: '', phone: '', roomType: 'Living Room', budget: '', message: '' });
      }
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    } finally {
      setInquirySubmitting(false);
    }
  };

  const [customPreset, setCustomPreset] = useState('living');
  const [customDimVal, setCustomDimVal] = useState(6);
  const [addonSoftClose, setAddonSoftClose] = useState(false);
  const [addonLed, setAddonLed] = useState(false);
  const [addonTufted, setAddonTufted] = useState(false);

  const estimatedPrice = useMemo(() => {
    const config = [
      { id: 'living', basePrice: 160000, rate: 20000 },
      { id: 'bedroom', basePrice: 130000, rate: 25000 },
      { id: 'dining', basePrice: 110000, rate: 15000 },
      { id: 'office', basePrice: 75000, rate: 12000 },
      { id: 'sofa', basePrice: 150000, rate: 25000 },
      { id: 'coffee', basePrice: 55000, rate: 10000 },
      { id: 'tv', basePrice: 85000, rate: 12000 },
      { id: 'storage', basePrice: 120000, rate: 3000 },
      { id: 'outdoor', basePrice: 95000, rate: 15000 },
      { id: 'kids', basePrice: 80000, rate: 15000 },
      { id: 'accessories', basePrice: 25000, rate: 8000 },
    ].find(p => p.id === customPreset) || { basePrice: 50000, rate: 10000 };

    let base = config.basePrice;
    if (customPreset === 'storage') {
      base = customDimVal * config.rate;
    } else if (customPreset === 'bedroom' || customPreset === 'kids') {
      base = config.basePrice + (customDimVal * config.rate);
    } else {
      base = config.basePrice + (customDimVal * config.rate * 0.1);
    }

    let multiplier = 1.0;
    if (selectedWood === 'walnut') multiplier += 0.15;
    else if (selectedWood === 'ash') multiplier += 0.20;

    if (selectedFabric === 'velvet') multiplier += 0.08;
    else if (selectedFabric === 'leather') multiplier += 0.12;

    let addonCost = 0;
    if (addonSoftClose) addonCost += 15000;
    if (addonLed) addonCost += 10000;
    if (addonTufted) addonCost += 8000;

    return Math.round(base * multiplier + addonCost);
  }, [customPreset, customDimVal, selectedWood, selectedFabric, addonSoftClose, addonLed, addonTufted]);

  useEffect(() => {
    if (activeCategory !== 'Custom Furniture Solutions') return;
    const woodLabel = selectedWood === 'sheesham' ? 'Premium Sheesham' : selectedWood === 'walnut' ? 'Walnut Stain' : 'Natural Ash Wood';
    const fabricLabel = selectedFabric === 'velvet' ? 'Royal Velvet' : selectedFabric === 'linen' ? 'Premium Linen' : 'Classic Leatherette';
    const addons: string[] = [];
    if (addonSoftClose) addons.push('Soft-Close Drawers');
    if (addonLed) addons.push('LED Lighting');
    if (addonTufted) addons.push('Tufted Backing');

    const presetObj = [
      { id: 'living', name: 'Living Room', unit: 'ft' },
      { id: 'bedroom', name: 'Bedroom', unit: 'size', options: ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed'] },
      { id: 'dining', name: 'Dining Room', unit: 'seats' },
      { id: 'office', name: 'Office', unit: 'ft' },
      { id: 'sofa', name: 'Sofas', unit: 'ft' },
      { id: 'coffee', name: 'Coffee Tables', unit: 'ft' },
      { id: 'tv', name: 'TV Units', unit: 'ft' },
      { id: 'storage', name: 'Storage', unit: 'sq ft' },
      { id: 'outdoor', name: 'Outdoor', unit: 'persons' },
      { id: 'kids', name: 'Kids Furniture', unit: 'age', options: ['Toddler Size', 'Junior Size', 'Teenager Size'] },
      { id: 'accessories', name: 'Accessories', unit: 'pcs' },
    ].find(p => p.id === customPreset);

    const presetLabel = presetObj ? presetObj.name : 'Custom Piece';
    let sizeText = '';
    if (presetObj?.unit === 'size' && presetObj.options) {
      sizeText = `Size: ${presetObj.options[customDimVal] || 'King Bed'}`;
    } else if (presetObj?.unit === 'age' && presetObj.options) {
      sizeText = `Size: ${presetObj.options[customDimVal] || 'Toddler Size'}`;
    } else {
      sizeText = `Size/Length: ${customDimVal} ${presetObj?.unit || 'units'}`;
    }

    const msg = `I am interested in a bespoke ${presetLabel}.\n- Wood Finish: ${woodLabel}\n- Fabric Option: ${fabricLabel}\n- ${sizeText}\n- Add-ons: ${addons.length ? addons.join(', ') : 'None'}\n- System Estimate: Rs. ${estimatedPrice.toLocaleString()}`;

    setInquiryForm(prev => ({
      ...prev,
      message: msg,
      roomType: presetLabel,
      budget: String(estimatedPrice),
    }));
  }, [selectedWood, selectedFabric, customPreset, customDimVal, addonSoftClose, addonLed, addonTufted, estimatedPrice, activeCategory]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchJson<any[]>('/api/public/categories');
        if (data && data.length > 0) {
          const names = ['All', ...data.map((c: any) => c.name)];
          setCategoriesList(names);
        }
      } catch {
        // fallback
      }
    };
    loadCategories();
  }, []);

  const setCachedProducts = useClientCacheStore((s) => s.setProducts);

  // Initialize and seed products from initial props and cache
  useEffect(() => {
    if (safeInitial.length > 0) {
      setCachedProducts(safeInitial as unknown as CachedProduct[]);
      setProducts((prev) => {
        const mergedMap = new Map<string, StorefrontProduct>();
        [...prev, ...safeInitial].forEach((p) => mergedMap.set(p.id, p));
        return Array.from(mergedMap.values());
      });
    }
  }, [safeInitial, setCachedProducts]);

  const fetchProducts = useCallback(async () => {
    if (activeCategory === 'Custom Furniture Solutions') {
      return;
    }
    // Zero-Loading: Never destroy existing UI with skeleton if products already exist
    if (products.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
      if (sortBy) params.set('sort', sortBy);
      const raw = await fetchJson<unknown>(`/api/v1/products?${params.toString()}`);
      let arr: StorefrontProduct[] = [];
      if (Array.isArray(raw)) {
        arr = raw;
      } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (Array.isArray(obj.products)) arr = obj.products as StorefrontProduct[];
        else if (Array.isArray(obj.data)) arr = obj.data as StorefrontProduct[];
        else if (Array.isArray(obj.items)) arr = obj.items as StorefrontProduct[];
      }
      if (arr.length > 0) {
        setProducts((prev) => {
          const mergedMap = new Map<string, StorefrontProduct>();
          [...prev, ...arr].forEach((p) => mergedMap.set(p.id, p));
          return Array.from(mergedMap.values());
        });
        setCachedProducts(arr as unknown as CachedProduct[]);
      }
    } catch {
      // Keep existing products in memory without blanking out
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, sortBy, products.length, setCachedProducts]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSortBy('');
    setPriceRange([0, 500000]);
    setSelectedMaterial('');
    window.history.pushState({}, '', '/shop');
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    const url = cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`;
    window.history.pushState({}, '', url);
  };

  // Instant 0ms Client-Side Filtering (Category, Search, Price, Material, Sort)
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // 1. Category filter (Robust smart matching)
      if (activeCategory && activeCategory !== 'All' && activeCategory !== 'Custom Furniture Solutions') {
        const pCat = (p.category || '').toLowerCase().trim();
        const aCat = activeCategory.toLowerCase().trim();
        const norm = (s: string) => s.replace(/[^a-z0-9]/g, '');
        const pNorm = norm(pCat);
        const aNorm = norm(aCat);

        const isMatch =
          pCat === aCat ||
          pNorm === aNorm ||
          pCat.includes(aCat) ||
          aCat.includes(pCat) ||
          (aCat.includes('bed') && (pCat.includes('bed') || (p.name || '').toLowerCase().includes('bed'))) ||
          (aCat.includes('living') && (pCat.includes('living') || pCat.includes('sofa') || (p.name || '').toLowerCase().includes('sofa'))) ||
          (aCat.includes('dining') && (pCat.includes('dining') || (p.name || '').toLowerCase().includes('dining') || (p.name || '').toLowerCase().includes('table'))) ||
          (aCat.includes('chair') && (pCat.includes('chair') || (p.name || '').toLowerCase().includes('chair'))) ||
          (aCat.includes('table') && (pCat.includes('table') || (p.name || '').toLowerCase().includes('table'))) ||
          (aCat.includes('wardrobe') && (pCat.includes('wardrobe') || (p.name || '').toLowerCase().includes('wardrobe') || (p.name || '').toLowerCase().includes('closet')));

        if (!isMatch) return false;
      }

      // 2. Search query filter
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const woodMatch = (p.woodType || p.material || '').toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !descMatch && !woodMatch) return false;
      }

      // 3. Price range filter
      const priceOk = p.price >= priceRange[0] && p.price <= priceRange[1];
      if (!priceOk) return false;

      // 4. Material filter
      const matOk = !selectedMaterial || (p.material || '').toLowerCase().includes(selectedMaterial.toLowerCase());
      if (!matOk) return false;

      return true;
    });

    // 5. Client-Side Sorting for instant response
    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      return [...list].reverse();
    }
    return list;
  }, [products, activeCategory, debouncedSearchQuery, priceRange, selectedMaterial, sortBy]);

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#221814] pt-24 sm:pt-28">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Open Royal Editorial Header (Centered Luxury Styling) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-2"
        >
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#221814] tracking-tight leading-tight mb-2">
            Handcrafted <span className="font-serif italic font-normal text-[#C9A24D] mx-2 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">Masterpieces</span>
          </h1>
          <div className="flex items-center justify-center gap-3 my-2.5">
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
          </div>
          <p className="text-[#7A6048] text-xs sm:text-sm md:text-base font-serif italic max-w-xl mx-auto">
            100% Solid Seasoned Sheesham & Walnut wood — traditional joinery tailored for luxury living.
          </p>
        </motion.div>

        {/* Search + Sort + View Layout Controls Bar with Luminous Border */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 p-3 sm:p-3.5 rounded-[24px] shadow-[0_4px_20px_rgba(184,142,75,0.08)] relative overflow-hidden">
          {/* Ambient Corner Glow */}
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />

          {/* Search Input */}
          <div className="relative flex-1 z-10">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B88E4B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search furniture by title, wood finish, or design specification..."
              className="w-full pl-11 pr-8 py-2.5 text-xs sm:text-sm border border-amber-300/60 rounded-xl bg-white text-[#221814] font-medium focus:outline-none focus:border-[#B88E4B] transition-all placeholder:text-stone-400 shadow-2xs"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#221814] p-1 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative z-10">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2.5 text-xs font-black border border-amber-300/60 rounded-xl bg-white text-[#221814] focus:outline-none focus:border-[#B88E4B] cursor-pointer hover:bg-[#FAF5EE] transition-all shadow-2xs"
            >
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border rounded-xl transition-all cursor-pointer shadow-2xs ${
                showFilters ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white border-amber-300 shadow-sm' : 'bg-white text-[#221814] border-amber-300/60 hover:border-[#B88E4B] hover:bg-[#FAF5EE]'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {(selectedMaterial || priceRange[1] < 500000) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Layout Mode Switcher */}
            <div className="hidden sm:flex items-center bg-white border border-amber-300/60 rounded-xl p-1 gap-1 shadow-2xs">
              <button
                onClick={() => setLayoutMode('grid3')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'grid3' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="3-Column Grid"
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setLayoutMode('grid4')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'grid4' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="4-Column Grid"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'list' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="Wide List View"
              >
                <List size={15} />
              </button>
            </div>

            {/* Clear All Filters */}
            {(activeCategory !== 'All' || searchQuery || sortBy || selectedMaterial || priceRange[1] < 500000) && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black text-rose-600 border border-rose-500/30 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer">
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Luxury Category Pills with Luminous Borders */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {categoriesList.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] shadow-[0_3px_12px_rgba(184,142,75,0.3)] border border-amber-200/60' 
                    : 'text-[#5A4336] bg-white border border-amber-200/70 hover:border-amber-400 hover:bg-[#FAF5EE] shadow-2xs'
                }`}
              >
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-8 items-start">

          {/* Collapsible Sidebar Filters with Luminous Border */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 240 }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-shrink-0 hidden md:block overflow-hidden"
              >
                <div className="w-60 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-2xl p-5 space-y-6 shadow-[0_4px_20px_rgba(184,142,75,0.08)] relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3 relative z-10">
                    <h3 className="text-xs font-extrabold text-[#221814] uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-[#B88E4B]" /> Filter Criteria
                    </h3>
                    <button onClick={clearFilters} className="text-[10px] text-[#B88E4B] font-bold hover:underline cursor-pointer">
                      Reset
                    </button>
                  </div>

                  {/* Price Range Slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-theme-dark mb-2">
                      <span>Max Price</span>
                      <span className="text-theme-accent font-mono">Rs. {formatPrice(priceRange[1])}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={500000}
                      step={5000}
                      value={priceRange[1]}
                      onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-theme-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-theme-muted font-mono mt-1">
                      <span>Rs. 0</span>
                      <span>Rs. 500,000</span>
                    </div>
                  </div>

                  {/* Materials Radio Pills */}
                  <div>
                    <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider mb-2.5">Wood & Material</h4>
                    <div className="space-y-1.5">
                      {materials.map(m => (
                        <button
                          key={m}
                          onClick={() => setSelectedMaterial(m === selectedMaterial ? '' : m)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            selectedMaterial === m ? 'bg-theme-accent text-white font-bold' : 'text-theme-muted hover:text-theme-dark hover:bg-theme-bg'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider mb-2.5">Wood Finish Tone</h4>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <button
                          key={c.name}
                          title={c.name}
                          className="w-6 h-6 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-theme-accent transition-all shadow-xs"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Catalog Display Grid */}
          <div className="flex-1 min-w-0">
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-theme-surface border border-theme-border/60 p-4 rounded-2xl">
                    <div className="aspect-[4/3] bg-theme-border/30 rounded-xl mb-4" />
                    <div className="h-4 bg-theme-border/30 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-theme-border/30 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              activeCategory === 'Custom Furniture Solutions' ? (
                /* Bespoke Configurator Studio */
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl mx-auto my-4 space-y-6">
                  <div className="relative rounded-3xl overflow-hidden bg-[#1A1410] p-8 md:p-12 text-white shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2C1E18] via-[#1A1410] to-[#0D0B08]" />
                    <div className="relative z-10 max-w-2xl">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3.5 py-1 rounded-full mb-4">
                        <Sparkles size={11} /> Bespoke Furniture Studio
                      </span>
                      <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-3">
                        Custom Furniture <span className="text-[#C9A96E]">Crafted to Specs</span>
                      </h2>
                      <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                        Configure solid Sheesham wood finishes, dimensions, and royal velvet fabrics — receive instant budget estimations and consultation.
                      </p>
                    </div>
                  </div>

                  {/* Form & Configurator Box */}
                  <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 sm:p-8 shadow-sm">
                    <form onSubmit={handleCustomInquirySubmit} className="space-y-4">
                      <h3 className="text-xl font-bold text-theme-dark font-serif mb-4">Request a Bespoke Quotation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Full Name *</label>
                          <input required type="text" value={inquiryForm.name} onChange={e => setInquiryForm({ ...inquiryForm, name: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="Fahad Ali" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Email Address *</label>
                          <input required type="email" value={inquiryForm.email} onChange={e => setInquiryForm({ ...inquiryForm, email: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="client@fahadali.com" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-theme-muted uppercase block mb-1">WhatsApp Phone</label>
                        <input type="text" value={inquiryForm.phone} onChange={e => setInquiryForm({ ...inquiryForm, phone: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="+92 300 0000000" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-theme-muted uppercase block mb-1">Project Specifications</label>
                        <textarea required rows={4} value={inquiryForm.message} onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark font-mono" />
                      </div>
                      <button type="submit" disabled={inquirySubmitting} className="w-full py-3.5 bg-theme-accent hover:bg-theme-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md">
                        {inquirySubmitting ? 'Sending Request...' : '✦ Submit Custom Design Inquiry'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-20 bg-theme-surface border border-theme-border/80 rounded-2xl shadow-xs">
                  <PackageSearch size={44} className="mx-auto text-theme-muted/40 mb-3" />
                  <p className="text-theme-dark font-bold text-base font-serif mb-1">No products match your criteria</p>
                  <p className="text-theme-muted text-xs mb-6">Try searching another term or resetting your price filter.</p>
                  <button onClick={clearFilters} className="px-6 py-2.5 bg-theme-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-theme-dark transition-colors shadow-sm">
                    Reset Filters
                  </button>
                </div>
              )
            ) : (
              /* Dynamic Layout Switcher Rendering */
              <div
                className={
                  layoutMode === 'list'
                    ? 'space-y-4'
                    : layoutMode === 'grid4'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                }
              >
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                    layoutMode={layoutMode}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Quick View Modal Backdrop */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-[#FCFAF7] border-2 border-[#E7DDD0] rounded-[28px] p-6 sm:p-8 max-w-3xl w-full shadow-[0_25px_60px_rgba(40,25,18,0.22)] relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Luxury Close Button */}
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white border border-[#E2D1BC] text-[#221814] shadow-2xs hover:bg-[#FAF5EE] hover:scale-105 active:scale-95 flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                {/* Left Showcase Image Frame */}
                <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-[#FAF5EE] border-2 border-[#E7DDD0] shadow-sm">
                  <img
                    src={resolveImageUrl(quickViewProduct.image, quickViewProduct.category)}
                    alt={quickViewProduct.name}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = resolveImageUrl(null, quickViewProduct.category);
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE]/95 backdrop-blur-md border border-[#E2D1BC] px-3 py-0.5 rounded-full shadow-2xs">
                      {quickViewProduct.category || 'Solid Sheesham'}
                    </span>
                  </div>
                </div>

                {/* Right Details Column */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#B88E4B] mb-1">
                      <Star size={13} className="fill-[#B88E4B] text-[#B88E4B]" />
                      <span>5.0 • Handcrafted Masterwork</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#221814] font-serif tracking-tight leading-tight">
                      {quickViewProduct.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-[9.5px] font-bold uppercase text-stone-400 tracking-wider block">Price</span>
                      <p className="text-2xl sm:text-3xl font-black text-[#221814] font-sans tracking-tight">
                        Rs. {formatPrice(quickViewProduct.price)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#7A6048] leading-relaxed font-serif italic">
                    {quickViewProduct.description || '100% Solid Seasoned Sheesham masterpiece engineered with traditional mortise & tenon joinery for royal living.'}
                  </p>

                  {/* Trust Highlights */}
                  <div className="space-y-2 pt-3 border-t border-[#E7DDD0] text-xs">
                    <div className="flex items-center gap-2 text-[#8C6239] font-bold">
                      <ShieldCheck size={16} className="text-[#B88E4B] shrink-0" />
                      <span>10-Year Craftsmanship Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#7A6048] font-medium">
                      <Truck size={16} className="text-[#B88E4B] shrink-0" />
                      <span>Free White-Glove Nationwide Delivery</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        addItem({
                          id: quickViewProduct.id,
                          name: quickViewProduct.name,
                          price: quickViewProduct.price,
                          image: quickViewProduct.image,
                          category: quickViewProduct.category || '',
                        });
                        toast.success(`Added ${quickViewProduct.name} to Cart 🛒`);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 py-3.5 bg-[#221814] hover:bg-gradient-to-r hover:from-[#B88E4B] hover:to-[#996515] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingBag size={15} />
                      <span>Add to Cart</span>
                    </button>
                    <Link
                      href={`/product/${quickViewProduct.id}`}
                      onClick={() => setQuickViewProduct(null)}
                      className="px-4 py-3.5 bg-white border border-[#E7DDD0] hover:border-[#B88E4B] text-[#221814] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-2xs hover:bg-[#FAF5EE] text-center"
                    >
                      Full Details
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
