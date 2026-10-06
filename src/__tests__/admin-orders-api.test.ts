/**
 * Unit Test Suite: Admin Orders API Route (/api/admin/orders)
 * Fahad Ali Haute Interior Architecture
 *
 * Verifies:
 * 1. OPTIONS CORS headers
 * 2. GET orders with verified admin authentication & financial formatting
 * 3. GET rejection for non-admin requests (403)
 * 4. PUT order update (status, paymentStatus, trackingNumber)
 * 5. PUT rejection when ID is missing (400)
 * 6. DELETE order (soft delete / recycle bin archiving)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE, OPTIONS } from '@/app/api/admin/orders/route';
import { getVerifiedAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { moveToRecycleBin } from '@/lib/recycle-bin';

jest.mock('@/lib/admin-auth', () => ({
  getVerifiedAdmin: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/recycle-bin', () => ({
  moveToRecycleBin: jest.fn(),
}));

describe('Admin Orders API (/api/admin/orders)', () => {
  const mockAdminUser = {
    id: 'admin-1',
    name: 'Fahad Ali',
    email: 'admin@fahadaliinterior.com',
    role: 'ADMIN',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OPTIONS handler', () => {
    it('returns 204 with valid CORS and allowed methods', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Allow')).toContain('GET');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
    });
  });

  describe('GET handler', () => {
    it('rejects unauthenticated or non-admin requests with 403', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/orders');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error).toContain('Forbidden');
    });

    it('returns formatted orders when executive admin is authenticated', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(mockAdminUser);
      (db.order.findMany as any).mockResolvedValue([
        {
          id: 'ord-123456',
          discount: '5000',
          gst: '0',
          totalAmount: '380000',
          subtotal: '385000',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          items: [
            { id: 'it-1', name: 'Royal Sheesham King Bed', price: '385000', quantity: 1 },
          ],
          user: { id: 'usr-1', name: 'Ali Khan', email: 'ali@example.com', phone: '03001234567' },
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/admin/orders');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.orders).toHaveLength(1);
      expect(typeof json.orders[0].totalAmount).toBe('number');
      expect(json.orders[0].totalAmount).toBe(380000);
      expect(json.orders[0].items[0].price).toBe(385000);
    });
  });

  describe('PUT handler', () => {
    it('rejects non-admin request with 403', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        method: 'PUT',
        body: JSON.stringify({ id: 'ord-123456', status: 'SHIPPED' }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(403);
    });

    it('returns 400 if order ID is missing', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(mockAdminUser);

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        method: 'PUT',
        body: JSON.stringify({ status: 'SHIPPED' }),
      });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Order ID is required');
    });

    it('updates order status, payment status and courier tracking number successfully', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(mockAdminUser);
      (db.order.update as any).mockResolvedValue({
        id: 'ord-123456',
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        trackingNumber: 'TCS-99887766',
        discount: 0,
        gst: 0,
        subtotal: 385000,
        totalAmount: 385000,
      });

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        method: 'PUT',
        body: JSON.stringify({
          id: 'ord-123456',
          status: 'SHIPPED',
          paymentStatus: 'PAID',
          trackingNumber: 'TCS-99887766',
        }),
      });
      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.status).toBe('SHIPPED');
      expect(json.paymentStatus).toBe('PAID');
      expect(json.trackingNumber).toBe('TCS-99887766');
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-123456' },
        data: {
          status: 'SHIPPED',
          paymentStatus: 'PAID',
          trackingNumber: 'TCS-99887766',
        },
      });
    });
  });

  describe('DELETE handler', () => {
    it('returns 400 when order ID is missing', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(mockAdminUser);

      const req = new NextRequest('http://localhost:3000/api/admin/orders', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
    });

    it('archives order to recycle bin and removes it', async () => {
      (getVerifiedAdmin as any).mockResolvedValue(mockAdminUser);
      (db.order.findUnique as any).mockResolvedValue({
        id: 'ord-998877',
        shippingName: 'Tariq Mehmood',
        items: [],
      });
      (moveToRecycleBin as any).mockResolvedValue({ id: 'bin-1' });
      (db.order.delete as any).mockResolvedValue({ id: 'ord-998877' });

      const req = new NextRequest('http://localhost:3000/api/admin/orders?id=ord-998877', {
        method: 'DELETE',
      });
      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.deletedId).toBe('ord-998877');
      expect(moveToRecycleBin).toHaveBeenCalled();
    });
  });
});
