/**
 * Audit Logger Utility
 * 
 * Records all important system actions to the audit_logs table.
 * Usage:
 *   import { logAudit } from '../services/auditLogger';
 *   await logAudit('EVENT_CREATED', { module: 'Events', message: 'Created event: Alumni Homecoming' });
 */
import { supabase } from './supabaseClient';

// Standard action types for consistency
export const AUDIT_ACTIONS = {
    // Auth
    LOGIN: 'LOGIN',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    DPA_CONSENT_ACCEPTED: 'DPA_CONSENT_ACCEPTED',
    MODULE_VIEWED: 'MODULE_VIEWED',
    NETWORK_OFFLINE: 'NETWORK_OFFLINE',
    NETWORK_ONLINE: 'NETWORK_ONLINE',

    // User Management
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
    USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
    MASTER_LIST_UPLOADED: 'MASTER_LIST_UPLOADED',
    CREDENTIALS_GENERATED: 'CREDENTIALS_GENERATED',

    // Events
    EVENT_CREATED: 'EVENT_CREATED',
    EVENT_UPDATED: 'EVENT_UPDATED',
    EVENT_DELETED: 'EVENT_DELETED',
    EVENT_APPROVED: 'EVENT_APPROVED',
    EVENT_REJECTED: 'EVENT_REJECTED',

    // News & Announcements
    NEWS_CREATED: 'NEWS_CREATED',
    NEWS_UPDATED: 'NEWS_UPDATED',
    NEWS_DELETED: 'NEWS_DELETED',
    NEWSLETTER_SENT: 'NEWSLETTER_SENT',

    // Donations
    DONATION_RECEIVED: 'DONATION_RECEIVED',
    DONATION_APPROVED: 'DONATION_APPROVED',
    DONATION_REJECTED: 'DONATION_REJECTED',
    CAMPAIGN_CREATED: 'CAMPAIGN_CREATED',

    // Jobs
    JOB_POSTED: 'JOB_POSTED',
    JOB_UPDATED: 'JOB_UPDATED',
    JOB_DELETED: 'JOB_DELETED',

    // Records & Reports
    RECORD_UPDATED: 'RECORD_UPDATED',
    RECORD_EXPORTED: 'RECORD_EXPORTED',
    REPORT_GENERATED: 'REPORT_GENERATED',

    // Feedback & Surveys
    FEEDBACK_REVIEWED: 'FEEDBACK_REVIEWED',
    SURVEY_PUBLISHED: 'SURVEY_PUBLISHED',

    // Community Forum
    FORUM_POST_CREATED: 'FORUM_POST_CREATED',
    FORUM_POST_UPDATED: 'FORUM_POST_UPDATED',
    FORUM_POST_DELETED: 'FORUM_POST_DELETED',
    FORUM_COMMENT_DELETED: 'FORUM_COMMENT_DELETED',

    // Partnerships & Inquiries
    INQUIRY_REVIEWED: 'INQUIRY_REVIEWED',
    INQUIRY_ROUTED: 'INQUIRY_ROUTED',
    INQUIRY_NOTES_UPDATED: 'INQUIRY_NOTES_UPDATED',
    INQUIRY_CLEANUP: 'INQUIRY_CLEANUP',

    // System
    SETTINGS_UPDATED: 'SETTINGS_UPDATED',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

interface AuditDetails {
    module?: string;
    message?: string;
    [key: string]: any;
}

type DiffRecord = Record<string, any>;

export const buildFieldDiff = (
    beforeRecord: DiffRecord = {},
    afterRecord: DiffRecord = {},
    fields?: string[]
) => {
    const keys = fields?.length
        ? fields
        : Array.from(new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]));

    const changes = keys
        .map((key) => {
            const before = beforeRecord[key] ?? null;
            const after = afterRecord[key] ?? null;
            if (JSON.stringify(before) === JSON.stringify(after)) return null;
            return { field: key, before, after };
        })
        .filter(Boolean);

    return {
        changedFields: changes.map((c: any) => c.field),
        changes,
        before: Object.fromEntries(keys.map((k) => [k, beforeRecord[k] ?? null])),
        after: Object.fromEntries(keys.map((k) => [k, afterRecord[k] ?? null])),
    };
};

/**
 * Log an action to the audit_logs table
 * @param action - The action type (use AUDIT_ACTIONS constants)
 * @param details - Object with module, message, and any extra data
 */
export const logAudit = async (
    action: AuditAction,
    details: AuditDetails = {}
): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Don't log if no user is authenticated

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action,
                details: {
                    module: details.module || 'General',
                    message: details.message || action.replace(/_/g, ' '),
                    ...details,
                    timestamp: new Date().toISOString(),
                },
            });

        if (error) {
            // Silently fail — audit logging should never break the main flow
            console.warn('Audit log insert failed:', error.message);
        }
    } catch (err) {
        console.warn('Audit logger error:', err);
    }
};

/**
 * Log a login event
 */
export const logLogin = async (email: string, method: string = 'email') => {
    await logAudit(AUDIT_ACTIONS.LOGIN, {
        module: 'Auth',
        message: `User logged in via ${method}`,
        email,
        method,
    });
};

export const logFailedLogin = async (email: string, reason: string = 'Unknown') => {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                details: {
                    module: 'Auth',
                    message: `Failed login attempt for ${email || 'unknown email'}`,
                    email,
                    reason,
                    timestamp: new Date().toISOString(),
                },
            });
        if (error) {
            console.warn('Failed login audit insert failed:', error.message);
        }
    } catch (err) {
        console.warn('Failed login audit error:', err);
    }
};

/**
 * Log a logout event
 */
export const logLogout = async () => {
    await logAudit(AUDIT_ACTIONS.LOGOUT, {
        module: 'Auth',
        message: 'User logged out',
    });
};

/**
 * Log a record export (CSV, PDF, etc.)
 */
export const logExport = async (format: string, recordCount: number, module: string = 'Reports') => {
    await logAudit(AUDIT_ACTIONS.RECORD_EXPORTED, {
        module,
        message: `Exported ${recordCount} records as ${format}`,
        format,
        recordCount,
    });
};

/**
 * Log master list upload
 */
export const logMasterListUpload = async (recordCount: number, accountsCreated: number) => {
    await logAudit(AUDIT_ACTIONS.MASTER_LIST_UPLOADED, {
        module: 'Master List',
        message: `Uploaded ${recordCount} records, ${accountsCreated} accounts created`,
        recordCount,
        accountsCreated,
    });
};

export const logModuleView = async (
    module: string,
    route: string,
    throttleMs: number = 5 * 60 * 1000
) => {
    const key = `audit_view_${route}`;
    const now = Date.now();
    const prevRaw = sessionStorage.getItem(key);
    const prev = prevRaw ? Number(prevRaw) : 0;
    if (prev && now - prev < throttleMs) return;
    sessionStorage.setItem(key, String(now));

    await logAudit(AUDIT_ACTIONS.MODULE_VIEWED, {
        module,
        message: `Viewed module ${module}`,
        route,
    });
};
