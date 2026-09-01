'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Minus, Plus, Truck, ShieldCheck, Heart,
  Sparkles, CheckCircle2, ShoppingBag,
  MessageSquare, ArrowRight, Share2, Compass
} from 'lucide-react';
import type { StorefrontProduct } from '@/lib/types/product';
import { resolveImageUrl, LOCAL_IMAGES } from '@/lib/images';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useIsInWishlist } from '@/hooks/use-is-in-wishlist';
import { useClientCacheStore, CachedProduct } from '@/store/clientCacheStore';
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
  const mainImage = resolveImageUrl(product.image, product.category);
  const allImages = [
    mainImage,
    ...(product.images && product.images.length > 0
      ? product.images.map((img) => resolveImageUrl(img, product.category))
      : [
          resolveImageUrl(null, product.category, 800),
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

  let parsedSpecs: any = {};
  try {
    if (product.specs) {
      parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    }
  } catch {
    // ignore
  }

  const currentPrice = product.price;
  const originalPrice = parsedSpecs.compareAtPrice ? Number(parsedSpecs.compareAtPrice) : Math.round(currentPrice * 1.33);
  const monthlyInstallment = Math.round(currentPrice / 12);

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

              {/* Floating Luxury Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF5EE]/95 backdrop-blur-md border border-amber-300/60 text-[#8C6239] text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  <Sparkles size={11} className="text-[#B88E4B]" /> 100% Solid Sheesham
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  Save 25% Luxury Privilege
                </span>
              </div>

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
                🔍 Hover to Magnify Grain Texture
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
                    <Star key={i} size={14} className="fill-[#B88E4B] text-[#B88E4B]" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#7A6048]">
                  5.0 (24 Verified Masterwork Reviews)
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
                    <span className="text-base text-stone-400 line-through">
                      Rs. {originalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <span className="bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 text-xs font-black px-3 py-1 rounded-xl">
                  25% SAVINGS
                </span>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-[#7A6048] relative z-10">
                <span>💳 0% Markup Installment Option:</span>
                <span className="font-bold text-[#221814]">From Rs. {monthlyInstallment.toLocaleString()}/mo</span>
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
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
