# 🔐 Demo Accounts - BCP Alumni System

## Quick Login Credentials

Use these accounts to test different roles in the system:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Alumni** | `alumni.demo@lcp.edu.ph` | `Demo2026!` | `/alumni/dashboard` |
| **Admin** | `admin.demo@lcp.edu.ph` | `Demo2026!` | `/admin/dashboard` |
| **Super Admin** | `superadmin.demo@lcp.edu.ph` | `Demo2026!` | `/superadmin/dashboard` |
| **Staff** | `staff.demo@lcp.edu.ph` | `Demo2026!` | `/staff/dashboard` |

---

## Setup Instructions

### Option 1: Create via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** for each account
3. Enter the email and password from the table above
4. After creating all 4 auth users, run the SQL script in `demo-accounts.sql`

### Option 2: Manual SQL (Advanced)

If you have direct database access, you can create the accounts programmatically, but you'll still need to set passwords via Supabase Auth.

---

## Account Details

### 👨‍🎓 Alumni Demo Account
- **Name:** Juan Dela Cruz
- **Course:** Bachelor of Science in Information Technology
- **Batch Year:** 2020
- **Employment:** Employed at Tech Solutions Inc.
- **Job Title:** Software Developer
- **Features to test:**
  - Profile management
  - Job board access
  - Event registration
  - Donation portal
  - Alumni network
  - News feed

### 👨‍💼 Admin Demo Account
- **Name:** Maria Santos
- **Features to test:**
  - User management
  - Event approvals
  - Reports & Analytics
  - Master list upload
  - Donation management
  - News/announcements

### 👑 Super Admin Demo Account
- **Name:** Pedro Reyes
- **Features to test:**
  - All admin features
  - System settings
  - Audit trail
  - Developer tools
  - Role switching
  - AI training

### 📋 Staff Demo Account
- **Name:** Ana Garcia
- **Features to test:**
  - Limited admin access
  - Event management
  - Basic reporting
  - User support

---

## Testing Workflows

### Password Reset Flow
1. Go to login page
2. Click "Forgot password?"
3. Enter any demo account email
4. Check email for reset link
5. Click link → redirects to `/reset-password`
6. Set new password

### Event Approval Workflow
1. Login as **Admin**
2. Go to **Event Management** → **Pending Approvals** tab
3. Review event details
4. Approve or reject with reason

### Alumni Registration
1. Alumni can register for events
2. Admin can view RSVP lists
3. System sends confirmation emails

---

## Notes

- All passwords are set to `Demo2026!` for easy testing
- Alumni account has 2FA disabled for demo purposes (OAuth users bypass 2FA)
- These accounts are for **development/testing only**
- Change passwords in production environment
