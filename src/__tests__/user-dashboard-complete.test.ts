import { describe, it, expect } from '@jest/globals';
import {
  DASHBOARD_TABS,
  formatPrice,
  buildDashboardKpis,
} from '@/components/user-dashboard/dashboard-kpis';
import { GET as userStatsGET } from '@/app/api/user/stats/route';
import { NextRequest } from 'next/server';

describe('Real User Dashboard Architecture, KPIs & Stats Suite', () => {
  describe('Tab Configuration (@/components/user-dashboard/dashboard-kpis)', () => {
    it('defines all 9 VIP user dashboard navigation tabs with unique IDs', () => {
      expect(DASHBOARD_TABS.length).toBe(9);
      const ids = DASHBOARD_TABS.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(9);

      expect(ids).toContain('overview');
      expect(ids).toContain('orders');
      expect(ids).toContain('wishlist');
      expect(ids).toContain('concierge');
      expect(ids).toContain('addresses');
      expect(ids).toContain('reviews');
      expect(ids).toContain('profile');
      expect(ids).toContain('security');
      expect(ids).toContain('settings');
    });

    it('formats Pakistani prices into local standard string', () => {
      expect(formatPrice(150000)).toBe('150,000');
      expect(formatPrice(0)).toBe('0');
      expect(formatPrice(385000)).toBe('385,000');
    });
  });

  describe('KPI Metric Aggregation (@/components/user-dashboard/dashboard-kpis)', () => {
    it('builds tab-specific VIP KPIs with calculated totals', () => {
      const kpis = buildDashboardKpis({
        totalSpentCalculated: 427500,
        totalOrdersCount: 3,
        deliveredCount: 2,
        orders: [
          { id: 'ord_1', totalAmount: 200000, status: 'DELIVERED' },
          { id: 'ord_2', totalAmount: 227500, status: 'PROCESSING' },
        ],
        mergedWishlist: [
          { id: 'w_1', product: { price: 150000 } },
          { id: 'w_2', product: { price: 200000 } },
        ],
        stats: {
          totalSpent: 427500,
          totalOrders: 3,
          completedOrders: 2,
          activeTickets: 0,
          loyaltyPoints: 427,
          wishlistCount: 2,
        },
        myReviews: [
          { id: 'r_1', rating: 5, status: 'APPROVED' },
        ],
        addresses: [
          { id: 'a_1', name: 'Home', phone: '+923001234567', address: 'Gulberg III', city: 'Lahore' },
        ],
      });

      expect(kpis.overviewKpis.length).toBe(4);
      expect(kpis.ordersKpis.length).toBe(4);
      expect(kpis.wishlistKpis.length).toBe(4);

      const spendKpi = kpis.overviewKpis.find(k => k.label === 'TOTAL EXPENDITURE');
      expect(spendKpi?.numValue).toBe(427500);

      const ordersKpi = kpis.overviewKpis.find(k => k.label === 'MY ORDERS');
      expect(ordersKpi?.numValue).toBe(3);

      const wishKpi = kpis.overviewKpis.find(k => k.label === 'HAUTE WISHLIST');
      expect(wishKpi?.numValue).toBe(2);

      const tierKpi = kpis.profileKpis.find(k => k.label === 'MEMBERSHIP TIER');
      expect(tierKpi?.numValue).toContain('Diamond');
    });
  });

  describe('User Stats Route Handler (@/app/api/user/stats/route)', () => {
    it('returns zeroed stats gracefully when session is unauthenticated', async () => {
      const req = new NextRequest('https://fahad-ali-interior.com/api/user/stats');
      const res = await userStatsGET(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.totalOrders).toBe(0);
      expect(data.totalSpent).toBe(0);
      expect(data.loyaltyPoints).toBe(0);
      expect(data.wishlistCount).toBe(0);
    });
  });
});
