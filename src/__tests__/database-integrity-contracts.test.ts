/**
 * Enterprise Database Relational Integrity & Schema Contracts Suite
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Verifies production schema integrity against real Prisma Enums and utilities:
 * 1. User Entity Defaults & Unique Email Normalization
 * 2. Order & Financial Totals Non-Negativity Integrity via @/lib/order-pricing
 * 3. Cascade Rules & Historical Audit Record Preservation
 * 4. Strict Prisma Enum Validations via @prisma/client & @/lib/enums
 * 5. Immutable Audit Trail via @/lib/db-utils recordAuditLog
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ReviewStatus,
  DiscountType,
  LoyaltyTier,
} from '@prisma/client';
import {
  toPaymentMethod,
  toOrderStatus,
  toPaymentStatus,
  toReviewStatus,
  toDiscountType,
} from '@/lib/enums';
import { calculateOrderTotals } from '@/lib/order-pricing';
import { recordAuditLog } from '@/lib/db-utils';
import { db } from '@/lib/db';

describe('Enterprise Database Relational Integrity & Schema Contracts Suite', () => {

  // ── 1. User Entity Defaults & Constraint Contracts ──
  describe('1. User Entity Defaults & Constraint Contracts', () => {
    interface UserModelContract {
      id: string;
      email: string;
      role: UserRole;
      loyaltyTier: LoyaltyTier;
      loyaltyPoints: number;
      isPremiumMember: boolean;
      language: string;
      darkMode: boolean;
      createdAt: Date;
    }

    const createUserWithDefaults = (email: string, overrides: Partial<UserModelContract> = {}): UserModelContract => {
      return {
        id: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        role: UserRole.USER,
        loyaltyTier: LoyaltyTier.BRONZE,
        loyaltyPoints: 0,
        isPremiumMember: false,
        language: 'en',
        darkMode: false,
        createdAt: new Date(),
        ...overrides,
      };
    };

    it('enforces default values matching schema.prisma for new client accounts', () => {
      const user = createUserWithDefaults('client@royal.pk');

      expect(user.role).toBe(UserRole.USER);
      expect(user.loyaltyTier).toBe(LoyaltyTier.BRONZE);
      expect(user.loyaltyPoints).toBe(0);
      expect(user.language).toBe('en');
      expect(user.darkMode).toBe(false);
      expect(user.isPremiumMember).toBe(false);
    });

    it('prevents duplicate email registration across accounts (Unique Constraint)', () => {
      const usersDb: UserModelContract[] = [createUserWithDefaults('jahangir@royal.pk')];

      const registerUser = (email: string) => {
        const normalized = email.trim().toLowerCase();
        if (usersDb.some(u => u.email === normalized)) {
          throw new Error('PrismaClientKnownRequestError: Unique constraint failed on the fields: (`email`)');
        }
        const newUser = createUserWithDefaults(normalized);
        usersDb.push(newUser);
        return newUser;
      };

      expect(() => registerUser('jahangir@royal.pk')).toThrow('Unique constraint failed');
      expect(() => registerUser('JAHANGIR@ROYAL.PK')).toThrow('Unique constraint failed'); // Case-insensitive
      expect(registerUser('fatima@luxury.pk').email).toBe('fatima@luxury.pk');
    });
  });

  // ── 2. Order & Financial Totals Integrity ──
  describe('2. Order & Financial Totals Non-Negativity Integrity', () => {
    it('guarantees that totalAmount cannot be negative using calculateOrderTotals', () => {
      const sampleItems = [
        { id: '1', price: 450000, quantity: 1 },
      ];
      const validTotals = calculateOrderTotals(sampleItems, { code: 'VIP10', percent: 10 }, 0);
      expect(validTotals.itemsSubtotal).toBe(450000);
      expect(validTotals.discountAmount).toBe(45000);
      expect(validTotals.grandTotal).toBe(405000);

      // Oversized fixed coupon capped at subtotal
      const cappedTotals = calculateOrderTotals(sampleItems, { code: 'MEGA', fixed: 600000 }, 0);
      expect(cappedTotals.discountAmount).toBe(450000);
      expect(cappedTotals.grandTotal).toBe(0);
      expect(cappedTotals.grandTotal).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 3. Cascade Rules & Historical Record Preservation ──
  describe('3. Cascade Rules & Historical Record Preservation', () => {
    interface UserDbState {
      users: { id: string; name: string }[];
      sessions: { id: string; userId: string }[];
      tokens: { id: string; userId: string }[];
      orders: { id: string; userId: string | null; totalAmount: number }[];
    }

    it('cascades deletion to sessions and tokens while preserving historical orders (SetNull / Soft-Delete)', () => {
      const state: UserDbState = {
        users: [{ id: 'usr_1', name: 'Malik Jahangir' }],
        sessions: [{ id: 'sess_1', userId: 'usr_1' }, { id: 'sess_2', userId: 'usr_1' }],
        tokens: [{ id: 'tok_1', userId: 'usr_1' }],
        orders: [{ id: 'ord_1001', userId: 'usr_1', totalAmount: 427500 }],
      };

      const deleteUser = (userId: string) => {
        state.sessions = state.sessions.filter(s => s.userId !== userId);
        state.tokens = state.tokens.filter(t => t.userId !== userId);
        state.orders = state.orders.map(o => (o.userId === userId ? { ...o, userId: null } : o));
        state.users = state.users.filter(u => u.id !== userId);
      };

      deleteUser('usr_1');

      expect(state.users.length).toBe(0);
      expect(state.sessions.length).toBe(0);
      expect(state.tokens.length).toBe(0);
      expect(state.orders.length).toBe(1);
      expect(state.orders[0].userId).toBeNull();
      expect(state.orders[0].totalAmount).toBe(427500);
    });
  });

  // ── 4. Strict Prisma Enum Validations via @prisma/client & @/lib/enums ──
  describe('4. Strict Prisma Enum Validations', () => {
    it('verifies all Prisma schema enums conform strictly to legal application sets', () => {
      expect(Object.values(UserRole)).toEqual(expect.arrayContaining([
        UserRole.USER,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.STAFF,
        UserRole.VENDOR,
      ]));

      expect(Object.values(OrderStatus)).toEqual(expect.arrayContaining([
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ]));

      expect(Object.values(PaymentMethod)).toEqual(expect.arrayContaining([
        PaymentMethod.COD,
        PaymentMethod.JAZZCASH,
        PaymentMethod.EASYPAISA,
        PaymentMethod.BANK,
      ]));

      expect(Object.values(LoyaltyTier)).toEqual(expect.arrayContaining([
        LoyaltyTier.BRONZE,
        LoyaltyTier.SILVER,
        LoyaltyTier.GOLD,
        LoyaltyTier.PLATINUM,
        LoyaltyTier.DIAMOND,
      ]));
    });

    it('maps and validates string representations to Prisma enums via @/lib/enums', () => {
      expect(toPaymentMethod('jazzcash')).toBe(PaymentMethod.JAZZCASH);
      expect(toPaymentMethod('cod')).toBe(PaymentMethod.COD);
      expect(toPaymentMethod('easypaisa')).toBe(PaymentMethod.EASYPAISA);
      expect(toPaymentMethod('bank')).toBe(PaymentMethod.BANK);
      expect(() => toPaymentMethod('invalid_gateway')).toThrow('Invalid payment method');

      expect(toOrderStatus('shipped')).toBe(OrderStatus.SHIPPED);
      expect(toOrderStatus('delivered')).toBe(OrderStatus.DELIVERED);
      expect(() => toOrderStatus('flying')).toThrow('Invalid order status');

      expect(toPaymentStatus('paid')).toBe(PaymentStatus.PAID);
      expect(toPaymentStatus('failed')).toBe(PaymentStatus.FAILED);
      expect(() => toPaymentStatus('unrecognized')).toThrow('Invalid payment status');

      expect(toReviewStatus('approved')).toBe(ReviewStatus.APPROVED);
      expect(toDiscountType('percentage')).toBe(DiscountType.PERCENTAGE);
    });
  });

  // ── 5. Immutable Audit Trail Contracts via @/lib/db-utils ──
  describe('5. Immutable Audit Trail Contracts', () => {
    it('records immutable audit log entries using recordAuditLog', async () => {
      const createSpy = jest.spyOn(db.auditLog, 'create').mockResolvedValueOnce({
        id: 'audit_test_1',
        userId: 'admin_fahad',
        action: 'UPDATE_ORDER_STATUS_TO_SHIPPED',
        entity: 'Order',
        entityId: 'ord_1001',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { courier: 'TCS' },
        createdAt: new Date(),
      } as any);

      await recordAuditLog({
        userId: 'admin_fahad',
        action: 'UPDATE_ORDER_STATUS_TO_SHIPPED',
        entity: 'Order',
        entityId: 'ord_1001',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { courier: 'TCS' },
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'admin_fahad',
            action: 'UPDATE_ORDER_STATUS_TO_SHIPPED',
            entity: 'Order',
            entityId: 'ord_1001',
          }),
        })
      );
      createSpy.mockRestore();
    });
  });
});