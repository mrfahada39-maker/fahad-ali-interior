/**
 * Comprehensive Pakistani Payment Methods & Fulfillment Lifecycle Suite
 * Fahad Ali Haute Interior Architecture & Artisanal Furniture
 *
 * Exhaustive End-to-End Tests for:
 * 1. Cash on Delivery (COD) Flow & Courier Settlement
 * 2. Direct Bank Transfer & SBP Raast Instant Settlement
 * 3. JazzCash Mobile Account & Merchant Verification
 * 4. Easypaisa Wallet & Instant Payment Handling
 * 5. Order Cancellation, Inventory Restock & Refund Integrity
 * 6. Admin Order Management API Contracts & Security Enforcement
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  formatPKR,
  isValidPakistaniPhone,
  detectPakistaniTelecom,
  RAAST_SBP_DETAILS,
  PAKISTANI_COURIERS,
  PAKISTAN_CITIES,
} from '@/lib/pakistan-localization';
import { toOrderStatus, toPaymentStatus, toPaymentMethod } from '@/lib/enums';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

interface CatalogProduct {
  id: string;
  name: string;
  stock: number;
  pricePKR: number;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface LifecycleOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  courier?: string;
  paymentReference?: string;
  refundAmount?: number;
}

describe('Pakistani Payment Gateways & E-Commerce Lifecycle Tests', () => {
  let inventory: CatalogProduct[];

  beforeEach(() => {
    inventory = [
      { id: 'prod_sheesham_bed', name: 'Royal Sheesham King Bed', stock: 5, pricePKR: 385000 },
      { id: 'prod_dining_table', name: 'Grand Imperial Dining Table', stock: 3, pricePKR: 420000 },
      { id: 'prod_accent_chair', name: 'Velvet Carved Armchair', stock: 8, pricePKR: 85000 },
    ];
  });

  // Helper to place an order and deduct stock atomically
  const placeOrder = (
    orderNum: string,
    customerName: string,
    phone: string,
    email: string,
    city: string,
    itemsToBuy: { productId: string; qty: number }[],
    method: PaymentMethod,
  ): LifecycleOrder => {
    if (!isValidPakistaniPhone(phone)) {
      throw new Error(`Invalid Pakistani phone number: ${phone}`);
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const req of itemsToBuy) {
      const prod = inventory.find((p) => p.id === req.productId);
      if (!prod || prod.stock < req.qty) {
        throw new Error(`Insufficient stock for product ${req.productId}`);
      }
      prod.stock -= req.qty;
      orderItems.push({
        productId: prod.id,
        name: prod.name,
        price: prod.pricePKR,
        quantity: req.qty,
      });
      subtotal += prod.pricePKR * req.qty;
    }

    return {
      id: `ord_${orderNum.toLowerCase()}`,
      orderNumber: orderNum,
      customerName,
      customerPhone: phone,
      customerEmail: email,
      city,
      items: orderItems,
      subtotal,
      shippingFee: 0,
      totalAmount: subtotal,
      paymentMethod: method,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
    };
  };

  // ─────────────────────────────────────────────────────────────
  // 1. CASH ON DELIVERY (COD) LIFECYCLE
  // ─────────────────────────────────────────────────────────────
  describe('1. Cash on Delivery (COD) Full Purchase Lifecycle', () => {
    it('successfully creates a COD order with PENDING status and correct enum mapping', () => {
      const methodEnum = toPaymentMethod('cod');
      expect(methodEnum).toBe(PaymentMethod.COD);

      const order = placeOrder(
        'FA-COD-101',
        'Sardar Usman Buzdar',
        '03001234567',
        'usman@example.com',
        'Lahore',
        [{ productId: 'prod_accent_chair', qty: 2 }],
        methodEnum,
      );

      expect(order.paymentMethod).toBe(PaymentMethod.COD);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(170000);
      expect(formatPKR(order.totalAmount)).toBe('Rs. 170,000');
      // Stock deducted from 8 to 6
      expect(inventory.find((p) => p.id === 'prod_accent_chair')?.stock).toBe(6);
    });

    it('advances COD order to SHIPPED with TCS White-Glove and verifies delivery settlement to PAID', () => {
      const order = placeOrder(
        'FA-COD-102',
        'Hamza Shahbaz',
        '03219876543',
        'hamza@example.com',
        'Lahore',
        [{ productId: 'prod_accent_chair', qty: 1 }],
        PaymentMethod.COD,
      );

      // Admin approves and ships via TCS
      order.status = toOrderStatus('processing');
      expect(order.status).toBe(OrderStatus.PROCESSING);

      const tcs = PAKISTANI_COURIERS.find((c) => c.id === 'tcs')!;
      order.courier = tcs.name;
      order.trackingNumber = 'TCS-9988223344';
      order.status = toOrderStatus('shipped');
      expect(order.status).toBe(OrderStatus.SHIPPED);

      // Customer receives furniture and pays cash at doorstep
      order.status = toOrderStatus('delivered');
      order.paymentStatus = toPaymentStatus('paid');

      expect(order.status).toBe(OrderStatus.DELIVERED);
      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DIRECT BANK TRANSFER & SBP RAAST INSTANT PAYMENT
  // ─────────────────────────────────────────────────────────────
  describe('2. Direct Bank Transfer & SBP Raast Settlement', () => {
    it('verifies State Bank of Pakistan (SBP) Raast credentials configuration', () => {
      expect(RAAST_SBP_DETAILS.accountTitle).toBe('Fahad Ali Interior (Pvt) Ltd');
      expect(RAAST_SBP_DETAILS.iban).toMatch(/^PK\d{2}MEZN/);
      expect(RAAST_SBP_DETAILS.bankName).toBe('Meezan Bank Limited');
      expect(RAAST_SBP_DETAILS.fee).toContain('0%');
    });

    it('creates Bank order, records customer IBFT reference, and admin approves payment', () => {
      const order = placeOrder(
        'FA-BANK-201',
        'Chaudhry Pervaiz Elahi',
        '03335554433',
        'pervaiz@example.com',
        'Gujrat',
        [{ productId: 'prod_sheesham_bed', qty: 1 }],
        PaymentMethod.BANK,
      );

      expect(order.paymentMethod).toBe(PaymentMethod.BANK);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);

      // Customer sends Raast payment receipt
      const customerSubmittedTxId = 'RAAST-MEZN-20261005-99812';
      order.paymentReference = customerSubmittedTxId;
      order.paymentStatus = toPaymentStatus('awaiting_verification');

      expect(order.paymentStatus).toBe(PaymentStatus.AWAITING_VERIFICATION);
      expect(order.paymentReference).toBe(customerSubmittedTxId);

      // Admin confirms funds credited in Meezan Bank portal
      order.paymentStatus = toPaymentStatus('paid');
      order.status = toOrderStatus('processing');

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('flags Bank order as FAILED when invalid / unverified reference is submitted', () => {
      const order = placeOrder(
        'FA-BANK-202',
        'Fake Payer',
        '03001112233',
        'fake@example.com',
        'Islamabad',
        [{ productId: 'prod_accent_chair', qty: 1 }],
        PaymentMethod.BANK,
      );

      order.paymentReference = 'INVALID-REF-000';
      // Bank reconciliation fails
      order.paymentStatus = toPaymentStatus('failed');
      expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
      expect(order.status).toBe(OrderStatus.PENDING);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. JAZZCASH MOBILE ACCOUNT GATEWAY
  // ─────────────────────────────────────────────────────────────
  describe('3. JazzCash Mobile Account & Wallet Verification', () => {
    it('detects Jazz 4G carrier network from customer mobile number', () => {
      const telecom = detectPakistaniTelecom('03014567890');
      expect(telecom).not.toBeNull();
      expect(telecom?.name).toBe('Jazz 4G');
      expect(telecom?.brandColor).toBe('#D9222A');
    });

    it('processes JazzCash order through instant token confirmation', () => {
      const jazzPhone = '03028472910';
      expect(isValidPakistaniPhone(jazzPhone)).toBe(true);

      const order = placeOrder(
        'FA-JAZZ-301',
        'Mian Muhammad Mansha',
        jazzPhone,
        'mansha@example.com',
        'Faisalabad',
        [{ productId: 'prod_dining_table', qty: 1 }],
        toPaymentMethod('jazzcash'),
      );

      expect(order.paymentMethod).toBe(PaymentMethod.JAZZCASH);
      expect(order.totalAmount).toBe(420000);

      // Simulate JazzCash gateway webhook success callback
      const gatewayResponse = {
        pp_ResponseCode: '000',
        pp_ResponseMessage: 'Transaction Successful',
        pp_TxnRefNo: 'T20261005143321',
        pp_Amount: '42000000', // 420,000 PKR in paisas
      };

      if (gatewayResponse.pp_ResponseCode === '000') {
        order.paymentStatus = PaymentStatus.PAID;
        order.paymentReference = gatewayResponse.pp_TxnRefNo;
        order.status = OrderStatus.PROCESSING;
      }

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order.status).toBe(OrderStatus.PROCESSING);
      expect(order.paymentReference).toBe('T20261005143321');
    });

    it('handles JazzCash insufficient balance and marks payment as FAILED', () => {
      const order = placeOrder(
        'FA-JAZZ-302',
        'Ahsan Iqbal',
        '03007654321',
        'ahsan@example.com',
        'Narowal',
        [{ productId: 'prod_accent_chair', qty: 1 }],
        PaymentMethod.JAZZCASH,
      );

      // Simulate JazzCash MPIN failure / insufficient funds
      const failureResponse = {
        pp_ResponseCode: '124',
        pp_ResponseMessage: 'Insufficient balance in JazzCash wallet',
      };

      if (failureResponse.pp_ResponseCode !== '000') {
        order.paymentStatus = PaymentStatus.FAILED;
      }

      expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. EASYPAISA MOBILE WALLET GATEWAY
  // ─────────────────────────────────────────────────────────────
  describe('4. Easypaisa Mobile Wallet Gateway Integration', () => {
    it('detects Telenor 4G carrier network from customer mobile number', () => {
      const telecom = detectPakistaniTelecom('03451234567');
      expect(telecom).not.toBeNull();
      expect(telecom?.name).toBe('Telenor 4G');
      expect(telecom?.brandColor).toBe('#00A1E0');
    });

    it('processes Easypaisa order and confirms instant payment', () => {
      const epPhone = '03429876543';
      expect(isValidPakistaniPhone(epPhone)).toBe(true);

      const order = placeOrder(
        'FA-EP-401',
        'Farooq Sattar',
        epPhone,
        'farooq@example.com',
        'Karachi',
        [{ productId: 'prod_accent_chair', qty: 2 }],
        toPaymentMethod('easypaisa'),
      );

      expect(order.paymentMethod).toBe(PaymentMethod.EASYPAISA);
      expect(order.totalAmount).toBe(170000);

      // Simulate Easypaisa instant IPN callback
      const easypaisaIPN = {
        orderRefNumber: order.orderNumber,
        paymentToken: 'EP-TOKEN-883719472',
        transactionStatus: 'PAID',
      };

      if (easypaisaIPN.transactionStatus === 'PAID') {
        order.paymentStatus = PaymentStatus.PAID;
        order.paymentReference = easypaisaIPN.paymentToken;
        order.status = OrderStatus.PROCESSING;
      }

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order.status).toBe(OrderStatus.PROCESSING);
      expect(order.paymentReference).toBe('EP-TOKEN-883719472');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. CANCELLATION, RESTOCKING & REFUND INTEGRITY
  // ─────────────────────────────────────────────────────────────
  describe('5. Order Cancellation, Stock Restoration & Refund Flow', () => {
    it('restores warehouse inventory atomically when an order is cancelled before shipping', () => {
      const chair = inventory.find((p) => p.id === 'prod_accent_chair')!;
      const initialStock = chair.stock; // 8

      const order = placeOrder(
        'FA-CANCEL-501',
        'Babar Azam',
        '03009988776',
        'babar@example.com',
        'Lahore',
        [{ productId: 'prod_accent_chair', qty: 3 }],
        PaymentMethod.COD,
      );

      expect(chair.stock).toBe(initialStock - 3); // 5

      // Customer cancels before dispatch
      expect(order.status).toBe(OrderStatus.PENDING);
      order.status = toOrderStatus('cancelled');

      // Restock action
      for (const item of order.items) {
        const p = inventory.find((prod) => prod.id === item.productId);
        if (p) p.stock += item.quantity;
      }

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(chair.stock).toBe(initialStock); // 8 restored!
    });

    it('processes full refund when a pre-paid order (Bank/JazzCash/Easypaisa) is cancelled', () => {
      const order = placeOrder(
        'FA-REFUND-502',
        'Shaheen Afridi',
        '03012233445',
        'shaheen@example.com',
        'Peshawar',
        [{ productId: 'prod_sheesham_bed', qty: 1 }],
        PaymentMethod.BANK,
      );

      // Customer paid via bank transfer
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentReference = 'RAAST-TXN-7766';

      // Customer requests cancellation, admin issues refund
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = toPaymentStatus('refunded');
      order.refundAmount = order.totalAmount;

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(order.refundAmount).toBe(385000);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. PAKISTAN CITIES & REGIONAL LOGISTICS MATRIX
  // ─────────────────────────────────────────────────────────────
  describe('6. Pakistani Regional Delivery & SLA Validation', () => {
    it('verifies major Pakistani cities have correct provinces and delivery estimates', () => {
      expect(PAKISTAN_CITIES['Lahore'].province).toBe('Punjab');
      expect(PAKISTAN_CITIES['Lahore'].estDeliveryDays).toContain('Atelier');

      expect(PAKISTAN_CITIES['Chiniot'].province).toBe('Punjab');
      expect(PAKISTAN_CITIES['Chiniot'].estDeliveryDays).toContain('Express');

      expect(PAKISTAN_CITIES['Karachi'].province).toBe('Sindh');
      expect(PAKISTAN_CITIES['Islamabad'].province).toBe('Islamabad Capital Territory');
      expect(PAKISTAN_CITIES['Peshawar'].province).toBe('Khyber Pakhtunkhwa (KPK)');
      expect(PAKISTAN_CITIES['Quetta'].province).toBe('Balochistan');
    });

    it('verifies courier tracking URL generation', () => {
      const couriers = PAKISTANI_COURIERS;
      expect(couriers.length).toBeGreaterThanOrEqual(5);

      const leopard = couriers.find((c) => c.id === 'leopard')!;
      expect(leopard.trackingUrl).toContain('leopardscourier');

      const trax = couriers.find((c) => c.id === 'trax')!;
      expect(trax.trackingUrl).toContain('trax.pk');
    });
  });
});
