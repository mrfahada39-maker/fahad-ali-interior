import { describe, it, expect, beforeEach } from '@jest/globals';
import { useCartStore, useWishlistStore } from '@/store';
import {
  encryptTotpSecret,
  decryptTotpSecret,
  verifyBackupCode,
  hashBackupCode,
} from '@/lib/totp-crypto';
import { POST as telemetryPOST } from '@/app/api/admin/telemetry/route';
import { NextRequest } from 'next/server';

describe('Real Interactive Stores, Telemetry Route & TOTP Crypto Suite', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useWishlistStore.setState({ items: [] });
  });

  describe('Zustand Cart & Wishlist State Management (@/store)', () => {
    it('adds item to cart store and calculates totals accurately', () => {
      const store = useCartStore.getState();
      store.addItem({
        id: 'prod_sheesham_king',
        name: 'Royal Sheesham King Bed',
        price: 385000,
        image: '/bed.jpg',
        category: 'Bedroom',
      });

      const updated = useCartStore.getState();
      expect(updated.items.length).toBe(1);
      expect(updated.items[0].quantity).toBe(1);
      expect(updated.getSubtotal()).toBe(385000);
      expect(updated.getItemCount()).toBe(1);

      // Increment quantity
      updated.updateQuantity('prod_sheesham_king', 2);
      expect(useCartStore.getState().getSubtotal()).toBe(770000);
      expect(useCartStore.getState().getItemCount()).toBe(2);
    });

    it('transfers item from wishlist to cart seamlessly', () => {
      const wishStore = useWishlistStore.getState();
      wishStore.addItem({
        id: 'wish_1',
        name: 'Imperial Velvet Sofa',
        price: 295000,
        image: '/sofa.jpg',
        category: 'Living Room',
      });

      expect(useWishlistStore.getState().items.length).toBe(1);

      // Move to cart
      const wishItem = useWishlistStore.getState().items[0];
      useCartStore.getState().addItem({
        id: wishItem.id,
        name: wishItem.name,
        price: wishItem.price,
        image: wishItem.image,
        category: wishItem.category,
      });
      useWishlistStore.getState().removeItem(wishItem.id);

      expect(useWishlistStore.getState().items.length).toBe(0);
      expect(useCartStore.getState().items.length).toBe(1);
      expect(useCartStore.getState().getSubtotal()).toBe(295000);
    });
  });

  describe('Real TOTP Cryptographic Operations (@/lib/totp-crypto)', () => {
    it('encrypts and decrypts TOTP secret reversibly via AES-256-GCM', () => {
      const plaintextSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = encryptTotpSecret(plaintextSecret);

      expect(encrypted).not.toBe(plaintextSecret);
      expect(encrypted.startsWith('enc:v1:')).toBe(true);

      const decrypted = decryptTotpSecret(encrypted);
      expect(decrypted).toBe(plaintextSecret);
    });

    it('hashes emergency backup codes and verifies correctly', () => {
      const plainCode = 'ABCD1234';
      const hashed = hashBackupCode(plainCode);

      expect(hashed.startsWith('bkc:v2:')).toBe(true);
      // Case-insensitive matching
      expect(verifyBackupCode('abcd1234', [hashed])).toBe(hashed);
      expect(verifyBackupCode('WRONG123', [hashed])).toBeNull();
    });
  });

  describe('Telemetry API Endpoint (@/app/api/admin/telemetry/route)', () => {
    it('accepts and records live visitor telemetry beacons', async () => {
      const req = new NextRequest('https://fahad-ali-interior.com/api/admin/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '111.119.187.2',
          'x-vercel-ip-city': 'Lahore',
          'x-vercel-ip-country': 'PK',
        },
        body: JSON.stringify({
          sessionId: 'sess_test_12345',
          pathname: '/shop',
          device: 'Desktop',
          browser: 'Chrome',
        }),
      });

      const res = await telemetryPOST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
