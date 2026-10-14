# Fahad Ali Interior — Haute Royal Furniture & Architectural Woodwork

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?logo=postgresql)](https://neon.tech/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-486%20Passed-brightgreen)](https://jestjs.io/)

Enterprise-grade e-commerce storefront, real-time AI interior design concierge (`👑 Senior Sales`), and executive administration suite for **Fahad Ali Interior** (Chiniot & Lahore, Pakistan).

---

## 🏛️ Table of Contents

1. [Tech Stack & Architecture](#-tech-stack--architecture)
2. [Key Features](#-key-features)
3. [Local Development Setup](#-local-development-setup)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [NPM Scripts & Commands](#-npm-scripts--commands)
6. [Deployment Guide (Vercel & Neon)](#-deployment-guide-vercel--neon)
7. [Automated Testing & Security Hardening](#-automated-testing--security-hardening)
8. [License](#-license)

---

## 💻 Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router, React 19, Server Components, Incremental Static Regeneration - ISR)
- **Language**: TypeScript 5 (Strict Mode, 100% type safety)
- **Database & ORM**: PostgreSQL via Neon Serverless, Prisma ORM 6
- **Distributed Cache & Rate Limiting**: Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`)
- **Authentication**: NextAuth.js (JWT strategy with periodic role/status re-verification, TOTP 2FA via RFC-6238, dedicated isolated Admin HMAC session tokens)
- **Multi-Provider AI Concierge**: Groq Cloud (Llama-3.3-70B / 120B), Google Gemini 2.0 Flash, OpenAI GPT-4o-mini, WebRTC audio/video consultations
- **Styling & Animation**: Tailwind CSS v4, Framer Motion, GSAP, Radix UI primitives, Lucide Icons
- **Media Delivery**: Cloudinary CDN with magic-byte verification and SVG sanitization
- **Offline PWA**: Serwist Service Worker with offline catalog fallback

### Directory Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/                # Canonical auth endpoints (register, reset password, verify email, 2FA)
│   │   ├── admin/               # Dedicated admin auth, token issuance, and session verification
│   │   ├── v1/ai/chat/          # Multi-provider LLM concierge (Groq, Gemini, OpenAI)
│   │   ├── health/              # Health diagnostic probes
│   │   └── v1/[...path]/        # REST API v1 resource dispatcher
│   ├── shop/                    # Catalog browsing, dynamic faceted filters, and search
│   ├── product/[id]/            # ISR Product detail pages (revalidate = 60 + generateStaticParams)
│   ├── checkout/                # Pakistani luxury checkout (COD, Raast, JazzCash, Easypaisa, Cards)
│   ├── dashboard/               # VIP Client order tracking, invoices, and profile
│   └── admin/                   # Executive suite (catalog, inventory, orders, analytics, live chat)
├── components/
│   ├── admin/                   # Admin tabs, analytics charts, and data tables
│   ├── checkout/                # Interactive 3D Pakistani bank card preview
│   └── VoiceAiModal.tsx         # Bilingual Urdu/English voice consultation modal with live waveform
├── lib/
│   ├── ai/                      # MultiProviderLlm, AgentRouter (Sales, Interior, Quote, Support), RAG
│   ├── admin-auth.ts            # Timing-safe HMAC-SHA256 admin token minting and validation
│   ├── rate-limit.ts            # Distributed sliding-window edge rate limiting
│   └── db.ts                    # Resilient Prisma database client pool
└── proxy.ts                     # Request proxy: strict CSP nonces, CSRF origin verification, auth guards
```

---

## ✨ Key Features

1. **👑 Senior Sales AI Concierge**:
   - High-capacity LLM answering (Groq / Gemini) with 3,000 max tokens per response.
   - Comprehensive markdown tables, live stock querying, PKR pricing, and bilingual Roman Urdu/English fluency.
2. **Pakistani Localization**:
   - Custom payment methods: Cash on Delivery (COD), Direct Bank Transfer (Raast / IBFT), JazzCash, Easypaisa.
   - White-Glove delivery logistics (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, and nationwide).
3. **Hardened Enterprise Security**:
   - Strict Content Security Policy (CSP) with dynamic per-request cryptographic nonces in production.
   - Isolated cryptographic signing secrets for User sessions, Admin tokens, and TOTP 2FA encryption (AES-256-GCM).
   - Upstash Redis edge rate-limiting preventing brute-force and scraping.
4. **SEO & Canonical URLs**:
   - Next.js dynamic metadata with canonical link tags configured across all routes (`/`, `/shop`, `/product/[id]`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`).
   - Automated dynamic XML sitemap (`/sitemap.xml`) and search crawler directives (`/robots.txt`).

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `>= 20.12.0` (Recommended: LTS Node.js 22+)
- **NPM**: `>= 10.x`
- **PostgreSQL Database**: Neon Serverless account or local PostgreSQL instance
- **Upstash Redis**: Free tier account at [console.upstash.com](https://console.upstash.com)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/fahad-ali-interior.git
cd fahad-ali-interior
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the values in `.env` (refer to the [Environment Variables Reference](#-environment-variables-reference) below).

### 5. Initialize the Database
Generate the Prisma Client and push the schema to your PostgreSQL database:
```bash
npm run db:generate
npm run db:migrate:dev
```
*(Optional) Seed initial products, categories, and master admin:*
```bash
npm run db:seed
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection pool URL (Neon connection string with SSL). |
| `DIRECT_DATABASE_URL` | **Yes** | Direct PostgreSQL connection URL for Prisma migrations. |
| `NEXTAUTH_SECRET` | **Yes** | 32-byte random hex string used to encrypt NextAuth JWT sessions. |
| `NEXTAUTH_URL` | **Yes** | Canonical app URL (e.g. `http://localhost:3000` or production URL). |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public frontend URL for client-side API requests. |
| `ADMIN_TOKEN_SECRET` | **Yes** | Separate 32-byte hex secret dedicated exclusively to signing admin HMAC tokens. |
| `TOTP_ENC_KEY` | **Yes** | 32-byte hex key for AES-256-GCM encryption of 2FA secrets at rest. |
| `AI_SESSION_SECRET` | **Yes** | 32-byte hex secret for cryptographically bound AI session cookies. |
| `ADMIN_EMAILS` | **Yes** | Comma-separated list of emails with administrative privileges. |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash Redis REST URL for distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash Redis REST authentication token. |
| `GROQ_API_KEY` | **Yes** | Groq Cloud API key powering the primary high-speed AI Concierge LLM. |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for multimodal room analyzer and fallback LLM. |
| `OPENAI_API_KEY` | Optional | OpenAI API key for secondary LLM fallback. |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud identifier for furniture media uploads. |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API access key. |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API access secret. |
| `SMTP_HOST` | **Yes** | SMTP server address (e.g. `smtp.gmail.com`). |
| `SMTP_PORT` | **Yes** | SMTP port (`465` for SSL/TLS, `587` for STARTTLS). |
| `SMTP_USER` | **Yes** | SMTP authentication email address. |
| `SMTP_PASS` | **Yes** | SMTP application-specific password. |
| `WHATSAPP_NUM` | Optional | Direct WhatsApp concierge phone number in international format. |

> [!TIP]
> Generate secure 32-byte cryptographic hex keys in your terminal using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 📜 NPM Scripts & Commands

All available project scripts configured in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack on port 3000. |
| `npm run build` | Compiles production build using Webpack and executes build pruning. |
| `npm start` | Launches optimized production server on port 3000. |
| `npm run lint` | Runs ESLint 9 across all TypeScript and React files with zero error tolerance. |
| `npm run test:unit` | Executes Jest unit and security penetration test suite (486 tests). |
| `npm run test:e2e` | Runs Playwright end-to-end browser tests across Chromium, Firefox, and WebKit. |
| `npm run test:ci` | Comprehensive CI pipeline running lint, unit tests, and E2E tests. |
| `npm run db:generate` | Generates TypeScript types for the Prisma client from schema. |
| `npm run db:migrate` | Deploys pending Prisma database migrations to production. |
| `npm run db:migrate:dev` | Creates and applies new database migrations during local development. |
| `npm run db:seed` | Populates the database with initial catalog, categories, and administrator. |
| `npm run pwa:icons` | Generates modern PWA web application manifest icons. |

---

## 🌐 Deployment Guide (Vercel & Neon)

### 1. Database Setup (Neon PostgreSQL)
1. Sign in to [Neon.tech](https://neon.tech) and create a new project (e.g. `fahad-ali-interior`).
2. Copy the **Pooled Connection String** to use as `DATABASE_URL`.
3. Copy the **Direct Connection String** to use as `DIRECT_DATABASE_URL`.

### 2. Upstash Redis Setup
1. Sign in to [Upstash Console](https://console.upstash.com) and create a Redis database in a nearby region (e.g., AWS `ap-southeast-1` or `eu-central-1`).
2. Copy the REST URL and REST Token.

### 3. Deploy to Vercel
1. Import your Git repository into [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**.
3. In **Settings → Environment Variables**, add all production variables listed in the [Environment Variables Reference](#-environment-variables-reference).
4. Verify that `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` match your production domain:
   ```env
   NEXTAUTH_URL=https://fahad-ali-interior.vercel.app
   NEXT_PUBLIC_APP_URL=https://fahad-ali-interior.vercel.app
   NEXT_PUBLIC_SITE_URL=https://fahad-ali-interior.vercel.app
   ```
5. Deploy! Vercel will run `npm run build` automatically.

---

## 🛡️ Automated Testing & Security Hardening

The repository enforces complete test coverage and rigorous security controls:

```bash
# Run all unit and security regression test suites
npm run test:unit
```

### Verification Matrix
- **Test Suites**: **38 passed, 38 total**
- **Individual Tests**: **486 passed, 486 total**
- **Static Analysis**: TypeScript (`npx tsc --noEmit`) ➔ **0 errors**
- **Code Linter**: ESLint (`npm run lint`) ➔ **0 errors, 0 warnings**
- **Cryptographic Nonce**: CSP nonces generated dynamically per request in production.
- **Client IP Protection**: Trusted proxy resolution prevents IP header spoofing.
- **Admin Tokens**: Mandatory 24-hour expiration with timing-safe HMAC verification.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

*Crafted with generational mastery for **Fahad Ali Interior**, Lahore & Chiniot, Pakistan.*
