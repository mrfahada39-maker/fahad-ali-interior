# Fahad Ali Interior — Full Deployment Guide

> Complete step-by-step guide to deploy the clean unified Next.js 16 Full-Stack platform to production.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│              User's Browser             │
└────────────────────┬────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────┐
│     Vercel (Next.js 16 Full-Stack)      │
│     fahadaliinterior.com                │
│     - Server Components & SSR           │
│     - NextAuth (Secure JWT sessions)    │
│     - Edge Middleware (Rate limiting)   │
│     - Serverless API Handlers (/api/v1) │
│     - Direct Gmail TLS SMTP             │
│     - WebRTC Signaling & AI Concierge   │
└────────────────────┬────────────────────┘
                     │
             ┌───────┴────────┐
             ▼                ▼
     ┌──────────────┐  ┌──────────────┐
     │  PostgreSQL  │  │    Redis     │
     │  (Neon.tech  │  │  (Upstash    │
     │ / Supabase)  │  │Rate Limiter) │
     └──────────────┘  └──────────────┘
```


---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables filled (see `.env.example`)
- [ ] Database provisioned and migrated
- [ ] Redis (Upstash) instance created
- [ ] Cloudinary account configured
- [ ] SMTP email credentials ready
- [ ] Domain name purchased and DNS configured

---

## 🗄️ Step 1: Database Setup (Neon.tech)

1. Go to [neon.tech](https://neon.tech) → Create a new project
2. Copy the **Connection String**
3. Run migrations:
```bash
# From project root
npm run db:migrate
```
4. Seed initial data:
```bash
npm run db:seed
```
5. Create admin user:
```bash
node scripts/make-admin.mjs
```

---

## ⚡ Step 2: Redis Setup (Upstash)

1. Go to [console.upstash.com](https://console.upstash.com) → Create Redis database
2. Select region closest to your users (e.g., `eu-west-1`)
3. Copy **REST URL** and **REST Token**
4. Add to both Frontend and Backend `.env`:
```env
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
REDIS_URL=rediss://default:your-password@your-host:6379
```

---

## 🖼️ Step 3: Cloudinary Setup (Image CDN)

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. From **Dashboard**, copy Cloud Name, API Key, API Secret
3. Create an **Upload Preset** (unsigned, for product images):
   - Settings → Upload → Upload presets → Add new
   - Name: `fahad-ali-products`
   - Signing mode: **Unsigned**
4. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=fahad-ali-products
CLOUDINARY_FOLDER=fahad-ali-interior
```

---

## 📧 Step 4: Email Setup (Resend / Brevo)

### Using Resend (Recommended)
1. Go to [resend.com](https://resend.com) → Create account
2. Add your domain → Verify DNS records
3. Create API key
4. Add to Backend `.env`:
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_your_api_key
EMAIL_FROM=Fahad Ali Interior <noreply@fahadaliinterior.com>
```

---

## 🚂 Step 5: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → Choose `Backend/` as root directory
3. **Add all environment variables** (copy from `Backend/.env.example`):
   - `NODE_ENV=production`
   - `PORT=3001`
   - `DATABASE_URL=...`
   - `JWT_ACCESS_SECRET=` (generate 64-char hex)
   - `JWT_REFRESH_SECRET=` (generate 64-char hex)
   - All SMTP, Cloudinary, Redis vars
4. Railway will auto-build using the `Dockerfile` in `Backend/`
5. Set custom domain: `api.fahadaliinterior.com`

**Verify backend is live:**
```
https://api.fahadaliinterior.com/api/v1/health/live
```
Should return: `{"status":"ok"}`

---

## ▲ Step 6: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select your repo (root directory: `./`)
3. Framework preset: **Next.js**
4. **Add all environment variables** (from `.env.example`):
```env
NEXTAUTH_SECRET=<64-char-hex>
NEXTAUTH_URL=https://fahadaliinterior.com
ENTERPRISE_API_ORIGIN=https://api.fahadaliinterior.com
INTERNAL_PROXY_KEY=<64-char-hex — must match backend>
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
NEXT_PUBLIC_BACKEND_URL=https://api.fahadaliinterior.com
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=false
```
5. Click **Deploy**

---

## 🔐 Step 7: NextAuth Secret Generation

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate INTERNAL_PROXY_KEY (same command, use same value in both .env files!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> ⚠️ **IMPORTANT**: `INTERNAL_PROXY_KEY` must be **identical** in both frontend and backend `.env` files!

---

## 🌐 Step 8: DNS Configuration

In your domain registrar (e.g. Namecheap, GoDaddy), set:

| Type | Name | Value |
|------|------|-------|
| `A` or `CNAME` | `@` | Vercel IP or `cname.vercel-dns.com` |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `api` | Your Railway domain (e.g. `backend-production-xxx.up.railway.app`) |

---

## 🔔 Step 9: Push Notifications (VAPID)

```bash
# In Backend directory
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
```

Add to **both** frontend and backend `.env`:
```env
# Frontend
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>

# Backend
VAPID_PUBLIC_KEY=<publicKey>
VAPID_PRIVATE_KEY=<privateKey>
VAPID_SUBJECT=mailto:support@fahadaliinterior.com
```

---

## 📊 Step 10: Monitoring Setup

### UptimeRobot (Free)
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:
   - `https://fahadaliinterior.com` — Frontend
   - `https://api.fahadaliinterior.com/api/v1/health/live` — Backend API

### Discord Alerts
1. Discord → Server Settings → Integrations → Webhooks → New Webhook
2. Copy URL to Backend `.env`:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## ✅ Final Verification

After deployment, verify these URLs work:

```
✅ https://fahadaliinterior.com                          → Homepage loads
✅ https://fahadaliinterior.com/shop                     → Shop page loads
✅ https://api.fahadaliinterior.com/api/v1/health/live   → {"status":"ok"}
✅ https://api.fahadaliinterior.com/api/v1/health        → Full health report
✅ https://fahadaliinterior.com/sitemap.xml              → SEO sitemap
✅ https://fahadaliinterior.com/robots.txt               → Robots file
```

---

## 🚨 Rollback Procedure

If deployment fails:

```bash
# Vercel rollback (from Vercel dashboard → Deployments → Rollback)

# Railway rollback
# Railway Dashboard → Service → Deployments → Click previous deployment → Redeploy
```

---

## 🔒 Security Checklist

- [ ] All secrets are 64-char random hex (not guessable)
- [ ] `INTERNAL_PROXY_KEY` matches exactly between frontend and backend
- [ ] `NODE_ENV=production` set on Railway
- [ ] `NEXTAUTH_URL` set to exact production URL
- [ ] HTTPS enforced (Vercel and Railway do this automatically)
- [ ] CORS configured in backend to only allow `fahadaliinterior.com`
