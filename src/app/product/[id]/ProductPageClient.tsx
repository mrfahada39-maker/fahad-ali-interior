'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Minus, Plus, Truck, ShieldCheck, Heart,
  Sparkles, CheckCircle2, ShoppingBag,
  MessageSquare, ArrowRight, Share2, Compass, PenTool, X,
  Layers, Hammer, Clock, Ruler, Paintbrush, Award
} from 'lucide-react';
import type { StorefrontProduct } from '@/lib/types';
import { resolveImageUrl, LOCAL_IMAGES } from '@/lib/images';
import { useCartStore, useWishlistStore, useClientCacheStore, type CachedProduct } from '@/store';
import { useIsInWishlist } from '@/hooks/use-is-in-wishlist';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

export default function ProductPageClient({
  initialProduct,
  productId,
}: {
  initialProduct: StorefrontProduct | null;
  productId?: string;
}) {
  const getCached = useClientCacheStore((s) => s.getProduct);
  const setCached = useClientCacheStore((s) => s.setProduct);

  // Instant fallback to client cache if initialProduct is null or resolving
  const cachedFallback = productId ? getCached(productId) : undefined;
  const product = (initialProduct || cachedFallback) as StorefrontProduct | undefined;

  useEffect(() => {
    if (initialProduct) {
      setCached(initialProduct as unknown as CachedProduct);
    }
  }, [initialProduct, setCached]);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [addedToCart, setAddedToCart] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlisted = useIsInWishlist(product?.id ?? '');
  const { data: session } = useSession();

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center pt-28">
        <div className="text-center bg-white border-2 border-[#E7DDD0] p-8 rounded-[28px] shadow-sm max-w-md">
          <p className="font-serif text-2xl font-black text-[#221814] mb-3">Masterpiece Not Found</p>
          <p className="text-xs text-[#7A6048] mb-6">The requested furniture item may have been archived or customized.</p>
          <Link href="/shop" prefetch={true} className="inline-flex items-center gap-2 px-6 py-3 bg-[#221814] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#B88E4B] transition-all">
            Return to Luxury Catalog
          </Link>
        </div>
      </div>
    );
  }
  const mainImage = resolveImageUrl(product.image, product.category, 1200);
  const allImages = [
    mainImage,
    ...(product.images && product.images.length > 0
      ? product.images.map((img) => resolveImageUrl(img, product.category, 1200))
      : [
          resolveImageUrl(null, product.category, 1200),
          LOCAL_IMAGES.dining,
          LOCAL_IMAGES.bed,
        ])
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
    }
    setAddedToCart(true);
    toast.success(`Added ${product.name} to Luxury Cart 🛒`);
    setTimeout(() => setAddedToCart(false), 2000);
    openCart();
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    if (session?.user) {
      apiFetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {});
    }
    toast.success(wishlisted ? 'Removed from Wishlist' : 'Saved to Royal Wishlist ❤️');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Explore this handcrafted luxury ${product.name} at Fahad Ali Interior.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard! 📋');
    }
  };

  const handleSubmitProductReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error('Please sign in to submit a patron review');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write your critique or craftsmanship notes');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await apiFetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      if (res.ok) {
        toast.success('Critique submitted for royal atelier verification');
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to submit review');
      }
    } catch {
      toast.error('Network error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const reviewsList = product.reviews || [];
  const reviewCount = reviewsList.length || (product.reviewCount ?? 0);
  const avgRating = reviewsList.length > 0
    ? Number((reviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1))
    : (product.avgRating ?? 5.0);

  let parsedSpecs: any = {};
  try {
    if (product.specs) {
      parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    }
  } catch {
    // ignore
  }

  const currentPrice = product.price;
  const compareAt = parsedSpecs.compareAtPrice ? Number(parsedSpecs.compareAtPrice) : null;
  const hasDiscount = Boolean(compareAt && compareAt > currentPrice);
  const discountPercent = hasDiscount && compareAt ? Math.round(((compareAt - currentPrice) / compareAt) * 100) : null;

  const whatsappMessage = encodeURIComponent(
    `Hello Fahad Ali Interior, I am interested in ordering the masterwork "${product.name}". Can we discuss bespoke dimensions and availability?`
  );

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-[#221814] pt-24 sm:pt-28 pb-28 sm:pb-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── BREADCRUMB HEADER ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E7DDD0]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#7A6048]">
            <Link href="/" className="hover:text-[#B88E4B] transition-colors">Home</Link>
            <span className="text-[#B88E4B]">/</span>
            <Link href="/shop" className="hover:text-[#B88E4B] transition-colors">{product.category || 'Catalog'}</Link>
            <span className="text-[#B88E4B]">/</span>
            <span className="text-[#221814] font-black truncate max-w-[240px]">{product.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7DDD0] text-xs font-bold text-[#5A4336] hover:border-[#B88E4B] shadow-2xs transition-all cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share Masterpiece</span>
            </button>
          </div>
        </div>

        {/* ── MAIN PRODUCT HERO (2-COLUMN EXECUTIVE SHOWCASE) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-start">

          {/* LEFT: INTERACTIVE HD MEDIA GALLERY (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">

            {/* Main Interactive Stage with Luminous Border */}
            <div
              className="relative aspect-[4/3] rounded-[26px] overflow-hidden bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 shadow-[0_8px_30px_rgba(184,142,75,0.12)] group cursor-crosshair"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Ambient Radial Corner Glow */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none bg-amber-500/15 opacity-80 z-10" />

              <Image
                src={allImages[activeImage] ?? mainImage}
                alt={product.name}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 55vw"
                className={`object-cover transition-transform duration-300 ${
                  isZooming ? 'scale-150' : 'scale-100'
                }`}
                style={
                  isZooming
                    ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                    : undefined
                }
              />


              {/* Floating Wishlist Button */}
              <button
                onClick={handleWishlist}
                className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-300/70 text-[#221814] shadow-[0_3px_12px_rgba(184,142,75,0.2)] hover:bg-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart
                  size={18}
                  className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#221814]'}
                />
              </button>

              {/* Hover Zoom Notice */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                🔍 Hover to Magnify Grain Texture
              </div>
            </div>

            {/* Thumbnail Showcase Carousel (Enlarged & Luxury Styling) */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-2 scrollbar-hide">
                {allImages.map((img, i) => {
                  const isActive = i === activeImage;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`group/thumb relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[22px] overflow-hidden shrink-0 border-2 transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'border-[#B88E4B] ring-4 ring-amber-400/30 shadow-[0_10px_25px_rgba(184,142,75,0.25)] scale-105 z-10'
                          : 'border-amber-200/60 bg-white opacity-75 hover:opacity-100 hover:border-amber-400 hover:scale-102 shadow-2xs'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-108"
                        sizes="128px"
                      />
                      {isActive && (
                        <div className="absolute inset-0 border-2 border-[#B88E4B] rounded-[20px] pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS & PURCHASING CONTROLS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header: Category Badge + Title + Rating */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] border border-amber-300/60 shadow-2xs">
                <span className="text-[#B88E4B] text-xs font-bold">✦</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A6354]">
                  {product.category || 'Atelier Masterpiece'}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-[#221814] tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-[#B88E4B]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(avgRating) ? 'fill-[#B88E4B] text-[#B88E4B]' : 'text-stone-300'}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#7A6048]">
                  {avgRating.toFixed(1)} ({reviewCount > 0 ? `${reviewCount} Verified Masterwork ${reviewCount === 1 ? 'Review' : 'Reviews'}` : 'Atelier Masterpiece Rating'})
                </span>
              </div>
            </div>

            {/* Price Stack & Privilege Card with Luminous Border */}
            <div className="bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[22px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(184,142,75,0.08)] space-y-3 relative overflow-hidden">
              {/* Ambient Corner Glow */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70" />

              <div className="flex items-baseline justify-between relative z-10">
                <div>
                  <span className="text-[9.5px] font-bold uppercase text-stone-400 tracking-wider block">Investment Value</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-[#221814] font-sans tracking-tight">
                      Rs. {currentPrice.toLocaleString()}
                    </span>
                    {hasDiscount && compareAt && (
                      <span className="text-base text-stone-400 line-through">
                        Rs. {compareAt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {hasDiscount && discountPercent && (
                  <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-xl">
                    {discountPercent}% SAVINGS
                  </span>
                )}
              </div>
            </div>

            {/* Product Narrative & Highlights */}
            {product.description && (
              <p className="text-xs sm:text-sm text-[#7A6048] leading-relaxed font-serif italic">
                {product.description}
              </p>
            )}

            {/* Quantity + Purchasing Action Row */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                
                {/* Quantity Pill */}
                <div className="flex items-center bg-white border-2 border-[#E7DDD0] rounded-xl h-13 px-2 shadow-2xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#221814] hover:bg-[#FAF5EE] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-[#221814]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#221814] hover:bg-[#FAF5EE] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Primary Add to Cart CTA */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-13 bg-[#221814] hover:bg-gradient-to-r hover:from-[#B88E4B] hover:to-[#996515] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_25px_rgba(34,24,20,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShoppingBag size={16} />
                  <span>{addedToCart ? '✓ Added to Cart!' : '✦ Add to Luxury Cart'}</span>
                </button>
              </div>

              {/* Instant Buy Now Button */}
              <Link
                href="/checkout"
                className="w-full h-12 bg-white border-2 border-[#E7DDD0] hover:border-[#B88E4B] hover:bg-[#FAF5EE] text-[#221814] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
              >
                <span>Experience Instant Checkout</span>
                <ArrowRight size={14} />
              </Link>

              {/* Direct Artisan WhatsApp Concierge */}
              <a
                href={`https://wa.me/923001234567?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} />
                <span>Request Custom Dimensions on WhatsApp Concierge</span>
              </a>

              {/* Quick Specs Snapshot */}
              <div className="pt-2 grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#FAF5EE] border border-amber-200/60 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[8.5px] font-black uppercase text-stone-400 tracking-wider">Wood / Frame</span>
                  <span className="text-[11px] font-black text-[#221814] truncate block mt-0.5">
                    {parsedSpecs.woodType || product.material || 'Sheesham'}
                  </span>
                </div>
                <div className="bg-[#FAF5EE] border border-amber-200/60 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[8.5px] font-black uppercase text-stone-400 tracking-wider">Polish Finish</span>
                  <span className="text-[11px] font-black text-[#221814] truncate block mt-0.5">
                    {parsedSpecs.finish || 'High Gloss'}
                  </span>
                </div>
                <div className="bg-[#FAF5EE] border border-amber-200/60 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[8.5px] font-black uppercase text-stone-400 tracking-wider">Warranty</span>
                  <span className="text-[11px] font-black text-[#221814] truncate block mt-0.5">
                    {parsedSpecs.warranty || '5 Years'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FURNITURE CRAFTSMANSHIP & MATERIAL SPECIFICATIONS SECTION ── */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-[0_8px_32px_rgba(184,142,75,0.08)] relative overflow-hidden">
          {/* Subtle Ambient Background Corner Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none bg-amber-500/10" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/70 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-[#FAF0E2] text-[#8C6239] border border-[#B88E4B]/40 flex items-center gap-1.5 shadow-2xs">
                  <Sparkles size={11} className="text-[#B88E4B]" />
                  <span>Artisan Certified</span>
                </span>
                <span className="px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300/50 flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck size={11} className="text-amber-700" />
                  <span>100% Kiln-Seasoned Wood</span>
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-black text-[#221814] tracking-tight">
                Furniture Craftsmanship & <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent">Material Specifications</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6048] mt-1 font-medium">
                Detailed architectural construction notes, timber grades, and upholstery data recorded at our Lahore atelier.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-stone-500 bg-white px-3 py-1.5 rounded-xl border border-amber-200/60 shadow-2xs">
                Ref: {product.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-6 relative z-10">
            {/* 1. General Material */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Layers size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">General Material</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {product.material || parsedSpecs.generalMaterial || '100% Solid Seasoned Sheesham Wood'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">Authentic hardwood with zero particle board or MDF veneer</p>
            </div>

            {/* 2. Wood Type / Frame */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Hammer size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Wood Type / Frame</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {parsedSpecs.woodType || 'Solid Sheesham (Dalbergia Sissoo)'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">Kiln-seasoned for 30 days to 8-12% moisture equilibrium</p>
            </div>

            {/* 3. Fabric / Upholstery */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Sparkles size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Fabric / Upholstery</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {parsedSpecs.upholstery || 'Imported High-Grade Fabric / Velvet'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">High-density multi-layer royal ergonomic cushioning</p>
            </div>

            {/* 4. Polish / Finish */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Paintbrush size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Polish / Finish</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {parsedSpecs.finish || '5-Coat Protective Polyurethane High-Gloss'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">Scratch-resistant lacquer emphasizing natural timber grains</p>
            </div>

            {/* 5. Production Lead Time */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Clock size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Production Lead Time</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {parsedSpecs.leadTime
                  ? (String(parsedSpecs.leadTime).toLowerCase().includes('day') ? parsedSpecs.leadTime : `${parsedSpecs.leadTime} Working Days`)
                  : '10–14 Working Days'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">Bespoke handcrafted timeline with real-time workshop tracking</p>
            </div>

            {/* 6. Warranty Guarantee */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all group">
              <div className="flex items-center gap-2.5 text-stone-400 mb-2">
                <Award size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Warranty Guarantee</span>
              </div>
              <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                {parsedSpecs.warranty
                  ? (String(parsedSpecs.warranty).toLowerCase().includes('year') ? parsedSpecs.warranty : `${parsedSpecs.warranty} Structural Warranty`)
                  : '10-Year Craftsmanship Guarantee'}
              </p>
              <p className="text-[10.5px] text-stone-400 mt-1 font-medium">Official anti-termite and structural joint integrity guarantee</p>
            </div>

            {/* 7. Dimensions (Span 3 on LG) */}
            <div className="sm:col-span-2 lg:col-span-3 bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-amber-200/60 shadow-2xs hover:border-[#B88E4B] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-stone-400">
                  <Ruler size={16} className="text-[#B88E4B] group-hover:scale-110 transition-transform" />
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-[#7A6048]">Dimensions & Spatial Proportion</span>
                </div>
                <p className="text-sm sm:text-base font-black text-[#221814] tracking-tight">
                  {product.dimensions || parsedSpecs.dimensions || 'Bespoke custom dimensions available upon consultation'}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#8C6239] bg-[#FAF5EE] border border-amber-300/50 px-3 py-1 rounded-lg">
                  📐 Custom Sizing Supported
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CLIENT REVIEWS & TIMBER TESTIMONIALS SECTION ── */}
        <div className="mt-16 sm:mt-24 pt-12 border-t border-[#E7DDD0]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FAF0E2] text-[#8C6239] border border-[#B88E4B]/35 flex items-center gap-1 shadow-2xs">
                  <Sparkles size={10} className="text-[#B88E4B]" />
                  <span>Artisan Reputation</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-500/35 flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 size={10} className="text-emerald-600" />
                  <span>Verified Purchases</span>
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#221814] tracking-tight">
                Patron Reviews & <span className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] bg-clip-text text-transparent">Critiques</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6048] mt-1 font-medium">
                Authentic testimonials from collectors commissioning handcrafted Sheesham furniture.
              </p>
            </div>

            {/* Score pill & Write review button */}
            <div className="flex items-center gap-4">
              <div className="bg-[#FAF5EE] border border-[#E7DDD0] rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#B88E4B]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < Math.round(avgRating) ? 'fill-[#B88E4B] text-[#B88E4B]' : 'text-stone-300'} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-stone-500 mt-0.5">
                    {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
                  </p>
                </div>
                <div className="border-l border-[#E7DDD0] pl-3">
                  <span className="text-2xl font-black text-[#221814] font-serif leading-none">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold block">/ 5.0</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!session?.user) {
                    toast.info('Please sign in to write an artisan critique');
                  }
                  setShowReviewModal(true);
                }}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#221814] to-[#3E2E25] hover:from-[#B88E4B] hover:to-[#996515] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <PenTool size={13} />
                <span>Write a Review</span>
              </button>
            </div>
          </div>

          {/* Review List or Empty State */}
          {reviewsList.length === 0 ? (
            <div className="bg-white/80 border-2 border-dashed border-[#E7DDD0] rounded-3xl p-10 sm:p-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF5EE] border border-[#E7DDD0] flex items-center justify-center mx-auto text-[#B88E4B]">
                <Star size={24} className="fill-[#B88E4B]/20 text-[#B88E4B]" />
              </div>
              <h3 className="font-serif font-black text-lg text-[#221814]">
                Be the First Royal Patron to Review this Piece
              </h3>
              <p className="text-xs text-[#7A6048] max-w-md mx-auto leading-relaxed">
                Commission this bespoke piece and share your critique on timber seasoning, brass fittings, and finishing grade.
              </p>
              <button
                onClick={() => setShowReviewModal(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#FAF5EE] hover:bg-[#FAF0E2] border border-[#B88E4B]/40 text-[#8C6239] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                ✦ Share Your Experience
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev) => {
                const initial = (rev.customerName || 'P').trim().charAt(0).toUpperCase();
                const stars = Number(rev.rating) || 5;

                return (
                  <div
                    key={rev.id}
                    className="bg-white border border-[#E7DDD0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(44,30,24,0.02)] space-y-3 hover:border-[#B88E4B]/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B88E4B] to-[#996515] text-white flex items-center justify-center font-serif font-black text-xs shadow-2xs">
                          {initial}
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-xs text-[#221814] leading-tight">
                            {rev.customerName || 'Valued Client'}
                          </h4>
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Verified Commission
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-stone-400">
                        {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < stars ? 'fill-amber-400 text-amber-500' : 'text-stone-200'} />
                      ))}
                      <span className="text-xs font-bold text-[#221814] ml-1">{stars}.0</span>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-[#3E2E25] font-serif italic bg-[#FCFAF7] p-3 rounded-xl border border-[#E7DDD0]/70 leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Submission Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl border border-[#E7DDD0] max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE] px-2.5 py-0.5 rounded-md border border-[#E2D1BC]">
                  Royal Patron Critique
                </span>
                <h3 className="font-serif text-xl font-black text-[#221814] mt-1.5">
                  Review: {product.name}
                </h3>
                <p className="text-xs text-[#7A6048]">
                  Share your experience with the craftsmanship, wood seasoning, and finishing.
                </p>
              </div>

              {!session?.user ? (
                <div className="bg-[#FAF5EE] p-5 rounded-2xl border border-[#E7DDD0] text-center space-y-3">
                  <p className="text-xs font-medium text-[#7A6048]">
                    Please sign in to your patron account to verify your commission and submit a critique.
                  </p>
                  <Link
                    href={`/signin?callbackUrl=/product/${product.id}`}
                    className="inline-block px-5 py-2.5 rounded-xl bg-[#221814] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#B88E4B] transition-all"
                  >
                    Sign In to Continue
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitProductReview} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#7A6048]">Artisanship Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="cursor-pointer p-0.5 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={22}
                            className={star <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-stone-200'}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-[#221814] ml-2">{reviewRating}.0 / 5.0</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#7A6048]">Your Critique & Finishing Notes</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Comment on the rosewood timber grain, joints, cushioning, or delivery presentation..."
                      rows={4}
                      required
                      className="w-full rounded-2xl border border-[#E7DDD0] p-3 text-xs text-[#221814] bg-[#FAF5EE]/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B88E4B]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] text-white text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : '✦ Submit Critique'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
