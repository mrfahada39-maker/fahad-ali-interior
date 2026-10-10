# Fahad Ali Interior — Royal Bespoke Furniture & Architectural Woodwork

Enterprise e-commerce storefront, AI interior design concierge, and executive administration suite for **Fahad Ali Interior** (Chiniot & Lahore, Pakistan).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Server Components, ISR)
- **Language**: TypeScript 5 (Strict mode)
- **Database**: PostgreSQL (Neon Serverless) with Prisma ORM
- **Authentication**: NextAuth.js (JWT strategy with periodic database role/status re-verification, TOTP 2FA, and dedicated Admin session tokens)
- **Rate Limiting & Distributed Cache**: Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`)
- **Validation**: Zod (`src/lib/validations/api-schemas.ts`)
- **Styling & Motion**: Tailwind CSS v4, Framer Motion, GSAP, Lucide Icons
- **Media & Storage**: Cloudinary (authenticated magic-byte verified uploads)
- **AI Concierge**: Google Gemini (`@google/genai`) with server-bound `httpOnly` session cookies

---

## Project Architecture

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/                # Canonical auth routes (register, forgot/reset password, verify-email, check-2fa)
│   │   ├── admin/               # Admin session login, logout (with token revocation), and verification
│   │   ├── ai/                  # Gemini AI chat & authenticated admin AI analytics
│   │   ├── health/              # Health check endpoint (detailed diagnostics restricted to admins)
│   │   └── v1/[...path]/        # Modular API v1 dispatcher
│   ├── product/[id]/            # ISR Product detail pages (revalidate = 60 + generateStaticParams)
│   ├── shop/                    # Interactive catalog & filtering
│   ├── checkout/                # Multi-step Pakistani luxury checkout (COD, Raast, JazzCash, Easypaisa, Cards)
│   ├── dashboard/               # VIP Client Portal
│   └── admin/                   # Executive Admin Suite
├── components/
│   ├── admin/                   # Modular admin navigation chrome & tabs
│   ├── checkout/                # Modular Pakistani bank card themes & 3D interactive preview
│   └── user-dashboard/          # Modular client order invoice, live crafting tracker & quick-view modals
├── hooks/
│   ├── use-admin-call.ts        # Admin WebRTC voice/video consultation hook
│   └── use-user-call.ts         # Client WebRTC voice/video consultation hook
├── lib/
│   ├── api-handlers/            # Modular API resource handlers (auth, products, orders, reviews, customers, messages, settings)
│   ├── validations/             # Zod request payload schemas (api-schemas.ts)
│   ├── totp-crypto.ts           # AES-256-GCM TOTP secret encryption & salted SHA-256 backup code hashing
│   ├── rate-limit.ts            # Upstash Redis + memory sliding-window rate limiter
│   └── contact-config.ts        # Centralized business contact configuration
└── proxy.ts                     # Next.js request proxy: per-request CSP nonce, CSRF guard, and route protection
```

---

## Getting Started

### 1. Prerequisites

- **Node.js** `>= 20.x`
- **PostgreSQL** database (local or Neon Serverless)
- **Upstash Redis** instance (required in production)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and populate all required secrets:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL pooled connection string |
| `DIRECT_URL` | PostgreSQL direct connection string for Prisma migrations |
| `NEXTAUTH_SECRET` | 32+ byte secret for NextAuth JWT encryption |
| `ADMIN_TOKEN_SECRET` | Dedicated secret for signing `/admin` tokens (falls back to `NEXTAUTH_SECRET` only in dev) |
| `TOTPSecretKey` / `TOTP_ENCRYPTION_KEY` | Key material for AES-256-GCM encryption of 2FA secrets at rest |
| `ADMIN_EMAILS` | Comma-separated list of authorized admin email addresses |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (enforced in production) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token (enforced in production) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GEMINI_API_KEY` | Google Gemini API key for the AI Interior Concierge |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL (e.g., `https://fahadaliinterior.com`) |

### 4. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

---

## Quality & Testing Commands

```bash
# TypeScript static type check
npx tsc --noEmit

# ESLint code quality check
npm run lint

# Jest unit & security penetration test suite
npm run test:unit

# Production build verification
npm run build
```

---

## Security

See [SECURITY.md](./SECURITY.md) for a comprehensive overview of the platform's security controls, cryptographic architecture, and vulnerability reporting process.
