import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getEnterpriseAccessToken,
  getEnterpriseRefreshToken,
  setEnterpriseTokens,
  clearEnterpriseTokens,
} from '@/lib/api-client';

class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe('API Client & Enterprise Session Security', () => {
  beforeEach(() => {
    (global as any).window = global;
    (global as any).sessionStorage = new StorageMock();
    (global as any).localStorage = new StorageMock();
  });

  it('returns null when no enterprise tokens are present', () => {
    expect(getEnterpriseAccessToken()).toBeNull();
    expect(getEnterpriseRefreshToken()).toBeNull();
  });

  it('sets and retrieves enterprise access and refresh tokens', () => {
    setEnterpriseTokens('access-token-xyz-123', 'refresh-token-abc-789');

    expect(getEnterpriseAccessToken()).toBe('access-token-xyz-123');
    expect(getEnterpriseRefreshToken()).toBe('refresh-token-abc-789');
  });

  it('clears all enterprise tokens on session termination', () => {
    setEnterpriseTokens('access-token-xyz-123', 'refresh-token-abc-789');
    clearEnterpriseTokens();

    expect(getEnterpriseAccessToken()).toBeNull();
    expect(getEnterpriseRefreshToken()).toBeNull();
    expect(sessionStorage.getItem('has_enterprise_session')).toBeNull();
  });
});
