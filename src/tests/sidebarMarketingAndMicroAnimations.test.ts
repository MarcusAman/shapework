/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getProductProfile } from '../config/productProfiles';

describe('Sidebar Marketing Intake Placement & Tactile Micro-Animations Suite', () => {
  it('1. Verifies Marketing Intake is prioritized at the top of operations in ryan_pilot product profile', () => {
    const profile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-wilmington');
    expect(profile.experience).toBe('ryan_pilot');

    const visibleModules = profile.modules.filter(m => m.visible);
    
    // Ask Nora is index 0
    expect(visibleModules[0].tab).toBe('Workboard');
    expect(visibleModules[0].name).toBe('Ask Nora');

    // Tasks is index 1 (top of operations)
    expect(visibleModules[1].tab).toBe('Tasks');
    expect(visibleModules[1].name).toBe('Tasks');

    // Vendor Dispatch is removed from navigation
    expect(visibleModules.map(m => m.tab)).not.toContain('Vendor Dispatch');
  });

  it('2. Verifies CollapsibleNavigationRail categorizes Tasks inside Daily Operations as #1 item', () => {
    const railFile = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/layout/CollapsibleNavigationRail.tsx'),
      'utf-8'
    );

    // Verify Daily Operations includes Tasks first
    expect(railFile).toMatch(/category:\s*'Daily Operations'/);
    expect(railFile).toMatch(/items:\s*\[[\s\S]*?'Tasks'[\s\S]*?'Pre-MLS Board'/);

    // Verify icon animation classes are mapped
    expect(railFile).toContain('nav-icon-phone');
    expect(railFile).toContain('nav-icon-wrench');
    expect(railFile).toContain('nav-icon-trend');
    expect(railFile).toContain('nav-icon-users');
    expect(railFile).toContain('nav-icon-gear');
    expect(railFile).toContain('nav-icon-book');
    expect(railFile).toContain('nav-icon-building');
  });

  it('3. Verifies Apple-grade tactile micro-animations and keyframes in components.css', () => {
    const cssFile = fs.readFileSync(
      path.resolve(process.cwd(), 'src/styles/components.css'),
      'utf-8'
    );

    // Verify smooth cubic-bezier transitions
    expect(cssFile).toContain('cubic-bezier(0.25, 1, 0.5, 1)');
    expect(cssFile).toContain('transform: scale(0.965)');

    // Verify keyframe definitions
    expect(cssFile).toContain('@keyframes nav-phone-wobble');
    expect(cssFile).toContain('@keyframes nav-wrench-tilt');
    expect(cssFile).toContain('@keyframes nav-gear-rotate');
    expect(cssFile).toContain('@keyframes nav-trend-rise');
    expect(cssFile).toContain('@keyframes nav-users-pop');
    expect(cssFile).toContain('@keyframes nav-sparkle-shimmer');
    expect(cssFile).toContain('@keyframes nav-inbox-nudge');
    expect(cssFile).toContain('@keyframes nav-check-pop');
    expect(cssFile).toContain('@keyframes nav-building-bounce');

    // Verify prefers-reduced-motion safety
    expect(cssFile).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssFile).toContain('.nav-item-shell:hover .nav-icon-phone');
    expect(cssFile).toContain('.nav-item-shell:hover .nav-icon-wrench');
  });
});
