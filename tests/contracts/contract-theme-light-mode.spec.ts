/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Copilot Light Mode Theme Regression Test Suite — Phase 4A.4 Visual QA
 * Ensures all Ask Nest Ops Contract Copilot UI components AND root layout shell
 * enforce strict light mode (#F7F8F5 canvas, #FFFFFF header/sidebar/cards, #01362D headings).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Contract Copilot Light Mode Theme & Layout Compliance (Phase 4A.4 Visual QA)', () => {
  const targetComponents = [
    'src/components/layout/AppShell.tsx',
    'src/components/layout/TopBar.tsx',
    'src/components/layout/CollapsibleNavigationRail.tsx',
    'src/components/brokerage-ops/NestOpsHub.tsx',
    'src/components/brokerage-ops/CompactContractSummary.tsx',
    'src/components/brokerage-ops/PendingIntakesList.tsx',
    'src/components/brokerage-ops/PendingIntakeReviewModal.tsx',
    'src/components/brokerage-ops/ContractCopilotCard.tsx',
    'src/components/brokerage-ops/DemoControlDropdown.tsx'
  ];

  const forbiddenDarkRootClasses = [
    'bg-slate-900',
    'bg-slate-950',
    'bg-[#0B1D19]',
    'dark:bg-',
    'dark:text-'
  ];

  targetComponents.forEach((componentPath) => {
    it(`verifies ${componentPath} contains no forbidden dark mode utility classes`, () => {
      const fullPath = path.resolve(process.cwd(), componentPath);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf-8');

      forbiddenDarkRootClasses.forEach((forbiddenClass) => {
        const containsForbidden = content.includes(forbiddenClass);
        expect(containsForbidden, `Component ${componentPath} contains forbidden dark class: "${forbiddenClass}"`).toBe(false);
      });
    });
  });

  it('verifies AppShell container is explicitly set to light mode canvas', () => {
    const appShellContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );

    expect(appShellContent).toMatch(/bg-\[var\(--sw-canvas\)\]|bg-\[#F7F8F5\]/);
    expect(appShellContent).not.toContain('bg-[#01362D]');
    expect(appShellContent).not.toContain('nest-layered-bg');
  });

  it('verifies Navigation Rail and TopBar headers are light surfaces', () => {
    const navContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/CollapsibleNavigationRail.tsx'),
      'utf-8'
    );
    const topBarContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/TopBar.tsx'),
      'utf-8'
    );

    expect(navContent).toMatch(/bg-\[var\(--sw-surface\)\]|bg-white/);
    expect(topBarContent).toMatch(/bg-\[var\(--sw-surface\)\]|bg-white/);
  });

  it('verifies broker-facing language is clean and free of system jargon', () => {
    const modalContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/brokerage-ops/PendingIntakeReviewModal.tsx'),
      'utf-8'
    );
    const listContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/brokerage-ops/PendingIntakesList.tsx'),
      'utf-8'
    );

    expect(modalContent).toContain("Here's what I captured");
    expect(modalContent).toContain('Review Offer Details');
    expect(modalContent).toContain('Continue Draft');
    expect(modalContent).not.toContain('candidate broker identifier');
    expect(modalContent).not.toContain('Sanitized Facts Proposed by Assistant');
    expect(modalContent).not.toContain('Claim & Continue');

    expect(listContent).toContain('ready for your review');
    expect(listContent).not.toContain('candidate broker identifier');
  });
});
