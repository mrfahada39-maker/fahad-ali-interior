'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingBag, Heart, Minus, Plus, Truck, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cartStore';
import { useIsInWishlist } from '@/hooks/use-is-in-wishlist';
import { useWishlistStore } from '@/store/wishlistStore';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Image from 'next/image';
import { apiFetchJson as fetchJson, apiFetch } from '@/lib/api-client';
import { formatPricePk } from '@/lib/format-price';
import { resolveImageUrl } from '@/lib/images';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image: string;
  material?: string | null;
  dimensions?: string | null;
  isPremium: boolean;
  avgRating?: number;
  reviewCount?: number;
  specs?: string | null;
  stockCount?: number;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const { data: session } = useSession();
  const wishlisted = useIsInWishlist(product?.id ?? '');

  const fetchRelated = useCallback(async () => {
    if (!product) return;
    try {
      const data = await fetchJson<{ products: Product[] }>(
        `/api/products?category=${encodeURIComponent(product.category)}&limit=5`
      );
      const filtered = (data?.products ?? [])
        .filter((p) => p.id !== product.id)
        .slice(0, 4);
      setRelatedProducts(filtered);
    } catch {
      setRelatedProducts([]);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen && product) {
      fetchRelated();
      setQuantity(1);
    }
  }, [isOpen, product, fetchRelated]);

  if (!product) return null;

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
    toast.success('Added to cart', { description: `${quantity}x ${product.name}` });
    setQuantity(1);
    openCart();
    onClose();
  };

  const handleWishlist = () => {
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
      description: product.name,
    });
    if (session?.user) {
      apiFetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      }).catch(() => {});
    }
  };

  const handleAddRelatedToCart = (p: Product) => {
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
    });
    toast.success('Added to cart', { description: p.name });
    openCart();
  };

  let parsedSpecs: any = {};
  try {
    if (product.specs) {
      parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    }
  } catch {
    // ignore
  }

  const compareAtPrice = parsedSpecs.compareAtPrice ? Number(parsedSpecs.compareAtPrice) : null;
  const hasComparePrice = !!compareAtPrice && compareAtPrice > product.price;
  const discountPercent = hasComparePrice 
    ? Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100)
    : 0;

  const gstAmount = product.price * 0.17;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-2 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-4xl sm:max-h-[90vh] bg-theme-bg border border-theme-accent/20 rounded-2xl z-50 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-theme-muted hover:text-theme-dark"
            >
              <X size={18} />
            </button>

            <div className="overflow-y-auto max-h-[90vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Image */}
                <div className="relative aspect-square sm:aspect-auto sm:min-h-[550px] bg-theme-card">
                  <Image
                    src={resolveImageUrl(product.image, product.category, 800)}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {product.isPremium && (
                    <Badge className="absolute top-4 left-4 bg-theme-accent text-[#2C1E18] text-[10px] tracking-wider uppercase rounded-none font-bold">
                      Premium
                    </Badge>
                  )}
                  {product.stockCount !== undefined && (
                    <Badge className={`absolute top-4 right-14 ${product.stockCount > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'} text-[10px] tracking-wider uppercase rounded-none font-bold`}>
                      {product.stockCount > 0 ? `In Stock (${product.stockCount})` : 'Out of Stock'}
                    </Badge>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 sm:p-8 flex flex-col">
                  <Badge className="bg-theme-card text-theme-muted text-[10px] tracking-wider uppercase rounded-none mb-3 w-fit">
                    {product.category}
                  </Badge>

                  <h2 className="text-theme-dark text-xl sm:text-2xl font-bold leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {product.name}
                  </h2>

                  {/* Rating */}
                  {product.avgRating !== undefined && product.avgRating > 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.round(product.avgRating || 0) ? 'fill-theme-accent text-theme-accent' : 'text-theme-muted'}
                        />
                      ))}
                      <span className="text-theme-muted text-xs ml-1">({product.reviewCount || 0} reviews)</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-theme-accent text-2xl font-bold">
                        Rs. {formatPricePk(product.price)}
                      </span>
                      {hasComparePrice && (
                        <>
                          <span className="text-theme-muted text-sm line-through">
                            Rs. {formatPricePk(compareAtPrice)}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">
                            {discountPercent}% OFF
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-theme-muted text-xs mt-0.5">
                      + Rs. {formatPricePk(Math.round(gstAmount))} GST (17%)
                    </p>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="text-theme-muted text-sm leading-relaxed mb-4">
                      {product.description}
                    </p>
                  )}

                  <Separator className="bg-white/5 my-3" />

                  {/* Specs */}
                  <div className="space-y-2 mb-4">
                    {product.material && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Material:</span>
                        <span className="text-theme-dark font-medium">{product.material}</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Dimensions:</span>
                        <span className="text-theme-dark font-medium">{product.dimensions}</span>
                      </div>
                    )}
                    {parsedSpecs.woodType && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Wood / Frame Type:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.woodType}</span>
                      </div>
                    )}
                    {parsedSpecs.upholstery && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Fabric / Upholstery:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.upholstery}</span>
                      </div>
                    )}
                    {parsedSpecs.finish && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Polish / Paint Finish:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.finish}</span>
                      </div>
                    )}
                    {parsedSpecs.leadTime && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Lead Time:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.leadTime}</span>
                      </div>
                    )}
                    {parsedSpecs.warranty && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Warranty:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.warranty}</span>
                      </div>
                    )}
                    {parsedSpecs.weight && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-theme-muted">Weight:</span>
                        <span className="text-theme-dark font-medium">{parsedSpecs.weight}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-theme-border my-3" />

                  {/* Quantity & Add to Cart */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center border border-theme-border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-dark"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-theme-dark text-sm">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 flex items-center justify-center text-theme-muted hover:text-theme-dark"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 bg-theme-accent hover:bg-[#b8954f] text-[#2C1E18] font-semibold tracking-wider uppercase rounded-none h-11"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={handleWishlist}
                      variant="outline"
                      className="border-theme-border rounded-none h-11 w-11 p-0"
                    >
                      <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-theme-muted'} />
                    </Button>
                  </div>

                  {/* Guarantees */}
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-theme-muted text-xs">
                      <Truck size={12} className="text-theme-accent" />
                      <span>Free Delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-theme-muted text-xs">
                      <Shield size={12} className="text-theme-accent" />
                      <span>5yr Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-theme-muted text-xs">
                      <Award size={12} className="text-theme-accent" />
                      <span>Premium</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products - From old code */}
              {relatedProducts.length > 0 && (
                <div className="border-t border-theme-border p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-[1px] bg-theme-accent" />
                        <span className="text-theme-accent text-[10px] tracking-[0.3em] uppercase">You May Also Like</span>
                      </div>
                      <h3 className="text-theme-dark text-lg font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Similar Masterpieces</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {relatedProducts.map((rp) => (
                      <div key={rp.id} className="group bg-theme-card border border-theme-border rounded-xl overflow-hidden hover:border-theme-accent/20 transition-all">
                        <div className="relative aspect-square">
                          <Image
                            src={resolveImageUrl(rp.image, rp.category)}
                            alt={rp.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                          {rp.isPremium && (
                            <Badge className="absolute top-2 left-2 bg-theme-accent text-[#2C1E18] text-[8px] tracking-wider uppercase rounded-none font-bold px-1.5 py-0.5">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-theme-dark text-xs sm:text-sm font-medium truncate group-hover:text-theme-accent transition-colors">{rp.name}</p>
                          <p className="text-theme-muted text-[10px] uppercase tracking-wider">{rp.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-theme-accent text-sm font-bold">Rs. {formatPricePk(rp.price)}</span>
                            <button
                              onClick={() => handleAddRelatedToCart(rp)}
                              className="w-7 h-7 bg-theme-accent/10 rounded-lg flex items-center justify-center text-theme-accent hover:bg-theme-accent hover:text-[#2C1E18] transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
