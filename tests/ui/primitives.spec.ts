/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shapework Shared UI Primitive Spec — Phase B1 Foundation
 * Verifies canonical primitives compliance: multi-tenant token consumption,
 * semantic state separation, accessibility, and zero hardcoded Nest hex leaks.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Shapework Phase B1 Canonical Shared UI Primitives Spec', () => {
  const primitiveFiles = [
    'Button.tsx',
    'IconButton.tsx',
    'SurfaceCard.tsx',
    'Badge.tsx',
    'StatusBadge.tsx',
    'TextInput.tsx',
    'TextArea.tsx',
    'SearchInput.tsx',
    'Select.tsx',
    'Checkbox.tsx',
    'Tabs.tsx',
    'SegmentedControl.tsx',
    'Avatar.tsx',
    'EmptyState.tsx',
  ];

  it('verifies all canonical primitive files exist in src/components/ui/', () => {
    primitiveFiles.forEach((file) => {
      const filePath = path.resolve(process.cwd(), 'src/components/ui', file);
      expect(fs.existsSync(filePath), `Primitive file ${file} must exist`).toBe(true);
    });
  });

  it('verifies zero hard-coded Nest Realty brand colors (#01362D, #00635C) in shared primitives', () => {
    const forbiddenHexes = ['#01362D', '#00635C', '#012b24', '#073F35', '#0B4A3F'];

    primitiveFiles.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui', file), 'utf-8');
      forbiddenHexes.forEach((hex) => {
        expect(content, `Primitive ${file} contains hardcoded hex ${hex}`).not.toContain(hex);
      });
    });
  });

  it('verifies shared primitives consume Layer 1, Layer 2, and Layer 3 CSS variables', () => {
    const buttonContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Button.tsx'), 'utf-8');
    const badgeContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Badge.tsx'), 'utf-8');
    const cardContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/SurfaceCard.tsx'), 'utf-8');

    // Button token consumption
    expect(buttonContent).toContain('var(--brand-primary)');
    expect(buttonContent).toContain('var(--brand-secondary)');
    expect(buttonContent).toContain('var(--state-danger)');

    // Badge token consumption & separation
    expect(badgeContent).toContain('var(--brand-soft)');
    expect(badgeContent).toContain('var(--state-success)');
    expect(badgeContent).toContain('var(--state-warning)');
    expect(badgeContent).toContain('var(--state-danger)');
    expect(badgeContent).toContain('var(--state-ai)');

    // Card token consumption
    expect(cardContent).toContain('var(--sw-surface)');
    expect(cardContent).toContain('var(--sw-border)');
  });

  it('verifies IconButton enforces mandatory aria-label for accessibility', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/IconButton.tsx'), 'utf-8');
    expect(content).toContain("'aria-label': ariaLabel");
    expect(content).toContain('aria-label={ariaLabel}');
  });

  it('verifies form controls associate label with input using htmlFor and id', () => {
    const inputContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/TextInput.tsx'), 'utf-8');
    const selectContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Select.tsx'), 'utf-8');
    const checkboxContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Checkbox.tsx'), 'utf-8');

    expect(inputContent).toContain('htmlFor={inputId}');
    expect(inputContent).toContain('id={inputId}');

    expect(selectContent).toContain('htmlFor={selectId}');
    expect(selectContent).toContain('id={selectId}');

    expect(checkboxContent).toContain('htmlFor={checkboxId}');
    expect(checkboxContent).toContain('id={checkboxId}');
  });

  it('verifies Tabs primitive implements keyboard navigation and aria role semantics', () => {
    const tabsContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Tabs.tsx'), 'utf-8');
    expect(tabsContent).toContain('role="tablist"');
    expect(tabsContent).toContain('role="tab"');
    expect(tabsContent).toContain('aria-selected=');
    expect(tabsContent).toContain('ArrowRight');
    expect(tabsContent).toContain('ArrowLeft');
  });

  it('verifies no dark-mode utility classes (bg-[#01362D], bg-[#012b24], nest-layered-bg) are introduced', () => {
    primitiveFiles.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui', file), 'utf-8');
      expect(content).not.toContain('bg-[#01362D]');
      expect(content).not.toContain('bg-[#012b24]');
      expect(content).not.toContain('nest-layered-bg');
    });
  });
});
