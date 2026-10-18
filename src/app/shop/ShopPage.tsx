/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any */
'use client';
import { logger } from '@/lib/logger';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, PackageSearch, SlidersHorizontal, RotateCcw, Sparkles, Compass,
  CheckCircle2, LayoutGrid, Grid, List, Eye, ShoppingBag, Heart, X, MessageSquare,
  ArrowRight, Tag, ShieldCheck, Truck, Clock, Star, ChevronDown, Check
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { apiFetchJson as fetchJson } from '@/lib/api-client';
import type { StorefrontProduct } from '@/lib/types';
import { resolveImageUrl } from '@/lib/images';
import { useCartStore, useClientCacheStore, type CachedProduct } from '@/store';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/pakistan-localization';

const DEFAULT_CATEGORIES = [
  'All',
  'Living Room',
  'Bedroom',
  'Dining Room',
  'Coffee Chairs',
  'Center Tables',
  'Luxury Showcase',
  'Luxury Wardrobes',
  'Custom Furniture Solutions',
];

const materials = ['Sheesham Wood', 'Kikar Wood', 'Solid Wood', 'Velvet', 'Upholstered', 'Walnut Finish', 'Leather'];

const sortOptions = [
  { value: '', label: 'Featured Popularity' },
  { value: 'bestsellers', label: 'Best Sellers' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

const colors = [
  { name: 'Natural Brown', hex: '#8B6914', keywords: ['brown', 'natural', 'honey', 'caramel', 'camel', 'tan', 'sheesham'] },
  { name: 'Walnut', hex: '#3D2B1F', keywords: ['walnut', 'dark', 'espresso', 'mahogany', 'chocolate', 'wood'] },
  { name: 'Ivory & Cream', hex: '#F5F5F0', keywords: ['white', 'cream', 'ivory', 'beige', 'off-white', 'sand'] },
  { name: 'Slate Grey', hex: '#8A8A8A', keywords: ['grey', 'gray', 'charcoal', 'silver', 'ash', 'slate'] },
  { name: 'Obsidian Black', hex: '#2C1E18', keywords: ['black', 'ebony', 'obsidian', 'onyx', 'Chesterfield'] },
  { name: 'Royal Teal & Blue', hex: '#2A6B7C', keywords: ['teal', 'blue', 'emerald', 'green', 'navy', 'velvet'] },
];

function normalizeCategoryParam(raw?: string | null): string {
  if (!raw) return 'All';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'custom' || lower.includes('custom furniture')) return 'Custom Furniture Solutions';
  if (lower === 'living') return 'Living Room';
  if (lower === 'dining') return 'Dining Room';
  if (lower === 'center tables') return 'Center Tables';
  return trimmed;
}

function isCategoryMatch(p: StorefrontProduct, cat: string): boolean {
  const pCat = (p.category || '').toLowerCase().trim();
  const aCat = cat.toLowerCase().trim();
  const norm = (s: string) => s.replace(/[^a-z0-9]/g, '');
  const pNorm = norm(pCat);
  const aNorm = norm(aCat);

  return (
    pCat === aCat ||
    pNorm === aNorm ||
    (Boolean(pCat) && Boolean(aCat) && (pCat.includes(aCat) || aCat.includes(pCat))) ||
    (aCat.includes('bed') && pCat.includes('bed')) ||
    (aCat.includes('dining') && pCat.includes('dining')) ||
    (aCat.includes('chair') && (pCat.includes('chair') || (p.name || '').toLowerCase().includes('lounge') || (p.name || '').toLowerCase().includes('chair'))) ||
    (aCat.includes('table') && pCat.includes('table')) ||
    (aCat.includes('wardrobe') && (pCat.includes('wardrobe') || pCat.includes('closet'))) ||
    ((aCat.includes('decor') || aCat.includes('lighting') || aCat.includes('showcase')) && (pCat.includes('decor') || pCat.includes('lighting') || pCat.includes('showcase'))) ||
    (!pCat && (p.name || '').toLowerCase().includes(aCat))
  );
}

interface ShopPageProps {
  initialProducts?: StorefrontProduct[];
  initialCategory?: string;
  initialCategories?: string[];
  embedded?: boolean;
  titlePrefix?: string;
  titleHighlight?: string;
  subtitle?: string;
}

export default function ShopPage({
  initialProducts = [],
  initialCategory,
  initialCategories,
  embedded = false,
  titlePrefix,
  titleHighlight,
  subtitle,
}: ShopPageProps) {
  const displayTitlePrefix = titlePrefix ?? (embedded ? 'Signature' : 'Handcrafted');
  const displayTitleHighlight = titleHighlight ?? (embedded ? 'Categories' : 'Masterpieces');
  const displaySubtitle = subtitle ?? (embedded 
    ? '100% Solid Seasoned Sheesham masterworks handcrafted for luxury living.' 
    : '100% Solid Seasoned Sheesham & Hardwood — traditional joinery tailored for luxury living.');
  const defaultPool = initialProducts;
  const searchParamsHook = useSearchParams();
  const urlCategory = searchParamsHook?.get('category') || undefined;
  const urlSort = searchParamsHook?.get('sort') || '';
  const resolvedInitialCategory = normalizeCategoryParam(initialCategory || urlCategory || 'All');

  const safeInitial = resolvedInitialCategory === 'Custom Furniture Solutions' ? [] : defaultPool;
  const [products, setProducts] = useState<StorefrontProduct[]>(safeInitial);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(resolvedInitialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(urlSort);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const isManualScrolling = useRef(false);
  const manualScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pillsContainerRef = useRef<HTMLDivElement | null>(null);
  const catalogTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(normalizeCategoryParam(urlCategory));
    }
    if (urlSort) {
      setSortBy(urlSort);
    }
  }, [urlCategory, urlSort]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [layoutMode, setLayoutMode] = useState<'grid3' | 'grid4' | 'list'>('grid3');
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [displayLimit, setDisplayLimit] = useState(18);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [userAdjustedPrice, setUserAdjustedPrice] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(
    initialCategories && initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES
  );

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
        toast.success('Your bespoke inquiry has been received! Our Lahore atelier will contact you shortly.');
        setInquiryForm({ name: '', email: '', phone: '', roomType: 'Living Room', budget: '', message: '' });
      }
    } catch (err) {
      toast.error('Unable to submit inquiry right now. Please message us on WhatsApp.');
      if (process.env.NODE_ENV === 'development') {
        logger.error('Failed to submit inquiry:', err);
      }
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
    if (initialCategories && initialCategories.length > 0) return;
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
  }, [initialCategories]);

  const setCachedProducts = useClientCacheStore((s) => s.setProducts);

  useEffect(() => {
    if (defaultPool.length > 0) {
      setProducts(defaultPool);
      setCachedProducts(defaultPool as unknown as CachedProduct[]);
    }
  }, [defaultPool, setCachedProducts]);

  const fetchProducts = useCallback(async () => {
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
        setProducts(arr);
        setCachedProducts(arr as unknown as CachedProduct[]);
      }
    } catch {
      // Keep existing products in memory without blanking out
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, sortBy, products.length, setCachedProducts]);

  const maxCatalogPrice = useMemo(() => {
    const highest = products.reduce((max, p) => Math.max(max, Number(p.price) || 0), 0);
    return Math.max(5000000, Math.ceil((highest || 500000) / 100000) * 100000);
  }, [products]);

  useEffect(() => {
    fetchProducts();

    const handleSync = () => {
      fetchProducts();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('fahad_catalog_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('fahad_catalog_updated', handleSync);
    };
  }, [fetchProducts]);

  const clearFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSortBy('');
    setUserAdjustedPrice(false);
    setPriceRange([0, 10000000]);
    setSelectedMaterial('');
    setSelectedColor('');
    window.history.pushState({}, '', '/shop');
  };

  // Grouped products by Category for the Scrollspy multi-section view (when not searching/filtering)
  const groupedCategoryProducts = useMemo(() => {
    if (debouncedSearchQuery.trim() || selectedMaterial || selectedColor || userAdjustedPrice || sortBy) {
      return null;
    }

    const validCategories = categoriesList.filter(
      (c) => c !== 'All' && c !== 'Custom Furniture Solutions'
    );

    const groups: { category: string; slug: string; products: StorefrontProduct[] }[] = [];
    const assignedIds = new Set<string>();

    for (const cat of validCategories) {
      const matching = products.filter(
        (p) => !assignedIds.has(p.id) && isCategoryMatch(p, cat)
      );
      if (matching.length > 0) {
        matching.forEach((p) => assignedIds.add(p.id));
        groups.push({
          category: cat,
          slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          products: matching,
        });
      }
    }

    const remaining = products.filter((p) => !assignedIds.has(p.id));
    if (remaining.length > 0) {
      groups.push({
        category: 'Atelier Signature Pieces',
        slug: 'atelier-signature-pieces',
        products: remaining,
      });
    }

    return groups.length > 0 ? groups : null;
  }, [products, categoriesList, debouncedSearchQuery, selectedMaterial, selectedColor, userAdjustedPrice, sortBy]);

  const handleCategoryClick = (cat: string) => {
    const norm = normalizeCategoryParam(cat);
    
    if (norm === 'All') {
      setActiveCategory('All');
      isManualScrolling.current = true;
      if (manualScrollTimer.current) clearTimeout(manualScrollTimer.current);
      if (catalogTopRef.current) {
        const yOffset = -90;
        const y = catalogTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      manualScrollTimer.current = setTimeout(() => {
        isManualScrolling.current = false;
      }, 800);
      return;
    }

    if (norm === 'Custom Furniture Solutions') {
      setActiveCategory(norm);
      return;
    }

    const slug = norm.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetEl = document.getElementById(`cat-section-${slug}`);

    if (targetEl && groupedCategoryProducts) {
      isManualScrolling.current = true;
      if (manualScrollTimer.current) clearTimeout(manualScrollTimer.current);
      setActiveCategory(norm);

      const yOffset = -140; // sticky header + sticky pills offset
      const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });

      manualScrollTimer.current = setTimeout(() => {
        isManualScrolling.current = false;
      }, 800);
    } else {
      setActiveCategory(norm);
    }
  };

  // Auto-scroll the active pill horizontally into view in the pills bar
  useEffect(() => {
    if (activeCategory && pillRefs.current[activeCategory]) {
      pillRefs.current[activeCategory]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeCategory]);

  // Scrollspy observer: Detect visible category section and automatically update the active pill
  useEffect(() => {
    if (!groupedCategoryProducts || groupedCategoryProducts.length === 0) return;

    const sections = document.querySelectorAll<HTMLElement>('.category-scroll-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScrolling.current) return;

        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => {
            const topA = Math.abs(a.boundingClientRect.top - 130);
            const topB = Math.abs(b.boundingClientRect.top - 130);
            return topA - topB;
          });
          const best = visibleEntries[0];
          const cat = best.target.getAttribute('data-category');
          if (cat && cat !== activeCategory) {
            setActiveCategory(cat);
          }
        }
      },
      {
        rootMargin: '-100px 0px -50% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [groupedCategoryProducts, activeCategory]);

  // Reset to "All" when user scrolls back up near the top of the section
  useEffect(() => {
    if (!groupedCategoryProducts || groupedCategoryProducts.length === 0) return;
    const topEl = catalogTopRef.current;
    if (!topEl || typeof IntersectionObserver === 'undefined') return;

    const topObserver = new IntersectionObserver(
      ([entry]) => {
        if (isManualScrolling.current) return;
        if (entry.isIntersecting && entry.boundingClientRect.top > 0) {
          setActiveCategory('All');
        }
      },
      { threshold: 0.15 }
    );

    topObserver.observe(topEl);
    return () => topObserver.disconnect();
  }, [groupedCategoryProducts]);

  // Client-Side Filtering (Category, Search, Price, Material, Wood Finish Tone, Sort)
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // 1. Category filter
      if (activeCategory && activeCategory !== 'All' && activeCategory !== 'Custom Furniture Solutions') {
        if (!isCategoryMatch(p, activeCategory)) return false;
      }

      // 2. Search query filter
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const woodMatch = ((p as any).woodType || p.material || '').toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !descMatch && !woodMatch) return false;
      }

      // 3. Price range filter
      const priceOk = !userAdjustedPrice || (p.price >= priceRange[0] && p.price <= priceRange[1]);
      if (!priceOk) return false;

      // 4. Material filter
      if (selectedMaterial) {
        const mQuery = selectedMaterial.toLowerCase().replace(' wood', '').replace(' finish', '');
        const fullText = `${p.material || ''} ${p.description || ''} ${typeof p.specs === 'string' ? p.specs : JSON.stringify(p.specs || '')}`.toLowerCase();
        if (!fullText.includes(mQuery)) return false;
      }

      // 5. Wood Finish Tone (Color) filter
      if (selectedColor) {
        const colorObj = colors.find((c) => c.name === selectedColor);
        if (colorObj) {
          const fullText = `${p.name || ''} ${p.material || ''} ${p.description || ''} ${typeof p.specs === 'string' ? p.specs : JSON.stringify(p.specs || '')}`.toLowerCase();
          const matchesColor = colorObj.keywords.some((kw) => fullText.includes(kw.toLowerCase()));
          if (!matchesColor) return false;
        }
      }

      return true;
    });

    // 6. Client-Side Sorting
    if (sortBy === 'price_asc' || sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc' || sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      return [...list].sort((a, b) => (Number(b.avgRating ?? 5) - Number(a.avgRating ?? 5)) || (b.price - a.price));
    } else if (sortBy === 'bestsellers') {
      return [...list].sort((a, b) => (Number(b.isPremium ? 1 : 0) - Number(a.isPremium ? 1 : 0)) || (b.price - a.price));
    } else if (sortBy === 'newest') {
      return [...list].reverse();
    }
    return list;
  }, [products, activeCategory, debouncedSearchQuery, priceRange, userAdjustedPrice, selectedMaterial, selectedColor, sortBy]);

  useEffect(() => {
    setDisplayLimit(18);
  }, [activeCategory, debouncedSearchQuery, sortBy, priceRange, selectedMaterial, selectedColor]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const isBespokeCategoryOnly =
    filteredProducts.length === 0 &&
    activeCategory !== 'All' &&
    activeCategory !== 'Custom Furniture Solutions' &&
    !debouncedSearchQuery.trim() &&
    !selectedMaterial &&
    !selectedColor &&
    !userAdjustedPrice;

  const HeadingTag = embedded ? 'h2' : 'h1';

  return (
    <div ref={catalogTopRef} className={`${embedded ? 'pt-10 sm:pt-14' : 'min-h-screen pt-24 sm:pt-28'} bg-[#FCFAF7] text-[#221814]`}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Open Royal Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-2"
        >
          {embedded && (
            <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E2D1BC] shadow-xs mb-3.5">
              <span className="text-[#B88E4B] text-sm font-bold">✦</span>
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-[0.25em] text-[#7A6354]">
                HAUTE COUTURE COLLECTIONS
              </span>
            </div>
          )}
          <HeadingTag className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#221814] tracking-tight leading-tight mb-2">
            {displayTitlePrefix} <span className="font-serif italic font-normal text-[#C9A24D] mx-2 text-[1.08em]">&</span> <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">{displayTitleHighlight}</span>
          </HeadingTag>
          <div className="flex items-center justify-center gap-3 my-2.5">
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#B88E4B] shadow-[0_0_8px_#B88E4B]" />
            <div className="h-[1.5px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-[#B88E4B] to-transparent" />
          </div>
          <p className="text-[#7A6048] text-xs sm:text-sm md:text-base font-serif italic max-w-xl mx-auto">
            {displaySubtitle}
          </p>
        </motion.div>

        {/* Search + Sort + View Layout Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 p-3 sm:p-3.5 rounded-[24px] shadow-[0_4px_20px_rgba(184,142,75,0.08)] relative z-20">
          <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl bg-amber-500/10 opacity-70" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1 z-10">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B88E4B]" />
            <label htmlFor="shop-search-input" className="sr-only">Search furniture catalog</label>
            <input
              type="text"
              id="shop-search-input"
              name="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search furniture by title, wood finish, or design specification..."
              className="w-full pl-11 pr-8 py-2.5 text-xs sm:text-sm border border-amber-300/60 rounded-xl bg-white text-[#221814] font-medium focus:outline-none focus:border-[#B88E4B] transition-all placeholder:text-stone-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#221814] p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative z-30">
            {/* Sort Dropdown */}
            <div className="relative z-50" ref={sortDropdownRef}>
              <button
                type="button"
                id="shop-sort-button"
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  isSortOpen
                    ? 'border-[#B88E4B] bg-[#FAF5EE] text-[#221814] ring-2 ring-amber-300/40'
                    : 'border-amber-300/60 bg-white text-[#221814] hover:border-[#B88E4B] hover:bg-[#FAF5EE]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#B88E4B]" />
                <span>{sortOptions.find(o => o.value === sortBy)?.label || 'Featured Popularity'}</span>
                <ChevronDown
                  size={14}
                  className={`text-[#B88E4B] transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white border-[1.5px] border-amber-300/80 rounded-2xl p-1.5 shadow-[0_16px_40px_rgba(34,24,20,0.18)] z-[100] space-y-1"
                    role="listbox"
                  >
                    <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#8C6239] border-b border-amber-200/60 flex items-center justify-between">
                      <span>Sort Collection</span>
                      <Sparkles size={10} className="text-[#B88E4B]" />
                    </div>
                    {sortOptions.map((o) => {
                      const isSelected = sortBy === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSortBy(o.value);
                            setIsSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#FAF5EE] to-[#F5ECE0] text-[#B88E4B] font-black border border-amber-300/60 shadow-2xs'
                              : 'text-[#5A4336] hover:text-[#221814] hover:bg-[#FAF5EE] font-bold'
                          }`}
                        >
                          <span>{o.label}</span>
                          {isSelected && <Check size={13} className="text-[#B88E4B]" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border rounded-xl transition-all cursor-pointer shadow-2xs ${
                showFilters ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white border-amber-300 shadow-sm' : 'bg-white text-[#221814] border-amber-300/60 hover:border-[#B88E4B] hover:bg-[#FAF5EE]'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {(selectedMaterial || selectedColor || userAdjustedPrice) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Layout Mode Switcher */}
            <div className="hidden sm:flex items-center bg-white border border-amber-300/60 rounded-xl p-1 gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setLayoutMode('grid3')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'grid3' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="3-Column Grid"
                aria-label="3-Column Grid View"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid4')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'grid4' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="4-Column Grid"
                aria-label="4-Column Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${layoutMode === 'list' ? 'bg-[#FAF5EE] text-[#B88E4B] shadow-2xs font-bold' : 'text-stone-400 hover:text-[#221814]'}`}
                title="Wide List View"
                aria-label="List View"
              >
                <List size={15} />
              </button>
            </div>

            {/* Clear All Filters */}
            {(activeCategory !== 'All' || searchQuery || sortBy || selectedMaterial || selectedColor || userAdjustedPrice) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black text-rose-600 border border-rose-500/30 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Luxury Category Pills Bar */}
        <div className="sticky top-[58px] sm:top-[70px] z-30 bg-[#FCFAF7]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-y border-amber-200/50 shadow-[0_4px_16px_rgba(184,142,75,0.06)] mb-8 transition-all">
          <div ref={pillsContainerRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
            {categoriesList.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  ref={el => { pillRefs.current[cat] = el; }}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
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

        <div className="flex gap-8 items-start">

          {/* Collapsible Sidebar Filters */}
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
                    <button type="button" onClick={clearFilters} className="text-[10px] text-[#B88E4B] font-bold hover:underline cursor-pointer">
                      Reset
                    </button>
                  </div>

                  {/* Price Range Slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold text-theme-dark mb-2">
                      <label htmlFor="price-range-slider">Max Price</label>
                      <span className="text-theme-accent font-mono">
                        Rs. {formatPrice(userAdjustedPrice ? priceRange[1] : maxCatalogPrice)}
                      </span>
                    </div>
                    <input
                      type="range"
                      id="price-range-slider"
                      name="maxPrice"
                      min={0}
                      max={maxCatalogPrice}
                      step={10000}
                      value={userAdjustedPrice ? priceRange[1] : maxCatalogPrice}
                      onChange={e => {
                        setUserAdjustedPrice(true);
                        setPriceRange([priceRange[0], parseInt(e.target.value, 10)]);
                      }}
                      className="w-full accent-theme-accent cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-theme-muted font-mono mt-1">
                      <span>Rs. 0</span>
                      <span>Rs. {formatPrice(maxCatalogPrice)}</span>
                    </div>
                  </div>

                  {/* Materials Radio Pills */}
                  <div>
                    <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider mb-2.5">Wood & Material</h4>
                    <div className="space-y-1.5">
                      {materials.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMaterial(m === selectedMaterial ? '' : m)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            selectedMaterial === m ? 'bg-[#B88E4B] text-white font-bold' : 'text-theme-muted hover:text-theme-dark hover:bg-theme-bg'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider">Wood Finish Tone</h4>
                      {selectedColor && (
                        <span className="text-[9.5px] font-bold text-[#B88E4B]">{selectedColor}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => {
                        const isColorActive = selectedColor === c.name;
                        return (
                          <button
                            key={c.name}
                            type="button"
                            title={c.name}
                            aria-label={`Filter by ${c.name} finish`}
                            onClick={() => setSelectedColor(isColorActive ? '' : c.name)}
                            className={`w-7 h-7 rounded-full ring-2 ring-offset-2 transition-all shadow-xs cursor-pointer ${
                              isColorActive ? 'ring-[#B88E4B] scale-110' : 'ring-transparent hover:ring-[#B88E4B]/60'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Filter Drawer */}
          <AnimatePresence>
            {showFilters && (
              <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filter Criteria">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-[#FCFAF7] border-l border-amber-300/80 p-5 overflow-y-auto z-10 shadow-2xl flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                      <h3 className="text-sm font-extrabold text-[#221814] uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal size={15} className="text-[#B88E4B]" /> Filter Criteria
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setShowFilters(false)} 
                        className="w-8 h-8 rounded-full bg-[#FAF5EE] border border-amber-300/60 flex items-center justify-center text-[#221814] hover:bg-amber-100 transition-colors"
                        aria-label="Close Filters"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Price Range Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-theme-dark mb-2">
                        <label htmlFor="mobile-price-range-slider">Max Price</label>
                        <span className="text-theme-accent font-mono">
                          Rs. {formatPrice(userAdjustedPrice ? priceRange[1] : maxCatalogPrice)}
                        </span>
                      </div>
                      <input
                        type="range"
                        id="mobile-price-range-slider"
                        name="mobileMaxPrice"
                        min={0}
                        max={maxCatalogPrice}
                        step={10000}
                        value={userAdjustedPrice ? priceRange[1] : maxCatalogPrice}
                        onChange={e => {
                          setUserAdjustedPrice(true);
                          setPriceRange([priceRange[0], parseInt(e.target.value, 10)]);
                        }}
                        className="w-full accent-theme-accent cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-theme-muted font-mono mt-1">
                        <span>Rs. 0</span>
                        <span>Rs. {formatPrice(maxCatalogPrice)}</span>
                      </div>
                    </div>

                    {/* Materials Radio Pills */}
                    <div>
                      <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider mb-2.5">Wood & Material</h4>
                      <div className="space-y-1.5">
                        {materials.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedMaterial(m === selectedMaterial ? '' : m)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                              selectedMaterial === m ? 'bg-[#B88E4B] text-white font-bold' : 'text-[#7A6048] hover:text-[#221814] hover:bg-[#FAF5EE]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-[11px] font-bold text-theme-dark uppercase tracking-wider">Wood Finish Tone</h4>
                        {selectedColor && (
                          <span className="text-[10px] font-bold text-[#B88E4B]">{selectedColor}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {colors.map(c => {
                          const isColorActive = selectedColor === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              title={c.name}
                              aria-label={`Filter by ${c.name} finish`}
                              onClick={() => setSelectedColor(isColorActive ? '' : c.name)}
                              className={`w-7 h-7 rounded-full ring-2 ring-offset-2 transition-all shadow-xs ${
                                isColorActive ? 'ring-[#B88E4B] scale-110' : 'ring-transparent hover:ring-[#B88E4B]'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-amber-200/60 flex gap-3">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex-1 py-3 bg-[#FAF5EE] text-[#7A6048] text-xs font-bold rounded-xl border border-amber-300/60"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-3 bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-xs font-bold rounded-xl shadow-md"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              </div>
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
                    {inquirySuccess && (
                      <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span>Your bespoke quotation request has been received! Our Lahore master artisans will reach out shortly.</span>
                        </div>
                        <button type="button" onClick={() => setInquirySuccess(false)} className="text-xs font-bold underline">Dismiss</button>
                      </div>
                    )}
                    <form onSubmit={handleCustomInquirySubmit} className="space-y-4">
                      <h3 className="text-xl font-bold text-theme-dark font-serif mb-4">Request a Bespoke Quotation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="inquiry-full-name" className="text-xs font-bold text-theme-muted uppercase block mb-1">Full Name *</label>
                          <input id="inquiry-full-name" name="fullName" required type="text" value={inquiryForm.name} onChange={e => setInquiryForm({ ...inquiryForm, name: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="Muhammad Fahad Ali" />
                        </div>
                        <div>
                          <label htmlFor="inquiry-email" className="text-xs font-bold text-theme-muted uppercase block mb-1">Email Address *</label>
                          <input id="inquiry-email" name="email" required type="email" value={inquiryForm.email} onChange={e => setInquiryForm({ ...inquiryForm, email: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="client@fahadali.com" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="inquiry-phone" className="text-xs font-bold text-theme-muted uppercase block mb-1">WhatsApp Phone</label>
                        <input id="inquiry-phone" name="phone" type="text" value={inquiryForm.phone} onChange={e => setInquiryForm({ ...inquiryForm, phone: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark" placeholder="+92 320 7006110" />
                      </div>
                      <div>
                        <label htmlFor="inquiry-message" className="text-xs font-bold text-theme-muted uppercase block mb-1">Project Specifications</label>
                        <textarea id="inquiry-message" name="message" required rows={4} value={inquiryForm.message} onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} className="w-full p-3 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-dark font-mono" />
                      </div>
                      <button type="submit" disabled={inquirySubmitting} className="w-full py-3.5 bg-theme-accent hover:bg-theme-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer">
                        {inquirySubmitting ? 'Sending Request...' : '✦ Submit Custom Design Inquiry'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              ) : isBespokeCategoryOnly && products.length > 0 ? (
                /* Smart Bespoke Category Banner + Featured Atelier Collection so no category link is ever a dead end */
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[26px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(184,142,75,0.10)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-xl">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FAF5EE] text-[#8C6239] border border-amber-300/60">
                        <Sparkles size={11} className="text-[#B88E4B]" /> Bespoke {activeCategory} Atelier
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl font-black text-[#221814]">
                        Custom {activeCategory} — Handcrafted to Your Exact Room Dimensions
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7A6048] leading-relaxed">
                        Our {activeCategory} commissions are crafted to order in kiln-seasoned solid Sheesham wood within 10–15 working days. Explore our ready-to-order flagship collection below or request custom sizing.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCategoryClick('Custom Furniture Solutions')}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:brightness-110 transition-all cursor-pointer"
                      >
                        ✦ Configure Custom {activeCategory}
                      </button>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-3 rounded-xl bg-white border border-amber-300/70 text-[#221814] text-xs font-bold hover:bg-[#FAF5EE] transition-all cursor-pointer"
                      >
                        View All Ready Pieces
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.slice(0, 9).map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={idx}
                        layoutMode={layoutMode}
                        onQuickView={(p) => setQuickViewProduct(p)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-theme-surface border border-theme-border/80 rounded-2xl shadow-xs">
                  <PackageSearch size={44} className="mx-auto text-theme-muted/40 mb-3" />
                  <p className="text-theme-dark font-bold text-base font-serif mb-1">No products match your criteria</p>
                  <p className="text-theme-muted text-xs mb-6">Try searching another term or resetting your filters.</p>
                  <button type="button" onClick={clearFilters} className="px-6 py-2.5 bg-theme-accent text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-theme-dark transition-colors shadow-sm cursor-pointer">
                    Reset Filters
                  </button>
                </div>
              )
            ) : (
              <>
                {groupedCategoryProducts ? (
                  /* ── SCROLLSPY CATEGORY-BY-CATEGORY SECTIONS ── */
                  <div className="space-y-14 sm:space-y-18">
                    {groupedCategoryProducts.map((group) => (
                      <section
                        key={group.slug}
                        id={`cat-section-${group.slug}`}
                        data-category={group.category}
                        className="category-scroll-section scroll-mt-28 sm:scroll-mt-36"
                      >
                        {/* Luxury Category Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 border-b border-amber-200/60 pb-3 gap-2">
                          <div>
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#B88E4B] mb-1">
                              <span>✦</span>
                              <span>ROYAL BESPOKE COLLECTION</span>
                            </div>
                            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#221814] tracking-tight">
                              {group.category}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-serif italic text-[#7A6048]">
                              {group.products.length} {group.products.length === 1 ? 'Masterpiece' : 'Masterpieces'}
                            </span>
                          </div>
                        </div>

                        {/* Product Grid */}
                        <div
                          className={
                            layoutMode === 'list'
                              ? 'space-y-4'
                              : layoutMode === 'grid4'
                              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
                              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                          }
                        >
                          {group.products.map((product, idx) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              index={idx}
                              layoutMode={layoutMode}
                              onQuickView={(p) => setQuickViewProduct(p)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  /* ── FLAT GRID (Active Filters / Search / Sort) ── */
                  <>
                    <div
                      className={
                        layoutMode === 'list'
                          ? 'space-y-4'
                          : layoutMode === 'grid4'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
                          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      }
                    >
                      {visibleProducts.map((product, idx) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={idx}
                          layoutMode={layoutMode}
                          onQuickView={(p) => setQuickViewProduct(p)}
                        />
                      ))}
                    </div>

                    {filteredProducts.length > displayLimit && (
                      <div className="mt-12 text-center">
                        <p className="text-xs text-[#7A6048] mb-3 font-serif">
                          Showing {visibleProducts.length} of {filteredProducts.length} masterpieces
                        </p>
                        <button
                          type="button"
                          onClick={() => setDisplayLimit((prev) => prev + 18)}
                          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#B88E4B] via-[#A68254] to-[#8C6944] text-white font-serif font-bold text-xs uppercase tracking-widest shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                        >
                          <span>Load More Masterpieces</span>
                          <ChevronDown size={15} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

        </div>

      </div>

      {/* Quick View Modal Backdrop */}
      <AnimatePresence>
        {quickViewProduct && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${quickViewProduct.name}`}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-[#FCFAF7] border-2 border-[#E7DDD0] rounded-[28px] p-6 sm:p-8 max-w-3xl w-full shadow-[0_25px_60px_rgba(40,25,18,0.22)] relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white border border-[#E2D1BC] text-[#221814] shadow-2xs hover:bg-[#FAF5EE] hover:scale-105 active:scale-95 flex items-center justify-center transition-all z-20 cursor-pointer"
                aria-label="Close quick view"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-[#FAF5EE] border-2 border-[#E7DDD0] shadow-sm">
                  <Image
                    src={resolveImageUrl(quickViewProduct.image, quickViewProduct.category)}
                    alt={quickViewProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE]/95 backdrop-blur-md border border-[#E2D1BC] px-3 py-0.5 rounded-full shadow-2xs">
                      {quickViewProduct.category || 'Solid Wood'}
                    </span>
                  </div>
                </div>

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
                      <span className="text-[9.5px] font-bold uppercase text-stone-400 tracking-wider block">Price (GST Inclusive)</span>
                      <p className="text-2xl sm:text-3xl font-black text-[#221814] font-sans tracking-tight">
                        Rs. {formatPrice(quickViewProduct.price)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#7A6048] leading-relaxed font-serif italic">
                    {quickViewProduct.description || '100% Solid Seasoned wood masterpiece engineered with traditional mortise & tenon joinery for royal living.'}
                  </p>

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

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
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
