/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shapework Multi-Tenant Design System & Theme Engine Spec — Phase A Foundation
 * Verifies 3-Layer Token Architecture, Workspace Brand Resolution, Strict Token Consumption,
 * Portal/Overlay Theme Inheritance, and Dynamic Workspace Switching without hardcoded hex leaks.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { resolveWorkspaceBrand, DEFAULT_SHAPEWORK_BRAND, applyWorkspaceBrandTheme } from '../../src/styles/workspaceTheme';

describe('Shapework 3-Layer Token Architecture & Theme Engine (Phase A Final Acceptance)', () => {
  it('verifies tokens.css defines strict light mode color scheme and Layer 1 tokens without circular aliases', () => {
    const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
    expect(fs.existsSync(tokensPath)).toBe(true);

    const content = fs.readFileSync(tokensPath, 'utf-8');

    // Strict Light Mode Color Scheme Declaration
    expect(content).toContain('color-scheme: light;');

    // Layer 1 — Shapework Core UI Tokens
    expect(content).toContain('--sw-canvas: #F7F8F5;');
    expect(content).toContain('--sw-surface: #FFFFFF;');
    expect(content).toContain('--sw-surface-elevated: #FFFFFF;');
    expect(content).toContain('--sw-text-primary: #17231F;');
    expect(content).toContain('--sw-text-secondary: #52605B;');

    // Layer 3 — Decoupled Semantic State Tokens
    expect(content).toContain('--state-success: #00635C;');
    expect(content).toContain('--state-warning: #9A6B1F;');
    expect(content).toContain('--state-danger: #C0392B;');

    // Audit against circular variable definitions (e.g. --brand-primary: var(--brand-primary);)
    const lines = content.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\s*(--[\w-]+)\s*:\s*var\((--[\w-]+)\)/);
      if (match) {
        const [, varName, aliasName] = match;
        expect(varName).not.toBe(aliasName); // Ensures no token points to itself
      }
    });
  });

  it('resolves Nest Realty brand tokens correctly for Nest pilot workspace', () => {
    const nestBrand = resolveWorkspaceBrand('nest-realty-demo');
    expect(nestBrand.id).toBe('nest-realty-demo');
    expect(nestBrand.brandPrimary).toBe('#01362D');
    expect(nestBrand.brandSecondary).toBe('#00635C');
    expect(nestBrand.brandAccent).toBe('#D0D6BB');

    const nestWilmingtonBrand = resolveWorkspaceBrand('nest-realty-wilmington');
    expect(nestWilmingtonBrand.brandPrimary).toBe('#01362D');
  });

  it('resolves neutral Shapework fallback brand for unknown/default workspaces (does NOT leak Nest branding)', () => {
    const defaultBrand = resolveWorkspaceBrand('default');
    expect(defaultBrand.id).toBe('default');
    expect(defaultBrand.brandPrimary).toBe('#1E293B');
    expect(defaultBrand.brandPrimary).not.toBe('#01362D');

    const unknownBrand = resolveWorkspaceBrand('compass-austin');
    expect(unknownBrand.id).toBe('default');
    expect(unknownBrand.brandPrimary).toBe('#1E293B');
  });

  it('verifies AppShell consumes semantic tokens var(--sw-canvas) and var(--sw-text-primary)', () => {
    const appShellContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );

    expect(appShellContent).toContain('applyWorkspaceBrandTheme');
    expect(appShellContent).toContain('data-tenant={activeBrand.id}');
    expect(appShellContent).toContain('bg-[var(--sw-canvas)]');
    expect(appShellContent).toContain('text-[var(--sw-text-primary)]');
    expect(appShellContent).not.toContain('bg-[#F7F8F5]');
    expect(appShellContent).not.toContain('nest-layered-bg');
  });

  it('verifies TopBar and Navigation Rail consume structural + workspace CSS variables instead of hard-coded Nest hex values', () => {
    const topBarContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/TopBar.tsx'),
      'utf-8'
    );
    const navContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/CollapsibleNavigationRail.tsx'),
      'utf-8'
    );

    // TopBar variable consumption
    expect(topBarContent).toContain('bg-[var(--sw-surface)]');
    expect(topBarContent).toContain('border-[var(--sw-border)]');
    expect(topBarContent).toContain('text-[var(--brand-primary)]');
    expect(topBarContent).toContain('text-[var(--brand-secondary)]');

    // Navigation Rail variable consumption
    expect(navContent).toContain('bg-[var(--brand-soft)]');
    expect(navContent).toContain('text-[var(--brand-secondary)]');
    expect(navContent).toContain('text-[var(--brand-primary)]');
    expect(navContent).toContain('border-[var(--sw-border)]');
  });

  it('verifies portal/overlay theme inheritance strategy applies tenant brand variables to root document elements', () => {
    const stylesMap = new Map<string, string>();
    const attributesMap = new Map<string, string>();

    const mockElement = {
      style: {
        setProperty: (key: string, val: string) => stylesMap.set(key, val),
      },
      setAttribute: (key: string, val: string) => attributesMap.set(key, val),
    } as unknown as HTMLElement;

    // Simulate DOM environment
    global.document = {
      documentElement: mockElement,
      body: mockElement,
    } as any;

    applyWorkspaceBrandTheme(mockElement, 'nest-realty-demo');
    expect(stylesMap.get('--brand-primary')).toBe('#01362D');
    expect(stylesMap.get('--brand-secondary')).toBe('#00635C');
    expect(attributesMap.get('data-tenant')).toBe('nest-realty-demo');
  });

  it('verifies workspace switching dynamically clears and overwrites brand tokens without stale variable leakage', () => {
    const stylesMap = new Map<string, string>();
    const attributesMap = new Map<string, string>();

    const mockElement = {
      style: {
        setProperty: (key: string, val: string) => stylesMap.set(key, val),
      },
      setAttribute: (key: string, val: string) => attributesMap.set(key, val),
    } as unknown as HTMLElement;

    global.document = {
      documentElement: mockElement,
      body: mockElement,
    } as any;

    // First workspace
    applyWorkspaceBrandTheme(mockElement, 'nest-realty-demo');
    expect(stylesMap.get('--brand-primary')).toBe('#01362D');

    // Switch workspace
    applyWorkspaceBrandTheme(mockElement, 'compass-austin');
    expect(stylesMap.get('--brand-primary')).toBe('#1E293B');
    expect(stylesMap.get('--brand-secondary')).toBe('#0F172A');
    expect(attributesMap.get('data-tenant')).toBe('default');
  });
});
