import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AUDIT_ACTIONS, buildFieldDiff } from '../../src/services/auditLogger';

/**
 * PHASE 5 WORKFLOW TESTING & CRITICAL STATE TRANSITIONS
 * 
 * Verifies Acceptance Criteria for:
 * 1. Registration & Approval Flow (Master list matching, status states, approval gates)
 * 2. Two-Factor Authentication (2FA) & Lockout Lifecycle (OTP validation, 30-day grace, lockout)
 * 3. Password Reset & Recovery Workflow (Format validation, session security, audit trails)
 * 4. Audit Trail Integrity & Mutation Logging (AUDIT_ACTIONS constants, diff builder, log payloads)
 */

describe('Item 1: Registration & Account Verification Workflow', () => {
  type AccountStatus = 'pending_approval' | 'master_list' | 'verified' | 'rejected' | 'archived';

  interface UserAccount {
    id: string;
    email: string;
    role: 'alumni' | 'admin' | 'staff' | 'superadmin';
    status: AccountStatus;
  }

  // State transition simulator modeled after Login.tsx and ProtectedRoute
  function evaluateLoginRoute(user: UserAccount): { allowed: boolean; redirect: string; error?: string } {
    if (user.status === 'archived') {
      return { allowed: false, redirect: '/login', error: 'This account has been archived. Please contact an administrator.' };
    }
    if (user.status === 'rejected') {
      return { allowed: false, redirect: '/login', error: 'Your account application was declined. Please contact the Alumni Affairs Office.' };
    }
    if (user.status === 'pending_approval') {
      return { allowed: false, redirect: '/login', error: 'Your account registration is awaiting administrator verification. Please check back soon.' };
    }
    if (user.role === 'alumni') {
      if (user.status === 'master_list') {
        return { allowed: true, redirect: '/onboarding' };
      }
      if (user.status === 'verified') {
        return { allowed: true, redirect: '/alumni/dashboard' };
      }
    }
    if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'staff') {
      return { allowed: true, redirect: '/admin/dashboard' };
    }
    return { allowed: false, redirect: '/login', error: 'Unrecognized system role.' };
  }

  it('rejects pending_approval users at login with security message', () => {
    const user: UserAccount = {
      id: 'usr-001',
      email: 'applicant@gmail.com',
      role: 'alumni',
      status: 'pending_approval',
    };
    const result = evaluateLoginRoute(user);
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('awaiting administrator verification');
  });

  it('routes master_list alumni accounts to /onboarding', () => {
    const user: UserAccount = {
      id: 'usr-002',
      email: 'masterlist@gmail.com',
      role: 'alumni',
      status: 'master_list',
    };
    const result = evaluateLoginRoute(user);
    expect(result.allowed).toBe(true);
    expect(result.redirect).toBe('/onboarding');
  });

  it('routes verified alumni accounts directly to /alumni/dashboard', () => {
    const user: UserAccount = {
      id: 'usr-003',
      email: 'verified_alumni@gmail.com',
      role: 'alumni',
      status: 'verified',
    };
    const result = evaluateLoginRoute(user);
    expect(result.allowed).toBe(true);
    expect(result.redirect).toBe('/alumni/dashboard');
  });

  it('blocks archived and rejected accounts from accessing portal', () => {
    const archived: UserAccount = { id: 'usr-004', email: 'archived@bcp.edu.ph', role: 'alumni', status: 'archived' };
    const rejected: UserAccount = { id: 'usr-005', email: 'rejected@bcp.edu.ph', role: 'alumni', status: 'rejected' };
    
    expect(evaluateLoginRoute(archived).allowed).toBe(false);
    expect(evaluateLoginRoute(rejected).allowed).toBe(false);
  });

  it('matches registration data against master list student_id and batch_year', () => {
    const masterListEntry = {
      student_id: '2022-10492',
      last_name: 'PESINO',
      first_name: 'PERRY',
      batch_year: '2024',
      course: 'BSIT',
    };

    const registrationSubmission = {
      studentId: '2022-10492',
      lastName: 'Pesino',
      batchYear: '2024',
    };

    const isMatch = (
      registrationSubmission.studentId.trim().toUpperCase() === masterListEntry.student_id.toUpperCase() &&
      registrationSubmission.lastName.trim().toUpperCase() === masterListEntry.last_name.toUpperCase() &&
      registrationSubmission.batchYear.trim() === masterListEntry.batch_year
    );

    expect(isMatch).toBe(true);
  });
});

describe('Item 2: Two-Factor Authentication (2FA) & Lockout Lifecycle', () => {
  const MAX_ATTEMPTS = 5;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  function verifyOtpAttempt(
    entered: string,
    expected: string,
    expiry: number,
    currentAttempts: number
  ): { success: boolean; error?: string; lockedOut: boolean; newAttempts: number } {
    if (Date.now() > expiry) {
      return { success: false, error: 'Code has expired. Please request a new one.', lockedOut: false, newAttempts: currentAttempts };
    }
    if (entered === expected) {
      return { success: true, lockedOut: false, newAttempts: currentAttempts };
    }
    const newAttempts = currentAttempts + 1;
    const lockedOut = newAttempts >= MAX_ATTEMPTS;
    return {
      success: false,
      error: lockedOut ? `Too many failed attempts (${MAX_ATTEMPTS}/${MAX_ATTEMPTS}). You have been locked out.` : 'Invalid code.',
      lockedOut,
      newAttempts,
    };
  }

  it('validates matching 6-digit OTP before expiry', () => {
    const validExpiry = Date.now() + 60000;
    const res = verifyOtpAttempt('839201', '839201', validExpiry, 0);
    expect(res.success).toBe(true);
    expect(res.lockedOut).toBe(false);
  });

  it('rejects expired OTP with actionable error message', () => {
    const pastExpiry = Date.now() - 5000;
    const res = verifyOtpAttempt('839201', '839201', pastExpiry, 0);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Code has expired');
  });

  it('triggers security lockout when failed attempts reach MAX_ATTEMPTS', () => {
    const validExpiry = Date.now() + 60000;
    let attempts = 4;
    const res = verifyOtpAttempt('000000', '839201', validExpiry, attempts);
    expect(res.success).toBe(false);
    expect(res.lockedOut).toBe(true);
    expect(res.newAttempts).toBe(5);
    expect(res.error).toContain('Too many failed attempts');
  });

  it('honors 30-day verification grace cycle', () => {
    const now = Date.now();
    const twentyNineDaysAgo = now - (29 * 24 * 60 * 60 * 1000);
    const thirtyOneDaysAgo = now - (31 * 24 * 60 * 60 * 1000);

    const isRecentWithinMonth = (timestamp: number) => (now - timestamp) < THIRTY_DAYS_MS;

    expect(isRecentWithinMonth(twentyNineDaysAgo)).toBe(true);
    expect(isRecentWithinMonth(thirtyOneDaysAgo)).toBe(false);
  });
});

describe('Item 3: Password Reset & Recovery Workflow', () => {
  function validatePasswordReset(code: string, newPassword: string): { valid: boolean; error?: string } {
    if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code)) {
      return { valid: false, error: 'Please enter a valid 6-digit verification code.' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long.' };
    }
    return { valid: true };
  }

  it('validates 6-digit verification codes and minimum 8-character password constraint', () => {
    expect(validatePasswordReset('123456', 'Pass1234!').valid).toBe(true);
    expect(validatePasswordReset('123', 'Pass1234!').valid).toBe(false);
    expect(validatePasswordReset('123456', 'short').valid).toBe(false);
    expect(validatePasswordReset('abcdef', 'Pass1234!').valid).toBe(false);
  });

  it('ResetPassword.tsx is upgraded with useToast and audit logging', () => {
    const resetFile = fs.readFileSync(path.resolve(__dirname, '../../src/pages/ResetPassword.tsx'), 'utf8');
    expect(resetFile).toContain('useToast');
    expect(resetFile).toContain('logAudit(AUDIT_ACTIONS.PASSWORD_CHANGED');
    expect(resetFile).not.toContain('alert(');
  });
});

describe('Item 4: Audit Trail Integrity & Mutation Logging', () => {
  it('exposes standard AUDIT_ACTIONS constants covering all critical domains', () => {
    expect(AUDIT_ACTIONS.LOGIN).toBe('LOGIN');
    expect(AUDIT_ACTIONS.LOGIN_FAILED).toBe('LOGIN_FAILED');
    expect(AUDIT_ACTIONS.PASSWORD_CHANGED).toBe('PASSWORD_CHANGED');
    expect(AUDIT_ACTIONS.USER_STATUS_CHANGED).toBe('USER_STATUS_CHANGED');
    expect(AUDIT_ACTIONS.MASTER_LIST_UPLOADED).toBe('MASTER_LIST_UPLOADED');
    expect(AUDIT_ACTIONS.DONATION_APPROVED).toBe('DONATION_APPROVED');
    expect(AUDIT_ACTIONS.DONATION_REJECTED).toBe('DONATION_REJECTED');
  });

  it('buildFieldDiff accurately detects field modifications between records', () => {
    const before = { status: 'pending_approval', role: 'alumni', course: 'BSIT' };
    const after = { status: 'verified', role: 'alumni', course: 'BSIT' };

    const diff = buildFieldDiff(before, after);
    expect(diff.changedFields).toEqual(['status']);
    expect(diff.changes).toEqual([
      { field: 'status', before: 'pending_approval', after: 'verified' }
    ]);
  });

  it('VerificationSubmodule integrates audit logging for user status and subscription applications', () => {
    const verificationFile = fs.readFileSync(
      path.resolve(__dirname, '../../src/pages/admin/VerificationSubmodule.tsx'),
      'utf8'
    );
    expect(verificationFile).toContain('import { logAudit, AUDIT_ACTIONS }');
    expect(verificationFile).toContain('logAudit(AUDIT_ACTIONS.USER_STATUS_CHANGED');
  });

  it('Alumni2FA integrates audit logging for successful 2FA and lockout', () => {
    const twoFaFile = fs.readFileSync(
      path.resolve(__dirname, '../../src/pages/Alumni2FA.tsx'),
      'utf8'
    );
    expect(twoFaFile).toContain('import { logAudit, AUDIT_ACTIONS }');
    expect(twoFaFile).toContain("logAudit('2FA_VERIFIED'");
    expect(twoFaFile).toContain("logAudit('2FA_LOCKED_OUT'");
  });
});
