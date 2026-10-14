# Security Architecture & Data Privacy Policy (RA 10173)
**BCP Alumni Portal — Production Security Standard**

---

## 1. Executive Security Overview

This document defines the security architecture, threat model, Row Level Security (RLS) matrix, and regulatory compliance protocols for the Bestlink College of the Philippines (BCP) Alumni Portal. All system boundaries conform to the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)** and the National Privacy Commission (NPC) circulars.

---

## 2. Threat Model

### 2.1 Threat Actors & Vectors
| Threat Actor | Capabilities & Objectives | Mitigations Implemented |
|---|---|---|
| **Unauthenticated Public / Web Attacker** | Network scanning, brute-forcing login, scraping directories, calling edge functions directly. | <ul><li>CORS restricted to authorized domains.</li><li>All administrative Edge Functions validate caller JWT before execution.</li><li>Anon execution revoked on administrative RPCs (`admin_create_user`).</li><li>Strict HTTP security headers (CSP, HSTS, X-Frame-Options: DENY).</li></ul> |
| **Malicious Authenticated Alumni** | Attempting privilege escalation to `admin` / `staff`, bypassing verification, scraping directory PII. | <ul><li>`BEFORE UPDATE` trigger on `profiles` blocks unauthorized changes to `role`, `status`, `student_id`.</li><li>Client role overrides eliminated; role resolved solely from database rows.</li><li>Auto-verification bypasses in frontend code removed.</li><li>Directory visibility constrained to public fields.</li></ul> |
| **Compromised Administrative Account** | Mass account modification, database tampering, unauthorized bulk exports. | <ul><li>Audited administrative actions in immutable `audit_logs` table.</li><li>Edge Functions enforce explicit admin role checks before updating passwords or provisioning users.</li></ul> |

---

## 3. Row Level Security (RLS) Policy Matrix

| Table | Operation | Role: Anonymous | Role: Alumni (Authenticated) | Role: Admin / Superadmin | Enforcement Mechanism |
|---|---|---|---|---|---|
| `profiles` | SELECT | ❌ Denied | ✅ Self & Public directory fields | ✅ Full row access | `profiles_select` + Directory View |
| `profiles` | INSERT | ❌ Denied | ✅ Self (`id = auth.uid()`) | ✅ Allowed (Staff / Admin) | `profiles_insert` |
| `profiles` | UPDATE | ❌ Denied | ⚠️ Self only (safe profile fields) | ✅ Allowed | `trg_prevent_profile_privilege_escalation` |
| `profiles` | DELETE | ❌ Denied | ❌ Denied | ✅ Admin / Superadmin only | `profiles_delete` |
| `user_otp_challenges` | ALL | ❌ Denied | ❌ Denied (Direct DB) | 🔒 Service Role Only | `FOR ALL TO public USING (false)` |
| `donations` | SELECT | ❌ Denied | ✅ Donor (`alumni_id = auth.uid()`) | ✅ Allowed | RLS ownership check |
| `donations` | INSERT | ❌ Denied | ✅ Authenticated alumni | ✅ Allowed | RLS with validated amount |
| `audit_logs` | ALL | ❌ Denied | ❌ Denied | 👁️ SELECT (Superadmin only) | `audit_logs_select` |
| `jobs` | SELECT | ❌ Denied | ✅ Active jobs only | ✅ All jobs (draft/active/archived) | Status filter |

---

## 4. Edge Functions Security Architecture

All sensitive operations execute isolated in Supabase Edge Functions:

1. **`admin-reset-password`**:
   - Validates caller JWT with `supabase.auth.getUser()`.
   - Checks caller role in `public.profiles`. Rejects non-admin with `403 Forbidden`.
   - Validates UUID format and password strength rules.
   - Records administrative event in `audit_logs`.
2. **`create-users`**:
   - Validates admin caller before accepting batch uploads.
   - Caps batches at 50 records to prevent worker timeouts.
   - Sanitizes names, course codes, and batch years.
3. **`send-email`**:
   - Holds Brevo API credentials securely in server environment secrets (`BREVO_API_KEY`).
   - Browser client bundle contains **zero email provider secrets**.
4. **`send-donation-receipt`**:
   - Validates webhook secret header before processing transactions.
   - Uses configured institutional email sender.

---

## 5. Philippine Data Privacy Act (RA 10173) Compliance

### 5.1 Lawful Basis & Consent
- **Explicit Digital Consent**: Alumni must consent to the Data Privacy Notice during first login via `DPAConsentModal`. The consent timestamp is recorded in `profiles.dpa_consented_at`.
- **Purpose Limitation**: Alumni personal information is collected exclusively for institutional alumni engagement, tracer studies, and academic accreditation. No data is leased, monetized, or shared with third-party advertisers.

### 5.2 Data Retention & Archival
- Alumni records remain active during enrollment in the Alumni Network.
- Accounts marked `status = 'archived'` are locked from signing in.
- Inactive user data retention conforms to CHED guidelines and school policy.

### 5.3 Data Subject Rights (Section 16, RA 10173)
1. **Right to Access / Export**:
   - Alumni may view all personal profile fields in `AlumniProfile.tsx` and export their activity history.
2. **Right to Rectification**:
   - Alumni may correct personal contact numbers, employment records, and bios directly in their profile settings.
3. **Right to Erasure / De-registration**:
   - Account deletion requests are logged and routed through the Alumni Affairs Officer for manual review and confirmation.

### 5.4 Mandatory Data Breach Management (NPC Circular 16-03)
In the event of a confirmed or suspected security incident involving unauthorized PII access:
1. **Containment**: Immediately revoke compromised API keys and session tokens.
2. **Internal Escalation**: The Solo Developer and Alumni Office Head initiate an investigation within 24 hours.
3. **National Privacy Commission (NPC) Notification**: Formal notification must be submitted to the NPC within **72 hours** of breach confirmation if personal data of 100+ individuals is affected.
4. **Data Subject Notification**: Affected alumni will be informed via registered email within the statutory timeframe detailing the nature of the breach, affected fields, and remedial actions.

---

## 6. Pre-Launch Security Checklist

- [x] Rotate Brevo API key and remove from frontend code.
- [x] Remove `.env.local` and build caches from git tracking.
- [x] Edge Functions enforce caller JWT and admin role verification.
- [x] PostgreSQL trigger prevents alumni from altering `role` or `status`.
- [x] Client-side role overrides (`admin@gmail.com`) eliminated.
- [x] Insecure legacy plaintext password script (`api.ts`) deleted.
- [x] File upload size and MIME type whitelisting enforced.
- [x] HTTP Content-Security-Policy and security headers configured.
- [x] Automated security test suite (`tests/security/phase1.test.ts`) passing in CI.
