import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 3 DATABASE ARCHITECTURE & MIGRATION SQUASH VERIFICATION SUITE
 * 
 * Verifies Acceptance Criteria for:
 * 1. Architecture Decision Record (docs/DATABASE_ARCHITECTURE.md)
 * 2. Consolidated Master Baseline Schema (supabase/baseline_schema.sql)
 * 3. Performance Indexing & Data Integrity Constraints
 * 4. Migration Directory Cleanliness (Removal of empty/duplicate backups)
 */

describe('Item 1: Database Architecture Decision Record (ADR)', () => {
  const adrPath = path.resolve(__dirname, '../../docs/DATABASE_ARCHITECTURE.md');

  it('docs/DATABASE_ARCHITECTURE.md exists', () => {
    expect(fs.existsSync(adrPath)).toBe(true);
  });

  it('evaluates Supabase Managed Postgres, Self-Hosted VPS Postgres, and MySQL', () => {
    const content = fs.readFileSync(adrPath, 'utf8');
    expect(content).toContain('Supabase Managed PostgreSQL');
    expect(content).toContain('Self-Hosted PostgreSQL on VPS');
    expect(content).toContain('MySQL');
    expect(content).toContain('Row Level Security (RLS)');
    expect(content).toContain('Authentication Engine');
  });

  it('provides explicit cost analysis and SaaS scaling recommendation', () => {
    const content = fs.readFileSync(adrPath, 'utf8');
    expect(content).toContain('$25/mo');
    expect(content).toContain('Docker');
    expect(content).toContain('Recommendation');
  });
});

describe('Item 2: Consolidated Master Baseline Schema Integrity', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/baseline_schema.sql');

  it('supabase/baseline_schema.sql exists and is non-empty', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    const stat = fs.statSync(schemaPath);
    expect(stat.size).toBeGreaterThan(10_000);
  });

  const schemaSql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';

  it('defines all 34 core application tables', () => {
    const coreTables = [
      'public.profiles',
      'public.alumni_profiles',
      'public.alumni_experience',
      'public.alumni_education',
      'public.alumni_connections',
      'public.alumni_events',
      'public.event_attendees',
      'public.jobs',
      'public.job_applications',
      'public.job_placement_logs',
      'public.alumni_saved_jobs',
      'public.alumni_resources',
      'public.donation_campaigns',
      'public.donations',
      'public.news_articles',
      'public.notifications',
      'public.alumni_surveys',
      'public.alumni_survey_responses',
      'public.alumni_feedback',
      'public.alumni_newsletters',
      'public.newsletter_subscribers',
      'public.forum_posts',
      'public.forum_comments',
      'public.forum_likes',
      'public.messages',
      'public.batch_reunions',
      'public.reunion_attendees',
      'public.announcements',
      'public.contact_inquiries',
      'public.audit_logs',
      'public.alumni_master_list',
      'public.document_requests',
      'public.alumni_mentors',
      'public.subscription_applications',
    ];

    coreTables.forEach((table) => {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    });
  });

  it('defines high-performance composite indexes on hot query paths', () => {
    expect(schemaSql).toContain('idx_profiles_role_status');
    expect(schemaSql).toContain('idx_profiles_email');
    expect(schemaSql).toContain('idx_profiles_student_id_unique');
    expect(schemaSql).toContain('idx_messages_participants');
    expect(schemaSql).toContain('idx_notifications_user_unread');
    expect(schemaSql).toContain('idx_jobs_status_created');
    expect(schemaSql).toContain('idx_donations_status');
  });

  it('includes security functions and privilege escalation trigger', () => {
    expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.current_user_role()');
    expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.is_admin_or_staff()');
    expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()');
    expect(schemaSql).toContain('CREATE TRIGGER trg_prevent_profile_privilege_escalation');
  });

  it('includes performant get_admin_dashboard_stats RPC with security permissions', () => {
    expect(schemaSql).toContain('CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()');
    expect(schemaSql).toContain('REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;');
    expect(schemaSql).toContain('GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;');
  });

  it('enforces RLS and revokes anonymous access to sensitive tables', () => {
    expect(schemaSql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
    expect(schemaSql).toContain('REVOKE ALL ON public.profiles FROM anon;');
    expect(schemaSql).toContain('REVOKE ALL ON public.donations FROM anon;');
    expect(schemaSql).toContain('REVOKE ALL ON public.audit_logs FROM anon;');
  });
});

describe('Item 3: Migration Directory Cleanliness', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');

  it('purged duplicate backup migration', () => {
    const duplicatePath = path.join(migrationsDir, '20260217130000_fix_rls_BACKUP_20260217.sql');
    expect(fs.existsSync(duplicatePath)).toBe(false);
  });

  it('purged 0-byte placeholder migration', () => {
    const emptyPath = path.join(migrationsDir, '20260214010855_initial_schema_backup.sql');
    expect(fs.existsSync(emptyPath)).toBe(false);
  });
});
