'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Eye, ArrowUpRight, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useIsInWishlist } from '@/hooks/use-is-in-wishlist';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api-client';
import { resolveImageUrl } from '@/lib/images';
import { useCartStore } from '@/store/cartStore';
import { useClientCacheStore } from '@/store/clientCacheStore';
import { toast } from 'sonner';

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

const formatPrice = (n: number) => new Intl.NumberFormat('en-PK').format(n);

export default function ProductCard({ product, index = 0, onQuickView, layoutMode = 'grid3' }: ProductCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const wishlisted = useIsInWishlist(product.id);
  const addItem = useCartStore((s) => s.addItem);
  const setCachedProduct = useClientCacheStore((s) => s.setProduct);
  const [imgError, setImgError] = useState(false);

  // Instant Zero-Loading Prefetch: primes Next.js router chunks on hover/touch without triggering state re-renders
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
    if (session?.user) {
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
  const isPriority = typeof index === 'number' && index < 4;

  if (layoutMode === 'list') {
    return (
      <div
        data-testid="product-card"
        className="group bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 hover:border-[#B88E4B] rounded-[24px] p-4 shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_16px_40px_rgba(184,142,75,0.18)] transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
      >
        {/* Ambient Corner Radial Glow */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />

        <Link
          href={`/product/${product.id}`}
          prefetch={true}
          onClick={handleProductClick}
          onMouseEnter={primeProductCache}
          onTouchStart={primeProductCache}
          className="relative w-full sm:w-56 aspect-[4/3] rounded-[18px] overflow-hidden bg-[#FAF5EE] shrink-0 border border-amber-200/60"
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-700 group-hover:scale-106"
            sizes="(max-width: 640px) 100vw, 224px"
            onError={() => setImgError(true)}
          />
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white text-[#221814] border border-amber-300/60 shadow-[0_2px_8px_rgba(184,142,75,0.15)] flex items-center justify-center transition-all z-10 hover:scale-105"
          >
            <Heart size={15} className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#221814]'} />
          </button>
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 w-full relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#8C6239] bg-[#FAF5EE] border border-amber-300/60 px-3 py-0.5 rounded-full shadow-2xs">
                {product.category || 'Solid Sheesham'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#B88E4B]">
                <Star size={12} className="fill-[#B88E4B] text-[#B88E4B]" />
                <span>5.0</span>
              </div>
            </div>
            <Link
              href={`/product/${product.id}`}
              prefetch={true}
              onClick={handleProductClick}
              onMouseEnter={primeProductCache}
              onTouchStart={primeProductCache}
            >
              <h3 className="text-lg font-bold text-[#221814] group-hover:text-[#B88E4B] transition-colors font-serif">
                {product.name}
              </h3>
            </Link>
            <p className="text-xs text-[#7A6048] line-clamp-2 mt-1 leading-relaxed font-serif italic">
              {product.description || '100% Solid Seasoned Sheesham masterpiece crafted with traditional mortise & tenon joinery.'}
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
                  onClick={() => onQuickView(product)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#FCFAF7] border border-amber-300/60 hover:border-[#B88E4B] text-xs font-black text-[#221814] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Eye size={14} /> Quick View
                </button>
              )}
              <button
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
      className="group relative bg-gradient-to-br from-white via-[#FCFAF7] to-[#FAF5EE] border-[1.5px] border-amber-300/80 hover:border-[#B88E4B] rounded-[24px] p-3.5 shadow-[0_4px_20px_rgba(184,142,75,0.08)] hover:shadow-[0_20px_45px_rgba(184,142,75,0.18)] transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Ambient Corner Radial Glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-xl pointer-events-none bg-amber-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-[#FAF5EE] mb-3.5 border border-amber-200/60">
        <Link
          href={`/product/${product.id}`}
          prefetch={true}
          onClick={handleProductClick}
          onMouseEnter={primeProductCache}
          onTouchStart={primeProductCache}
          className="block absolute inset-0 z-0"
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            unoptimized
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-700 group-hover:scale-108"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-wider bg-[#FAF5EE]/95 backdrop-blur-md text-[#8C6239] border border-amber-300/60 px-3 py-0.5 rounded-full shadow-2xs">
            {product.category || 'Solid Wood'}
          </span>
        </div>

        {/* Floating Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 w-8.5 h-8.5 rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white text-[#221814] border border-amber-300/60 shadow-[0_2px_8px_rgba(184,142,75,0.15)] flex items-center justify-center transition-all z-10 hover:scale-110 cursor-pointer"
          aria-label="Toggle Wishlist"
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-[#221814]'}
          />
        </button>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2 z-10">
          {onQuickView && (
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(product); }}
              className="flex-1 bg-white/95 backdrop-blur-md hover:bg-white text-[#221814] text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-xl shadow-md border border-amber-300/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} /> Quick View
            </button>
          )}
          <button
            onClick={handleAddToCart}
            className="p-2.5 bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white rounded-xl shadow-md transition-colors cursor-pointer active:scale-95"
            title="Add to Cart"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 px-1 relative z-10">
        <div>
          <Link
            href={`/product/${product.id}`}
            prefetch={true}
            onClick={handleProductClick}
            onMouseEnter={primeProductCache}
            onTouchStart={primeProductCache}
            className="block"
          >
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#221814] group-hover:text-[#B88E4B] transition-colors font-serif leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-[#7A6048] font-medium line-clamp-1 mt-0.5">100% Solid Handcrafted Sheesham</p>
        </div>

        <div className="flex items-center justify-between pt-3 mt-3 border-t border-amber-200/60">
          <div>
            <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider block">Price</span>
            <span className="text-lg sm:text-xl font-black text-[#221814] font-sans tracking-tight">
              Rs. {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-[#B88E4B] to-[#996515] hover:brightness-110 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag size={13} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
