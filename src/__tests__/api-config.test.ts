import { describe, it, expect } from '@jest/globals';
import {
  resolveApiPath,
  toNestApiPath,
  isNestApiRoute,
  isNextAuthInternalRoute,
  isNextJsOnlyApiRoute,
} from '@/lib/api-config';

describe('resolveApiPath', () => {
  it('maps /api/products to /api/v1/products', () => {
    expect(resolveApiPath('/api/products')).toBe('/api/v1/products');
  });

  it('maps /api/auth/login to /api/v1/auth/login', () => {
    expect(resolveApiPath('/api/auth/login')).toBe('/api/v1/auth/login');
  });

  it('keeps /api/auth/register on internal NextAuth router', () => {
    expect(resolveApiPath('/api/auth/register')).toBe('/api/auth/register');
  });


  it('does not double-prefix already prefixed /api/v1/ paths', () => {
    expect(resolveApiPath('/api/v1/products')).toBe('/api/v1/products');
    expect(resolveApiPath('/api/v1')).toBe('/api/v1');
  });

  it('keeps NextAuth internal routes unchanged', () => {
    expect(resolveApiPath('/api/auth/session')).toBe('/api/auth/session');
    expect(resolveApiPath('/api/auth/csrf')).toBe('/api/auth/csrf');
    expect(resolveApiPath('/api/auth/signin')).toBe('/api/auth/signin');
    expect(resolveApiPath('/api/auth/signout')).toBe('/api/auth/signout');
  });

  it('maps /api/register to /api/v1/auth/register', () => {
    expect(resolveApiPath('/api/register')).toBe('/api/v1/auth/register');
  });

  it('maps /api/health to /api/v1/health', () => {
    expect(resolveApiPath('/api/health')).toBe('/api/v1/health');
  });

  it('keeps enterprise routes unchanged', () => {
    expect(resolveApiPath('/api/enterprise')).toBe('/api/enterprise');
    expect(resolveApiPath('/api/enterprise/settings')).toBe(
      '/api/enterprise/settings',
    );
  });

  it('preserves query parameters through mapping', () => {
    expect(resolveApiPath('/api/products?page=1&limit=20')).toBe(
      '/api/v1/products?page=1&limit=20',
    );
  });

  it('strips trailing slashes', () => {
    expect(resolveApiPath('/api/products/')).toBe('/api/v1/products');
  });
});

describe('isNextJsOnlyApiRoute', () => {
  it('returns true for enterprise routes', () => {
    expect(isNextJsOnlyApiRoute('/api/enterprise')).toBe(true);
    expect(isNextJsOnlyApiRoute('/api/enterprise/settings')).toBe(true);
  });

  it('returns true for nextauth catch-all', () => {
    expect(isNextJsOnlyApiRoute('/api/auth/[...nextauth]')).toBe(true);
  });

  it('returns false for normal api routes', () => {
    expect(isNextJsOnlyApiRoute('/api/products')).toBe(false);
  });
});

describe('isNextAuthInternalRoute', () => {
  it('returns true for known NextAuth prefixes', () => {
    expect(isNextAuthInternalRoute('/api/auth/session')).toBe(true);
    expect(isNextAuthInternalRoute('/api/auth/callback')).toBe(true);
  });

  it('returns true for /api/auth alone', () => {
    expect(isNextAuthInternalRoute('/api/auth')).toBe(true);
  });

  it('returns false for /api/auth/login', () => {
    expect(isNextAuthInternalRoute('/api/auth/login')).toBe(false);
  });
});

describe('isNestApiRoute', () => {
  it('returns true for api routes that go to Nest', () => {
    expect(isNestApiRoute('/api/products')).toBe(true);
    expect(isNestApiRoute('/api/payments/webhook')).toBe(true);
  });

  it('returns false for NextAuth routes', () => {
    expect(isNestApiRoute('/api/auth/session')).toBe(false);
  });

  it('returns false for non-api paths', () => {
    expect(isNestApiRoute('/about')).toBe(false);
  });
});

describe('toNestApiPath', () => {
  it('maps generic /api/foo to /api/v1/foo', () => {
    expect(toNestApiPath('/api/orders')).toBe('/api/v1/orders');
  });

  it('handles nested paths correctly', () => {
    expect(toNestApiPath('/api/products/category/electronics')).toBe(
      '/api/v1/products/category/electronics',
    );
  });
});
