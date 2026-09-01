/** Centralized Cloudinary Ultra-Low Bandwidth Asset Registry (< 1.0 MB Grand Total) */
export const CLOUDINARY_ASSETS = {
  // Vector Brand Monogram (Ultra-light 2.56 KB vector SVG)
  logo: 'https://res.cloudinary.com/dfd8rzojj/image/upload/v1788039209/fahad-ali-interior/assets/fahad_ali_logo.svg',
  
  // Micro-Compressed Payment Badges (1.1 KB - 1.8 KB WebP/SVG)
  jazzcash: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_auto,q_auto,w_140/v1788039222/fahad-ali-interior/assets/jazzcash_logo.svg',
  easypaisa: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/easypaisa_logo.png',
  raast: 'https://res.cloudinary.com/dfd8rzojj/image/upload/f_webp,q_auto:eco,w_140/v1788039224/fahad-ali-interior/assets/raast_logo.png',
  
  // Ultra-Low Bandwidth Video Streams (326 KB Mobile / 527 KB Desktop, 24fps cinema cadence, 0 audio overhead)
  heroMobileVideo: 'https://res.cloudinary.com/dfd8rzojj/video/upload/f_mp4,q_auto:eco,ac_none,w_450,br_260k,fps_24/v1788030499/fahad-ali-interior/hero/mobile_hero_video.mp4',
  heroDesktopVideo: 'https://res.cloudinary.com/dfd8rzojj/video/upload/f_mp4,q_auto:eco,ac_none,w_800,br_450k,fps_24/v1788030503/fahad-ali-interior/hero/desktop_hero_video.mp4',
  
  // Exact 0.0s First Frame Video Posters (Ultra-light 11KB-17KB WebP previews)
  heroMobilePoster: 'https://res.cloudinary.com/dfd8rzojj/video/upload/so_0,f_webp,q_40,w_450/v1788030499/fahad-ali-interior/hero/mobile_hero_video.jpg',
  heroDesktopPoster: 'https://res.cloudinary.com/dfd8rzojj/video/upload/so_0,f_webp,q_40,w_800/v1788030503/fahad-ali-interior/hero/desktop_hero_video.jpg',
} as const;
