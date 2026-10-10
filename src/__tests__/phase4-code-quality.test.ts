import fs from 'fs';
import path from 'path';
import {
  orderItemInputSchema,
  createOrderSchema,
  createProductSchema,
  createReviewSchema,
  createAddressSchema,
  contactInquirySchema,
  adminPasswordChangeSchema,
} from '@/lib/validations/api-schemas';

describe('Phase 4: Code Quality, Modularization & Validation Schemas', () => {
  const rootDir = process.cwd();

  it('modularizes src/app/api/v1/[...path]/route.ts into resource-based handlers', () => {
    const routePath = path.join(rootDir, 'src/app/api/v1/[...path]/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');
    const lineCount = routeContent.split(/\r?\n/).length;

    expect(lineCount).toBeLessThan(150);
    expect(routeContent).not.toMatch(/NestJS fallback/i);

    const handlerFiles = [
      'src/lib/api-handlers/shared.ts',
      'src/lib/api-handlers/auth.ts',
      'src/lib/api-handlers/products.ts',
      'src/lib/api-handlers/orders.ts',
      'src/lib/api-handlers/reviews.ts',
      'src/lib/api-handlers/customers.ts',
      'src/lib/api-handlers/messages.ts',
      'src/lib/api-handlers/settings.ts',
    ];
    for (const file of handlerFiles) {
      expect(fs.existsSync(path.join(rootDir, file))).toBe(true);
    }
  });

  it('delegates duplicate auth routes in src/lib/api-handlers/auth.ts to canonical /api/auth/* handlers', () => {
    const authHandlerContent = fs.readFileSync(
      path.join(rootDir, 'src/lib/api-handlers/auth.ts'),
      'utf8'
    );
    expect(authHandlerContent).toContain("@/app/api/auth/register/route");
    expect(authHandlerContent).toContain("@/app/api/auth/forgot-password/route");
    expect(authHandlerContent).toContain("@/app/api/auth/reset-password/route");
    expect(authHandlerContent).toContain("@/app/api/auth/verify-email/route");
    expect(authHandlerContent).toContain("@/app/api/auth/resend-verification/route");
    expect(authHandlerContent).toContain("@/app/api/auth/check-2fa/route");
  });

  it('extracts modular components and hooks from Checkout, AdminDashboard, and UserDashboard', () => {
    expect(fs.existsSync(path.join(rootDir, 'src/components/checkout/checkout-banks.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/hooks/use-admin-call.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/components/admin/AdminNavigationChrome.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/hooks/use-user-call.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'src/components/user-dashboard/UserOrderModals.tsx'))).toBe(true);
  });

  it('validates API request bodies strictly with Zod schemas', () => {
    expect(
      createOrderSchema.safeParse({
        items: [{ productId: 'prod-1', quantity: 2 }],
        paymentMethod: 'COD',
      }).success
    ).toBe(true);

    expect(
      orderItemInputSchema.safeParse({
        productId: 'prod-1',
        quantity: 25,
      }).success
    ).toBe(false);

    expect(
      createProductSchema.safeParse({
        name: 'Royal Sheesham Sofa',
        price: 185000,
        category: 'Living Room',
      }).success
    ).toBe(true);

    expect(
      createReviewSchema.safeParse({
        productId: 'prod-1',
        rating: 5,
        comment: 'Exquisite craftsmanship.',
      }).success
    ).toBe(true);

    expect(
      createAddressSchema.safeParse({
        name: 'Home',
        phone: '03001234567',
        address: 'House 12, Gulberg III',
        city: 'Lahore',
      }).success
    ).toBe(true);

    expect(
      contactInquirySchema.safeParse({
        name: 'Client Name',
        email: 'client@example.com',
        message: 'Interested in a bespoke dining table.',
      }).success
    ).toBe(true);

    expect(
      adminPasswordChangeSchema.safeParse({
        currentPassword: 'OldPassword1!',
        newPassword: 'NewStrongPassword1!',
      }).success
    ).toBe(true);
  });

  it('re-enables ESLint rules and removes unused date-fns from next.config.ts', () => {
    const eslintContent = fs.readFileSync(path.join(rootDir, 'eslint.config.mjs'), 'utf8');
    expect(eslintContent).toContain('"@typescript-eslint/no-unused-vars": ["warn"');
    expect(eslintContent).toContain('"@typescript-eslint/no-explicit-any": "warn"');
    expect(eslintContent).toContain('"react-hooks/exhaustive-deps": "warn"');
    expect(eslintContent).toContain('"@next/next/no-img-element": "warn"');

    const nextConfigContent = fs.readFileSync(path.join(rootDir, 'next.config.ts'), 'utf8');
    expect(nextConfigContent).not.toContain('date-fns');
  });

  it('includes comprehensive README.md and SECURITY.md documentation', () => {
    expect(fs.existsSync(path.join(rootDir, 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'SECURITY.md'))).toBe(true);
  });
});
