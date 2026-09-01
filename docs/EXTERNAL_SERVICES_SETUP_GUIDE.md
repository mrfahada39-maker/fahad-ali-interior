# Production External Services Onboarding & Setup Guide

This guide provides step-by-step instructions to configure every external production service required by the **Fahad Ali Interior** enterprise stack.

---

## 1. Discord Webhook Alerts (`DISCORD_WEBHOOK_URL`)

### Purpose
Sends immediate, formatted alerts to your engineering Discord channel whenever a 500 error, database downtime, or system health anomaly occurs.

### Setup Instructions
1. Open your Discord server settings -> **Integrations** -> **Webhooks**.
2. Click **New Webhook**, select the channel (e.g. `#alerts-prod`), and copy the **Webhook URL**.
3. Add the URL to your environment variables:
   ```env
   DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"
   ```

---

## 2. Transactional Email SMTP (`SMTP_*`)

### Purpose
Sends automated welcome emails, password reset requests, order confirmation receipts, and customer notification updates.

### Setup Instructions (Resend / SendGrid / Amazon SES / Brevo)
1. Register for an SMTP provider (e.g., [Resend](https://resend.com), [Brevo](https://brevo.com), or SendGrid).
2. Obtain your SMTP credentials:
   ```env
   SMTP_HOST="smtp.resend.com"
   SMTP_PORT=587
   SMTP_USER="resend"
   SMTP_PASS="re_123456789"
   EMAIL_FROM="Fahad Ali Interior <noreply@fahadaliinterior.com>"
   ```

---

## 3. GitHub Secrets Configuration

### Purpose
Secures deployment webhooks for automated CI/CD deployment pipelines.

### Setup Instructions
1. Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following repository secrets:
   * `RAILWAY_WEBHOOK_URL`: Obtained from Railway Service -> Settings -> Deploy Triggers -> Webhook URL.
   * `VERCEL_DEPLOY_HOOK_URL`: Obtained from Vercel Project -> Settings -> Git -> Deploy Hooks.

---

## 4. Vercel Production Environment Variables (Frontend)

### Purpose
Powers Next.js 16 server-side rendering, authentication, and Upstash Redis rate-limiting at the edge.

### Setup Instructions
Navigate to **Vercel Dashboard** -> **Project Settings** -> **Environment Variables** and add:
```env
NEXTAUTH_SECRET="<generate 64-char hex>"
NEXTAUTH_URL="https://fahadaliinterior.com"
ENTERPRISE_API_ORIGIN="https://api.fahadaliinterior.com"
INTERNAL_PROXY_KEY="<generate 64-char hex, match backend>"
UPSTASH_REDIS_REST_URL="https://<your-db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<your-upstash-token>"
CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
CLOUDINARY_API_KEY="<your-api-key>"
CLOUDINARY_API_SECRET="<your-api-secret>"
```

---

## 5. Vercel Production Environment Variables (Next.js 16 Unified Platform)

### Purpose
Powers the unified Next.js 16 full-stack application, serverless REST APIs, PostgreSQL Prisma connection, Upstash Redis rate-limiter, and JWT authentication.

### Setup Instructions
Navigate to **Vercel Dashboard** -> **Settings** -> **Environment Variables** and add:
```env
NODE_ENV="production"
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXTAUTH_SECRET="<generate 64-char hex>"
NEXTAUTH_URL="https://fahad-ali-interior.vercel.app"
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="<token>"
CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
CLOUDINARY_API_KEY="<your-api-key>"
CLOUDINARY_API_SECRET="<your-api-secret>"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
SMTP_HOST="smtp.provider.com"
SMTP_PORT=587
SMTP_USER="smtp-user"
SMTP_PASS="smtp-pass"
EMAIL_FROM="noreply@fahadaliinterior.com"
```

---

## 6. Uptime & Status Monitoring (UptimeRobot / Better Stack)

### Purpose
Monitors API health, uptime, CPU/memory performance, and database latency.

### Setup Instructions
1. Register on [UptimeRobot](https://uptimerobot.com) or [Better Stack](https://betterstack.com).
2. Create HTTP(s) monitor targeting:
   * **Liveness Endpoint:** `https://api.fahadaliinterior.com/api/v1/health/live`
   * **Full Diagnostics Endpoint:** `https://api.fahadaliinterior.com/api/v1/health`
   * **Metrics Endpoint:** `https://api.fahadaliinterior.com/api/v1/metrics`
3. Set alert threshold to 30 seconds interval.
