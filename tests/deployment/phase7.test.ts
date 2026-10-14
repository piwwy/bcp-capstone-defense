import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 7 PRODUCTION DEPLOYMENT & READINESS VERIFICATION SUITE
 * 
 * Verifies Acceptance Criteria for:
 * 1. Production Deployment Guide Completeness (docs/DEPLOYMENT_GUIDE.md)
 * 2. Architecture Decision Documentation (docs/DATABASE_ARCHITECTURE.md)
 * 3. Environment Variable Template Security & Parity (.env.example)
 * 4. Netlify Single Page Application (SPA) Configuration (netlify.toml)
 * 5. Repository Readme Integrity & Verified Demo Credentials (README.md)
 */

describe('Item 1: Production Deployment Guide & Architecture Docs', () => {
  const guidePath = path.resolve(__dirname, '../../docs/DEPLOYMENT_GUIDE.md');
  const archPath = path.resolve(__dirname, '../../docs/DATABASE_ARCHITECTURE.md');

  it('docs/DEPLOYMENT_GUIDE.md exists and is fully populated', () => {
    expect(fs.existsSync(guidePath)).toBe(true);
    const content = fs.readFileSync(guidePath, 'utf8');
    expect(content).toContain('Production Deployment & Operations Guide');
    expect(content).toContain('Supabase Database Baseline Setup');
    expect(content).toContain('Supabase Edge Functions & Secrets Configuration');
    expect(content).toContain('Netlify Frontend Deployment');
    expect(content).toContain('Brevo');
    expect(content).toContain('Verification & Smoke Test Runbook');
  });

  it('docs/DATABASE_ARCHITECTURE.md exists and provides ADR recommendation', () => {
    expect(fs.existsSync(archPath)).toBe(true);
    const content = fs.readFileSync(archPath, 'utf8');
    expect(content.toUpperCase()).toContain('ARCHITECTURE DECISION RECORD');
    expect(content).toContain('Supabase Managed PostgreSQL');
  });
});

describe('Item 2: Environment Variable Template Security & Sanitization', () => {
  const envExamplePath = path.resolve(__dirname, '../../.env.example');

  it('.env.example exists and contains required frontend variables', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const content = fs.readFileSync(envExamplePath, 'utf8');
    expect(content).toContain('VITE_SUPABASE_URL');
    expect(content).toContain('VITE_SUPABASE_ANON_KEY');
    expect(content).toContain('VITE_APP_NAME');
    expect(content).toContain('VITE_APP_URL');
  });

  it('.env.example documents Edge Function secrets without leaking live keys', () => {
    const content = fs.readFileSync(envExamplePath, 'utf8');
    expect(content).toContain('BREVO_API_KEY');
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');

    // Security check: Must not contain live production keys
    expect(content).not.toContain('xkeysib-a029304b5131d77db905623c5ede941d113c182e79763a607cc96a2606ca79a8');
    expect(content).not.toContain('iDNuKU31kYV_r1CeIWd5Srdj0pe55KF_lhV03poFAwo');
  });
});

describe('Item 3: Netlify SPA Redirects & Build Configuration', () => {
  const netlifyTomlPath = path.resolve(__dirname, '../../netlify.toml');

  it('netlify.toml defines single page application (SPA) rewrite to index.html', () => {
    expect(fs.existsSync(netlifyTomlPath)).toBe(true);
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');
    expect(content).toContain('from = "/*"');
    expect(content).toContain('to = "/index.html"');
    expect(content).toContain('status = 200');
  });

  it('netlify.toml specifies standard Vite build commands and dist output', () => {
    const content = fs.readFileSync(netlifyTomlPath, 'utf8');
    expect(content).toContain('command = "npm run build"');
    expect(content).toContain('publish = "dist"');
  });
});

describe('Item 4: README Integrity & Demo Credentials', () => {
  const readmePath = path.resolve(__dirname, '../../README.md');

  it('README references verified demo credentials for testing and evaluation', () => {
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('admin@gmail.com');
    expect(content).toContain('alumni_demo@gmail.com');
    expect(content).toContain('Auto-fill Code');
  });

  it('README documents automated test execution (npm test)', () => {
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('npm test');
  });

  it('README links to deployment documentation', () => {
    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('DEPLOYMENT_GUIDE.md');
    expect(content).toContain('DATABASE_ARCHITECTURE.md');
  });
});
