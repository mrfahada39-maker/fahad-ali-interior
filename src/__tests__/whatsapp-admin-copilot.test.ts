import { WhatsAppAdminCopilot } from '@/lib/whatsapp-admin-copilot';
import { db } from '@/lib/db';
import { WhatsAppService } from '@/lib/whatsapp';

// Mock DB and WhatsAppService
jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inquiry: {
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/whatsapp', () => ({
  WhatsAppService: {
    generateDailyReport: jest.fn().mockResolvedValue('MOCK_DAILY_REPORT_SUCCESS'),
    sendCustomerOrderShipped: jest.fn().mockResolvedValue(true),
  },
}));

describe('WhatsAppAdminCopilot Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Question-Wise Menu Generation', () => {
    it('returns the rich question-wise executive menu with all 7 options', () => {
      const menu = WhatsAppAdminCopilot.getAdminMenuMessage();
      expect(menu).toContain('FAHAD ALI INTERIOR — AI EXECUTIVE MANAGER');
      expect(menu).toContain('Assalam-o-Alaikum Sir Fahad!');
      expect(menu).toContain('Sawal 1: Sales & Hisaab');
      expect(menu).toContain('Sawal 2: Pending Orders & Slips');
      expect(menu).toContain('Sawal 3: Order Dispatch & Tracking');
      expect(menu).toContain('Sawal 4: Stock Update');
      expect(menu).toContain('Sawal 5: Price Change');
      expect(menu).toContain('Sawal 6: Naya Discount Coupon');
      expect(menu).toContain('Sawal 7: Customer Inquiries');
    });

    it('returns menu on greetings like "hi", "aoa", "salam", "menu"', async () => {
      const resAoa = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'Aoa');
      expect(resAoa).toContain('Sawal 1: Sales & Hisaab');

      const resMenu = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'menu');
      expect(resMenu).toContain('Sawal 1: Sales & Hisaab');
    });
  });

  describe('2. Option 1: Sales & Hisaab Command', () => {
    it('handles option 1 and calls WhatsAppService.generateDailyReport', async () => {
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '1');
      expect(res).toBe('MOCK_DAILY_REPORT_SUCCESS');
      expect(WhatsAppService.generateDailyReport).toHaveBeenCalled();
    });

    it('handles natural Urdu phrases like "aaj ki sale batao"', async () => {
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'aaj ki sale batao');
      expect(res).toBe('MOCK_DAILY_REPORT_SUCCESS');
    });
  });

  describe('3. Option 2: Pending Orders Command', () => {
    it('returns empty notice when no pending orders exist', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValueOnce([]);
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '2');
      expect(res).toContain('Alhamdulillah Sir, is waqt koi pending order nahi hai');
    });

    it('formats pending orders with verify commands when orders exist', async () => {
      (db.order.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'ord_12345678',
          shippingName: 'Hamza Khan',
          shippingPhone: '03001234567',
          totalAmount: 95000,
          paymentScreenshot: 'https://example.com/slip.jpg',
          items: [{ name: 'Velvet Sofa', quantity: 1 }],
        },
      ]);

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'pending orders');
      expect(res).toContain('PENDING ORDERS FOR VERIFICATION');
      expect(res).toContain('Hamza Khan');
      expect(res).toContain('PKR 95,000');
      expect(res).toContain('verify 345678');
    });
  });

  describe('4. Option 3: Dispatch & Tracking', () => {
    it('asks for Order ID when none is provided', async () => {
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '3');
      expect(res).toContain('kis Order ID ko dispatch/shipped mark karna chahte hain');
    });

    it('updates order to SHIPPED and notifies customer when valid ID provided', async () => {
      (db.order.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'ord_abcdef123456',
        shippingName: 'Farhan Tariq',
        shippingPhone: '03211234567',
        items: [{ name: 'Royal Dining Table', quantity: 1 }],
      });

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'ship 123456');
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'SHIPPED' },
        })
      );
      expect(WhatsAppService.sendCustomerOrderShipped).toHaveBeenCalled();
      expect(res).toContain('Order Updated Successfully');
      expect(res).toContain('SHIPPED');
    });
  });

  describe('5. Option 4: Stock Update', () => {
    it('prompts with example format if stock command is incomplete', async () => {
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '4');
      expect(res).toContain('stock <Item Name> <Quantity>');
    });

    it('updates stock in database when valid item and quantity are given', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'prod_sofa_1',
          name: 'Emerald Velvet Sofa',
          stockCount: 3,
        },
      ]);

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'stock Velvet Sofa 12');
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: 'prod_sofa_1' },
        data: { stockCount: 12 },
      });
      expect(res).toContain('Stock Updated Successfully Sir');
      expect(res).toContain('12 units');
    });
  });

  describe('6. Option 5: Price Change', () => {
    it('prompts with format when price command is incomplete', async () => {
      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '5');
      expect(res).toContain('price <Item Name> <Amount in PKR>');
    });

    it('updates price in database when valid product and price are given', async () => {
      (db.product.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'prod_bed_1',
          name: 'Royal Heritage Bed',
          price: 150000,
        },
      ]);

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'price Royal Bed 175000');
      expect(db.product.update).toHaveBeenCalled();
      expect(res).toContain('Price Updated Successfully Sir');
      expect(res).toContain('175,000');
    });
  });

  describe('7. Option 6: Coupon Creation', () => {
    it('creates active percentage coupon code', async () => {
      (db.coupon.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', 'coupon EID20 20%');
      expect(db.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'EID20',
            discountType: 'PERCENTAGE',
            isActive: true,
          }),
        })
      );
      expect(res).toContain('Coupon Activated Successfully Sir');
      expect(res).toContain('EID20');
      expect(res).toContain('20% OFF');
    });
  });

  describe('8. Option 7: Customer Inquiries', () => {
    it('fetches latest inquiries and formatted click-to-chat links', async () => {
      (db.inquiry.findMany as jest.Mock).mockResolvedValueOnce([
        {
          roomType: 'Master Bedroom',
          budget: 500000,
          description: 'Full luxury wall paneling and custom wardrobe',
          user: { name: 'Ayesha Khan', phone: '03214567890' },
        },
      ]);
      (db.message.findMany as jest.Mock).mockResolvedValueOnce([]);

      const res = await WhatsAppAdminCopilot.processAdminCommand('923207006110', '7');
      expect(res).toContain('LATEST CUSTOMER INQUIRIES & MESSAGES');
      expect(res).toContain('Master Bedroom');
      expect(res).toContain('Ayesha Khan');
      expect(res).toContain('wa.me/923214567890');
    });
  });
});
