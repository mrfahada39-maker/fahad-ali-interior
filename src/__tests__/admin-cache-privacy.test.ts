import {
  ADMIN_CACHE_KEY,
  sanitizeBundleForCache,
  saveSanitizedAdminBundle,
  clearAdminCache,
} from '@/lib/admin-cache';

describe('Admin Cache Privacy & PII Protection (M1)', () => {
  const mockLocalStorage: Record<string, string> = {};

  const storageMock = {
    getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: jest.fn(() => {
      for (const key of Object.keys(mockLocalStorage)) {
        delete mockLocalStorage[key];
      }
    }),
  };

  beforeAll(() => {
    (global as unknown as { window: unknown }).window = {
      localStorage: storageMock,
    };
  });

  afterAll(() => {
    delete (global as unknown as { window?: unknown }).window;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockLocalStorage)) {
      delete mockLocalStorage[key];
    }
  });

  describe('sanitizeBundleForCache', () => {
    it('strips all sensitive PII (orders, users, messages, inquiries, admin account)', () => {
      const fullBundleWithPii = {
        stats: { totalSales: 150000, totalOrders: 42 },
        analytics: { topProducts: ['chair-1'], visitorCount: 890 },
        siteSettings: { storeName: 'Fahad Ali Interior', currency: 'PKR' },
        orders: [
          {
            id: 'ord-101',
            customerName: 'Muhammad Ahmad',
            customerEmail: 'ahmad@example.com',
            shippingAddress: 'House 42, Gulberg III, Lahore',
            phone: '+923001234567',
            total: 45000,
          },
        ],
        users: [
          {
            id: 'usr-202',
            name: 'Fatima Noor',
            email: 'fatima@example.com',
            phone: '+923219876543',
          },
        ],
        customers: [
          { id: 'usr-203', email: 'leak@example.com' },
        ],
        messages: [
          {
            id: 'msg-303',
            customerName: 'Zainab Bibi',
            customerPhone: '+923335551212',
            text: 'When will my custom dining table arrive?',
          },
        ],
        inquiries: [
          {
            id: 'inq-404',
            name: 'Bilal Khan',
            phone: '+923456789012',
            details: 'Need 12 wooden armchairs',
          },
        ],
        account: {
          name: 'Super Admin',
          email: 'admin@fahadali.com',
          phone: '+923000000000',
        },
        reviews: [
          { id: 'rev-1', author: 'Customer A', comment: 'Great service' },
        ],
      };

      const sanitized = sanitizeBundleForCache(fullBundleWithPii);

      // Verify non-personal aggregates are preserved
      expect(sanitized.stats).toEqual({ totalSales: 150000, totalOrders: 42 });
      expect(sanitized.analytics).toEqual({ topProducts: ['chair-1'], visitorCount: 890 });
      expect(sanitized.siteSettings).toEqual({ storeName: 'Fahad Ali Interior', currency: 'PKR' });

      // Verify no PII is retained
      const sanitizedRecord = sanitized as Record<string, unknown>;
      expect(sanitizedRecord.orders).toBeUndefined();
      expect(sanitizedRecord.users).toBeUndefined();
      expect(sanitizedRecord.customers).toBeUndefined();
      expect(sanitizedRecord.messages).toBeUndefined();
      expect(sanitizedRecord.inquiries).toBeUndefined();
      expect(sanitizedRecord.account).toBeUndefined();
      expect(sanitizedRecord.reviews).toBeUndefined();

      // Ensure JSON representation does not contain any customer names or emails
      const json = JSON.stringify(sanitized);
      expect(json).not.toContain('Muhammad Ahmad');
      expect(json).not.toContain('ahmad@example.com');
      expect(json).not.toContain('Fatima Noor');
      expect(json).not.toContain('Zainab Bibi');
      expect(json).not.toContain('Bilal Khan');
      expect(json).not.toContain('House 42');
    });

    it('returns empty object when bundle is null or undefined', () => {
      expect(sanitizeBundleForCache(null)).toEqual({});
      expect(sanitizeBundleForCache(undefined)).toEqual({});
    });
  });

  describe('saveSanitizedAdminBundle', () => {
    it('writes only sanitized non-personal data to localStorage', () => {
      const bundle = {
        stats: { totalSales: 5000 },
        orders: [{ id: 'order-1', customerName: 'Secret Customer' }],
      };

      saveSanitizedAdminBundle(bundle);

      expect(storageMock.setItem).toHaveBeenCalledWith(
        ADMIN_CACHE_KEY,
        JSON.stringify({ stats: { totalSales: 5000 } })
      );

      const savedValue = mockLocalStorage[ADMIN_CACHE_KEY];
      expect(savedValue).toBeDefined();
      expect(savedValue).not.toContain('Secret Customer');
      expect(savedValue).not.toContain('order-1');
    });

    it('gracefully handles quota or storage exceptions without throwing', () => {
      storageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        saveSanitizedAdminBundle({ stats: { count: 1 } });
      }).not.toThrow();
    });
  });

  describe('clearAdminCache', () => {
    it('completely removes the cached admin bundle on logout', () => {
      mockLocalStorage[ADMIN_CACHE_KEY] = JSON.stringify({ stats: { total: 10 } });
      expect(mockLocalStorage[ADMIN_CACHE_KEY]).toBeDefined();

      clearAdminCache();

      expect(storageMock.removeItem).toHaveBeenCalledWith(ADMIN_CACHE_KEY);
      expect(mockLocalStorage[ADMIN_CACHE_KEY]).toBeUndefined();
    });

    it('gracefully handles exceptions without throwing', () => {
      storageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });

      expect(() => {
        clearAdminCache();
      }).not.toThrow();
    });
  });
});
