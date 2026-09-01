'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  X,
  LayoutGrid,
  List,
  Search,
  Filter,
  ShieldAlert,
  Package,
  Layers,
  AlertCircle,
  Sparkles,
  Tag,
  CheckCircle2,
  Crown,
  Boxes,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CloudinaryImageUpload from '@/components/CloudinaryImageUpload';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import LuxurySelect from '@/components/ui/LuxurySelect';

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

interface ProductsTabProps {
  products: any[];
  categories: any[];
  showAddProduct: boolean;
  setShowAddProduct: (show: boolean) => void;
  productForm: any;
  setProductForm: (form: any) => void;
  addProduct: () => void;
  deleteProduct: (id: string) => void;
  defaultProductImage: (cat: string) => string;
  editingProductId: string | null;
  setEditingProductId: (id: string | null) => void;
}

export default function ProductsTab({
  products,
  categories,
  showAddProduct,
  setShowAddProduct,
  productForm,
  setProductForm,
  addProduct,
  deleteProduct,
  defaultProductImage,
  editingProductId,
  setEditingProductId,
}: ProductsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock'>('newest');

  const handleEdit = (p: any) => {
    setEditingProductId(p.id);
    let parsedSpecs: any = {};
    try {
      if (p.specs) {
        parsedSpecs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs;
      }
    } catch {
      // ignore
    }

    setProductForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price || 0,
      category: p.category || '',
      image: p.image || '',
      images: Array.isArray(p.images) ? p.images.join(', ') : (p.images || ''),
      material: p.material || '',
      dimensions: p.dimensions || '',
      stockCount: p.stockCount || 0,
      isPremium: p.isPremium || false,
      compareAtPrice: parsedSpecs.compareAtPrice !== null && parsedSpecs.compareAtPrice !== undefined ? String(parsedSpecs.compareAtPrice) : '',
      woodType: parsedSpecs.woodType || '',
      upholstery: parsedSpecs.upholstery || '',
      finish: parsedSpecs.finish || '',
      leadTime: parsedSpecs.leadTime || '',
      warranty: parsedSpecs.warranty || '',
    });
    setShowAddProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowAddProduct(false);
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      images: '',
      material: '',
      dimensions: '',
      stockCount: 0,
      isPremium: false,
      compareAtPrice: '',
      woodType: '',
      upholstery: '',
      finish: '',
      leadTime: '',
      warranty: '',
    });
  };

  // Real Database Stats calculation
  const totalProducts = products.length;
  const premiumCount = products.filter((p) => p.isPremium).length;
  const outOfStockCount = products.filter((p) => (p.stockCount ?? 0) <= 0).length;
  const lowStockCount = products.filter((p) => (p.stockCount ?? 0) > 0 && (p.stockCount ?? 0) < 5).length;

  // Filter & Sort Products
  const filteredProducts = products
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        Boolean(p.name && p.name.toLowerCase().includes(q)) ||
        Boolean(p.material && p.material.toLowerCase().includes(q)) ||
        Boolean(p.category && p.category.toLowerCase().includes(q));
      const matchesCategory = selectedCategoryFilter ? p.category === selectedCategoryFilter : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'stock') return (a.stockCount || 0) - (b.stockCount || 0);
      return 0; // Default newest
    });

  const extraImagesList = typeof productForm.images === 'string'
    ? productForm.images.split(',').map((url: string) => url.trim()).filter(Boolean)
    : (Array.isArray(productForm.images) ? productForm.images : []);

  const kpis = [
    {
      label: 'TOTAL CATALOG PRODUCTS',
      numValue: totalProducts,
      sub: '✓ 100% In-Stock Database',
      icon: Package,
      color: 'text-[#B88E4B]',
      iconBg: 'bg-gradient-to-br from-amber-50 via-[#FAF5EE] to-amber-100/80 border-amber-300/70 text-[#B88E4B] shadow-[0_3px_12px_rgba(184,142,75,0.2)]',
      ambientGlow: 'bg-[#B88E4B]/10',
      cardGlow: 'border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.18)]',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
    },
    {
      label: 'PREMIUM MASTERPIECES',
      numValue: premiumCount,
      sub: '⭐ VIP Exclusive Designs',
      icon: Crown,
      color: 'text-amber-600',
      iconBg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 border-amber-300/70 text-amber-600 shadow-[0_3px_12px_rgba(245,158,11,0.2)]',
      ambientGlow: 'bg-amber-500/10',
      cardGlow: 'border-amber-300/80 hover:border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)]',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    {
      label: 'OUT OF STOCK ITEMS',
      numValue: outOfStockCount,
      sub: outOfStockCount === 0 ? '✓ All Items Available' : '⚠️ Restock Required',
      icon: AlertCircle,
      color: 'text-rose-600',
      iconBg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100/80 border-rose-300/70 text-rose-600 shadow-[0_3px_12px_rgba(244,63,94,0.2)]',
      ambientGlow: 'bg-rose-500/10',
      cardGlow: 'border-rose-300/80 hover:border-rose-500 shadow-[0_4px_20px_rgba(244,63,94,0.08)] hover:shadow-[0_12px_30px_rgba(244,63,94,0.18)]',
      badgeBg: outOfStockCount === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-500/30' : 'bg-rose-50 text-rose-800 border-rose-500/30',
      dotColor: outOfStockCount === 0 ? 'bg-emerald-500' : 'bg-rose-500',
    },
    {
      label: 'LOW STOCK THRESHOLD',
      numValue: lowStockCount,
      sub: lowStockCount === 0 ? '✓ Inventory Healthy' : '⚡ Less than 5 units left',
      icon: ShieldAlert,
      color: 'text-orange-600',
      iconBg: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100/80 border-orange-300/70 text-orange-600 shadow-[0_3px_12px_rgba(249,115,22,0.2)]',
      ambientGlow: 'bg-orange-500/10',
      cardGlow: 'border-orange-300/80 hover:border-orange-500 shadow-[0_4px_20px_rgba(249,115,22,0.08)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.18)]',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-500/30',
      dotColor: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-4 font-sans">
      
      {/* ── $100,000 LUXURY HEADER (DUAL RESPONSIVE: GRAND ON DESKTOP, COMPACT ON MOBILE) ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2.5 bg-gradient-to-r from-white via-[#FCFAF7] to-white border border-[#E7DDD0] p-3 sm:py-2.5 sm:px-5 lg:py-3 lg:px-6 rounded-2xl lg:rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.02)] shrink-0 relative overflow-hidden group hover:border-[#B88E4B]/40 transition-all"
      >
        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
              <Sparkles size={9} className="text-[#B88E4B] animate-spin duration-3000" />
              <span className="lg:hidden">V2.4</span>
              <span className="hidden lg:inline">CATALOG REGISTRY V2.4</span>
            </span>

            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-black font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500 animate-pulse" />
              </span>
              <span className="lg:hidden">{totalProducts} PRODUCTS</span>
              <span className="hidden lg:inline">{totalProducts} ACTIVE PRODUCTS IN DATABASE</span>
            </span>
          </div>

          <h1 className="text-[21px] sm:text-2xl lg:text-3xl xl:text-4xl font-black text-[#221814] tracking-tight leading-snug lg:leading-tight font-serif">
            Products Catalog <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent font-serif">& Inventory Registry</span>
          </h1>
          <p className="hidden sm:block text-stone-500 text-[11px] sm:text-xs font-medium mt-0.5">
            Manage specifications, pricing, wood craftsmanship, Cloudinary high-res gallery, and live stock allocations.
          </p>
        </div>

        {/* Add Product Gold Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full lg:w-auto shrink-0 relative z-10 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E7DDD0]/60">
          <Button
            onClick={() => {
              if (editingProductId) {
                handleCancel();
              }
              setShowAddProduct(!showAddProduct);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {showAddProduct ? <X size={15} /> : <Plus size={15} />}
            <span>{showAddProduct ? 'Close Form' : 'New Masterpiece'}</span>
          </Button>
        </div>
      </motion.div>

      {/* ── 4 KPI METRIC CARDS (ULTRA-MODERN, STYLISH & ANIMATED GLASS JEWEL EDITION WITH LUMINOUS BORDERS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 shrink-0">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: idx * 0.05, duration: 0.25, type: 'spring', stiffness: 350, damping: 25 }}
            className={`bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border rounded-2xl sm:rounded-[22px] p-4.5 flex flex-col justify-between min-h-[124px] transition-all duration-300 cursor-pointer relative overflow-hidden group ${kpi.cardGlow}`}
          >
            {/* Ambient Colored Radial Glow in Top Corner */}
            <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-80 sm:opacity-60 sm:group-hover:opacity-100 ${kpi.ambientGlow}`} />

            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10.5px] font-black tracking-wider text-[#7A6354] uppercase">
                {kpi.label}
              </span>
              {/* 3D Glass Jewel Orb */}
              <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${kpi.iconBg}`}>
                <kpi.icon size={17} className="stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-2 relative z-10">
              <h3 className="text-2xl sm:text-[28px] lg:text-[30px] font-black text-[#1F1612] tracking-tight leading-none">
                <AnimatedCounter value={kpi.numValue} duration={1.5} />
              </h3>

              <div className="mt-2.5 flex items-center">
                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${kpi.badgeBg}`}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${kpi.dotColor} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${kpi.dotColor}`} />
                  </span>
                  {kpi.sub}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CREATE / EDIT PRODUCT EXPANDABLE PANEL ── */}
      <AnimatePresence>
        {showAddProduct && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-2 border-[#B88E4B]/40 shadow-[0_12px_40px_rgba(184,142,75,0.12)] rounded-[24px] p-6 space-y-5 relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515]" />
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-[#221814] font-serif flex items-center gap-2">
                  <span className="text-[#B88E4B] text-xl">✦</span>
                  {editingProductId ? 'Edit Product Specifications' : 'Add New Luxury Furniture Piece'}
                </h3>
                <p className="text-stone-400 text-xs font-semibold mt-0.5">
                  Complete all dimensions, upholstery fabric, wood finish, and Cloudinary media assets.
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Core Details (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Product Name *</label>
                <Input
                  placeholder="e.g. Royal Maharaja Velvet 8-Seater Dining Set"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Price (PKR) *</label>
                <Input
                  placeholder="e.g. 385000"
                  type="number"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Compare-At Price (PKR Discount Anchor)</label>
                <Input
                  placeholder="e.g. 450000 (Original price before luxury discount)"
                  type="number"
                  value={productForm.compareAtPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>
            </div>

            {/* Category, Dimensions & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value, image: defaultProductImage(e.target.value) })}
                  className="w-full bg-[#FCFAF7] border border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 px-3 text-xs focus:border-[#B88E4B] outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Dimensions</label>
                <Input
                  placeholder="e.g. 280 x 90 x 75 cm"
                  value={productForm.dimensions}
                  onChange={(e) => setProductForm({ ...productForm, dimensions: e.target.value })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Stock Count *</label>
                <Input
                  placeholder="e.g. 5"
                  type="number"
                  value={productForm.stockCount !== undefined ? productForm.stockCount : ''}
                  onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-10 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>
            </div>

            {/* Furniture Craftsmanship & Construction Block */}
            <div className="bg-[#FCFAF7] border border-[#E7DDD0] p-4 rounded-2xl space-y-3">
              <span className="text-[#221814] text-xs font-black font-serif uppercase tracking-wider block border-b border-neutral-200/70 pb-2 flex items-center gap-1.5">
                <span className="text-[#B88E4B]">✦</span> Furniture Craftsmanship & Material Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">General Material</label>
                  <Input
                    placeholder="e.g. Solid Sheesham Wood & Turkish Velvet"
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">Wood Type / Frame</label>
                  <Input
                    placeholder="e.g. Seasoned Solid Sheesham Wood"
                    value={productForm.woodType}
                    onChange={(e) => setProductForm({ ...productForm, woodType: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">Fabric / Upholstery</label>
                  <Input
                    placeholder="e.g. Imported Premium Velvet"
                    value={productForm.upholstery}
                    onChange={(e) => setProductForm({ ...productForm, upholstery: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">Polish / Finish</label>
                  <Input
                    placeholder="e.g. Antique Walnut Matte Polish"
                    value={productForm.finish}
                    onChange={(e) => setProductForm({ ...productForm, finish: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">Production Lead Time</label>
                  <Input
                    placeholder="e.g. 15-20 Working Days"
                    value={productForm.leadTime}
                    onChange={(e) => setProductForm({ ...productForm, leadTime: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-500 text-[9px] uppercase font-black tracking-wider">Warranty Guarantee</label>
                  <Input
                    placeholder="e.g. 10 Years Lifetime Wood Warranty"
                    value={productForm.warranty}
                    onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    className="bg-white border-[#E7DDD0] text-[#221814] font-semibold rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200/70">
                <input
                  type="checkbox"
                  checked={productForm.isPremium}
                  onChange={(e) => setProductForm({ ...productForm, isPremium: e.target.checked })}
                  className="accent-[#B88E4B] w-4 h-4 rounded cursor-pointer"
                  id="isPremium"
                />
                <label htmlFor="isPremium" className="text-[#221814] text-xs font-black select-none cursor-pointer flex items-center gap-1">
                  ⭐ Mark as VIP / Premium Member Exclusive Piece
                </label>
              </div>
            </div>

            {/* Cloudinary Media Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider block">
                  Product Primary High-Res Showcase Image *
                </label>
                <CloudinaryImageUpload
                  folder="products"
                  compact
                  currentImage={productForm.image}
                  onUpload={(result) => {
                    setProductForm({ ...productForm, image: result.secureUrl });
                    toast.success('Primary image uploaded to Cloudinary ✓');
                  }}
                />
                <Input
                  placeholder="Or paste main image URL directly"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-medium rounded-xl h-9 text-xs focus-visible:ring-[#B88E4B]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider block">
                  Gallery Extra Angles
                </label>
                <CloudinaryImageUpload
                  folder="products"
                  compact
                  multiple
                  onUpload={(result) => {
                    const existing = typeof productForm.images === 'string'
                      ? productForm.images.split(',').map((url: string) => url.trim()).filter(Boolean)
                      : (Array.isArray(productForm.images) ? productForm.images : []);
                    const combined = [...existing, result.secureUrl].join(', ');
                    setProductForm({ ...productForm, images: combined });
                    toast.success('Gallery angle uploaded ✓');
                  }}
                  onUploadMultiple={(results) => {
                    const urls = results.map((r) => r.secureUrl);
                    const existing = typeof productForm.images === 'string'
                      ? productForm.images.split(',').map((url: string) => url.trim()).filter(Boolean)
                      : (Array.isArray(productForm.images) ? productForm.images : []);
                    const combined = [...existing, ...urls].join(', ');
                    setProductForm({ ...productForm, images: combined });
                    toast.success(`${results.length} gallery images uploaded ✓`);
                  }}
                />
                <Textarea
                  placeholder="Paste extra image URLs separated by commas"
                  value={productForm.images || ''}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                  className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-medium rounded-xl text-xs resize-none focus-visible:ring-[#B88E4B]"
                  rows={2}
                />
                {extraImagesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1.5 max-h-16 overflow-y-auto">
                    {extraImagesList.map((url: string, index: number) => (
                      <div key={index} className="w-10 h-10 border border-[#E7DDD0] rounded-lg relative bg-white flex items-center justify-center overflow-hidden shadow-2xs">
                        <img src={url} alt={`preview-${index}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = extraImagesList.filter((_: any, i: number) => i !== index);
                            setProductForm({ ...productForm, images: updated.join(', ') });
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-stone-600 text-[10px] uppercase font-black tracking-wider">Product Heritage & Design Description</label>
              <Textarea
                placeholder="Describe the artisan hand-carving, solid Sheesham wood seasoning, comfort grade, and styling notes..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-medium rounded-xl text-xs h-20 resize-none focus-visible:ring-[#B88E4B]"
              />
            </div>

            {/* Save Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={addProduct}
                className="bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white font-black rounded-xl text-xs px-7 py-2.5 shadow-[0_4px_16px_rgba(184,142,75,0.3)] transition-all cursor-pointer"
              >
                {editingProductId ? 'Update Product in Registry' : 'Publish Product to Live Store'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-[#E7DDD0] text-stone-600 font-bold rounded-xl text-xs hover:bg-[#FCFAF7] px-6 py-2.5 transition-all cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER, SEARCH & VIEW MODE TOOLBAR ── */}
      <div className="bg-white border border-[#E7DDD0] p-3 rounded-[18px] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
        
        {/* Search Input */}
        <div className="flex flex-1 w-full sm:w-auto items-center gap-2 relative">
          <Search size={15} className="text-stone-400 absolute left-3.5" />
          <Input
            placeholder="Search by name, wood type, or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 bg-[#FCFAF7] border-[#E7DDD0] text-[#221814] font-bold rounded-xl h-9.5 text-xs w-full max-w-sm focus-visible:ring-[#B88E4B]"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          
          {/* Category Dropdown (Custom Luxury Select) */}
          <div className="flex items-center">
            <LuxurySelect
              value={selectedCategoryFilter}
              onChange={(val) => setSelectedCategoryFilter(val)}
              options={[
                { value: '', label: `All Categories (${totalProducts})` },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              icon={<Filter size={13} />}
            />
          </div>

          {/* Sort By Dropdown (Custom Luxury Select) */}
          <div className="flex items-center">
            <LuxurySelect
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'newest', label: 'Sort: Newest First' },
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
                { value: 'stock', label: 'Stock: Low to High' },
              ]}
              icon={<ArrowUpDown size={13} />}
            />
          </div>

          {/* Grid/List View Toggles */}
          <div className="flex border border-[#E7DDD0] rounded-xl overflow-hidden p-0.5 bg-[#FCFAF7]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-sm' : 'text-stone-500 hover:text-[#221814]'
              }`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white shadow-sm' : 'text-stone-500 hover:text-[#221814]'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* ── PRODUCT ITEMS LIST / GRID RENDER ── */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E7DDD0] rounded-[20px] shadow-[0_4px_20px_rgba(44,30,24,0.015)]">
          <Package className="mx-auto text-stone-300 mb-3 opacity-60" size={48} />
          <h4 className="text-base font-black text-[#221814] font-serif">No Products Found</h4>
          <p className="text-stone-500 text-xs mt-1">Try adjusting your search query or category filter.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── DYNAMIC LUXURY FLOATING LIST ROWS VIEW ── */
        <div className="space-y-2.5">
          {filteredProducts.map((p) => {
            let discountPercent = 0;
            let parsedSpecs: any = {};
            try {
              if (p.specs) {
                parsedSpecs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs;
                if (parsedSpecs.compareAtPrice && Number(parsedSpecs.compareAtPrice) > p.price) {
                  discountPercent = Math.round(((Number(parsedSpecs.compareAtPrice) - p.price) / Number(parsedSpecs.compareAtPrice)) * 100);
                }
              }
            } catch {
              // ignore
            }

            const isLowStock = (p.stockCount ?? 0) > 0 && (p.stockCount ?? 0) < 5;
            const isOutOfStock = (p.stockCount ?? 0) <= 0;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/60 p-3.5 rounded-[18px] shadow-[0_3px_15px_rgba(44,30,24,0.015)] hover:shadow-[0_8px_25px_rgba(184,142,75,0.12)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 group"
              >
                {/* Left: Thumbnail & Name */}
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 border-2 border-[#E7DDD0] bg-[#FCFAF7] rounded-xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#B88E4B]/50 transition-colors">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <ImageIcon size={22} className="text-stone-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[#1F1612] font-serif font-black text-sm lg:text-base leading-snug group-hover:text-[#B88E4B] transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-semibold mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {p.material && <span>{p.material}</span>}
                      {p.dimensions && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span>{p.dimensions}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Data Tags & Actions */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs w-full md:w-auto justify-between md:justify-end">
                  
                  {/* Category */}
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Category</span>
                    <span className="text-[10.5px] font-black text-[#7A6354] uppercase tracking-wider mt-0.5 bg-[#FAF7F2] border border-[#E7DDD0] px-2.5 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Price</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-[#1F1612]">Rs. {formatPrice(p.price)}</span>
                      {discountPercent > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Inventory Status */}
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Inventory</span>
                    <span
                      className={`text-[10.5px] font-black rounded-full border px-2.5 py-0.5 mt-0.5 flex items-center gap-1 ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-black'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      {isOutOfStock ? 'Sold Out' : `${p.stockCount} left`}
                    </span>
                  </div>

                  {/* Membership Tier */}
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 font-black">Membership</span>
                    {p.isPremium ? (
                      <span className="bg-gradient-to-r from-[#FAF0E2] to-[#F5E5CF] text-[#8C6239] border border-[#B88E4B]/40 text-[10px] font-black rounded-full px-2.5 py-0.5 mt-0.5 flex items-center gap-1 shadow-2xs">
                        <Sparkles size={10} className="text-[#B88E4B]" />
                        Premium
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-stone-400 font-bold mt-0.5">Standard</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 border-t border-neutral-100 md:border-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] text-stone-600 hover:text-[#B88E4B] hover:border-[#B88E4B]/50 transition-all cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-all cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ── DYNAMIC LUXURY CARD GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            let discountPercent = 0;
            let parsedSpecs: any = {};
            try {
              if (p.specs) {
                parsedSpecs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs;
                if (parsedSpecs.compareAtPrice && Number(parsedSpecs.compareAtPrice) > p.price) {
                  discountPercent = Math.round(((Number(parsedSpecs.compareAtPrice) - p.price) / Number(parsedSpecs.compareAtPrice)) * 100);
                }
              }
            } catch {
              // ignore
            }

            const isLowStock = (p.stockCount ?? 0) > 0 && (p.stockCount ?? 0) < 5;
            const isOutOfStock = (p.stockCount ?? 0) <= 0;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-[#E7DDD0] hover:border-[#B88E4B]/60 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(44,30,24,0.015)] hover:shadow-[0_12px_30px_rgba(184,142,75,0.15)] transition-all duration-300 flex flex-col group relative"
              >
                {/* Floating Category and Premium Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start pointer-events-none">
                  <span className="bg-white/90 backdrop-blur-xs text-[#7A6354] font-black text-[9px] rounded-full border border-[#E7DDD0] uppercase tracking-wider px-2.5 py-0.5 shadow-xs">
                    {p.category}
                  </span>
                  {p.isPremium && (
                    <span className="bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-[9px] font-black rounded-full px-2.5 py-0.5 shadow-md flex items-center gap-1">
                      <Sparkles size={9} />
                      Premium
                    </span>
                  )}
                </div>

                {/* Floating Stock Badge */}
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <span
                    className={`text-[9px] font-black rounded-full px-2.5 py-0.5 shadow-xs ${
                      isOutOfStock
                        ? 'bg-rose-600 text-white'
                        : isLowStock
                        ? 'bg-amber-500 text-white font-black'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isOutOfStock ? 'Sold Out' : `${p.stockCount} Left`}
                  </span>
                </div>

                {/* Product Image */}
                <div className="aspect-[4/3] w-full bg-[#FCFAF7] border-b border-[#E7DDD0] flex items-center justify-center overflow-hidden relative">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="object-cover w-full h-full group-hover:scale-108 transition-transform duration-500" />
                  ) : (
                    <ImageIcon size={32} className="text-stone-300" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-[#1F1612] font-serif font-black text-sm lg:text-base leading-snug group-hover:text-[#B88E4B] transition-colors line-clamp-1">
                      {p.name}
                    </h4>
                    {p.material && (
                      <p className="text-[10.5px] text-stone-500 font-semibold mt-1 truncate">
                        {p.material}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div>
                      <p className="text-base font-black text-[#1F1612]">Rs. {formatPrice(p.price)}</p>
                      {discountPercent > 0 && (
                        <p className="text-[10px] font-black text-emerald-700">-{discountPercent}% Discount</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E7DDD0] text-stone-600 hover:text-[#B88E4B] hover:border-[#B88E4B]/50 transition-all cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-all cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
