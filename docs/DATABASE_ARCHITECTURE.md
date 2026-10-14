# Database Architecture & Platform Evaluation

**Project**: BCP Alumni Portal (Productization)  
**Date**: October 2026  
**Status**: APPROVED ARCHITECTURE DECISION RECORD (ADR)  

---

## 1. Executive Summary

The BCP Alumni Management System is transitioning from an academic capstone prototype into a commercial, production-ready SaaS alumni platform designed for higher education institutions. This document evaluates three database architecture options:

1. **Option A: Supabase Managed PostgreSQL** *(Current Architecture)*
2. **Option B: Self-Hosted PostgreSQL on VPS** *(Virtual Private Server via Docker)*
3. **Option C: MySQL 8.x** *(Relational Database alternative)*

### Final Recommendation
**Retain Supabase Managed PostgreSQL for development, staging, and initial institutional launch.**  
If an institution mandates on-premises data residency or has zero recurring cloud budget, provide an automated **Supabase Self-Hosted (Docker Compose)** deployment script. **Migrating to MySQL is strongly discouraged** due to catastrophic rewrites required for Row-Level Security, Auth, Realtime, and Edge Functions.

---

## 2. Platform Comparison Matrix

| Criteria | Option A: Supabase Managed Postgres | Option B: Self-Hosted VPS Postgres | Option C: MySQL 8.x |
| :--- | :--- | :--- | :--- |
| **Row Level Security (RLS)** | Native Postgres RLS with JWT claim context (`auth.uid()`, `auth.role()`) | Native Postgres RLS supported | ❌ **No native RLS**. Security must be entirely rewritten in backend code |
| **Authentication Engine** | Built-in GoTrue auth service, email/password, OAuth, magic links, session tokens | Can deploy GoTrue container or build custom auth service | ❌ Must write entire auth system + JWT issuance + password reset service |
| **File / Media Storage** | Built-in S3-compatible storage API with RLS bucket policies | Must host MinIO or S3 bucket + custom auth proxy | Must configure separate storage and write custom upload endpoints |
| **Realtime WebSockets** | Native Realtime engine for live chat, presence, notifications | Self-host Supabase Realtime container or socket.io server | Must build custom WebSocket server and pub/sub broker (e.g. Redis) |
| **Edge Functions / Serverless** | Deno Edge Functions managed and scaled automatically | Must deploy custom Node.js/Go API server + reverse proxy | Must build and maintain custom backend API server |
| **Monthly Infrastructure Cost** | **$0/mo** (Free tier) to **$25/mo** (Pro tier for production) | **$6 - $15/mo** (Hetzner / DigitalOcean / Linode VPS) | **$6 - $12/mo** (VPS with MySQL) |
| **DevOps Overhead** | **Zero**. Automated backups, point-in-time recovery, managed patching | **High**. Manual Postgres tuning, WAL archiving, backups, SSL certs | **High**. Manual DB administration, replication, security patching |
| **Time to Market / Portability** | Immediate (zero code rewrite) | 2–3 days (Docker setup, exact same Postgres schema) | **6–8 weeks** (Full rewrite of API, auth, queries, and security) |

---

## 3. Deep-Dive Evaluation

### Option A: Supabase Managed PostgreSQL (Recommended)
- **Strengths**:
  - **Single SDK**: Frontend interacts directly with Supabase via `@supabase/supabase-js` without requiring a bloated intermediary middleware server for standard CRUD operations.
  - **Database-Level Security**: Every single row accessed is governed by PostgreSQL Row Level Security (RLS). Even if frontend code is tampered with, unprivileged users cannot view or manipulate other users' data.
  - **Zero Maintenance**: Backups, WAL archiving, database upgrades, and high availability are managed by Supabase infrastructure.
  - **Cost-Efficiency**: Free tier supports up to 500MB database, 1GB storage, 50,000 monthly active users, and 500K edge function invocations. Upgrading to Pro ($25/month) provides 8GB DB, 100GB storage, 100,000 MAUs, and daily automated backups.

### Option B: Self-Hosted Supabase / Postgres on VPS
- **When to Use**:
  - If a client college or university has a strict legal mandate requiring data to remain on school-owned servers (on-premises) or in a specific domestic datacenter.
  - If recurring monthly cloud costs ($25/mo) cannot be approved by school administration.
- **Implementation Strategy**:
  - Utilize Supabase's official Docker Compose stack (`supabase/docker`).
  - Retains 100% compatibility with the frontend codebase, database schema, RLS policies, and storage buckets.
  - **Estimated VPS Specs**: 2 vCPU, 4GB RAM, 80GB NVMe SSD (~$10–$14/mo on Hetzner or DigitalOcean).

### Option C: MySQL 8.x (Not Recommended)
- **Why it is Rejected**:
  - MySQL lacks built-in declarative Row-Level Security (`CREATE POLICY ... USING (auth.uid() = user_id)`). To match current security, the entire application would require building a custom backend API server (Express/NestJS/FastAPI) and rewriting hundreds of frontend database calls into REST endpoints.
  - Requires replacing `@supabase/supabase-js`, Supabase Auth, Storage, and Realtime with bespoke custom implementations.
  - Migrating to MySQL would delay productization by months without providing any measurable technical or financial benefit.

---

## 4. Database Schema Health & Squashing Strategy

### Current Issue: Migration Fragmentation
The repository previously accumulated **34 fragmented migration files**:
- Broken/empty placeholder migrations (`20260214010855_initial_schema_backup.sql`).
- Duplicate backup files (`20260217130000_fix_rls_BACKUP_20260217.sql`).
- Overlapping and competing RLS policies resulting in circular query loops.
- Untracked tables referenced by UI components (e.g., `subscription_applications`).

### Squashing Solution
1. **Single Master Baseline Schema** (`supabase/baseline_schema.sql`):
   - Fully consolidated, idempotent, and ordered:
     1. PostgreSQL Extensions (`uuid-ossp`, `pgcrypto`).
     2. All 34 Core Domain Tables with explicit primary keys and foreign key constraints.
     3. High-performance composite indexes on hot query paths.
     4. Helper functions (`current_user_role()`, `is_admin_or_staff()`, `is_admin()`).
     5. Triggers: User auto-provisioning (`handle_new_user()`) and security privilege escalation prevention (`prevent_profile_privilege_escalation()`).
     6. Consolidated RPC functions (`get_admin_dashboard_stats()`).
     7. Comprehensive RLS policies and role-based grant revokes.
2. **Fresh Deployment Simplicity**:
   - A new environment or tenant can now be provisioned in under 60 seconds simply by running `supabase/baseline_schema.sql`.

---

## 5. Performance Indexing Strategy

To maintain <100ms response times as alumni counts grow to tens of thousands of records, the following composite indexes are enforced:

| Table | Index Columns | Purpose |
| :--- | :--- | :--- |
| `profiles` | `(role, status)` | Fast filtering in admin panels and dashboard stats |
| `profiles` | `(email)` | Instant login and registration duplication checks |
| `profiles` | `(student_id) WHERE student_id IS NOT NULL` | Master list verification and bulk import matching |
| `profiles` | `(course, batch_year)` | Alumni directory faceted search |
| `messages` | `(sender_id, receiver_id, created_at DESC)` | Direct message thread loading |
| `notifications` | `(user_id, is_read, created_at DESC)` | Instant bell notification counter & feed |
| `jobs` | `(status, created_at DESC)` | Active job board queries |
| `alumni_events` | `(status, date DESC)` | Upcoming and past event listing |
| `audit_logs` | `(user_id, created_at DESC)` | Compliance audits and user activity logs |
| `contact_inquiries` | `(inquiry_type, status, created_at DESC)` | Partner & employer inquiries inbox |

---

## 6. Conclusion
Retaining Supabase PostgreSQL while consolidating the schema into a single production baseline maximizes stability, maintains strict row-level security, and provides a clear institutional deployment path (cloud or self-hosted) with zero frontend disruption.
