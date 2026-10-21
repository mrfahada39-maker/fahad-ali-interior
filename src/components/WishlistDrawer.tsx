'use client';

import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/button';
import { useWishlistStore, useCartStore } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { create } from 'zustand';
import { formatPricePk } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/images';

// Wishlist Drawer Store
interface WishlistDrawerStore {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useWishlistDrawerStore = create<WishlistDrawerStore>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
}));

// Wishlist Drawer Panel Component
export function WishlistDrawerPanel() {
  const router = useRouter();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { isOpen, closeDrawer } = useWishlistDrawerStore();

  const handleMoveToCart = (item: (typeof items)[0]) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
    });
    removeItem(item.id);
    toast.success('Moved to cart', { description: item.name });
    setTimeout(() => openCart(), 300);
  };

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast.success('Removed from wishlist', { description: name });
  };

  const handleMoveAllToCart = () => {
    if (items.length === 0) {
      toast.error('Wishlist is empty');
      return;
    }
    items.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
      });
    });
    clearWishlist();
    toast.success(`${items.length} items moved to cart`);
    setTimeout(() => openCart(), 300);
  };

  const totalValue = items.reduce((acc, item) => acc + (item.price || 0), 0);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist Drawer"
      className="fixed inset-0 z-[99999] flex items-center justify-center sm:justify-end p-3 sm:p-6 overflow-hidden"
    >
      {/* Subtle Luxury Frosted Glass Backdrop (Zero Mobile GPU Overhead) */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 -z-10 bg-black/60 md:backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Luxury Floating Wishlist Modal Container */}
      <div
        style={{ backgroundColor: '#FCFAF7' }}
        className="w-full max-w-[440px] h-[600px] max-h-[90vh] bg-[#FCFAF7] border-2 border-[#D4AF37]/50 rounded-[28px] shadow-[0_25px_80px_rgba(44,30,24,0.18),0_0_35px_rgba(184,142,75,0.2)] flex flex-col overflow-hidden z-20 transition-all duration-200 will-change-transform"
      >
        {/* Top Brand Header */}
        <div className="relative px-5 py-4 border-b border-[#E2D6C8] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center text-[#8C6239] shadow-2xs">
              <Heart size={16} className="stroke-[2.2] fill-[#8C6239]/20" />
            </div>
            <div>
              <h2 className="font-serif font-black text-sm text-[#221814] uppercase tracking-wide flex items-center gap-1.5 leading-tight">
                My Wishlist
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FAF5EE] text-[#8C6239] border border-[#E2D1BC]">
                  {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
                </span>
              </h2>
              <p className="text-[8.5px] font-bold text-[#8C6239] uppercase tracking-[0.25em]">
                Fahad Ali Bespoke Atelier
              </p>
            </div>
          </div>

          {/* Ornate Circular Close Button (WCAG 44px Touch Target Compliant) */}
          <button
            onClick={closeDrawer}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#FAF5EE] border border-[#E2D1BC] text-[#8C6239] hover:bg-[#B88E4B] hover:text-white hover:border-[#B88E4B] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            aria-label="Close wishlist"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Wishlist Items Stream */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF6F0]">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2D1BC] flex items-center justify-center text-[#B88E4B] mb-3 shadow-xs">
              <Heart size={28} className="stroke-[1.8] fill-[#B88E4B]/15" />
            </div>
            <h3 className="font-serif font-black text-base text-[#221814]">Your Wishlist is Empty</h3>
            <p className="text-stone-500 text-xs max-w-xs mt-1 leading-relaxed">
              Discover our timeless solid sheesham masterpieces and save your preferred selections to your bespoke collection.
            </p>
            <Button
              onClick={() => {
                closeDrawer();
                router.push('/#signature-categories');
              }}
              className="mt-5 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold rounded-xl px-5 h-10 text-xs shadow-xs transition-all cursor-pointer"
            >
              Explore Collection
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#FAF6F0]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-white rounded-2xl p-3 border border-[#E7DDD0] shadow-2xs hover:border-[#B88E4B] transition-colors"
                >
                  {/* High-Res Product Thumbnail */}
                  <Link
                    href={`/product/${item.id}`}
                    prefetch={false}
                    onClick={closeDrawer}
                    className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#FAF5EE] border border-[#E2D1BC] flex items-center justify-center group"
                  >
                    <Image
                      src={resolveImageUrl(item.image, item.name)}
                      alt={item.name}
                      width={64}
                      height={64}
                      style={{ aspectRatio: '1/1' }}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Info & Move to Cart Controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <Link href={`/product/${item.id}`} prefetch={false} onClick={closeDrawer}>
                          <h3 className="text-[#221814] text-xs sm:text-sm font-black font-serif truncate hover:text-[#B88E4B] transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-[10px] font-bold text-[#8C6239] uppercase tracking-wider mt-0.5">
                          100% Solid Seasoned Wood • {item.category}
                        </p>
                      </div>
                      <span className="font-serif font-black text-xs sm:text-sm text-[#8C6222] shrink-0">
                        Rs. {formatPricePk(item.price)}
                      </span>
                    </div>

                    {/* Actions (Add to Cart & Remove) */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold rounded-lg px-3 py-1.5 text-[11px] shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-98"
                      >
                        <ShoppingBag size={12} className="stroke-[2.2]" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={13} />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Luxury Footer Summary & Move All to Cart */}
            <div className="border-t border-[#E2D6C8] p-4 bg-white space-y-3 shrink-0 shadow-[0_-4px_20px_rgba(44,30,24,0.04)]">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Saved Pieces</span>
                  <span className="text-[#221814] font-bold">
                    {items.length} {items.length === 1 ? 'Piece' : 'Pieces'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#E7DDD0]">
                  <div>
                    <span className="font-serif font-black text-sm text-[#221814]">Wishlist Total</span>
                    <p className="text-[9.5px] font-bold text-[#8C6239]">✓ Handcrafted Bespoke Value</p>
                  </div>
                  <span className="font-serif font-black text-base sm:text-lg text-[#8C6222]">
                    Rs. {formatPricePk(totalValue)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleMoveAllToCart}
                  className="flex-1 bg-gradient-to-r from-[#B88E4B] via-[#D4AF37] to-[#996515] hover:brightness-110 text-white font-serif font-bold rounded-xl h-11 text-xs sm:text-sm shadow-[0_4px_20px_rgba(184,142,75,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <ShoppingBag size={15} className="stroke-[2.2]" />
                  <span>Move All to Cart</span>
                  <ArrowRight size={14} className="stroke-[2.2]" />
                </button>
                <button
                  onClick={() => {
                    clearWishlist();
                    toast.success('Wishlist cleared');
                  }}
                  className="border border-[#E2D1BC] text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 font-bold rounded-xl h-11 px-3 text-xs transition-all cursor-pointer"
                  title="Empty wishlist"
                >
                  Clear
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WishlistDrawerPanel;
