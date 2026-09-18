/**
 * Enterprise Concurrency, Race Conditions & Inventory Double-Spending Suite
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Scenarios:
 * 1. The "Last Item in Stock" 10-User Simultaneous Checkout Race Condition
 * 2. Single-Use VIP Coupon Simultaneous Multi-Tab Redemption Race
 * 3. Concurrent Loyalty Points Double-Spending Prevention
 * 4. Optimistic Locking & Mutex Atomic State Transitions
 */

describe('Enterprise Concurrency, Race Conditions & Inventory Double-Spending Suite', () => {

  // ── 1. The "Last Item in Stock" 10-User Simultaneous Checkout ──
  describe('1. The "Last Item in Stock" Concurrent Checkout Simulation', () => {
    interface InventoryItem {
      id: string;
      title: string;
      stock: number;
    }

    interface CheckoutResult {
      userId: string;
      success: boolean;
      orderId?: string;
      error?: string;
    }

    it('guarantees that 10 simultaneous checkouts on stock=1 yield strictly 1 success, 9 failures, and 0 stock', async () => {
      const inventory: InventoryItem = {
        id: 'prod_sheesham_king_bed',
        title: 'Masterpiece Sheesham King Bed',
        stock: 1, // Only 1 in warehouse!
      };

      // Atomic simulated database transaction lock (mutex)
      let isDbLocked = false;
      const processCheckout = async (userId: string): Promise<CheckoutResult> => {
        // Simulate random network latency (5ms - 25ms)
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 20) + 5));

        // Atomic Mutex / Row Lock acquisition
        while (isDbLocked) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
        isDbLocked = true;

        try {
          // Check stock inside transaction
          if (inventory.stock < 1) {
            return { userId, success: false, error: 'Insufficient stock: Item already acquired by another patron' };
          }

          // Atomic deduction
          inventory.stock -= 1;
          const orderId = `ord_success_${userId}_${Date.now()}`;
          return { userId, success: true, orderId };
        } finally {
          isDbLocked = false;
        }
      };

      // 10 simultaneous customer requests
      const userIds = Array.from({ length: 10 }, (_, i) => `patron_${i + 1}`);
      const checkoutPromises = userIds.map(uid => processCheckout(uid));

      const results = await Promise.all(checkoutPromises);

      const successfulCheckouts = results.filter(r => r.success);
      const failedCheckouts = results.filter(r => !r.success);

      // Strict mathematical assertions
      expect(successfulCheckouts.length).toBe(1);
      expect(failedCheckouts.length).toBe(9);
      expect(inventory.stock).toBe(0); // STRICT ZERO, NEVER NEGATIVE
      expect(failedCheckouts[0].error).toContain('Insufficient stock');
    });
  });

  // ── 2. Single-Use Coupon Simultaneous Multi-Tab Redemption ──
  describe('2. Single-Use Coupon Multi-Tab Concurrent Redemption', () => {
    interface CouponRecord {
      code: string;
      isRedeemed: boolean;
      redeemedBy?: string;
    }

    it('ensures single-use coupon cannot be double-spent across simultaneous browser tabs', async () => {
      const coupon: CouponRecord = {
        code: 'VIP_ONE_TIME_ROYAL',
        isRedeemed: false,
      };

      let lock = false;
      const redeemCoupon = async (tabSessionId: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 15)));

        while (lock) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
        lock = true;

        try {
          if (coupon.isRedeemed) {
            return { success: false, error: 'Coupon has already been redeemed' };
          }
          coupon.isRedeemed = true;
          coupon.redeemedBy = tabSessionId;
          return { success: true, code: coupon.code };
        } finally {
          lock = false;
        }
      };

      // 3 simultaneous tabs submitting coupon redemption
      const attempts = await Promise.all([
        redeemCoupon('tab_chrome_1'),
        redeemCoupon('tab_chrome_2'),
        redeemCoupon('tab_mobile_1'),
      ]);

      const successes = attempts.filter(a => a.success);
      const rejections = attempts.filter(a => !a.success);

      expect(successes.length).toBe(1);
      expect(rejections.length).toBe(2);
      expect(coupon.isRedeemed).toBe(true);
      expect(rejections[0].error).toBe('Coupon has already been redeemed');
    });
  });

  // ── 3. Concurrent Loyalty Points Double-Spending ──
  describe('3. Concurrent Loyalty Points Double-Spending Prevention', () => {
    interface CustomerAccount {
      id: string;
      loyaltyPoints: number;
    }

    it('prevents simultaneous orders from deducting more loyalty points than available balance', async () => {
      const customer: CustomerAccount = {
        id: 'cust_lahore_vip',
        loyaltyPoints: 10000, // Worth 10,000 PKR
      };

      let lock = false;
      const deductPoints = async (pointsToSpend: number, orderRef: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 10)));

        while (lock) {
          await new Promise(resolve => setTimeout(resolve, 2));
        }
        lock = true;

        try {
          if (customer.loyaltyPoints < pointsToSpend) {
            return { success: false, error: 'Insufficient loyalty balance' };
          }
          customer.loyaltyPoints -= pointsToSpend;
          return { success: true, remainingBalance: customer.loyaltyPoints, orderRef };
        } finally {
          lock = false;
        }
      };

      // Customer attempts to spend 10,000 points on Order A and 10,000 points on Order B at the same time
      const [orderA, orderB] = await Promise.all([
        deductPoints(10000, 'ord_A'),
        deductPoints(10000, 'ord_B'),
      ]);

      const results = [orderA, orderB];
      const successfulDeductions = results.filter(r => r.success);
      const failedDeductions = results.filter(r => !r.success);

      expect(successfulDeductions.length).toBe(1);
      expect(failedDeductions.length).toBe(1);
      expect(customer.loyaltyPoints).toBe(0); // Cannot go to -10000
      expect(failedDeductions[0].error).toBe('Insufficient loyalty balance');
    });
  });

  // ── 4. Optimistic Locking & Version Conflicts ──
  describe('4. Optimistic Locking & Version Conflicts Defense', () => {
    interface VersionedOrder {
      id: string;
      status: string;
      version: number; // Row version for optimistic locking
    }

    it('rejects stale concurrent updates when row version does not match expected state', () => {
      const dbOrder: VersionedOrder = {
        id: 'ord_version_test',
        status: 'PROCESSING',
        version: 1,
      };

      const updateOrderStatus = (expectedVersion: number, newStatus: string) => {
        if (dbOrder.version !== expectedVersion) {
          throw new Error('OptimisticLockException: Order was updated by another concurrent administrator. Please refresh.');
        }
        dbOrder.status = newStatus;
        dbOrder.version += 1;
        return dbOrder;
      };

      // Admin 1 updates with version 1 -> succeeds, version becomes 2
      const resAdmin1 = updateOrderStatus(1, 'CRAFTING');
      expect(resAdmin1.status).toBe('CRAFTING');
      expect(resAdmin1.version).toBe(2);

      // Admin 2 (who had old version 1 cached) attempts update -> rejected!
      expect(() => updateOrderStatus(1, 'SHIPPED')).toThrow('OptimisticLockException');
      expect(dbOrder.status).toBe('CRAFTING'); // Preserved
    });
  });
});