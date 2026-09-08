'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PRIORITY_ROUTES = [
  '/shop',
  '/shop/categories',
  '/about',
  '/contact',
  '/cart',
];

const PREWARM_IMAGE_URLS = [
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1784925534/fahad-ali-interior/categories/s5onwnhftunjxnkl1atp.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1784918803/fahad-ali-interior/categories/gkz7dfmdgmhwjc1oq6i7.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1784924359/fahad-ali-interior/categories/l42atnfbez1wkqx7byy9.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1784926669/fahad-ali-interior/categories/xqe9nnbcbvna9iqvnhpk.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1785010771/fahad-ali-interior/categories/xpdpsxe6jvjs6ezukwmg.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1785011112/fahad-ali-interior/categories/on6j6aaprejwskrykplu.jpg',
  'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,c_limit,w_550/v1784927258/fahad-ali-interior/categories/b1v3zxrruuddtxkth1f9.jpg',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?fm=webp&q=65&w=600',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fm=webp&q=65&w=600',
  'https://images.unsplash.com/photo-1617806118233-18e1de247200?fm=webp&q=65&w=600',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?fm=webp&q=65&w=600',
];

export default function GlobalAssetPrewarmer() {
  const router = useRouter();
  const prewarmed = useRef(false);

  useEffect(() => {
    if (prewarmed.current || typeof window === 'undefined') return;
    prewarmed.current = true;

    const startPrewarming = () => {
      // 1. Silently prefetch Next.js page routes in background
      PRIORITY_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch {}
      });

      // 2. Pre-download and GPU-decode critical images so they appear with 0ms delay
      PREWARM_IMAGE_URLS.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        if ('decode' in img) {
          img.decode().catch(() => {});
        }
      });
    };

    // Use requestIdleCallback so prewarming never interrupts UI scrolling or user interactions
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(startPrewarming, { timeout: 2500 });
    } else {
      setTimeout(startPrewarming, 1200);
    }
  }, [router]);

  return null;
}
