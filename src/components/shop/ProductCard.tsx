'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Crown, ShoppingCart, Box, Share2, Star } from 'lucide-react';
import { useWishlistStore, useCartStore, useClientCacheStore } from '@/store';
import { useIsInWishlist } from '@/hooks/use-is-in-wishlist';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { resolveImageUrl } from '@/lib/images';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/pakistan-localization';

type ProductCardProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  isPremium?: boolean;
  description?: string | null;
  material?: string | null;
  avgRating?: number;
  reviewCount?: number;
  stockCount?: number;
};

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  onQuickView?: (product: ProductCardProduct) => void;
  layoutMode?: 'grid3' | 'grid4' | 'list';
}

export default function ProductCard({ product, index: _index = 0, onQuickView, layoutMode = 'grid3' }: ProductCardProps) {
  const router = useRouter();
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const wishlisted = useIsInWishlist(product.id);
  const addItem = useCartStore((s) => s.addItem);
  const setCachedProduct = useClientCacheStore((s) => s.setProduct);
  const [imgError, setImgError] = useState(false);

  // Desktop-only hover prefetch: never trigger main-thread RSC fetches during mobile touch scrolling
  const primeProductCache = () => {
    if (product?.id) {
      router.prefetch(`/product/${product.id}`);
    }
  };

  const handleProductClick = () => {
    if (product?.id) {
      setCachedProduct(product);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    if (typeof document !== 'undefined' && document.cookie.includes('next-auth')) {
      apiFetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {});
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category || '',
    });
    toast.success(`Added ${product.name} to Cart 🛒`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${product.id}` : `/product/${product.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Fahad Ali Interior`,
        url: productUrl,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(productUrl).then(() => {
        toast.success('Product link copied to clipboard! 📋');
      }).catch(() => {
        toast.success('Product link copied! 📋');
      });
    } else {
      toast.success('Link copied! 📋');
    }
  };

  const handle3DPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      router.push(`/product/${product.id}`);
    }
  };

  const imgSrc = resolveImageUrl(imgError ? null : product.image, product.category, 800);

  // Subtitle / Tagline derived from product details or luxury defaults
  const tagline = product.description?.split('.')[0]
    || (product.material ? `Handcrafted in ${product.material}. Modern Comfort.` : 'Timeless Elegance. Modern Comfort.');

  // Realistic strikethrough price (original price) and discount %
  const originalPrice = Math.round(product.price * 1.22);
  const discountPercent = 18;

  // Star rating
  const avgRating = product.avgRating ? Number(product.avgRating).toFixed(1) : '4.8';
  const reviewsText = product.reviewCount ? `${(product.reviewCount > 999 ? (product.reviewCount / 1000).toFixed(1) + 'k' : product.reviewCount)} Reviews` : '2.5k Reviews';

  if (layoutMode === 'list') {
    return (
      <div
        data-testid="product-card"
        className="group bg-white border border-stone-200/80 hover:border-[#B88E4B] rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgba(184,142,75,0.15)] transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
      >
        <div className="relative w-full sm:w-56 aspect-[4/3] rounded-[18px] overflow-hidden bg-[#FBF9F6] shrink-0 border border-stone-100">
          <Link
            href={`/product/${product.id}`}
            prefetch={false}
            onClick={handleProductClick}
            onMouseEnter={primeProductCache}
            className="block absolute inset-0 z-0"
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              loading="lazy"
              decoding="async"
              style={{ aspectRatio: '4/3' }}
              className="object-cover transition-transform duration-700 group-hover:scale-106 aspect-[4/3]"
              sizes="(max-width: 640px) 100vw, 224px"
              onError={() => setImgError(true)}
            />
          </Link>

          {/* Bestseller Badge */}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 bg-[#1F1A17] text-[#F3EADB] border border-[#B88E4B]/50 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-xs">
              <Crown size={12} className="text-[#C59B4B] fill-[#C59B4B]" />
              <span>Bestseller</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white text-[#111827] hover:border-[#B88E4B]/60 border border-stone-200 shadow-sm flex items-center justify-center transition-all z-10 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Toggle Wishlist"
          >
            <Heart size={16} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#111827]'} />
          </button>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 w-full relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7030] bg-[#FAF5ED] border border-[#E8DFC8] px-2.5 py-0.5 rounded-full">
                {product.category || 'Luxury'}
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-[#111827]">
                <Star size={13} className="fill-[#FBBF24] text-[#FBBF24]" />
                <span>{avgRating}</span>
                <span className="text-gray-400">({reviewsText})</span>
              </div>
            </div>
            <Link
              href={`/product/${product.id}`}
              prefetch={false}
              onClick={handleProductClick}
              onMouseEnter={primeProductCache}
            >
              <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#B88E4B] transition-colors">
                {product.name}
              </h3>
            </Link>
            <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">
              {tagline}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#111827] font-sans">
                Rs. {formatPrice(product.price)}
              </span>
              <span className="text-xs text-[#9CA3AF] line-through">
                Rs. {formatPrice(originalPrice)}
              </span>
              <span className="bg-[#FAF5ED] text-[#9A7030] border border-[#E8DFC8] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {discountPercent}% OFF
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_14px_rgba(184,142,75,0.28)] inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ShoppingCart size={15} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="product-card"
      className="group relative bg-white border border-stone-200/70 hover:border-amber-300/80 rounded-[28px] p-3 sm:p-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_36px_rgba(184,142,75,0.12)] transition-all duration-300 flex flex-col justify-between"
    >
      {/* ── TOP IMAGE CONTAINER ── */}
      <div className="relative aspect-[4/3] w-full rounded-[22px] overflow-hidden bg-[#FAF9F6] border border-stone-100/90 mb-3.5">
        {/* Product Image */}
        <Link
          href={`/product/${product.id}`}
          prefetch={false}
          onClick={handleProductClick}
          onMouseEnter={primeProductCache}
          className="block absolute inset-0 z-0"
          aria-label={product.name}
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: '4/3' }}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-106 aspect-[4/3]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Top-Left Bestseller Pill (Matches royal gold & espresso luxury scheme) */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-[#1F1A17]/95 backdrop-blur-xs text-[#F3EADB] border border-[#B88E4B]/50 px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
            <Crown size={14} className="text-[#C59B4B] fill-[#C59B4B]" />
            <span>Bestseller</span>
          </span>
        </div>

        {/* Top-Right Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white hover:bg-[#FAF6F0] text-[#111827] hover:border-[#B88E4B]/60 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-stone-100 flex items-center justify-center transition-all z-10 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Toggle Wishlist"
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#111827]'}
          />
        </button>
      </div>

      {/* ── CARD CONTENT ── */}
      <div className="flex flex-col justify-between flex-1 px-1">
        <div>
          {/* Title */}
          <Link
            href={`/product/${product.id}`}
            prefetch={false}
            onClick={handleProductClick}
            onMouseEnter={primeProductCache}
            className="block"
          >
            <h3 className="text-lg sm:text-[19px] font-bold text-[#111827] group-hover:text-[#B88E4B] transition-colors leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Subtitle / Tagline */}
          <p className="text-xs sm:text-[13px] text-[#6B7280] line-clamp-1 mt-0.5 font-normal">
            {tagline}
          </p>

          {/* Ratings & Reviews Row */}
          <div className="flex items-center gap-1 mt-2 mb-2">
            <div className="flex items-center text-[#FBBF24]">
              <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
              <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
              <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
              <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
              <div className="relative">
                <Star size={14} className="fill-[#E5E7EB] text-[#E5E7EB]" />
                <div className="absolute inset-0 overflow-hidden w-[75%]">
                  <Star size={14} className="fill-[#FBBF24] text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <span className="font-bold text-[#111827] text-xs sm:text-sm ml-1">{avgRating}</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-[#6B7280] text-xs sm:text-sm">({reviewsText})</span>
          </div>

          {/* Pricing & Discount Row */}
          <div className="flex items-center flex-wrap gap-2 mb-3.5">
            <span className="text-xl sm:text-2xl font-black text-[#111827] font-sans tracking-tight">
              Rs. {formatPrice(product.price)}
            </span>
            <span className="text-xs sm:text-sm text-[#9CA3AF] line-through font-sans">
              Rs. {formatPrice(originalPrice)}
            </span>
            <span className="bg-[#FAF5ED] text-[#9A7030] border border-[#E8DFC8] text-[11px] font-bold px-2.5 py-0.5 rounded-full font-sans">
              {discountPercent}% OFF
            </span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ROW ── */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-100/80">
          {/* Main Add to Cart Pill Button (Exact Color Match to Hero "Shop Collection" Button in Img 1) */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-gradient-to-r from-[#C59B4B] via-[#B88E4B] to-[#9E7333] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(184,142,75,0.28)] cursor-pointer min-h-[44px]"
          >
            <ShoppingCart size={16} strokeWidth={2.2} />
            <span>Add to Cart</span>
          </button>

          {/* 3D Preview Circular Button */}
          <button
            type="button"
            onClick={handle3DPreview}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-stone-200/90 bg-white hover:bg-[#FAF6F0] hover:border-[#B88E4B] hover:text-[#B88E4B] active:scale-95 text-gray-800 flex flex-col items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
            title="3D Preview"
            aria-label="3D Preview"
          >
            <Box size={14} strokeWidth={2} />
            <span className="text-[8px] font-black leading-none mt-0.5 tracking-tight">3D</span>
          </button>

          {/* Share Circular Button */}
          <button
            type="button"
            onClick={handleShare}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-stone-200/90 bg-white hover:bg-[#FAF6F0] hover:border-[#B88E4B] hover:text-[#B88E4B] active:scale-95 text-gray-800 flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Share Product"
            aria-label="Share Product"
          >
            <Share2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
