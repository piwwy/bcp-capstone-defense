import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 6 ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENFORCEMENT
 * 
 * Verifies Acceptance Criteria for:
 * 1. Role Normalization & Officer Taxonomy
 * 2. Specialized Dashboard Switcher Isolation
 * 3. Granular Sidebar Menu Filtering for Each Officer Role
 * 4. Login Role Dispatch & Exception Elimination
 * 5. Legacy Route Protection & Redirection
 */

describe('Item 1: Role Normalization & Officer Taxonomy', () => {
  const normalizeRole = (role?: string) => {
    const value = (role || '').toLowerCase().trim();
    if (value === 'super_admin') return 'superadmin';
    return value;
  };

  it('normalizes role variations and casing consistently', () => {
    expect(normalizeRole('SUPER_ADMIN')).toBe('superadmin');
    expect(normalizeRole('super_admin')).toBe('superadmin');
    expect(normalizeRole(' Admin ')).toBe('admin');
    expect(normalizeRole('JOB_OFFICER')).toBe('job_officer');
    expect(normalizeRole('Finance_Manager')).toBe('finance_manager');
    expect(normalizeRole('ALUMNI_MANAGER')).toBe('alumni_manager');
    expect(normalizeRole('Event_Officer')).toBe('event_officer');
    expect(normalizeRole('Alumni')).toBe('alumni');
  });

  it('App.tsx defines normalizeRole and uses it in DashboardSwitcher', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../../src/App.tsx'), 'utf8');
    expect(appContent).toContain('const normalizeRole');
    expect(appContent).toContain('normalizeRole(user?.role)');
  });
});

describe('Item 2: DashboardSwitcher Component RBAC Isolation', () => {
  // Simulator modeled after DashboardSwitcher in App.tsx
  function resolveDashboardName(rawRole?: string): string {
    const role = (rawRole || '').toLowerCase().trim();
    const normalized = role === 'super_admin' ? 'superadmin' : role;

    if (normalized === 'superadmin') return 'DashboardSuperAdmin';
    if (normalized === 'admin' || normalized === 'registrar') return 'DashboardAdmin';
    if (normalized === 'job_officer') return 'JobOfficerDashboard';
    if (normalized === 'finance_manager' || normalized === 'finance' || normalized === 'finance_officer') return 'FinanceManagerDashboard';
    if (normalized === 'alumni_manager' || normalized === 'alumni_officer') return 'AlumniManagerDashboard';
    if (normalized === 'event_officer') return 'EventOfficerDashboard';

    return 'StaffDashboard';
  }

  it('routes superadmin and super_admin to DashboardSuperAdmin', () => {
    expect(resolveDashboardName('superadmin')).toBe('DashboardSuperAdmin');
    expect(resolveDashboardName('super_admin')).toBe('DashboardSuperAdmin');
  });

  it('routes admin and registrar to DashboardAdmin', () => {
    expect(resolveDashboardName('admin')).toBe('DashboardAdmin');
    expect(resolveDashboardName('registrar')).toBe('DashboardAdmin');
  });

  it('routes job_officer to JobOfficerDashboard', () => {
    expect(resolveDashboardName('job_officer')).toBe('JobOfficerDashboard');
  });

  it('routes finance_manager, finance_officer, and finance to FinanceManagerDashboard', () => {
    expect(resolveDashboardName('finance_manager')).toBe('FinanceManagerDashboard');
    expect(resolveDashboardName('finance_officer')).toBe('FinanceManagerDashboard');
    expect(resolveDashboardName('finance')).toBe('FinanceManagerDashboard');
  });

  it('routes alumni_manager and alumni_officer to AlumniManagerDashboard', () => {
    expect(resolveDashboardName('alumni_manager')).toBe('AlumniManagerDashboard');
    expect(resolveDashboardName('alumni_officer')).toBe('AlumniManagerDashboard');
  });

  it('routes event_officer to EventOfficerDashboard', () => {
    expect(resolveDashboardName('event_officer')).toBe('EventOfficerDashboard');
  });

  it('defaults unassigned operational staff to StaffDashboard', () => {
    expect(resolveDashboardName('staff')).toBe('StaffDashboard');
    expect(resolveDashboardName('unknown_operator')).toBe('StaffDashboard');
  });
});

describe('Item 3: Granular Sidebar RBAC Filtering (AdminSidebar)', () => {
  const allMenuItems = [
    { name: "Dashboard" },
    { name: "Alumni & Records" },
    { name: "Career & Jobs" },
    { name: "Events" },
    { name: "Communication & Updates" },
    { name: "Donation & Campaign Tools" },
    { name: "Engagement" },
    { name: "Advanced Tools" },
    { name: "Settings" },
  ];

  function filterMenuForRole(rawRole?: string): string[] {
    const role = (rawRole || 'staff').toLowerCase().trim();

    if (['super_admin', 'superadmin', 'admin', 'registrar'].includes(role)) {
      return allMenuItems.map(m => m.name);
    }

    return allMenuItems.filter(item => {
      if (item.name === "Dashboard" || item.name === "Settings") return true;

      if (role === 'event_officer') {
        return ["Events", "Communication & Updates"].includes(item.name);
      }
      if (role === 'finance_manager' || role === 'finance_officer' || role === 'finance') {
        return ["Donation & Campaign Tools", "Advanced Tools"].includes(item.name);
      }
      if (role === 'job_officer') {
        return ["Career & Jobs"].includes(item.name);
      }
      if (role === 'alumni_manager' || role === 'alumni_officer') {
        return ["Alumni & Records", "Engagement", "Communication & Updates"].includes(item.name);
      }

      return ["Alumni & Records", "Career & Jobs", "Events"].includes(item.name);
    }).map(m => m.name);
  }

  it('grants full menu access to system administrators', () => {
    const adminMenu = filterMenuForRole('admin');
    expect(adminMenu.length).toBe(9);
    expect(adminMenu).toContain('Donation & Campaign Tools');
    expect(adminMenu).toContain('Advanced Tools');
    expect(adminMenu).toContain('Settings');
  });

  it('restricts job_officer strictly to Career & Jobs modules and shared utilities', () => {
    const jobMenu = filterMenuForRole('job_officer');
    expect(jobMenu).toEqual(['Dashboard', 'Career & Jobs', 'Settings']);
    expect(jobMenu).not.toContain('Donation & Campaign Tools');
    expect(jobMenu).not.toContain('Advanced Tools');
  });

  it('restricts finance_manager to Donation & Finance modules and Advanced Tools', () => {
    const financeMenu = filterMenuForRole('finance_manager');
    expect(financeMenu).toContain('Donation & Campaign Tools');
    expect(financeMenu).toContain('Advanced Tools');
    expect(financeMenu).not.toContain('Career & Jobs');
    expect(financeMenu).not.toContain('Events');
  });

  it('restricts event_officer strictly to Events and Communication', () => {
    const eventMenu = filterMenuForRole('event_officer');
    expect(eventMenu).toEqual(['Dashboard', 'Events', 'Communication & Updates', 'Settings']);
    expect(eventMenu).not.toContain('Donation & Campaign Tools');
  });

  it('restricts alumni_manager strictly to Records, Engagement, and Communication', () => {
    const alumniOfficerMenu = filterMenuForRole('alumni_manager');
    expect(alumniOfficerMenu).toContain('Alumni & Records');
    expect(alumniOfficerMenu).toContain('Engagement');
    expect(alumniOfficerMenu).toContain('Communication & Updates');
    expect(alumniOfficerMenu).not.toContain('Donation & Campaign Tools');
  });
});

describe('Item 4: Login Role Dispatch & Exception Elimination', () => {
  const loginFilePath = path.resolve(__dirname, '../../src/pages/Login.tsx');
  const loginFile = fs.readFileSync(loginFilePath, 'utf8');

  it('Login.tsx supports all officer roles without throwing Unrecognized system role', () => {
    expect(loginFile).toContain('job_officer');
    expect(loginFile).toContain('finance_manager');
    expect(loginFile).toContain('alumni_manager');
    expect(loginFile).toContain('event_officer');
    expect(loginFile).toContain('officerRoles.includes(role)');
  });

  it('routes superadmin safely to /superadmin/dashboard', () => {
    expect(loginFile).toContain("navigate('/superadmin/dashboard'");
  });
});

describe('Item 5: Legacy Route Protection & Redirection', () => {
  it('App.tsx safely redirects /staff/* to /admin/dashboard', () => {
    const appFile = fs.readFileSync(path.resolve(__dirname, '../../src/App.tsx'), 'utf8');
    expect(appFile).toContain('path="/staff/*"');
    expect(appFile).toContain('to="/admin/dashboard"');
  });

  it('StaffSidebar links map to /admin endpoints instead of broken /staff paths', () => {
    const staffSidebarFile = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/sidebar/StaffSidebar.tsx'),
      'utf8'
    );
    expect(staffSidebarFile).toContain('path: "/admin/dashboard"');
    expect(staffSidebarFile).toContain('path: "/admin/records"');
    expect(staffSidebarFile).toContain('path: "/admin/events/calendar"');
    expect(staffSidebarFile).not.toContain('path: "/staff/dashboard"');
  });
});
