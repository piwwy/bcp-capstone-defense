# 🚀 Production Deployment & Operations Guide
## Bestlink College of the Philippines (BCP) Alumni Management Portal

---

### 1. System Overview & Architecture

The **BCP Alumni Management Portal** is a production-grade enterprise web application built for institutional scale, security, and compliance with the Philippine Data Privacy Act of 2012 (RA 10173).

- **Frontend SPA**: React 18, TypeScript, TailwindCSS, Vite 6, TanStack Query v5. Hosted on **Netlify**.
- **Database & Identity**: Supabase Managed PostgreSQL (34 tables, RLS security gates, composite indexes, atomic triggers).
- **Serverless Edge Layer**: Deno Supabase Edge Functions with `service_role` isolation for administrative operations (user creation, password reset, transactional notifications).
- **Email Delivery**: Brevo Transactional API dispatched server-side via Edge Functions.

---

### 2. Prerequisites

Before starting deployment, verify access to the following accounts:
1. **GitHub Repository**: Admin access to `piwwy/bcp-capstone-defense`.
2. **Supabase Cloud**: Active project at [supabase.com](https://supabase.com).
3. **Netlify**: Team account at [netlify.com](https://netlify.com).
4. **Brevo**: Verified sender domain/email account at [brevo.com](https://brevo.com).
5. **Node.js**: v18.0.0 or higher with `npm` installed locally.

---

### 3. Step 1: Supabase Database Baseline Setup

#### 3.1 Apply Master Baseline Schema
1. Open your Supabase Project Dashboard ➔ **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of [`supabase/baseline_schema.sql`](file:///c:/Users/perry/betlink%20alumni%20portal/bcp/supabase/baseline_schema.sql).
4. Click **Run**.
5. Verify that all 34 tables, RLS policies, indexes, and RPC functions (`get_dashboard_counts`, `admin_create_user`) compile with `Success. No rows returned`.

#### 3.2 Authentication & Email Provider Settings
1. Navigate to **Authentication** ➔ **Providers** ➔ **Email**.
2. If testing in staging/local development, you may toggle OFF **Confirm email** to allow immediate logins. In production, keep **Confirm email** ON and ensure Brevo or custom SMTP is active.
3. In **Authentication** ➔ **URL Configuration**:
   - **Site URL**: `https://your-production-subdomain.netlify.app`
   - **Redirect URLs**: Add `https://your-production-subdomain.netlify.app/**` and `http://localhost:5175/**`.

#### 3.3 Storage Buckets
In **Storage**, verify the existence of the following public/authenticated buckets:
- `avatars` (Public: Yes)
- `receipts` (Public: No, authenticated only)
- `event_banners` (Public: Yes)
- `documents` (Public: No)

---

### 4. Step 2: Supabase Edge Functions & Secrets Configuration

All sensitive API keys are isolated on the serverless edge runtime.

#### 4.1 Configure Vault Secrets
In your Supabase Dashboard ➔ **Settings** ➔ **Vault** (or Edge Functions Secrets):

| Secret Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `BREVO_API_KEY` | Transactional API key from Brevo | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | Verified institutional sender address | `alumni-affairs@bcp.edu.ph` |
| `BREVO_SENDER_NAME` | Institutional sender display name | `BCP Alumni Affairs Office` |
| `SUPABASE_URL` | Auto-provided or your project URL | `https://your-project-id.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role secret key | `eyJhbGciOi...` |

#### 4.2 Deploy Edge Functions via Supabase CLI
Run the following deployment commands from the repository root:

```bash
# Login to Supabase CLI
npx supabase login

# Link your remote Supabase project
npx supabase link --project-ref your-project-id

# Deploy all 4 serverless functions
npx supabase functions deploy create-users
npx supabase functions deploy admin-reset-password
npx supabase functions deploy send-email
npx supabase functions deploy send-donation-receipt
```

---

### 5. Step 3: Netlify Frontend Deployment

#### 5.1 Link GitHub Repository
1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** ➔ **Import an existing project** ➔ **GitHub**.
3. Select `piwwy/bcp-capstone-defense`.
4. Configure Build Settings:
   - **Base directory**: `.`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

#### 5.2 Configure Production Environment Variables
In Netlify ➔ **Site settings** ➔ **Environment variables**, define:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-supabase-anon-key
VITE_APP_NAME="BCP Alumni Portal"
VITE_APP_URL=https://your-production-subdomain.netlify.app
VITE_VERBOSE_DEBUG_TOASTS=false
```

#### 5.3 Single Page Application (SPA) Routing
Netlify requires all virtual paths to fall back to `index.html`. This is pre-configured in [`netlify.toml`](file:///c:/Users/perry/betlink%20alumni%20portal/bcp/netlify.toml):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### 6. Step 4: Verification & Smoke Test Runbook

Perform the following smoke tests on the freshly deployed environment:

| Test ID | Procedure | Expected Result |
| :--- | :--- | :--- |
| **ST-01** | Open `/login` | High-contrast branding with Bestlink College of the Philippines title |
| **ST-02** | Sign in with `admin@gmail.com` | Redirected to `/admin/dashboard` with AdminSidebar |
| **ST-03** | Sign in with `alumni_demo@gmail.com` | Prompts for 2FA, auto-fills dev OTP, enters `/alumni/dashboard` |
| **ST-04** | Check Audit Trail (`/admin/audit-trail`) | Entries present for logins, status modifications, and password resets |
| **ST-05** | Attempt direct URL jump (`/admin/dashboard` as unauthenticated) | Intercepted by ProtectedRoute and redirected to `/login` |
| **ST-06** | Run automated test suite (`npm test`) | 77/77 tests passing across all test suites |

---

### 7. Disaster Recovery & Backup Plan

1. **Daily Automated Backups**: Handled by Supabase Managed Postgres.
2. **Point-in-Time Recovery (PITR)**: Enable PITR in Supabase Pro Plan for 7-day rolling rollback capability.
3. **Manual Snapshot Command**:
   ```bash
   npx supabase db dump -f backup_$(date +%Y%m%d).sql --data-only
   ```
