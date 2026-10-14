import { describe, it, expect } from 'vitest';
import { queryClient } from '../../src/lib/queryClient';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 2 STABILITY & PERFORMANCE AUTOMATED VERIFICATION SUITE
 * 
 * Verifies Acceptance Criteria for:
 * 1. Global Background Polling Disabled (queryClient defaults)
 * 2. Idle Database Hammering Prevented (useAdminDashboardStats refetchInterval = false)
 * 3. Dashboard Statistics Aggregation RPC Schema Correctness
 * 4. Production Bundle Chunk Configuration (vite.config.ts)
 * 5. Auth State Storm Mitigation (AuthContext.tsx)
 */

describe('Item 1: QueryClient Background Polling & Storm Prevention', () => {
  const defaultQueryOptions = queryClient.getDefaultOptions().queries;

  it('disables automatic background polling intervals (refetchInterval = false)', () => {
    expect(defaultQueryOptions?.refetchInterval).toBe(false);
  });

  it('disables background polling when tab is inactive (refetchIntervalInBackground = false)', () => {
    expect(defaultQueryOptions?.refetchIntervalInBackground).toBe(false);
  });

  it('disables aggressive refetching on window focus (refetchOnWindowFocus = false)', () => {
    expect(defaultQueryOptions?.refetchOnWindowFocus).toBe(false);
  });

  it('maintains a reasonable staleTime (>= 60s) to prevent duplicate fetch cascades', () => {
    expect(defaultQueryOptions?.staleTime).toBeGreaterThanOrEqual(60_000);
  });

  it('caps query retry attempts to 1 to prevent cascade retry storms', () => {
    expect(defaultQueryOptions?.retry).toBe(1);
  });
});

describe('Item 2: Dashboard Statistics Single-Query RPC Migration', () => {
  const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20260315_phase2_dashboard_stats_rpc.sql');

  it('migration file exists in supabase/migrations', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('defines get_admin_dashboard_stats function with SECURITY DEFINER', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()');
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain('SET search_path = public');
  });

  it('aggregates user and module counts in a single JSON payload', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('total');
    expect(sql).toContain('unclaimed');
    expect(sql).toContain('verified');
    expect(sql).toContain('rejected');
    expect(sql).toContain('pending');
    expect(sql).toContain('pendingApplications');
    expect(sql).toContain('events');
    expect(sql).toContain('jobs');
    expect(sql).toContain('campaigns');
    expect(sql).toContain('news');
  });

  it('restricts execute privileges to authenticated users only (revoked from anon)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;');
  });
});

describe('Item 3: Vite Production Bundle Chunking Optimization', () => {
  const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');

  it('replaces non-existent UI chunk dependencies with lightweight installed libraries', () => {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    // Ensure ui chunk uses actual installed libraries (framer-motion) and does not force html2canvas into initial ui chunk
    expect(viteConfig).toContain("'framer-motion'");
    expect(viteConfig).not.toContain("ui: ['lucide-react', 'html2canvas', 'dompurify']");
  });
});

describe('Item 4: AuthContext Session Storm & Spinner Lock Mitigations', () => {
  const authContextPath = path.resolve(__dirname, '../../src/context/AuthContext.tsx');

  it('removes window focus and document visibility event listeners from AuthContext', () => {
    const authCode = fs.readFileSync(authContextPath, 'utf8');
    expect(authCode).not.toContain("addEventListener('visibilitychange'");
    expect(authCode).not.toContain("addEventListener('focus'");
    expect(authCode).not.toContain("addEventListener('online'");
  });

  it('removes manual 8-minute token heartbeat interval timer', () => {
    const authCode = fs.readFileSync(authContextPath, 'utf8');
    expect(authCode).not.toContain('HEARTBEAT_INTERVAL_MS');
    expect(authCode).not.toContain('heartbeatTimer');
  });

  it('includes safety timeout to prevent permanent loading spinner locks', () => {
    const authCode = fs.readFileSync(authContextPath, 'utf8');
    expect(authCode).toContain('safetyTimer');
  });
});
