# Security Policy & Architecture

## Reporting a Vulnerability

If you discover a security vulnerability in **Fahad Ali Interior**, please report it privately to the security team via the official contact address configured in `NEXT_PUBLIC_CONTACT_EMAIL` (`info@fahadaliinterior.com`) rather than opening a public issue. We investigate all legitimate reports within 48 hours.

---

## Security Controls Overview

### 1. Authentication, Sessions & Access Control

- **Defense-in-Depth Admin Verification**: Every admin API handler in `src/lib/api-handlers/*` and `src/app/api/*` independently verifies administrator privileges via `requireAdmin()`, checking both the edge proxy headers (`src/proxy.ts`) and the database/session token.
- **Dedicated Admin Signing Secret**: Admin tokens (`fahad_admin_token`) are signed and verified using `ADMIN_TOKEN_SECRET`, separated from `NEXTAUTH_SECRET`.
- **Server-Side Token Revocation**: Logging out of `/api/admin/logout` records the token's SHA-256 digest in the `AdminTokenRevocation` table (`SiteSetting`), immediately invalidating the token before its natural expiration.
- **Periodic JWT Re-Validation**: NextAuth JWT callbacks re-query PostgreSQL every 5 minutes to ensure soft-deleted users (`deletedAt !== null`) or demoted accounts lose access immediately.
- **Password Policy**: All registration, password-reset, and admin password-change flows enforce a minimum of 10 characters with uppercase, lowercase, numeric, and special character complexity.
- **Anti-Enumeration & Timing Protection**: Authentication endpoints (`forgot-password`, `resend-verification`, `check-2fa`, and `credentials` login) return uniform responses and execute dummy `bcrypt.compare` operations when an email does not exist to prevent timing side-channel enumeration.

### 2. Two-Factor Authentication (2FA)

- **Fail-Closed Verification**: TOTP verification strictly fails closed on any cryptographic or library error.
- **Encryption at Rest**: User `twoFactorSecret` values are encrypted using **AES-256-GCM** (`src/lib/totp-crypto.ts`) prior to storage in PostgreSQL.
- **Salted Backup Codes**: 2FA recovery backup codes are hashed with per-code random salts using **SHA-256** and verified with `crypto.timingSafeEqual`.

### 3. E-Commerce & Financial Integrity

- **Authoritative Database Pricing**: Order creation (`POST /api/v1/orders`) ignores client-supplied item prices and computes subtotals, GST, shipping, and discounts exclusively from live PostgreSQL `Product` records.
- **Atomic Inventory & Coupon Transactions**: Stock deduction (`stockCount >= quantity`) and coupon `usedCount` increments execute inside a single atomic `db.$transaction()`, preventing race-condition overselling or coupon replay attacks.
- **Guest Checkout Isolation**: Guest orders never overwrite or attach to existing registered `User` accounts and never create passwordless user records.
- **Strict Payload Validation**: All mutating API endpoints validate request bodies with strict **Zod** schemas (`src/lib/validations/api-schemas.ts`).

### 4. Content Security Policy (CSP), CSRF & Transport Security

- **Per-Request Nonce CSP**: `src/proxy.ts` generates a cryptographic nonce per request and enforces `script-src 'self' 'nonce-<nonce>' 'strict-dynamic'` without `'unsafe-inline'` or `'unsafe-eval'`.
- **CSRF Origin/Referer Guard**: All mutating `/api/*` requests (`POST`, `PUT`, `PATCH`, `DELETE`) are validated in `src/proxy.ts` against the application host (`Origin` / `Referer` verification).
- **No Sensitive Tokens in `localStorage`**: Session and admin authentication rely exclusively on `httpOnly`, `SameSite=Lax`, `Secure` cookies.

### 5. Rate Limiting, Uploads & Real-Time Signaling

- **Distributed Rate Limiting**: Sensitive endpoints (`/api/auth/*`, `/api/ai/*`, `/api/v1/orders`, `/api/v1/uploads/*`) are protected by Upstash Redis sliding-window rate limiters (`src/lib/rate-limit.ts`). Production deployments enforce Upstash configuration.
- **Magic-Byte Upload Verification**: Image uploads (`/api/v1/uploads/image`) require authentication, enforce a 5 MB size ceiling, and inspect raw binary magic bytes (JPEG, PNG, GIF, WebP) before streaming to Cloudinary.
- **Server-Bound AI Sessions**: AI chat sessions (`/api/ai/chat`) issue server-generated `crypto.randomUUID()` session IDs bound to an HMAC-signed `httpOnly` cookie (`fai_ai_session`), preventing cross-user chat history spoofing.
- **Serverless WebRTC Signaling**: Consultation call signaling (`/api/v1/calls/signal`) persists state in Upstash Redis / PostgreSQL with a strict 5-minute TTL rather than in-memory globals.

### 6. CI/CD Supply-Chain Security

- **Automated Security Audit**: `.github/workflows/ci.yml` runs `npm audit --audit-level=high`, ESLint, TypeScript checks, and Jest unit tests on every push and pull request.
- **Gated Production Deployment**: `.github/workflows/cd.yml` triggers only after the `CI Pipeline` workflow succeeds on `main`.
