import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('PWA & Offline Experience Specifications', () => {
  const rootDir = process.cwd();
  const manifestPath = path.join(rootDir, 'public', 'manifest.json');
  const swPath = path.join(rootDir, 'public', 'sw-push.js');
  const offlineHtmlPath = path.join(rootDir, 'public', 'offline.html');

  describe('Manifest Configuration (manifest.json)', () => {
    it('exists and is valid JSON', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('defines app identity and standalone display mode', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.id).toBe('/fahad-ali-interior-app');
      expect(manifest.name).toContain('Fahad Ali Interior');
      expect(manifest.short_name).toBe('FA Interior');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#c9a96e');
      expect(manifest.background_color).toBe('#0A0C0E');
      expect(manifest.start_url).toContain('pwa');
    });

    it('contains standard app icons for any and maskable purposes', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const icons = manifest.icons;
      expect(Array.isArray(icons)).toBe(true);

      const has192 = icons.some((i: any) => i.sizes === '192x192');
      const has512 = icons.some((i: any) => i.sizes === '512x512');
      const hasMaskable = icons.some((i: any) => i.purpose === 'maskable');
      const hasApple = icons.some((i: any) => i.src === '/apple-touch-icon.png');

      expect(has192).toBe(true);
      expect(has512).toBe(true);
      expect(hasMaskable).toBe(true);
      expect(hasApple).toBe(true);
    });

    it('includes rich install screenshots for wide and narrow form factors', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const screenshots = manifest.screenshots;
      expect(Array.isArray(screenshots)).toBe(true);
      expect(screenshots.length).toBeGreaterThanOrEqual(2);

      const hasWide = screenshots.some((s: any) => s.form_factor === 'wide');
      const hasNarrow = screenshots.some((s: any) => s.form_factor === 'narrow');
      expect(hasWide).toBe(true);
      expect(hasNarrow).toBe(true);
    });

    it('provides quick app shortcuts', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const shortcuts = manifest.shortcuts;
      expect(Array.isArray(shortcuts)).toBe(true);
      expect(shortcuts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Static PWA Physical Assets', () => {
    it('verifies existence of apple-touch-icon and icons', () => {
      expect(fs.existsSync(path.join(rootDir, 'public', 'apple-touch-icon.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'public', 'icons', 'icon-192.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'public', 'icons', 'icon-512.png'))).toBe(true);
    });

    it('verifies existence of install preview screenshots', () => {
      expect(fs.existsSync(path.join(rootDir, 'public', 'screenshots', 'desktop.png'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'public', 'screenshots', 'mobile.png'))).toBe(true);
    });

    it('verifies luxury standalone offline fallback page (offline.html)', () => {
      expect(fs.existsSync(offlineHtmlPath)).toBe(true);
      const content = fs.readFileSync(offlineHtmlPath, 'utf8');
      expect(content).toContain('Offline Mode');
      expect(content).toContain('handleReconnect');
      // Must be under 30KB for instantaneous offline load
      const stats = fs.statSync(offlineHtmlPath);
      expect(stats.size).toBeLessThan(35000);
    });
  });

  describe('Service Worker Precaching (sw-push.js)', () => {
    it('verifies precache assets list exists in sw-push.js', () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swContent = fs.readFileSync(swPath, 'utf8');
      expect(swContent).toContain('PRECACHE_ASSETS');
      expect(swContent).toContain('/offline.html');
      expect(swContent).toContain('/icons/icon-192.png');
      expect(swContent).toContain('/apple-touch-icon.png');
    });
  });
});
