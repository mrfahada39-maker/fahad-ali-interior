/** Shared storefront product shape from `/api/v1/products`. */
export type StorefrontProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image: string;
  material?: string | null;
  dimensions?: string | null;
  stockCount?: number;
  isPremium: boolean;
  images?: string[];
  avgRating?: number;
  reviewCount?: number;
  specs?: string | null;
};
