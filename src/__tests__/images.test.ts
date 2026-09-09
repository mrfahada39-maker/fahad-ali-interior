import { describe, it, expect } from '@jest/globals';
import {
  LOCAL_IMAGES,
  compressCloudinaryUrl,
  optimizeUnsplashUrl,
  resolveImageUrl,
  defaultProductImage,
} from '@/lib/images';

describe('Image Optimization & Delivery Pipeline', () => {
  describe('compressCloudinaryUrl', () => {
    it('injects f_auto, q_auto:good and width transformation into Cloudinary URLs', () => {
      const original = 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/sample.jpg';
      const compressed = compressCloudinaryUrl(original, 500);
      expect(compressed).toContain('f_auto,q_auto:good,c_limit,w_500');
    });

    it('transforms Cloudinary video URLs to high-performance mp4 without audio', () => {
      const original = 'https://res.cloudinary.com/dfd8rzojj/video/upload/v1788039209/hero_reel.mp4';
      const compressed = compressCloudinaryUrl(original);
      expect(compressed).toContain('f_mp4,vc_h264:high:3.1,q_auto:good,ac_none,w_540');
    });

    it('leaves already optimized or non-Cloudinary URLs unchanged', () => {
      const alreadyOptimized = 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto/sample.jpg';
      expect(compressCloudinaryUrl(alreadyOptimized)).toBe(alreadyOptimized);

      const nonCloudinary = 'https://images.unsplash.com/photo-12345';
      expect(compressCloudinaryUrl(nonCloudinary)).toBe(nonCloudinary);
    });

    it('handles empty or non-string inputs safely', () => {
      expect(compressCloudinaryUrl('')).toBe('');
      expect(compressCloudinaryUrl(null as any)).toBeNull();
    });
  });

  describe('optimizeUnsplashUrl', () => {
    it('appends auto format, crop, and quality query parameters', () => {
      const original = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6';
      const optimized = optimizeUnsplashUrl(original, 600);
      expect(optimized).toContain('auto=format');
      expect(optimized).toContain('fit=crop');
      expect(optimized).toContain('q=65');
      expect(optimized).toContain('w=600');
    });

    it('returns non-Unsplash URLs unchanged', () => {
      const external = 'https://example.com/furniture.jpg';
      expect(optimizeUnsplashUrl(external)).toBe(external);
    });
  });

  describe('resolveImageUrl and Fallbacks', () => {
    it('returns category fallback when image is missing or empty', () => {
      expect(resolveImageUrl('', 'Beds')).toBe(LOCAL_IMAGES.bed);
      expect(resolveImageUrl(null, 'Living')).toBe(LOCAL_IMAGES.sofa);
      expect(resolveImageUrl(undefined, 'Dining')).toBe(LOCAL_IMAGES.dining);
      expect(resolveImageUrl('   ', 'Wardrobes')).toBe(LOCAL_IMAGES.wardrobe);
    });

    it('returns sofa image when category is unknown and image is missing', () => {
      expect(resolveImageUrl('', 'UnknownCategory')).toBe(LOCAL_IMAGES.sofa);
    });

    it('preserves official local logos and image assets', () => {
      expect(resolveImageUrl('/logo.svg')).toBe('/logo.svg');
      expect(resolveImageUrl('/images/logo.svg')).toBe('/images/logo.svg');
    });

    it('compresses remote Cloudinary and Unsplash URLs dynamically', () => {
      const cld = 'https://res.cloudinary.com/dfd8rzojj/image/upload/v12345/product.jpg';
      const resolvedCld = resolveImageUrl(cld, 'Sofas', 400);
      expect(resolvedCld).toContain('w_400');
      expect(resolvedCld).toContain('f_auto');

      const unsplash = 'https://images.unsplash.com/photo-9999';
      const resolvedUnsplash = resolveImageUrl(unsplash, 'Dining', 400);
      expect(resolvedUnsplash).toContain('w=400');
    });
  });

  describe('defaultProductImage', () => {
    it('maps known categories to verified photography', () => {
      expect(defaultProductImage('Beds')).toBe(LOCAL_IMAGES.bed);
      expect(defaultProductImage('Sofas')).toBe(LOCAL_IMAGES.sofa);
      expect(defaultProductImage('Dining')).toBe(LOCAL_IMAGES.dining);
    });
  });
});
