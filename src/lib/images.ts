/** Canonical local product/hero images — verified ultra-high-resolution luxury photography. */
export const LOCAL_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?fm=webp&q=65&w=800',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fm=webp&q=65&w=480',
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?fm=webp&q=65&w=480',
  dining: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?fm=webp&q=65&w=480',
  wardrobe: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?fm=webp&q=65&w=480',
  chair: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?fm=webp&q=65&w=480',
} as const;

export type ImageCategory = keyof typeof LOCAL_IMAGES;

const CATEGORY_MAP: Record<string, string> = {
  Beds: LOCAL_IMAGES.bed,
  Bedroom: LOCAL_IMAGES.bed,
  'Bed Sets': LOCAL_IMAGES.bed,
  Sofas: LOCAL_IMAGES.sofa,
  Living: LOCAL_IMAGES.sofa,
  'Living Room': LOCAL_IMAGES.sofa,
  Dining: LOCAL_IMAGES.dining,
  'Dining Room': LOCAL_IMAGES.dining,
  'Dining Sets': LOCAL_IMAGES.dining,
  Wardrobes: LOCAL_IMAGES.wardrobe,
  Chairs: LOCAL_IMAGES.chair,
  Accessories: LOCAL_IMAGES.chair,
  'Center Tables': LOCAL_IMAGES.dining,
  'Coffee Tables': LOCAL_IMAGES.dining,
  'Tables': LOCAL_IMAGES.dining,
};

/**
 * Automatically compress any Cloudinary URL to ultra-fast AVIF/WebP format and perceptual auto quality.
 */
export function compressCloudinaryUrl(url: string, width = 600): string {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/f_auto') || url.includes('/q_auto')) return url;

  // Transform /image/upload/...
  return url.replace(
    /\/image\/upload\/(v\d+\/)?/,
    `/image/upload/f_auto,q_auto:good,c_limit,w_${width},dpr_auto/$1`
  ).replace(
    /\/video\/upload\/(v\d+\/)?/,
    `/video/upload/f_auto,q_auto:eco,ac_none,w_450,br_260k,fps_24/$1`
  );
}

/**
 * Optimize Unsplash URLs to deliver lightweight WebP with width capping.
 */
export function optimizeUnsplashUrl(url: string, width = 600): string {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('q', '75');
    if (!parsed.searchParams.has('w') || Number(parsed.searchParams.get('w')) > width) {
      parsed.searchParams.set('w', String(width));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Resolve a product/banner image URL for display with universal Cloudinary/CDN compression.
 */
export function resolveImageUrl(
  image: string | null | undefined,
  category?: string | null,
  width = 600
): string {
  if (!image || typeof image !== 'string' || image.trim() === '') {
    return (category && CATEGORY_MAP[category]) ? CATEGORY_MAP[category] : LOCAL_IMAGES.sofa;
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    if (image.includes('res.cloudinary.com')) {
      return compressCloudinaryUrl(image, width);
    }
    if (image.includes('images.unsplash.com')) {
      return optimizeUnsplashUrl(image, width);
    }
    return image;
  }

  if (image.startsWith('/images/3b894ebf') || image === '/logo.svg' || image === '/images/logo.svg') {
    return image;
  }

  // Any other legacy local images path -> Fall back to high-res category photography
  return (category && CATEGORY_MAP[category]) ? CATEGORY_MAP[category] : LOCAL_IMAGES.sofa;
}

export function defaultProductImage(category: string): string {
  return (category && CATEGORY_MAP[category]) ? CATEGORY_MAP[category] : LOCAL_IMAGES.sofa;
}
