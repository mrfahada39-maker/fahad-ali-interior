'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { create } from 'zustand';
import { formatPricePk } from '@/lib/format-price';
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

  const handleMoveToCart = (item: typeof items[0]) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-theme-bg border-l border-theme-accent/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-theme-border">
              <div className="flex items-center gap-2">
                <Heart className="text-theme-accent" size={20} />
                <h2 className="text-theme-dark font-semibold text-lg tracking-wide">My Wishlist</h2>
                <span className="text-theme-muted text-sm">({items.length})</span>
              </div>
              <button onClick={closeDrawer} className="text-theme-muted hover:text-theme-dark p-1">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <Heart className="text-theme-muted mb-4" size={64} />
                <p className="text-theme-muted text-lg mb-2">Your wishlist is empty</p>
                <p className="text-theme-muted text-sm text-center">
                  Save your favorite furniture pieces here for later
                </p>
                <Button
                  onClick={() => {
                    closeDrawer();
                    router.push('/shop');
                  }}
                  className="mt-6 bg-theme-accent hover:bg-[#b8954f] text-[#2C1E18] font-semibold tracking-wider uppercase rounded-none px-6"
                >
                  Browse Collection
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 bg-theme-card rounded-xl p-3 border border-theme-border"
                    >
                      {/* Image */}
                      <Link
                        href={`/product/${item.id}`}
                        prefetch={true}
                        onClick={closeDrawer}
                        className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-theme-card block"
                      >
                        <Image
                          src={resolveImageUrl(item.image, item.category)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`} prefetch={true} onClick={closeDrawer}>
                          <h3 className="text-theme-dark text-sm font-medium line-clamp-1 hover:text-[#B88E4B] transition-colors">{item.name}</h3>
                        </Link>
                        <p className="text-theme-muted text-xs mt-0.5">{item.category}</p>
                        <p className="text-theme-accent text-sm font-semibold mt-1">
                          Rs. {formatPricePk(item.price)}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            onClick={() => handleMoveToCart(item)}
                            className="bg-theme-accent hover:bg-[#b8954f] text-[#2C1E18] text-[10px] tracking-wider uppercase rounded-none h-7 px-3 font-semibold"
                          >
                            <ShoppingBag size={12} className="mr-1" />
                            Add to Cart
                          </Button>
                          <button
                            onClick={() => handleRemove(item.id, item.name)}
                            className="text-theme-muted hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-theme-border p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">{items.length} saved item{items.length !== 1 ? 's' : ''}</span>
                    <span className="text-theme-muted">Total value</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span />
                    <span className="text-theme-accent">Rs. {formatPricePk(items.reduce((t, i) => t + i.price, 0))}</span>
                  </div>

                  <Button
                    onClick={handleMoveAllToCart}
                    className="w-full bg-theme-accent hover:bg-[#b8954f] text-[#2C1E18] font-semibold tracking-wider uppercase rounded-none h-12"
                  >
                    <ShoppingBag size={16} className="mr-2" />
                    Move All to Cart
                  </Button>
                  <button
                    onClick={() => { clearWishlist(); toast.success('Wishlist cleared'); }}
                    className="w-full text-center text-theme-muted text-xs tracking-wider uppercase hover:text-red-400 transition-colors py-1"
                  >
                    Clear Wishlist
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
