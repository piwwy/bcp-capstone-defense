import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 4 DESIGN SYSTEM & VISUAL POLISH VERIFICATION SUITE
 * 
 * Verifies Acceptance Criteria for:
 * 1. Institution Branding & Modern Typography (index.html)
 * 2. Tailwind Theme Tokens & Font Hierarchy (tailwind.config.js)
 * 3. Reusable UI Components (EmptyState.tsx, StatsCardSkeleton, TableSkeleton)
 * 4. Empty State Integration Across Alumni & Admin Modules
 * 5. Consistent Bestlink College of the Philippines Branding
 */

describe('Item 1: Institution Branding & Typography (index.html)', () => {
  const indexHtmlPath = path.resolve(__dirname, '../../index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  it('sets page title and description to Bestlink College of the Philippines', () => {
    expect(indexHtml).toContain('BCP Alumni Portal | Bestlink College of the Philippines');
    expect(indexHtml).toContain('Bestlink College of the Philippines Alumni Portal');
    expect(indexHtml).not.toContain('Linker College of the Philippines');
  });

  it('preloads Plus Jakarta Sans and Inter font families', () => {
    expect(indexHtml).toContain('Plus+Jakarta+Sans');
    expect(indexHtml).toContain('Inter');
  });
});

describe('Item 2: Tailwind Theme & Design System (tailwind.config.js)', () => {
  const configPath = path.resolve(__dirname, '../../tailwind.config.js');
  const tailwindConfig = fs.readFileSync(configPath, 'utf8');

  it('defines BCP institutional brand colors (blue, navy, gold)', () => {
    expect(tailwindConfig).toContain('bcp:');
    expect(tailwindConfig).toContain('navy:');
    expect(tailwindConfig).toContain('blue:');
    expect(tailwindConfig).toContain('gold:');
  });

  it('configures modern sans font stack prioritizing Plus Jakarta Sans', () => {
    expect(tailwindConfig).toContain("'Plus Jakarta Sans'");
    expect(tailwindConfig).toContain("'Inter'");
    expect(tailwindConfig).toContain("'Poppins'");
  });
});

describe('Item 3: EmptyState & Skeleton UI Components', () => {
  const emptyStatePath = path.resolve(__dirname, '../../src/components/ui/EmptyState.tsx');
  const skeletonPath = path.resolve(__dirname, '../../src/components/ui/Skeleton.tsx');

  it('EmptyState component exists and is exported', () => {
    expect(fs.existsSync(emptyStatePath)).toBe(true);
    const content = fs.readFileSync(emptyStatePath, 'utf8');
    expect(content).toContain('export const EmptyState');
    expect(content).toContain('action');
  });

  it('Skeleton.tsx exports StatsCardSkeleton and TableSkeleton', () => {
    const skeletonContent = fs.readFileSync(skeletonPath, 'utf8');
    expect(skeletonContent).toContain('export const StatsCardSkeleton');
    expect(skeletonContent).toContain('export const TableSkeleton');
  });
});

describe('Item 4: Empty State Adoption Across Modules', () => {
  it('AlumniEvents imports and renders EmptyState when category/events are empty', () => {
    const eventsPath = path.resolve(__dirname, '../../src/pages/alumni/AlumniEvents.tsx');
    const content = fs.readFileSync(eventsPath, 'utf8');
    expect(content).toContain("import { EmptyState } from '../../components/ui/EmptyState'");
    expect(content).toContain('<EmptyState');
    expect(content).toContain('No Upcoming Events Found');
  });

  it('AlumniJobs imports and renders EmptyState for empty job and saved listings', () => {
    const jobsPath = path.resolve(__dirname, '../../src/pages/alumni/AlumniJobs.tsx');
    const content = fs.readFileSync(jobsPath, 'utf8');
    expect(content).toContain("import { EmptyState } from '../../components/ui/EmptyState'");
    expect(content).toContain('<EmptyState');
    expect(content).toContain('No Saved Jobs Yet');
  });

  it('AlumniDirectory imports and renders EmptyState for empty search results', () => {
    const dirPath = path.resolve(__dirname, '../../src/pages/alumni/AlumniDirectory.tsx');
    const content = fs.readFileSync(dirPath, 'utf8');
    expect(content).toContain("import { EmptyState } from '../../components/ui/EmptyState'");
    expect(content).toContain('<EmptyState');
    expect(content).toContain('No Alumni Found');
  });
});

describe('Item 5: Institutional Consistency Verification', () => {
  it('replaces legacy "Linker" college references across core entry pages', () => {
    const onboarding = fs.readFileSync(path.resolve(__dirname, '../../src/pages/Onboarding.tsx'), 'utf8');
    expect(onboarding).toContain('BCP ALUMNI');
    expect(onboarding).not.toContain('Linker College Of The Philippines.png');

    const signUp = fs.readFileSync(path.resolve(__dirname, '../../src/pages/SignUpOptions.tsx'), 'utf8');
    expect(signUp).toContain('BCP Alumni Network');
    expect(signUp).not.toContain('LCP Alumni Network');

    const donation = fs.readFileSync(path.resolve(__dirname, '../../src/pages/PublicDonationPage.tsx'), 'utf8');
    expect(donation).toContain('BCP GIVING');
    expect(donation).not.toContain('LCP GIVING');

    const dir = fs.readFileSync(path.resolve(__dirname, '../../src/pages/alumni/AlumniDirectory.tsx'), 'utf8');
    expect(dir).toContain('Bestlink College of the Philippines');
    expect(dir).not.toContain('Linker College of the Philippines');
  });
});
