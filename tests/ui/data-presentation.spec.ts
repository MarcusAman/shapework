/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shapework Phase B3 Data Presentation & Operational UI Patterns Spec
 * Verifies MetricTile, DataTable semantics, sortable header keyboard navigation,
 * aria-sort, ResponsiveDataList, Pagination ARIA boundaries, ProgressBar ARIA values,
 * Skeleton reduced motion, and zero hardcoded Nest brand hex leaks.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Shapework Phase B3 Data Presentation & Operational Patterns Spec', () => {
  const b3PrimitiveFiles = [
    'MetricTile.tsx',
    'DataTable.tsx',
    'ResponsiveDataList.tsx',
    'DataToolbar.tsx',
    'Pagination.tsx',
    'ProgressBar.tsx',
    'Skeleton.tsx',
  ];

  it('verifies all B3 canonical data primitive files exist in src/components/ui/', () => {
    b3PrimitiveFiles.forEach((file) => {
      const filePath = path.resolve(process.cwd(), 'src/components/ui', file);
      expect(fs.existsSync(filePath), `Primitive file ${file} must exist`).toBe(true);
    });
  });

  it('verifies zero hard-coded Nest Realty brand colors (#01362D, #00635C) in B3 primitives', () => {
    const forbiddenHexes = ['#01362D', '#00635C', '#012b24', '#073F35', '#0B4A3F'];

    b3PrimitiveFiles.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui', file), 'utf-8');
      forbiddenHexes.forEach((hex) => {
        expect(content, `Primitive ${file} contains hardcoded hex ${hex}`).not.toContain(hex);
      });
    });
  });

  it('verifies MetricTile uses Layer 1 surface tokens and decoupled semantic state tokens', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/MetricTile.tsx'), 'utf-8');
    expect(content).toContain('var(--sw-surface)');
    expect(content).toContain('var(--sw-border)');
    expect(content).toContain('var(--state-success)');
    expect(content).toContain('var(--state-warning)');
    expect(content).toContain('var(--state-danger)');
  });

  it('verifies DataTable enforces semantic HTML table structure (table, thead, tbody, th scope="col"), sortable buttons, and aria-sort', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/DataTable.tsx'), 'utf-8');
    expect(content).toContain('<table');
    expect(content).toContain('<thead');
    expect(content).toContain('<tbody');
    expect(content).toContain('scope="col"');
    expect(content).toContain('aria-sort=');
    expect(content).toContain('type="button"');
    expect(content).toContain('Select all rows');
  });

  it('verifies ResponsiveDataList preserves critical data fields without horizontal squishing', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/ResponsiveDataList.tsx'), 'utf-8');
    expect(content).toContain('itemConfig.title');
    expect(content).toContain('itemConfig.details');
    expect(content).toContain('grid grid-cols-2');
  });

  it('verifies DataToolbar composes SearchInput, filter dropdowns, and mobile drawer filter', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/DataToolbar.tsx'), 'utf-8');
    expect(content).toContain('SearchInput');
    expect(content).toContain('Drawer');
    expect(content).toContain('mobileFilterOpen');
  });

  it('verifies Pagination implements aria-label, disabled boundaries, and page context', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Pagination.tsx'), 'utf-8');
    expect(content).toContain('aria-label="Pagination Navigation"');
    expect(content).toContain('disabled={isFirstPage}');
    expect(content).toContain('disabled={isLastPage}');
    expect(content).toContain('aria-label="Previous Page"');
    expect(content).toContain('aria-label="Next Page"');
  });

  it('verifies ProgressBar specifies role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, and semantic state indicators', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/ProgressBar.tsx'), 'utf-8');
    expect(content).toContain('role="progressbar"');
    expect(content).toContain('aria-valuenow=');
    expect(content).toContain('aria-valuemin=');
    expect(content).toContain('aria-valuemax=');
    expect(content).toContain('var(--state-danger)');
    expect(content).toContain('var(--state-warning)');
  });

  it('verifies Skeleton incorporates prefers-reduced-motion handling and Shapework surface tokens', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Skeleton.tsx'), 'utf-8');
    expect(content).toContain('motion-reduce:animate-none');
    expect(content).toContain('var(--sw-canvas)');
  });
});
