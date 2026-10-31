# Security Policy & Architecture

## Reporting a Vulnerability

If you discover a security vulnerability in **Fahad Ali Interior**, please report it privately to the security team via the official contact address configured in `NEXT_PUBLIC_CONTACT_EMAIL` (`info@fahadaliinterior.com`) rather than opening a public issue. We investigate all legitimate reports within 48 hours.

---

## Security Controls Overview

### 1. Authentication, Sessions & Access Control

- **Dual-Token Session Architecture**:
  - Storefront users authenticate via **NextAuth JWT** sessions stored in `httpOnly`, `SameSite=Lax`, `Secure` cookies.
  - Store administrators operate with isolated, timing-safe HMAC-SHA256 signed admin tokens (`fai_admin_token`) signed with a dedicated `ADMIN_TOKEN_SECRET`.
- **Unified Credential & 2FA Verification**:
  - Both NextAuth credentials authentication and the dedicated admin login endpoint rely on `verifyCredentialsAnd2Fa` (`src/lib/auth.ts`).
  - Phone-OTP two-factor secrets are single-use; the secret is invalidated upon successful verification with a sentinel (`phone_otp:v1:used:${Date.now()}`) to prevent replay attacks across both authentication channels.
- **Server-Side Token Revocation**: Logging out of `/api/admin/logout` records the token's SHA-256 digest in the `AdminTokenRevocation` table (`SiteSetting`), immediately invalidating the token before its natural expiration.
- **Periodic JWT Re-Validation**: NextAuth JWT callbacks re-query PostgreSQL every 5 minutes to ensure soft-deleted users (`deletedAt !== null`) or demoted accounts lose access immediately.
- **Progressive Account Lockout & DoS Immunity**:
  - Failed login attempts trigger progressive lockout tiers (5m &rarr; 15m &rarr; 30m &rarr; 60m &rarr; 24h) via `calculateLockoutDurationMs` alongside per-IP rate limiting (`login_ip:${ip}`).
  - Active admin sessions with valid cryptographically signed tokens are immune to lockout DOS caused by external attackers spraying invalid passwords on login forms.
- **Password Policy**: All registration, password-reset, and admin password-change flows enforce a minimum of 10 characters with uppercase, lowercase, numeric, and special character complexity.
- **Anti-Enumeration & Timing Protection**: Endpoints return uniform responses and execute dummy `bcrypt.compare` operations when an email does not exist to prevent timing side-channel enumeration.

### 2. Two-Factor Authentication (2FA) & Cryptographic Hygiene

- **Fail-Closed Verification**: TOTP and Phone OTP verification strictly fail closed on any cryptographic, network, or library error.
- **Encryption at Rest**: User `twoFactorSecret` values are encrypted using **AES-256-GCM** (`src/lib/totp-crypto.ts`) prior to storage in PostgreSQL.
- **Domain-Separated HKDF Key Derivation**: Sub-keys (such as guest order tokens) are derived using `derivePurposeSecret` with domain-separated HKDF-SHA256.
- **Production Critical Secrets Validation**:
  - Application startup checks 8 critical production secrets (`NEXTAUTH_SECRET`, `ADMIN_TOKEN_SECRET`, `TOTP_ENC_KEY`, `AI_SESSION_SECRET`, `CRON_SECRET`, `WHATSAPP_APP_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
  - Strict pairwise uniqueness prevents secret reuse across domains.

### 3. E-Commerce & Financial Integrity

- **Authoritative Database Pricing & Taxes**: Order creation (`POST /api/v1/orders`) ignores client-supplied item prices and computes subtotals, GST, and shipping exclusively from live PostgreSQL `Product` records and centralized database settings.
- **Atomic Inventory & Coupon Transactions**: Stock deduction (`stockCount >= quantity`) and coupon `usedCount` increments execute inside an atomic `db.$transaction()`, preventing race-condition overselling or coupon replay attacks.
- **Guest Order Protection & Stock Reservation**:
  - Guest orders require verified phone tokens and are tracked using order-bound HMAC guest tokens.
  - Orders feature a 30-minute stock reservation expiry window to prevent inventory hoarding.
- **Audit Trail & Tax Compliance on Deletion**:
  - The `Order.user` relationship enforces `onDelete: Restrict`. User accounts requesting deletion are safely anonymized (`safeDeleteOrAnonymizeUser`) while preserving financial and invoice records for legal and tax compliance.

### 4. Webhook Integrity & Third-Party Integrations

- **Fail-Closed WhatsApp Webhook Verification**:
  - Webhooks validate `X-Hub-Signature-256` HMAC signatures using `WHATSAPP_APP_SECRET`.
  - Missing signatures or invalid payloads are rejected with 401/403.
- **Signed Cloudinary Uploads**:
  - Media uploads utilize signed direct upload signatures (`/api/v1/uploads/sign`) to avoid memory bloat and bypass serverless payload limits.
  - Fallbacks never store raw base64 data URLs in database fields.
- **Client Privacy in Administration**:
  - The admin dashboard cache (`fai_admin_cache`) strictly excludes customer names, phone numbers, and messages from browser `localStorage`, retaining only non-sensitive catalog data.
- **AI Tool Authorization**:
  - Sensitive AI tools (such as `trackOrder`) require authenticated session ownership or valid HMAC guest order tokens.

### 5. Content Security Policy (CSP), CSRF & Transport Security

- **Per-Request Nonce CSP**: `src/proxy.ts` generates a cryptographic nonce per request and enforces `script-src 'self' 'nonce-<nonce>' 'strict-dynamic'` without `'unsafe-inline'` or `'unsafe-eval'`.
- **Safe JSON-LD Injection**: The centralized `<JsonLd />` component neutralizes script tag breaking (`</script>` to `<\/script>`) and attaches per-request CSP nonces.
- **CSRF Origin/Referer Guard**: All mutating `/api/*` requests (`POST`, `PUT`, `PATCH`, `DELETE`) are validated in `src/proxy.ts` against the application host (`Origin` / `Referer` verification).
- **Centralized Domain Configuration**: Domain references are unified in `SITE_CONFIG` (`src/lib/site-config.ts`), preventing host spoofing and hardcoded legacy domains.

### 6. Rate Limiting, Signaling & Edge Defense

- **Distributed Rate Limiting**: Sensitive endpoints (`/api/auth/*`, `/api/ai/*`, `/api/v1/orders`, `/api/v1/uploads/*`) are protected by Upstash Redis sliding-window rate limiters (`src/lib/rate-limit.ts`).
- **OTP Verification Throttling**: OTP attempts and cooldowns are managed through Redis keys (`fai:otp:*`) with fail-closed delivery in production.
- **Serverless WebRTC Signaling**: Consultation call signaling (`/api/v1/calls/signal`) strictly derives identity from server-side authenticated sessions, preventing caller ID impersonation.

### 7. CI/CD Supply-Chain Security

- **Automated Security Pipeline**: `.github/workflows/ci.yml` runs on `main` and active development branches, enforcing `npx eslint .`, `npx tsc --noEmit`, `npx jest --maxWorkers=2`, and `npm audit --audit-level=high`.
- **CodeQL Static Analysis**: `.github/workflows/security.yml` executes weekly CodeQL AST vulnerability scans across all JavaScript and TypeScript code.
- **Gated Production Deployment**: `.github/workflows/cd.yml` triggers Vercel production deployment only after the complete CI test and validation suite passes.
