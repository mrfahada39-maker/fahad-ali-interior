import { describe, it, expect } from '@jest/globals';
import { formatPricePk } from '@/lib/format-price';

describe('formatPricePk', () => {
  it('formats whole numbers with comma separators', () => {
    expect(formatPricePk(1000)).toBe('1,000');
  });

  it('formats large numbers', () => {
    expect(formatPricePk(150000)).toBe('150,000');
  });

  it('rounds decimal amounts to nearest integer by default', () => {
    expect(formatPricePk(99.99)).toBe('100');
  });

  it('rounds down correctly', () => {
    expect(formatPricePk(99.49)).toBe('99');
  });

  it('formats zero as 0', () => {
    expect(formatPricePk(0)).toBe('0');
  });

  it('displays decimal places when decimals=2', () => {
    expect(formatPricePk(99.99, 2)).toBe('99.99');
  });

  it('pads trailing zeros with decimals=2', () => {
    expect(formatPricePk(1000.5, 2)).toBe('1,000.50');
  });

  it('rounds to 2 decimal places when decimals=2', () => {
    expect(formatPricePk(123.456, 2)).toBe('123.46');
  });

  it('formats millions correctly', () => {
    expect(formatPricePk(9999999)).toBe('9,999,999');
  });

  it('handles negative numbers', () => {
    expect(formatPricePk(-1000)).toBe('-1,000');
    expect(formatPricePk(-0.99)).toBe('-1');
  });
});
