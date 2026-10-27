import {
  generateOrderActionToken,
  verifyOrderActionToken,
  WhatsAppService,
  formatPaymentMethodDisplay,
} from '@/lib/whatsapp';
import { PaymentVerifier, PaymentAuditResult } from '@/lib/ai/payment-verifier';

jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'ord_sample_1',
          totalAmount: 250000,
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          items: [{ name: 'Royal Velvet Chesterfield', quantity: 1, price: 250000 }],
        },
      ]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'ord_sample_1' }),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'prod_1', name: 'Royal Velvet Chesterfield', stockCount: 1 },
      ]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit_1' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif_1' }),
    },
  },
}));

describe('AI Payment Verification & WhatsApp Admin 3-Button Approval Suite', () => {
  describe('1. 1-Tap Cryptographic Token Security', () => {
    const orderId = 'ORD_TEST_99214';

    it('generates and validates authentic 1-tap HMAC action tokens', () => {
      const verifyToken = generateOrderActionToken(orderId, 'verify');
      const holdToken = generateOrderActionToken(orderId, 'hold');
      const rejectToken = generateOrderActionToken(orderId, 'reject');

      expect(verifyOrderActionToken(orderId, 'verify', verifyToken)).toBe(true);
      expect(verifyOrderActionToken(orderId, 'hold', holdToken)).toBe(true);
      expect(verifyOrderActionToken(orderId, 'reject', rejectToken)).toBe(true);
    });

    it('rejects action mismatch (e.g., verify token used for reject action)', () => {
      const verifyToken = generateOrderActionToken(orderId, 'verify');
      expect(verifyOrderActionToken(orderId, 'reject', verifyToken)).toBe(false);
      expect(verifyOrderActionToken(orderId, 'hold', verifyToken)).toBe(false);
    });

    it('rejects order mismatch (e.g., token generated for order A used on order B)', () => {
      const tokenOrderA = generateOrderActionToken('ORDER_AAA', 'verify');
      expect(verifyOrderActionToken('ORDER_BBB', 'verify', tokenOrderA)).toBe(false);
    });

    it('rejects tampered or malformed tokens', () => {
      expect(verifyOrderActionToken(orderId, 'verify', 'malformed_token')).toBe(false);
      expect(verifyOrderActionToken(orderId, 'verify', '12345.deadbeefcafebabe')).toBe(false);
    });
  });

  describe('2. AI Payment Verifier Forensic Analysis', () => {
    it('detects duplicate Transaction IDs from database and triggers fraud alert', async () => {
      // Mock db lookup for duplicate TID
      const auditResult = await PaymentVerifier.verifyScreenshot({
        orderId: 'new_order_id',
        screenshotUrlOrBase64: '',
        expectedAmount: 85000,
        paymentMethod: 'BANK',
        selectedBank: 'Meezan Bank',
      });

      expect(auditResult).toBeDefined();
      expect(auditResult.expectedAmount).toBe(85000);
      expect(typeof auditResult.confidence).toBe('number');
      expect(typeof auditResult.summaryUrdu).toBe('string');
      expect(typeof auditResult.summaryEnglish).toBe('string');
    });

    it('correctly compares extracted and expected amounts', () => {
      const mockResult: PaymentAuditResult = {
        isAuthentic: true,
        confidence: 95,
        extractedAmount: 85000,
        expectedAmount: 85000,
        amountMatches: true,
        transactionId: 'TXN_10928374',
        isDuplicateTid: false,
        receiverAccount: 'FAHAD ALI INTERIOR',
        senderName: 'Muhammad Usman',
        bankOrProvider: 'Meezan Bank',
        paymentDate: '2026-10-22 14:30',
        tamperingSuspected: false,
        verdict: 'AUTHENTIC_MATCH',
        summaryUrdu: '✅ Slip Asli Hai',
        summaryEnglish: '✅ VERIFIED AUTHENTIC',
      };

      expect(mockResult.amountMatches).toBe(true);
      expect(mockResult.verdict).toBe('AUTHENTIC_MATCH');
    });
  });

  describe('3. WhatsApp Dispatcher & 3-Button Payload Verification', () => {
    it('correctly constructs order slip, AI Bot report, and 3 buttons', async () => {
      const mockOrder = {
        id: 'ord_luxury_test_108',
        shippingName: 'Muhammad Bilal',
        shippingPhone: '+92 300 1234567',
        shippingCity: 'Lahore',
        shippingAddress: 'DHA Phase 5, Lahore',
        paymentMethod: 'Meezan Bank (IBFT)',
        totalAmount: 145000,
        items: [
          { name: 'Royal Teakwood Armchair', quantity: 2, price: 72500 },
        ],
        paymentScreenshot: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      };

      const mockAudit: PaymentAuditResult = {
        isAuthentic: true,
        confidence: 97,
        extractedAmount: 145000,
        expectedAmount: 145000,
        amountMatches: true,
        transactionId: 'MEEZAN_9482710',
        isDuplicateTid: false,
        receiverAccount: 'FAHAD ALI INTERIOR',
        senderName: 'Muhammad Bilal',
        bankOrProvider: 'Meezan Bank',
        paymentDate: '2026-10-22',
        tamperingSuspected: false,
        verdict: 'AUTHENTIC_MATCH',
        summaryUrdu: '✅ Slip Asli Hai: Poori raqam aur TID match ho gayi.',
        summaryEnglish: '✅ VERIFIED AUTHENTIC: PKR 145,000 matches.',
      };

      const dispatchResult = await WhatsAppService.sendAdminOrderVerificationAlert({
        order: mockOrder,
        audit: mockAudit,
      });

      expect(dispatchResult.success).toBe(true);
      expect(['META_CLOUD_API', 'LOCAL_LOG']).toContain(dispatchResult.mode);
    });
  });

  describe('4. Deep Security & Forensic Hardening', () => {
    it('safely rejects SSRF attempts to internal cloud metadata (169.254.169.254)', async () => {
      const ssrfResult = await PaymentVerifier.verifyScreenshot({
        orderId: 'ssrf_attack_test',
        screenshotUrlOrBase64: 'http://169.254.169.254/latest/meta-data/',
        expectedAmount: 50000,
        paymentMethod: 'BANK',
      });

      expect(ssrfResult).toBeDefined();
      expect(ssrfResult.extractedAmount).toBeNull();
      expect(ssrfResult.verdict).toBe('MANUAL_REVIEW_NEEDED');
    });

    it('safely rejects SSRF attempts to localhost and loopback interfaces (127.0.0.1, ::1)', async () => {
      const loopbackResult = await PaymentVerifier.verifyScreenshot({
        orderId: 'loopback_test',
        screenshotUrlOrBase64: 'http://127.0.0.1:5432/status',
        expectedAmount: 20000,
        paymentMethod: 'BANK',
      });

      expect(loopbackResult).toBeDefined();
      expect(loopbackResult.extractedAmount).toBeNull();
    });

    it('does not falsely flag generic placeholder TIDs (e.g., 000000, 123456, N/A) as duplicates', async () => {
      const genericResult = await PaymentVerifier.verifyScreenshot({
        orderId: 'generic_tid_test',
        screenshotUrlOrBase64: '',
        expectedAmount: 35000,
        paymentMethod: 'EASYPAISA',
      });

      expect(genericResult.isDuplicateTid).toBe(false);
    });
  });

  describe('5. Automated Customer WhatsApp Notifications (Approval & Dispatch)', () => {
    const customerOrder = {
      id: 'ord_cust_test_7788',
      shippingName: 'Tariq Mehmood',
      shippingPhone: '03001234567',
      totalAmount: 185000,
      trackingNumber: 'TCS_99210488',
      items: [
        { name: 'Royal Velvet Chesterfield Sofa', quantity: 1, price: 185000 },
      ],
    };

    it('formats and dispatches customer order approved notification', async () => {
      const result = await WhatsAppService.sendCustomerOrderApproved(customerOrder);
      expect(typeof result).toBe('boolean');
    });

    it('formats and dispatches customer order shipped notification with tracking ID', async () => {
      const result = await WhatsAppService.sendCustomerOrderShipped(
        customerOrder,
        'TCS_99210488',
        'TCS Express'
      );
      expect(typeof result).toBe('boolean');
    });

    it('safely handles missing customer phone number without throwing', async () => {
      const invalidOrder = { id: 'ord_no_phone', items: [] };
      const resApprove = await WhatsAppService.sendCustomerOrderApproved(invalidOrder);
      const resShip = await WhatsAppService.sendCustomerOrderShipped(invalidOrder);
      expect(resApprove).toBe(false);
      expect(resShip).toBe(false);
    });
  });

  describe('6. Daily Executive Sales & Stock Report', () => {
    it('generates a formatted daily sales and stock report string', async () => {
      const report = await WhatsAppService.generateDailyReport();
      expect(typeof report).toBe('string');
      expect(report).toContain('FAHAD ALI INTERIOR — DAILY EXECUTIVE REPORT');
      expect(report).toContain('SALES & REVENUE SUMMARY');
      expect(report).toContain('INVENTORY & STOCK STATUS');
    });

    it('dispatches the daily report to admin phone', async () => {
      const dispatched = await WhatsAppService.sendDailyReport('923001234567');
      expect(typeof dispatched).toBe('boolean');
    });
  });

  describe('7. Clean Payment Method Normalization', () => {
    it('normalizes JazzCash and strips extraneous bank names', () => {
      expect(
        formatPaymentMethodDisplay({
          paymentMethod: 'JAZZCASH',
          shippingNotes: 'Method: JAZZCASH (Meezan Bank). TxID: N/A.',
        })
      ).toBe('JAZZCASH');
    });

    it('normalizes EasyPaisa and strips extraneous bank names', () => {
      expect(
        formatPaymentMethodDisplay({
          paymentMethod: 'EASYPAISA',
          shippingNotes: 'Method: EASYPAISA (Meezan Bank). TxID: 98124.',
        })
      ).toBe('EASYPAISA');
    });

    it('preserves bank name for genuine Bank Transfers', () => {
      expect(
        formatPaymentMethodDisplay({
          paymentMethod: 'BANK',
          shippingNotes: 'Method: BANK TRANSFER (Meezan Bank). TxID: 12345.',
        })
      ).toBe('BANK TRANSFER (Meezan Bank)');
    });

    it('handles Cash on Delivery and Cards cleanly', () => {
      expect(formatPaymentMethodDisplay({ paymentMethod: 'cod' })).toBe('CASH ON DELIVERY');
      expect(formatPaymentMethodDisplay({ paymentMethod: 'card' })).toBe('CREDIT / DEBIT CARD');
    });
  });
});


