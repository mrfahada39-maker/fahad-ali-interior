import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { handleProductRoutes } from '@/lib/api-handlers/products';
import { getUserFromSessionOrToken, type ApiDispatchContext } from '@/lib/api-handlers/shared';

jest.mock('@/lib/api-handlers/shared', () => {
  const actual = jest.requireActual('@/lib/api-handlers/shared');
  return {
    ...actual,
    getUserFromSessionOrToken: jest.fn(),
  };
});

describe('Cloudinary Upload Hardening & Direct Signed Uploads (M6)', () => {
  const mockedGetUser = getUserFromSessionOrToken as jest.Mock;
  const originalEnv = process.env;

  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
    };
    mockedGetUser.mockResolvedValue(null);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function makeContext(
    req: NextRequest,
    segment: string,
    method = 'POST'
  ): ApiDispatchContext {
    const normalizedSegment = segment.replace(/^v1\//, '').replace(/^\/+|\/+$/g, '');
    return {
      method,
      segment,
      normalizedSegment,
      pathParts: normalizedSegment.split('/'),
      req,
      ip: '127.0.0.1',
    };
  }

  describe('POST /api/v1/uploads/image (Single Upload)', () => {
    it('rejects unauthenticated user with 401', async () => {
      mockedGetUser.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/uploads/image', {
        method: 'POST',
      });
      const ctx = makeContext(req, 'v1/uploads/image');

      const res = await handleProductRoutes(ctx);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(401);
      const data = await res?.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('rejects regular non-admin user trying to upload to products folder with 403', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'user_1',
        email: 'user@example.com',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/v1/uploads/image?folder=fahad-ali-interior/products',
        { method: 'POST' }
      );
      const ctx = makeContext(req, 'v1/uploads/image');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.error).toContain('Forbidden');
    });

    it('returns 503 error and NEVER returns base64 when Cloudinary config is missing', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const formData = new FormData();
      const file = new File([validJpegBuffer], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const req = new NextRequest('http://localhost:3000/api/v1/uploads/image', {
        method: 'POST',
        body: formData,
      });
      const ctx = makeContext(req, 'v1/uploads/image');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(503);
      const data = await res?.json();
      expect(data.error).toBe('Image upload failed. Storage service is not configured.');
      expect(data.data).toBeUndefined();
      expect(data.url).toBeUndefined();
    });

    it('returns 502 error and NEVER returns base64 when Cloudinary API rejects upload', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      // Mock global fetch to simulate Cloudinary failure
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid signature or corrupt image',
      });

      try {
        const formData = new FormData();
        const file = new File([validJpegBuffer], 'test.jpg', { type: 'image/jpeg' });
        formData.append('file', file);

        const req = new NextRequest('http://localhost:3000/api/v1/uploads/image', {
          method: 'POST',
          body: formData,
        });
        const ctx = makeContext(req, 'v1/uploads/image');

        const res = await handleProductRoutes(ctx);
        expect(res?.status).toBe(502);
        const data = await res?.json();
        expect(data.error).toBe(
          'Image upload failed. Cloud storage service rejected the file or was unreachable.'
        );
        expect(data.data).toBeUndefined();
        expect(data.url).toBeUndefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('returns Cloudinary CDN URL when upload succeeds', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/prod_1.jpg',
          public_id: 'prod_1',
          format: 'jpg',
          resource_type: 'image',
          width: 800,
          height: 600,
          bytes: 12345,
        }),
      });

      try {
        const formData = new FormData();
        const file = new File([validJpegBuffer], 'test.jpg', { type: 'image/jpeg' });
        formData.append('file', file);

        const req = new NextRequest('http://localhost:3000/api/v1/uploads/image', {
          method: 'POST',
          body: formData,
        });
        const ctx = makeContext(req, 'v1/uploads/image');

        const res = await handleProductRoutes(ctx);
        expect(res?.status).toBe(200);
        const data = await res?.json();
        expect(data.success).toBe(true);
        expect(data.secureUrl).toBe(
          'https://res.cloudinary.com/test-cloud/image/upload/v123/prod_1.jpg'
        );
        expect(data.data.publicId).toBe('prod_1');
        // Ensure no base64 string returned
        expect(data.secureUrl).not.toContain('data:image');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('POST /api/v1/uploads/multiple (Multiple Uploads)', () => {
    it('returns 503 error if Cloudinary is not configured and NEVER returns base64', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const formData = new FormData();
      formData.append('files', new File([validJpegBuffer], '1.jpg', { type: 'image/jpeg' }));
      formData.append('files', new File([validJpegBuffer], '2.jpg', { type: 'image/jpeg' }));

      const req = new NextRequest('http://localhost:3000/api/v1/uploads/multiple', {
        method: 'POST',
        body: formData,
      });
      const ctx = makeContext(req, 'v1/uploads/multiple');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(503);
      const data = await res?.json();
      expect(data.error).toBe('Image upload failed. Storage service is not configured.');
      expect(data.data).toBeUndefined();
    });

    it('returns 502 error if Cloudinary upload fails on multiple images and NEVER returns base64', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Cloudinary internal error',
      });

      try {
        const formData = new FormData();
        formData.append('files', new File([validJpegBuffer], '1.jpg', { type: 'image/jpeg' }));

        const req = new NextRequest('http://localhost:3000/api/v1/uploads/multiple', {
          method: 'POST',
          body: formData,
        });
        const ctx = makeContext(req, 'v1/uploads/multiple');

        const res = await handleProductRoutes(ctx);
        expect(res?.status).toBe(502);
        const data = await res?.json();
        expect(data.error).toBe('One or more images failed to upload to cloud storage.');
        expect(data.data).toBeUndefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('POST /api/v1/uploads/sign (Direct Signed Uploads for Vercel 4.5MB bypass)', () => {
    it('rejects unauthenticated user with 401', async () => {
      mockedGetUser.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/v1/uploads/sign', {
        method: 'POST',
      });
      const ctx = makeContext(req, 'v1/uploads/sign');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(401);
    });

    it('rejects non-admin user attempting to sign catalog folder with 403', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'user_regular',
        email: 'shopper@example.com',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/v1/uploads/sign?folder=fahad-ali-interior/products',
        { method: 'POST' }
      );
      const ctx = makeContext(req, 'v1/uploads/sign');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(403);
    });

    it('generates valid Cloudinary signature and parameters for authorized users', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/v1/uploads/sign?folder=fahad-ali-interior/products',
        { method: 'POST' }
      );
      const ctx = makeContext(req, 'v1/uploads/sign');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(200);
      const data = await res?.json();

      expect(data.success).toBe(true);
      expect(data.apiKey).toBe('test-api-key');
      expect(data.cloudName).toBe('test-cloud');
      expect(data.folder).toBe('fahad-ali-interior/products');
      expect(data.uploadUrl).toBe('https://api.cloudinary.com/v1_1/test-cloud/auto/upload');
      expect(typeof data.timestamp).toBe('number');

      // Verify signature correctness: sha1(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`)
      const expectedParams = `folder=${data.folder}&timestamp=${data.timestamp}test-api-secret`;
      const expectedSignature = crypto.createHash('sha1').update(expectedParams).digest('hex');
      expect(data.signature).toBe(expectedSignature);
    });

    it('allows regular users to get signatures for customer-allowed folders (e.g. reviews)', async () => {
      mockedGetUser.mockResolvedValue({
        id: 'user_shopper',
        email: 'shopper@example.com',
        role: 'USER',
      });

      const req = new NextRequest(
        'http://localhost:3000/api/v1/uploads/sign?folder=fahad-ali-interior/reviews',
        { method: 'POST' }
      );
      const ctx = makeContext(req, 'v1/uploads/sign');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(200);
      const data = await res?.json();
      expect(data.success).toBe(true);
      expect(data.folder).toBe('fahad-ali-interior/reviews');
    });

    it('returns 503 error if Cloudinary is unconfigured', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;

      mockedGetUser.mockResolvedValue({
        id: 'admin_1',
        email: 'admin@fahadali.com',
        role: 'ADMIN',
      });

      const req = new NextRequest('http://localhost:3000/api/v1/uploads/sign', {
        method: 'POST',
      });
      const ctx = makeContext(req, 'v1/uploads/sign');

      const res = await handleProductRoutes(ctx);
      expect(res?.status).toBe(503);
      const data = await res?.json();
      expect(data.error).toBe('Image upload failed. Storage service is not configured.');
    });
  });
});
