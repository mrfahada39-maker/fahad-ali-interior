'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
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

  const imgSrc = resolveImageUrl(imgError ? null : product.image, product.category, 800);

  if (layoutMode === 'list') {
    return (
      <div
        data-testid="product-card"
        className="group bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 hover:border-[#B88E4B] rounded-[24px] p-4 shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_16px_40px_rgba(184,142,75,0.18)] transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,transparent_70%)] opacity-70 group-hover:opacity-100 transition-opacity" />

        <div className="relative w-full sm:w-56 aspect-[4/3] rounded-[18px] overflow-hidden bg-[#FAF5EE] shrink-0 border border-amber-200/60">
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
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white hover:bg-[#FAF5EE] text-[#221814] border border-amber-300/60 shadow-[0_2px_8px_rgba(184,142,75,0.15)] flex items-center justify-center transition-all z-10 hover:scale-105 cursor-pointer"
            aria-label="Toggle Wishlist"
          >
            <Heart size={15} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#221814]'} />
          </button>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 w-full relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE] border border-amber-300/60 px-3 py-0.5 rounded-full shadow-2xs">
                {product.category || 'Solid Wood'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#8C6222]">
                <Star size={12} className="fill-[#B88E4B] text-[#B88E4B]" />
                <span>{product.avgRating ? Number(product.avgRating).toFixed(1) : '5.0'}</span>
              </div>
            </div>
            <Link
              href={`/product/${product.id}`}
              prefetch={false}
              onClick={handleProductClick}
              onMouseEnter={primeProductCache}
            >
              <h3 className="text-lg font-bold text-[#221814] group-hover:text-[#B88E4B] transition-colors font-serif">
                {product.name}
              </h3>
            </Link>
            <p className="text-xs text-[#7A6048] line-clamp-2 mt-1 leading-relaxed font-serif italic">
              {product.description || (product.material ? `Handcrafted from premium ${product.material} with traditional mortise & tenon joinery.` : '100% Solid Seasoned wood masterpiece crafted with traditional mortise & tenon joinery.')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-amber-200/60">
            <div>
              <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider block">Price</span>
              <span className="text-xl font-black text-[#221814] font-sans">
                Rs. {formatPrice(product.price)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {onQuickView && (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FCFAF7] border border-amber-300/60 hover:border-[#B88E4B] text-xs font-black text-[#221814] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye size={14} /> Quick View
                </button>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ShoppingBag size={14} /> Add to Cart
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
      tabIndex={0}
      className="group relative aspect-[4/3] rounded-[24px] overflow-hidden bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 hover:border-[#B88E4B] shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_20px_45px_rgba(184,142,75,0.22)] transition-all duration-500 cursor-pointer focus:outline-none"
    >
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(245,158,11,0.2)_0%,transparent_70%)] opacity-60 group-hover:opacity-100 transition-opacity z-10" />

      {/* 1. Full Furniture Product Image (Fills the entire card cleanly — matches user screenshot 1) */}
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
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => setImgError(true)}
        />
      </Link>

      {/* 2. Top-Left Category Badge (Matches User Screenshot 1) */}
      <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
        <span className="text-[11px] font-black uppercase tracking-wider bg-white/95 text-[#8C6222] border border-amber-300/80 px-4 py-1.5 rounded-full shadow-xs backdrop-blur-xs">
          {product.category || 'Solid Wood'}
        </span>
      </div>

      {/* 3. Top-Right Wishlist Button (Matches User Screenshot 1) */}
      <button
        type="button"
        onClick={handleWishlist}
        className="absolute top-3.5 right-3.5 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-[#FAF5EE] text-[#221814] border border-amber-300/80 shadow-[0_2px_12px_rgba(184,142,75,0.18)] flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-xs"
        aria-label="Toggle Wishlist"
      >
        <Heart
          size={18}
          className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#221814]'}
        />
      </button>

      {/* 4. Bottom Details Overlay (Hidden normally, Smoothly Slides Up on Cursor Hover - Matches User Screenshot 2) */}
      <div className="absolute inset-x-3 bottom-3 z-20 p-4 sm:p-4.5 rounded-[20px] bg-white/95 backdrop-blur-md border border-amber-300/80 shadow-[0_16px_36px_rgba(44,30,24,0.2)] transition-all duration-300 ease-out transform translate-y-[112%] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto flex flex-col justify-between">
        <div className="mb-2.5">
          <Link
            href={`/product/${product.id}`}
            prefetch={false}
            onClick={handleProductClick}
            onMouseEnter={primeProductCache}
            className="block"
          >
            <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-[#221814] hover:text-[#B88E4B] transition-colors font-serif leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C6239] line-clamp-1 mt-0.5">
            {product.category || product.material || 'SOFA SET'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-amber-200/70">
          <div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest block leading-none mb-1">Price</span>
            <span className="text-lg sm:text-xl font-black text-[#221814] font-sans tracking-tight">
              Rs. {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
                className="w-10 h-10 rounded-xl bg-[#FAF5EE] border border-amber-300/60 hover:border-[#B88E4B] text-[#221814] flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Quick View"
                aria-label="Quick View"
              >
                <Eye size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={handleAddToCart}
              className="bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={15} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
