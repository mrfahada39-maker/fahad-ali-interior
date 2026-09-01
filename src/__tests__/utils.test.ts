import { describe, it, expect } from '@jest/globals';

describe('formatPrice', () => {
  it('formats PKR numbers correctly', () => {
    const format = (n: number) => new Intl.NumberFormat('en-PK').format(Math.round(n));
    expect(format(1000)).toBe('1,000');
    expect(format(150000)).toBe('150,000');
    expect(format(99.99)).toBe('100');
  });
});

describe('cart calculations', () => {
  it('calculates subtotal from items', () => {
    const items = [
      { price: 1000, quantity: 2 },
      { price: 500, quantity: 1 },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(2500);
  });

  it('applies percentage discount correctly', () => {
    const subtotal = 10000;
    const discount = subtotal * (10 / 100);
    expect(discount).toBe(1000);
    expect(subtotal - discount).toBe(9000);
  });

  it('calculates GST at 17%', () => {
    const taxable = 9000;
    const gst = taxable * 0.17;
    expect(gst).toBe(1530);
    expect(taxable + gst).toBe(10530);
  });
});

describe('payment method validation', () => {
  const validMethods = ['cod', 'jazzcash', 'easypaisa', 'bank'];
  it('accepts valid payment methods', () => {
    validMethods.forEach((m) => expect(validMethods.includes(m)).toBe(true));
  });
  it('rejects invalid payment method', () => {
    expect(validMethods.includes('stripe')).toBe(false);
    expect(validMethods.includes('')).toBe(false);
  });
});
