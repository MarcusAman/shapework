/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Shapework Phase B2 Overlays & Form Composition Spec
 * Verifies accessibility, portal theme inheritance, keyboard navigation, focus management,
 * and zero hardcoded Nest brand hex leaks across B2 primitives.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Shapework Phase B2 Overlays, Dialogs & Form Composition Spec', () => {
  const b2PrimitiveFiles = [
    'Modal.tsx',
    'ConfirmDialog.tsx',
    'Drawer.tsx',
    'Popover.tsx',
    'DropdownMenu.tsx',
    'FormField.tsx',
  ];

  it('verifies all B2 canonical overlay & form primitive files exist in src/components/ui/', () => {
    b2PrimitiveFiles.forEach((file) => {
      const filePath = path.resolve(process.cwd(), 'src/components/ui', file);
      expect(fs.existsSync(filePath), `Primitive file ${file} must exist`).toBe(true);
    });
  });

  it('verifies zero hard-coded Nest Realty brand colors (#01362D, #00635C) in B2 primitives', () => {
    const forbiddenHexes = ['#01362D', '#00635C', '#012b24', '#073F35', '#0B4A3F'];

    b2PrimitiveFiles.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui', file), 'utf-8');
      forbiddenHexes.forEach((hex) => {
        expect(content, `Primitive ${file} contains hardcoded hex ${hex}`).not.toContain(hex);
      });
    });
  });

  it('verifies Modal/Dialog specifies role="dialog", aria-modal="true", aria-labelledby, Escape close, and focus trap', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf-8');
    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby=');
    expect(content).toContain("e.key === 'Escape'");
    expect(content).toContain("e.key === 'Tab'");
    expect(content).toContain('previousActiveElement.current.focus()');
    expect(content).toContain('aria-label="Close dialog"');
  });

  it('verifies Drawer/Sheet implements role="dialog", aria-modal, Escape key close, and portal rendering', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Drawer.tsx'), 'utf-8');
    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain("e.key === 'Escape'");
    expect(content).toContain('createPortal');
    expect(content).toContain('aria-label="Close drawer"');
  });

  it('verifies Popover supports backdrop/outside-click listener and Escape key close', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Popover.tsx'), 'utf-8');
    expect(content).toContain('handleClickOutside');
    expect(content).toContain("e.key === 'Escape'");
    expect(content).toContain('z-[var(--z-popover)]');
  });

  it('verifies DropdownMenu supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/DropdownMenu.tsx'), 'utf-8');
    expect(content).toContain("e.key === 'ArrowDown'");
    expect(content).toContain("e.key === 'ArrowUp'");
    expect(content).toContain("e.key === 'Enter'");
    expect(content).toContain("e.key === 'Escape'");
    expect(content).toContain('role="menu"');
    expect(content).toContain('role="menuitem"');
  });

  it('verifies FormField system manages label htmlFor, description ID, and error alert role', () => {
    const content = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/FormField.tsx'), 'utf-8');
    expect(content).toContain('htmlFor={fieldId}');
    expect(content).toContain('id={descriptionId}');
    expect(content).toContain('role="alert"');
    expect(content).toContain('var(--state-danger)');
  });

  it('verifies B2 overlay components consume semantic layer z-index tokens instead of arbitrary values', () => {
    const modalContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf-8');
    const drawerContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Drawer.tsx'), 'utf-8');
    const popoverContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Popover.tsx'), 'utf-8');
    const dropdownContent = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/DropdownMenu.tsx'), 'utf-8');

    expect(modalContent).toContain('var(--z-modal)');
    expect(drawerContent).toContain('var(--z-drawer)');
    expect(popoverContent).toContain('var(--z-popover)');
    expect(dropdownContent).toContain('var(--z-dropdown)');

    // Ensure no runaway z-[9999] values in canonical primitives
    [modalContent, drawerContent, popoverContent, dropdownContent].forEach((c) => {
      expect(c).not.toContain('z-[9999]');
      expect(c).not.toContain('z-[99999]');
    });
  });
});
